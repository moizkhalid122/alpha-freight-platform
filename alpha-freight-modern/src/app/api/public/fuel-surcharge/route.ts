import { NextRequest, NextResponse } from "next/server";

import { calculateFuelSurcharge } from "@/lib/freight-calculators";

export async function POST(request: NextRequest) {
  let body: { baseRate?: number; fscPercent?: number; miles?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const baseRate = Number(body.baseRate);
  const fscPercent = Number(body.fscPercent);

  if (!baseRate || baseRate <= 0) {
    return NextResponse.json({ error: "Enter a valid base rate in GBP." }, { status: 400 });
  }
  if (Number.isNaN(fscPercent) || fscPercent < 0) {
    return NextResponse.json({ error: "Enter a valid fuel surcharge percentage." }, { status: 400 });
  }

  try {
    const result = calculateFuelSurcharge({
      baseRate,
      fscPercent,
      miles: body.miles !== undefined ? Number(body.miles) : undefined,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[public/fuel-surcharge]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate surcharge." },
      { status: 500 },
    );
  }
}
