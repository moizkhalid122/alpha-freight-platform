import { NextResponse } from "next/server";
import { isOpenAiConfigured } from "@/lib/openai-chat";
import { isOpenAiReachable } from "@/lib/copilot/connectivity";
import {
  DEFAULT_GUEST_MODEL,
  DEFAULT_MEMBER_MODEL,
  getModelLabelForTier,
} from "@/lib/openai-model-router";

export const runtime = "nodejs";

export async function GET() {
  const configured = isOpenAiConfigured();

  if (!configured) {
    return NextResponse.json({
      ok: false,
      openai: "not_configured",
      live: false,
      message: "Add OPENAI_API_KEY to .env.local and restart the server.",
    });
  }

  const reachable = await isOpenAiReachable();

  if (reachable) {
    return NextResponse.json({
      ok: true,
      openai: "connected",
      live: true,
      model: getModelLabelForTier("guest"),
      guestModel: getModelLabelForTier("guest"),
      memberModel: getModelLabelForTier("member"),
      defaults: {
        guest: DEFAULT_GUEST_MODEL,
        member: DEFAULT_MEMBER_MODEL,
      },
    });
  }

  return NextResponse.json({
    ok: false,
    openai: "blocked_or_timeout",
    live: false,
    message: "OpenAI key is set but api.openai.com is not reachable from this network. Use VPN or deploy to production.",
  });
}
