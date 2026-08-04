import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";
import { buildHandoffReply, logHandoffRequest } from "@/lib/copilot/handoff";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const message = String(body.message || "").slice(0, 500);
  const assistantType = String(body.assistantType || "general");
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  await logHandoffRequest(supabase, user?.id || null, message, assistantType);

  const reply = buildHandoffReply(displayName);

  return NextResponse.json({
    success: true,
    structuredMessage: reply,
    message: reply.rawText || reply.shortExplanation,
  });
}
