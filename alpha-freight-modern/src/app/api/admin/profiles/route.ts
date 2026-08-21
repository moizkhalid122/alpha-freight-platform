import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { deleteMarketplaceProfiles } from "@/lib/admin-delete-profile";
import { fetchAdminProfilesRest } from "@/lib/admin-rest";
import { isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  ADMIN_API_CACHE_HEADERS,
  getAdminProfilesCache,
  getStaleAdminProfilesCache,
  invalidateAdminProfilesCache,
  setAdminProfilesCache,
} from "@/lib/admin-api-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const idsParam = searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const cacheKey = `${role ?? "all"}:${ids.join(",")}`;
  const now = Date.now();
  const cached = getAdminProfilesCache(cacheKey, now);
  if (cached) {
    return NextResponse.json({ profiles: cached.profiles }, { headers: ADMIN_API_CACHE_HEADERS });
  }

  try {
    const profiles = await fetchAdminProfilesRest({ role, ids });
    setAdminProfilesCache(cacheKey, profiles, now);
    return NextResponse.json({ profiles }, { headers: ADMIN_API_CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/profiles] REST failed:", restError);
    const stale = getStaleAdminProfilesCache(cacheKey);
    if (stale) {
      return NextResponse.json({ profiles: stale.profiles }, { headers: ADMIN_API_CACHE_HEADERS });
    }
    return NextResponse.json({ profiles: [] }, { headers: ADMIN_API_CACHE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let ids: string[] = [];
  try {
    const body = (await request.json()) as { ids?: string[] };
    ids = Array.isArray(body.ids)
      ? body.ids.map((value) => String(value).trim()).filter(Boolean)
      : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ error: "Select at least one account to delete." }, { status: 400 });
  }

  if (ids.length > 50) {
    return NextResponse.json({ error: "Delete up to 50 accounts at a time." }, { status: 400 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and restart the dev server before deleting accounts.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await deleteMarketplaceProfiles(ids);
    invalidateAdminProfilesCache();

    return NextResponse.json(result, {
      status: result.failed.length > 0 && result.deleted.length === 0 ? 500 : 200,
    });
  } catch (error) {
    console.error("[admin/profiles] DELETE failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete accounts. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      },
      { status: 500 }
    );
  }
}
