import { NextRequest } from "next/server";
import type { AssistantKind, ChatHistoryItem, CopilotContextMemory } from "@/lib/chat-types";
import { preparePublicStreamChat, buildPublicChatStreamFallback } from "@/lib/copilot-engine";
import { markOpenAiUnreachable } from "@/lib/copilot/connectivity";
import type { LanguagePreference } from "@/lib/copilot/language";
import { checkPublicAiRateLimit, getClientIp, PUBLIC_AI_MESSAGE_LIMIT } from "@/lib/public-ai-rate-limit";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";
import { detectIntent } from "@/lib/copilot/intent-detector";
import { enrichPublicAiReply } from "@/lib/public-ai-growth";
import { buildPublicPlainReply, inferPublicSuggestedQuestions, streamPublicOpenAiReply } from "@/lib/openai-stream";
import { getOpenAiChatReply } from "@/lib/openai-chat";

export const runtime = "nodejs";

function sseEncode(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const language = typeof body.language === "string" ? (body.language as LanguagePreference) : undefined;
    const assistantType: AssistantKind =
      body.assistantType === "employee" ||
      body.assistantType === "carrier" ||
      body.assistantType === "supplier"
        ? body.assistantType
        : "general";

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const supabase = createAuthedSupabaseFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isGuest = !user;
    let guestRemaining: number | undefined;

    if (isGuest) {
      const ip = getClientIp(request);
      const limit = checkPublicAiRateLimit(ip);
      guestRemaining = limit.remaining;

      if (!limit.allowed) {
        const limitStream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              sseEncode("limit", {
                limitReached: true,
                remaining: 0,
                message: `Free limit reached (${PUBLIC_AI_MESSAGE_LIMIT} messages/hour). Sign up free for unlimited Alpha Freight AI + live loads.`,
                structuredMessage: {
                  mode: "logistics_copilot",
                  displayStyle: "plain",
                  title: "Sign up for unlimited AI",
                  shortExplanation:
                    "You've used your free guest messages for this hour. Create a free Alpha Freight account for unlimited AI, live load board, bids, and wallet.",
                  keyPoints: [],
                  quickActions: [
                    {
                      label: "Sign Up Free",
                      href: "/auth/select",
                      action: "How do I sign up?",
                      variant: "primary",
                    },
                  ],
                },
              })
            );
            controller.close();
          },
        });

        return new Response(limitStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
    }

    const prepared = await preparePublicStreamChat({
      message,
      assistantType,
      history: history as ChatHistoryItem[],
      language,
      publicMode: true,
      sessionMemory:
        body.sessionMemory && typeof body.sessionMemory === "object"
          ? (body.sessionMemory as CopilotContextMemory)
          : undefined,
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(sseEncode(event, data));
        };

        try {
          if (prepared.mode === "complete") {
            send("done", {
              message: prepared.result.message,
              structuredMessage: prepared.result.structuredMessage,
              source: prepared.result.source,
              remaining: guestRemaining,
            });
            controller.close();
            return;
          }

          const detected = detectIntent(message, prepared.assistantType);
          let fullText = "";
          let gotToken = false;

          for await (const delta of streamPublicOpenAiReply({
            message: prepared.message,
            history: prepared.history,
            extraContext: prepared.extraContext,
            detectedIntent: detected,
            assistantType: prepared.assistantType,
          })) {
            gotToken = true;
            fullText += delta;
            send("token", { delta });
          }

          if (!gotToken || !fullText.trim()) {
            markOpenAiUnreachable();

            const retry = await getOpenAiChatReply({
              message: prepared.message,
              history: prepared.history,
              extraContext: prepared.extraContext,
              detectedIntent: detected,
              assistantType: prepared.assistantType,
              publicMode: true,
            });

            if (retry?.message?.trim()) {
              const suggestedQuestions = inferPublicSuggestedQuestions(message, prepared.history);
              let structuredMessage = buildPublicPlainReply(
                retry.message.trim(),
                prepared.assistantType,
                retry.structuredMessage?.suggestedQuestions?.length
                  ? retry.structuredMessage.suggestedQuestions
                  : suggestedQuestions
              );
              structuredMessage = enrichPublicAiReply(structuredMessage, message);
              structuredMessage.knowledgeSource = prepared.extraContext.includes("Live web data")
                ? "openai+web"
                : "openai";
              send("done", {
                message: retry.message.trim(),
                structuredMessage,
                source: "openai",
                remaining: guestRemaining,
              });
              controller.close();
              return;
            }

            const fallback = await buildPublicChatStreamFallback(
              message,
              prepared.history,
              prepared.assistantType
            );
            send("done", {
              message: fallback.message,
              structuredMessage: fallback.structuredMessage,
              source: fallback.source,
              remaining: guestRemaining,
            });
            controller.close();
            return;
          }

          const suggestedQuestions = inferPublicSuggestedQuestions(message, prepared.history);
          let structuredMessage = buildPublicPlainReply(
            fullText.trim(),
            prepared.assistantType,
            suggestedQuestions
          );
          structuredMessage = enrichPublicAiReply(structuredMessage, message);
          structuredMessage.knowledgeSource =
            prepared.extraContext.includes("Live web data") ? "openai+web" : "openai";

          send("done", {
            message: fullText.trim(),
            structuredMessage,
            source: "openai",
            remaining: guestRemaining,
          });
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          send("error", { message: "Sorry, something went wrong. Please try again." });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);
    return new Response(JSON.stringify({ error: "Stream failed" }), { status: 500 });
  }
}
