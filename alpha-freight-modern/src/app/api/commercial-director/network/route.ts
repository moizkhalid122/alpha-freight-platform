import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { fetchCommercialNetworkProfiles } from "@/lib/commercial-director-profiles-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=30" };
const SERVER_CACHE_MS = 30_000;

type NetworkPayload = {
  suppliers: Awaited<ReturnType<typeof fetchCommercialNetworkProfiles>>["suppliers"];
  carriers: Awaited<ReturnType<typeof fetchCommercialNetworkProfiles>>["carriers"];
  employees: Awaited<ReturnType<typeof fetchCommercialNetworkProfiles>>["employees"];
};

let networkCache: { expiresAt: number; payload: NetworkPayload } | null = null;

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (networkCache && networkCache.expiresAt > now) {
    return NextResponse.json(networkCache.payload, { headers: CACHE_HEADERS });
  }

  try {
    const db = getSupabaseForAdminApi(request);
    const result = await fetchCommercialNetworkProfiles(db);

    if (result.error) {
      if (networkCache) {
        return NextResponse.json(networkCache.payload, { headers: CACHE_HEADERS });
      }
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }

    const payload: NetworkPayload = {
      suppliers: result.suppliers,
      carriers: result.carriers,
      employees: result.employees,
    };

    networkCache = {
      expiresAt: now + SERVER_CACHE_MS,
      payload,
    };

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[commercial-director/network]", error);
    if (networkCache) {
      return NextResponse.json(networkCache.payload, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch network directory." },
      { status: 503 }
    );
  }
}
