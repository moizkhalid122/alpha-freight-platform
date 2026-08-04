import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  calculateFreightQuote,
  normalizeLocation,
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
    console.error("[public/freight-quote loads]", error);
    return [];
  }

  return (data ?? []) as RateLoadRow[];
}

export async function POST(request: NextRequest) {
  let body: {
    origin?: string;
    destination?: string;
    equipment?: string;
    weightKg?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const origin = normalizeLocation(body.origin || "");
  const destination = normalizeLocation(body.destination || "");

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    return NextResponse.json({ error: "Origin and destination must be different." }, { status: 400 });
  }

  const equipment = parseEquipmentQuery(body.equipment || "general");
  const weightKg =
    typeof body.weightKg === "number" && body.weightKg > 0 ? Math.round(body.weightKg) : undefined;

  try {
    const loads = await fetchRateLoads();
    const quote = calculateFreightQuote({ origin, destination, equipment, weightKg, loads });
    return NextResponse.json({ quote });
  } catch (error) {
    console.error("[public/freight-quote POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate quote." },
      { status: 500 },
    );
  }
}
