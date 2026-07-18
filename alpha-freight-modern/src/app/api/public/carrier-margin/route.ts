import { NextRequest, NextResponse } from "next/server";

import { calculateCarrierMargin } from "@/lib/freight-calculators";

export async function POST(request: NextRequest) {
  let body: {
    bidAmount?: number;
    loadedMiles?: number;
    emptyMiles?: number;
    fuelPricePerLitre?: number;
    litresPerMile?: number;
    otherCosts?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const bidAmount = Number(body.bidAmount);
  const loadedMiles = Number(body.loadedMiles);

  if (!bidAmount || bidAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid amount in GBP." }, { status: 400 });
  }
  if (!loadedMiles || loadedMiles <= 0) {
    return NextResponse.json({ error: "Enter loaded miles for the job." }, { status: 400 });
  }

  try {
    const result = calculateCarrierMargin({
      bidAmount,
      loadedMiles,
      emptyMiles: body.emptyMiles !== undefined ? Number(body.emptyMiles) : undefined,
      fuelPricePerLitre: body.fuelPricePerLitre !== undefined ? Number(body.fuelPricePerLitre) : undefined,
      litresPerMile: body.litresPerMile !== undefined ? Number(body.litresPerMile) : undefined,
      otherCosts: body.otherCosts !== undefined ? Number(body.otherCosts) : undefined,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[public/carrier-margin]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate margin." },
      { status: 500 },
    );
  }
}
