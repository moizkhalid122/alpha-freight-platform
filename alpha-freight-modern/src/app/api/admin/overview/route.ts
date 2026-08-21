import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { fetchAdminOverviewBundle } from "@/lib/admin-overview-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let overviewCache: {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchAdminOverviewBundle>>;
} | null = null;

export function invalidateAdminOverviewCache() {
  overviewCache = null;
}

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (overviewCache && overviewCache.expiresAt > now) {
    return NextResponse.json(overviewCache.body, { headers: CACHE_HEADERS });
  }

  try {
    const body = await fetchAdminOverviewBundle();
    overviewCache = { expiresAt: now + SERVER_CACHE_MS, body };
    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[admin/overview]", error);
    if (overviewCache) {
      return NextResponse.json(overviewCache.body, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load overview." },
      { status: 503 }
    );
  }
}
