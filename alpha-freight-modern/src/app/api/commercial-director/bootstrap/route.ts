import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { fetchCommercialBootstrapData } from "@/lib/commercial-director-bootstrap-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=15" };
const SERVER_CACHE_MS = 15_000;

type BootstrapPayload = Awaited<ReturnType<typeof fetchCommercialBootstrapData>> & {
  updatedAt: string;
};

let bootstrapCache: { expiresAt: number; payload: BootstrapPayload } | null = null;

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (bootstrapCache && bootstrapCache.expiresAt > now) {
    return NextResponse.json(bootstrapCache.payload, { headers: CACHE_HEADERS });
  }

  try {
    const db = getSupabaseForAdminApi(request);
    const result = await fetchCommercialBootstrapData(db);

    const payload: BootstrapPayload = {
      ...result,
      updatedAt: new Date().toISOString(),
    };

    bootstrapCache = {
      expiresAt: now + SERVER_CACHE_MS,
      payload,
    };

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[commercial-director/bootstrap]", error);
    if (bootstrapCache) {
      return NextResponse.json(bootstrapCache.payload, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load commercial data." },
      { status: 503 }
    );
  }
}
