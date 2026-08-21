import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { fetchCommercialLoadsRest } from "@/lib/commercial-director-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=20" };
const SERVER_CACHE_MS = 5 * 60_000;

let loadsCache: { expiresAt: number; loads: Awaited<ReturnType<typeof fetchCommercialLoadsRest>> } | null =
  null;

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (loadsCache && loadsCache.expiresAt > now) {
    return NextResponse.json({ loads: loadsCache.loads }, { headers: CACHE_HEADERS });
  }

  try {
    const loads = await fetchCommercialLoadsRest();
    loadsCache = { expiresAt: now + SERVER_CACHE_MS, loads };
    return NextResponse.json({ loads }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[commercial-director/loads]", error);
    if (loadsCache) {
      return NextResponse.json({ loads: loadsCache.loads }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch loads." },
      { status: 503 }
    );
  }
}
