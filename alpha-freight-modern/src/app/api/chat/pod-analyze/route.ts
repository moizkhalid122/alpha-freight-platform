import { NextRequest, NextResponse } from "next/server";
import { analyzePodText, buildPodHelpReply } from "@/lib/copilot/pod-analyzer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const description = String(body.description || body.message || "").trim();

  if (!description) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  const analysis = analyzePodText(description);
  const help = buildPodHelpReply(analysis);

  return NextResponse.json({
    success: true,
    analysis,
    reply: help,
  });
}
