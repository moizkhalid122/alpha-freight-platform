import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);
    const [loadsResult, profilesResult, bidsResult] = await Promise.all([
      db.from("loads").select(LOAD_LIST_SELECT).order("created_at", { ascending: false }),
      db.from("profiles").select("id, full_name, company_name, role, profile_extras"),
      db.from("bids").select("id, load_id, carrier_id, amount, status, created_at"),
    ]);

    if (loadsResult.error) {
      return NextResponse.json({ error: loadsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      loads: loadsResult.data ?? [],
      profiles: profilesResult.error ? [] : (profilesResult.data ?? []),
      bids: bidsResult.error ? [] : (bidsResult.data ?? []),
    });
  } catch (error) {
    console.error("[admin/loads]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch loads." },
      { status: 500 }
    );
  }
}
