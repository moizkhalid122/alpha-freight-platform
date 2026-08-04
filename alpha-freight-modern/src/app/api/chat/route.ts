import { NextRequest, NextResponse } from "next/server";
import type { AssistantKind, ChatHistoryItem } from "@/lib/chat-types";
import { runCopilotEngine } from "@/lib/copilot-engine";
import type { LanguagePreference } from "@/lib/copilot/language";
import { checkPublicAiRateLimit, getClientIp, PUBLIC_AI_MESSAGE_LIMIT } from "@/lib/public-ai-rate-limit";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const assistantType =
      typeof body.assistantType === "string" ? body.assistantType : "general";
    const language = typeof body.language === "string" ? (body.language as LanguagePreference) : undefined;
    const confirmAction = Boolean(body.confirmAction);
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;
    const publicMode = Boolean(body.publicMode);

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const normalizedType: AssistantKind =
      assistantType === "carrier" || assistantType === "supplier"
        ? assistantType
        : "general";

    const supabase = createAuthedSupabaseFromRequest(request);
    const { data: { user } } = await supabase.auth.getUser();
    const isGuest = !user;
    let guestRemaining: number | undefined;

    if (publicMode && isGuest) {
      const ip = getClientIp(request);
      const limit = checkPublicAiRateLimit(ip);
      guestRemaining = limit.remaining;

      if (!limit.allowed) {
        return NextResponse.json({
          success: false,
          limitReached: true,
          message: `Free limit reached (${PUBLIC_AI_MESSAGE_LIMIT} messages/hour). Sign up free for unlimited Alpha Freight AI + live loads.`,
          structuredMessage: {
            mode: "logistics_copilot",
            displayStyle: "card",
            title: "🔓 Sign Up for Unlimited AI",
            shortExplanation:
              "You've used your free guest messages for this hour. Create a free Alpha Freight account for unlimited AI, live load board, bids, and wallet.",
            keyPoints: [
              "✅ Free carrier or supplier account",
              "🚛 Live UK load board & smart matching",
              "💰 RPM tools, wallet & 7-day payouts",
            ],
            recommendation: "💡 Signing up takes under 2 minutes — no monthly fee.",
            nextStep: "Choose carrier (find loads) or supplier (post loads).",
            quickActions: [
              { label: "Sign Up Free", href: "/auth/select", action: "How do I sign up?", variant: "primary" },
            ],
          },
          remaining: 0,
        });
      }

    }

    const result = await runCopilotEngine({
      message,
      assistantType: normalizedType,
      history: history as ChatHistoryItem[],
      language,
      request,
      confirmAction,
      conversationId,
      publicMode,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      structuredMessage: result.structuredMessage,
      source: result.source,
      conversationId: result.conversationId || conversationId,
      alerts: result.alerts || [],
      remaining: guestRemaining,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Sorry, I encountered an error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
