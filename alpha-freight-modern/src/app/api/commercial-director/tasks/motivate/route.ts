import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { generateCommercialDirectorMotivation } from "@/lib/commercial-director-motivation-ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { actualMtd?: number; monthTarget?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const motivation = await generateCommercialDirectorMotivation({
    actualMtd: body.actualMtd,
    monthTarget: body.monthTarget,
  });

  return NextResponse.json(motivation);
}
