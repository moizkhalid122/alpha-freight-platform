import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const messageId = String(body.messageId || "");
  const feedback = body.feedback === "down" ? "down" : body.feedback === "up" ? "up" : null;
  const assistantType = String(body.assistantType || "general");
  const query = String(body.query || "").slice(0, 500);
  const replyTitle = String(body.replyTitle || "").slice(0, 200);

  if (!feedback) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  try {
    await supabase.from("ai_chat_feedback").insert({
      user_id: user?.id || null,
      message_id: messageId || null,
      feedback,
      assistant_type: assistantType,
      query,
      reply_title: replyTitle,
    });
  } catch {
    // Table may not exist — still return success for UX
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ stats: null }, { status: 401 });
  }

  try {
    const { data } = await supabase
      .from("ai_chat_feedback")
      .select("feedback")
      .eq("user_id", user.id)
      .limit(500);

    const up = (data || []).filter((r) => r.feedback === "up").length;
    const down = (data || []).filter((r) => r.feedback === "down").length;

    return NextResponse.json({ stats: { up, down, total: up + down } });
  } catch {
    return NextResponse.json({ stats: { up: 0, down: 0, total: 0 } });
  }
}
