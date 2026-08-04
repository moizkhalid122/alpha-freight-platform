import { NextRequest, NextResponse } from "next/server";

import { findBackhaulLanes, normalizeLocation, parseEquipmentQuery, resolveUkCityLabel } from "@/lib/freight-tools";
import { fetchPublicRateLoads } from "@/lib/public-freight-data";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromCity = normalizeLocation(params.get("from") || "");
  const equipment = parseEquipmentQuery(params.get("equipment"));

  if (!fromCity) {
    return NextResponse.json({ error: "Current location is required." }, { status: 400 });
  }

  if (!resolveUkCityLabel(fromCity)) {
    return NextResponse.json({ error: "Enter a recognised UK city." }, { status: 400 });
  }

  try {
    const loads = await fetchPublicRateLoads();
    const backhaul = findBackhaulLanes({ fromCity, equipment, loads });
    return NextResponse.json({ backhaul });
  } catch (error) {
    console.error("[public/backhaul]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to find backhaul lanes." },
      { status: 500 },
    );
  }
}
