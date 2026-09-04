import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { generateRevenueTasksWithAi } from "@/lib/commercial-director-task-ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { actualMtd?: number; monthTarget?: number; count?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const tasks = await generateRevenueTasksWithAi({
    actualMtd: body.actualMtd,
    monthTarget: body.monthTarget,
    count: body.count ?? 5,
  });

  return NextResponse.json({ tasks, source: tasks.length ? "ai" : "fallback" });
}
