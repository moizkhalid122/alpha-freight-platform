import { NextResponse } from "next/server";
import { isOpenAiConfigured, getOpenAiChatReply } from "@/lib/openai-chat";

export const runtime = "nodejs";

export async function GET() {
  const configured = isOpenAiConfigured();

  if (!configured) {
    return NextResponse.json({
      ok: false,
      openai: "not_configured",
      message: "Add OPENAI_API_KEY to .env.local and restart the server.",
    });
  }

  const probe = await getOpenAiChatReply({
    message: "Reply with exactly: OK",
    assistantType: "general",
    history: [],
  });

  if (probe) {
    return NextResponse.json({
      ok: true,
      openai: "connected",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      sample: probe.message.slice(0, 80),
    });
  }

  return NextResponse.json({
    ok: false,
    openai: "timeout_or_error",
    message: "Key is set but OpenAI API is not reachable. Try VPN or check internet.",
  });
}
