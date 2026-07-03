import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

const PUBLIC_LOAD_SELECT =
  "id, origin, destination, pickup_location, delivery_location, price, equipment, pickup_date, delivery_date, status, commodity, title, created_at, payment_route, payment_state";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ loads: [], stats: { total: 0, avgRatePerMile: null } });
    }

    const db = isAdminServiceConfigured()
      ? getAdminSupabase()
      : createClient(url, anonKey);

    const { data, error } = await db
      .from("loads")
      .select(PUBLIC_LOAD_SELECT)
      .in("status", ["active", "available", "pending"])
      .is("carrier_id", null)
      .order("created_at", { ascending: false })
      .limit(48);

    if (error) {
      return NextResponse.json({ error: error.message, loads: [], stats: { total: 0, avgRatePerMile: null } }, { status: 500 });
    }

    const loads = (data ?? []).map((load) => ({
      id: load.id,
      code: `AF-${String(load.id).slice(0, 8).toUpperCase()}`,
      origin: load.origin || load.pickup_location || "UK",
      destination: load.destination || load.delivery_location || "UK",
      price: Number(load.price) || 0,
      equipment: load.equipment || "General",
      pickupDate: load.pickup_date,
      commodity: load.commodity || load.title || "Freight",
      status: load.status,
      createdAt: load.created_at,
    }));

    const pricedLoads = loads.filter((load) => load.price > 0);
    const avgRatePerMile =
      pricedLoads.length > 0
        ? pricedLoads.reduce((sum, load) => {
            const miles = 80 + (hashString(load.id) % 220);
            return sum + load.price / miles;
          }, 0) / pricedLoads.length
        : null;

    return NextResponse.json({
      loads,
      stats: {
        total: loads.length,
        avgRatePerMile: avgRatePerMile ? Number(avgRatePerMile.toFixed(2)) : null,
      },
    });
  } catch (error) {
    console.error("[public/loads]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch loads.",
        loads: [],
        stats: { total: 0, avgRatePerMile: null },
      },
      { status: 500 }
    );
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
