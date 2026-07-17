import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  buildLaneRatesResponse,
  parseEquipmentQuery,
  type RateLoadRow,
} from "@/lib/freight-tools";

const RATE_LOAD_SELECT =
  "id, origin, destination, pickup_location, delivery_location, price, equipment, created_at, status";

async function fetchRateLoads(): Promise<RateLoadRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const db = isAdminServiceConfigured()
    ? getAdminSupabase()
    : createClient(url, anonKey);

  const { data, error } = await db
    .from("loads")
    .select(RATE_LOAD_SELECT)
    .gt("price", 0)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("[public/lane-rates]", error);
    return [];
  }

  return (data ?? []) as RateLoadRow[];
}

export async function GET(request: NextRequest) {
  try {
    const equipment = parseEquipmentQuery(request.nextUrl.searchParams.get("equipment"));
    const loads = await fetchRateLoads();
    const payload = buildLaneRatesResponse(loads, equipment);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[public/lane-rates GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch lane rates." },
      { status: 500 },
    );
  }
}
