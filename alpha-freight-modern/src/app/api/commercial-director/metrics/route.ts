import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { fetchCommercialMetricsRest } from "@/lib/commercial-director-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let metricsCache: {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchCommercialMetricsRest>>;
} | null = null;

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (metricsCache && metricsCache.expiresAt > now) {
    return NextResponse.json(metricsCache.body, { headers: CACHE_HEADERS });
  }

  try {
    const body = await fetchCommercialMetricsRest();
    metricsCache = {
      expiresAt: now + SERVER_CACHE_MS,
      body,
    };
    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[commercial-director/metrics]", error);
    if (metricsCache) {
      return NextResponse.json(metricsCache.body, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load metrics." },
      { status: 503 }
    );
  }
}
