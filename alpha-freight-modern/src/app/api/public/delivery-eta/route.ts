import { NextRequest, NextResponse } from "next/server";

import { calculateDeliveryEta } from "@/lib/freight-calculators";

export async function POST(request: NextRequest) {
  let body: {
    origin?: string;
    destination?: string;
    distanceMiles?: number;
    pickupAt?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.pickupAt) {
    return NextResponse.json({ error: "Pickup date and time are required." }, { status: 400 });
  }

  const hasCities = Boolean(body.origin && body.destination);
  const hasMiles = Boolean(body.distanceMiles && Number(body.distanceMiles) > 0);

  if (!hasCities && !hasMiles) {
    return NextResponse.json(
      { error: "Enter UK origin and destination, or a distance in miles." },
      { status: 400 },
    );
  }

  try {
    const result = calculateDeliveryEta({
      origin: body.origin,
      destination: body.destination,
      distanceMiles: body.distanceMiles !== undefined ? Number(body.distanceMiles) : undefined,
      pickupAt: body.pickupAt,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[public/delivery-eta]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to estimate delivery." },
      { status: 400 },
    );
  }
}
