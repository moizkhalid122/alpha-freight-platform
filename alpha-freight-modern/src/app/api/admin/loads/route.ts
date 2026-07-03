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

    return NextResponse.json({ load: data, message: "Load published to the marketplace." });
  } catch (error) {
    console.error("[admin/loads POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post load." },
      { status: 500 }
    );
  }
}
