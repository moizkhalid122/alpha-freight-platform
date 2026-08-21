import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { fetchAdminOverviewBundle } from "@/lib/admin-overview-data";
import {
  ADMIN_API_CACHE_HEADERS,
  getAdminOverviewCache,
  getStaleAdminOverviewCache,
  invalidateAdminOverviewCache,
  setAdminOverviewCache,
} from "@/lib/admin-api-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  const cached = getAdminOverviewCache(now);
  if (cached) {
    return NextResponse.json(cached.body, { headers: ADMIN_API_CACHE_HEADERS });
  }

  try {
    const body = await fetchAdminOverviewBundle();
    setAdminOverviewCache(body, now);
    return NextResponse.json(body, { headers: ADMIN_API_CACHE_HEADERS });
  } catch (error) {
    console.error("[admin/overview]", error);
    const stale = getStaleAdminOverviewCache();
    if (stale) {
      return NextResponse.json(stale.body, { headers: ADMIN_API_CACHE_HEADERS });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load overview." },
      { status: 503 }
    );
  }
}
