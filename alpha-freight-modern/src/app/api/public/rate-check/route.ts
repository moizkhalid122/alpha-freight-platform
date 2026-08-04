import { NextRequest, NextResponse } from "next/server";

import {
  compareRateToMarket,
  isValidUkLane,
  normalizeLocation,
  parseEquipmentQuery,
} from "@/lib/freight-tools";
import { fetchPublicRateLoads } from "@/lib/public-freight-data";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = normalizeLocation(params.get("origin") || "");
  const destination = normalizeLocation(params.get("destination") || "");
  const equipment = parseEquipmentQuery(params.get("equipment"));
  const userRate = Number(params.get("rate") || 0);

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
  }

  if (!userRate || userRate <= 0) {
    return NextResponse.json({ error: "Enter a valid load rate in GBP." }, { status: 400 });
  }

  if (!isValidUkLane(origin, destination)) {
    return NextResponse.json(
      { error: "Enter recognised UK cities for both origin and destination." },
      { status: 400 },
    );
  }

  try {
    const loads = await fetchPublicRateLoads();
    const comparison = compareRateToMarket({ origin, destination, equipment, userRate, loads });
    return NextResponse.json({ comparison });
  } catch (error) {
    console.error("[public/rate-check]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to compare rate." },
      { status: 500 },
    );
  }
}
