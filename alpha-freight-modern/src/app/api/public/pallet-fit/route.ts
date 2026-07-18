import { NextRequest, NextResponse } from "next/server";

import { calculatePalletFit } from "@/lib/freight-calculators";

export async function POST(request: NextRequest) {
  let body: {
    palletCount?: number;
    weightKg?: number;
    temperatureControlled?: boolean;
    oversized?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const palletCount = Number(body.palletCount);
  const weightKg = Number(body.weightKg);

  if (!palletCount || palletCount <= 0) {
    return NextResponse.json({ error: "Enter a valid pallet count." }, { status: 400 });
  }
  if (!weightKg || weightKg <= 0) {
    return NextResponse.json({ error: "Enter a valid weight in kg." }, { status: 400 });
  }

  try {
    const result = calculatePalletFit({
      palletCount,
      weightKg,
      temperatureControlled: Boolean(body.temperatureControlled),
      oversized: Boolean(body.oversized),
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[public/pallet-fit]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate fit." },
      { status: 500 },
    );
  }
}
