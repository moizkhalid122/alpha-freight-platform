import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { invalidateAdminOverviewCache } from "@/app/api/admin/overview/route";
import { fetchAdminLoadsBundleRest } from "@/lib/admin-rest";
import { isAdminServiceConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let loadsCache: {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchAdminLoadsBundleRest>>;
} | null = null;

export function invalidateAdminLoadsCache() {
  loadsCache = null;
}

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (loadsCache && loadsCache.expiresAt > now) {
    return NextResponse.json(loadsCache.body, { headers: CACHE_HEADERS });
  }

  try {
    const body = await fetchAdminLoadsBundleRest();
    loadsCache = { expiresAt: now + SERVER_CACHE_MS, body };
    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/loads] REST failed:", restError);
    if (loadsCache) {
      return NextResponse.json(loadsCache.body, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ loads: [], profiles: [], bids: [] }, { headers: CACHE_HEADERS });
  }
}

type AdminPostLoadBody = {
  title?: string;
  origin?: string;
  destination?: string;
  pickup_date?: string;
  delivery_date?: string;
  price?: number | string;
  weight?: string;
  equipment?: string;
  commodity?: string;
  notes?: string;
  supplier_id?: string | null;
};

export async function POST(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = (await request.json()) as AdminPostLoadBody;
    const origin = String(body.origin || "").trim();
    const destination = String(body.destination || "").trim();
    const price = Number(body.price);

    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Enter a valid load price." }, { status: 400 });
    }

    const db = getSupabaseForAdminApi(request);
    const title =
      String(body.title || "").trim() ||
      `${origin.split(",")[0]?.trim() || origin} → ${destination.split(",")[0]?.trim() || destination}`;

    const { data, error } = await db
      .from("loads")
      .insert({
        status: "active",
        payment_state: "paid",
        payment_route: "admin",
        origin,
        destination,
        pickup_location: origin,
        delivery_location: destination,
        price,
        weight: body.weight ? String(body.weight) : null,
        equipment: body.equipment ? String(body.equipment) : "General",
        commodity: body.commodity ? String(body.commodity) : null,
        notes: body.notes ? String(body.notes) : null,
        pickup_date: body.pickup_date || null,
        delivery_date: body.delivery_date || null,
        supplier_id: body.supplier_id || null,
        title,
      })
      .select("id, title, origin, destination, price, status, payment_state, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    loadsCache = null;
    invalidateAdminOverviewCache();
    return NextResponse.json({ load: data, message: "Load published to the marketplace." });
  } catch (error) {
    console.error("[admin/loads POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post load." },
      { status: 500 }
    );
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
    return NextResponse.json({ error: "Select at least one load to delete." }, { status: 400 });
  }

  if (ids.length > 50) {
    return NextResponse.json({ error: "Delete up to 50 loads at a time." }, { status: 400 });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and restart the dev server before deleting loads.",
      },
      { status: 503 }
    );
  }

  try {
    const { deleteAdminLoads } = await import("@/lib/admin-delete-load");
    const result = await deleteAdminLoads(ids);
    invalidateAdminLoadsCache();
    invalidateAdminOverviewCache();

    return NextResponse.json(result, {
      status: result.failed.length > 0 && result.deleted.length === 0 ? 500 : 200,
    });
  } catch (error) {
    console.error("[admin/loads DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete loads." },
      { status: 500 }
    );
  }
}
