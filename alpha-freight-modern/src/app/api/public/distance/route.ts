import { NextRequest, NextResponse } from "next/server";

import { calculateUkDistance, isValidUkLane, normalizeLocation } from "@/lib/freight-tools";

export async function GET(request: NextRequest) {
  const origin = normalizeLocation(request.nextUrl.searchParams.get("origin") || "");
  const destination = normalizeLocation(request.nextUrl.searchParams.get("destination") || "");

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    return NextResponse.json({ error: "Origin and destination must be different." }, { status: 400 });
  }

  if (!isValidUkLane(origin, destination)) {
    return NextResponse.json(
      { error: "Enter recognised UK cities for both origin and destination." },
      { status: 400 },
    );
  }

  try {
    const distance = calculateUkDistance(origin, destination);
    return NextResponse.json({ distance });
  } catch (error) {
    console.error("[public/distance]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate distance." },
      { status: 500 },
    );
  }
}
