import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

const LOAD_DETAIL_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, updated_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state, notes, pod_url, pod_name, pod_uploaded_at, pod_verification_status, pod_review_note, pod_verified_at";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await context.params;
  const loadId = String(id || "").trim();

  if (!loadId) {
    return NextResponse.json({ error: "Missing load id." }, { status: 400 });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const { data: load, error: loadError } = await db
      .from("loads")
      .select(LOAD_DETAIL_SELECT)
      .eq("id", loadId)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    if (!load) {
      return NextResponse.json({ error: "Load not found." }, { status: 404 });
    }

    const profileIds = [load.supplier_id, load.carrier_id].filter(Boolean) as string[];

    const [bidsResult, paymentsResult, profilesResult] = await Promise.all([
      db
        .from("bids")
        .select("id, load_id, carrier_id, amount, status, created_at, updated_at")
        .eq("load_id", loadId)
        .order("created_at", { ascending: false }),
      db
        .from("supplier_payments")
        .select("*")
        .eq("load_id", loadId)
        .order("created_at", { ascending: false }),
      profileIds.length
        ? db
            .from("profiles")
            .select(
              "id, full_name, company_name, role, created_at, verification_status, avatar_url, industry"
            )
            .in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const bids = bidsResult.error ? [] : (bidsResult.data ?? []);
    const bidCarrierIds = [...new Set(bids.map((bid) => bid.carrier_id).filter(Boolean))] as string[];

    let bidCarrierProfiles: unknown[] = [];
    if (bidCarrierIds.length) {
      const { data } = await db
        .from("profiles")
        .select("id, full_name, company_name, role, verification_status")
        .in("id", bidCarrierIds);
      bidCarrierProfiles = data ?? [];
    }

    const relatedProfiles = profilesResult.error ? [] : (profilesResult.data ?? []);
    const profileMap = new Map<string, unknown>();
    relatedProfiles.forEach((profile) => profileMap.set(profile.id, profile));
    bidCarrierProfiles.forEach((profile) => {
      const record = profile as { id: string };
      if (!profileMap.has(record.id)) {
        profileMap.set(record.id, profile);
      }
    });

    return NextResponse.json({
      load,
      profiles: [...profileMap.values()],
      bids,
      payments: paymentsResult.error ? [] : (paymentsResult.data ?? []),
    });
  } catch (error) {
    console.error("[admin/loads/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch load detail." },
      { status: 500 }
    );
  }
}
