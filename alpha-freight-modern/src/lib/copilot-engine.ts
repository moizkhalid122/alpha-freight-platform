import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantKind, ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";
import { detectIntent } from "@/lib/copilot/intent-detector";
import { searchWeb, formatWebSearchContext, type WebSearchResult } from "@/lib/copilot/web-search";
import { buildKbContext } from "@/lib/copilot/knowledge-base";
import { fetchCopilotUserContext, formatUserContextForPrompt } from "@/lib/copilot/user-context";
import { enrichPlatformReply, executeCreateLoad } from "@/lib/copilot/platform-enrichment";
import { calculateProfit, extractProfitFromMessage } from "@/lib/copilot/profit-calculator";
import { detectLanguage, getLanguageInstruction, buildGlossaryContext, type LanguagePreference } from "@/lib/copilot/language";
import { buildHandoffReply, logHandoffRequest } from "@/lib/copilot/handoff";
import { buildProactiveAlerts } from "@/lib/copilot/notifications";
import { analyzePodText, buildPodHelpReply } from "@/lib/copilot/pod-analyzer";
import { withTimeout } from "@/lib/copilot/timeout";
import {
  isGenericMarketingFallback,
  buildInstantMarketingReply,
  buildPlatformFastReply,
  buildProfitFastReply,
  isGreetingOrThanks,
  isDieselOrFuelQuery,
  buildDieselPriceReply,
} from "@/lib/copilot/fast-replies";
import { getOpenAiChatReply, isOpenAiConfigured, buildOpenAiRetryReply } from "@/lib/openai-chat";
import { enrichPublicAiReply } from "@/lib/public-ai-growth";
import { getMarketingChatReply } from "@/lib/marketing-chat";

export type CopilotEngineInput = {
  message: string;
  assistantType: AssistantKind;
  history: ChatHistoryItem[];
  language?: LanguagePreference;
  request?: NextRequest;
  confirmAction?: boolean;
  conversationId?: string;
  publicMode?: boolean;
};

export type CopilotEngineResult = {
  message: string;
  structuredMessage: StructuredAssistantReply;
  source: string;
  conversationId?: string;
  alerts?: ReturnType<typeof buildProactiveAlerts>;
};

function needsUserContext(
  detected: ReturnType<typeof detectIntent>,
  confirmAction: boolean
): boolean {
  if (confirmAction) return true;
  if (detected.platformIntent) return true;
  if (detected.actionRequest) return true;
  if (detected.needsProfitCalc) return true;
  return false;
}

function needsKbContext(message: string): boolean {
  return /\b(alpha freight|sign up|signup|policy|terms|pod|proof of delivery|how do i|kaise|kya hai|what is)\b/i.test(
    message
  );
}

function mergeIntentIntoReply(
  reply: StructuredAssistantReply,
  detected: ReturnType<typeof detectIntent>
): StructuredAssistantReply {
  return {
    ...reply,
    platformIntent: reply.platformIntent || detected.platformIntent,
    actionRequest: reply.actionRequest || detected.actionRequest || null,
  };
}

function buildWebSearchFastReply(search: WebSearchResult, message: string): CopilotEngineResult {
  const answer = search.answer || search.results[0]?.content?.slice(0, 500) || "No live results found.";
  const structured: StructuredAssistantReply = {
    mode: "logistics_copilot",
    displayStyle: "card",
    assistantName: "Alpha Freight Co-Pilot",
    modeLabel: "Live Data",
    knowledgeSource: "web_search",
    confidence: 90,
    title: "🔎 Live Update",
    shortExplanation: answer,
    keyPoints: search.results.slice(0, 3).map((r, i) => `${["📌", "🌐", "💡"][i] || "📌"} ${r.title}`),
    recommendation: "💡 Live data — verify critical numbers before booking decisions.",
    nextStep: "Ask a follow-up if you need a specific route or date.",
    suggestedQuestions: ["⛽ Diesel price near me?", "🛣️ M1 traffic today?"],
    quickActions: [],
    rawText: answer,
  };
  return { message: answer, structuredMessage: structured, source: "web_search" };
}

function applyProfitCalc(reply: StructuredAssistantReply, message: string): StructuredAssistantReply {
  const inputs = extractProfitFromMessage(message);
  if (!inputs?.rate || !inputs?.loadedMiles) return reply;

  const result = calculateProfit({ rate: inputs.rate, loadedMiles: inputs.loadedMiles });
  return {
    ...reply,
    title: "📊 Profit & RPM Analysis",
    shortExplanation: result.summary,
    metrics: result.metrics,
    recommendation: result.recommendation,
    keyPoints: [
      ...(reply.keyPoints || []).slice(0, 3),
      `💰 Est. profit: £${result.grossProfit.toFixed(2)}`,
      `📈 RPM: £${result.rpm.toFixed(2)}/mi`,
    ].slice(0, 5),
    knowledgeSource: reply.knowledgeSource || "copilot-engine",
  };
}

function applyPodHelp(reply: StructuredAssistantReply, message: string): StructuredAssistantReply {
  const podInfo = buildPodHelpReply(analyzePodText(message));
  return {
    ...reply,
    title: podInfo.title,
    shortExplanation: podInfo.shortExplanation,
    keyPoints: podInfo.keyPoints,
    recommendation: podInfo.recommendation,
    knowledgeSource: "pod-guide",
  };
}

function saveChatMessagesAsync(
  supabase: SupabaseClient,
  conversationId: string | undefined,
  userMessage: string,
  reply: StructuredAssistantReply,
  assistantType: AssistantKind
): void {
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let convId = conversationId;
      if (!convId) {
        const { data: conv } = await supabase
          .from("ai_chat_conversations")
          .insert({ user_id: user.id, assistant_type: assistantType, title: userMessage.slice(0, 72) })
          .select("id")
          .single();
        convId = conv?.id;
      }
      if (!convId) return;

      await supabase.from("ai_chat_messages").insert([
        { conversation_id: convId, role: "user", content: { text: userMessage } },
        {
          conversation_id: convId,
          role: "assistant",
          content: {
            title: reply.title,
            sectionLabel: reply.shortExplanation,
            bullets: reply.keyPoints,
            footer: reply.nextStep,
            structured: reply,
          },
        },
      ]);
    } catch {
      // Non-blocking — history save must not slow chat
    }
  })();
}

const PUBLIC_AI_CONTEXT = `Public /ai page — guest, no login. You are Alpha Freight AI only. Never mention OpenAI or other AI brands in replies.`;

async function runPublicCopilotEngine(
  input: CopilotEngineInput
): Promise<CopilotEngineResult | null> {
  const { message, assistantType, history, language: explicitLang } = input;
  if (!isOpenAiConfigured()) return null;

  const lang = detectLanguage(message, explicitLang);
  const detected = detectIntent(message, assistantType);

  const profitFast = buildProfitFastReply(message, assistantType);
  if (profitFast && detected.needsProfitCalc) {
    return {
      ...profitFast,
      structuredMessage: enrichPublicAiReply(profitFast.structuredMessage, message),
      source: "instant",
    };
  }

  if (isDieselOrFuelQuery(message)) {
    const webSearch = await withTimeout(searchWeb(message), 2500, null);
    if (webSearch?.ok && webSearch.answer) {
      const fast = buildWebSearchFastReply(webSearch, message);
      return {
        ...fast,
        structuredMessage: enrichPublicAiReply(fast.structuredMessage, message),
        source: "web_search",
      };
    }
    const diesel = buildDieselPriceReply(assistantType);
    return {
      ...diesel,
      structuredMessage: enrichPublicAiReply(diesel.structuredMessage, message),
      source: "instant",
    };
  }

  const extraContext: string[] = [getLanguageInstruction(lang), PUBLIC_AI_CONTEXT];
  const glossary = buildGlossaryContext(message);
  if (glossary) extraContext.push(glossary);
  if (needsKbContext(message)) extraContext.push(buildKbContext(message));

  const webSearch = detected.needsWebSearch
    ? await withTimeout(searchWeb(message), 2500, null)
    : null;
  if (webSearch?.ok && webSearch.answer) {
    extraContext.push(`Live web data: ${webSearch.answer.slice(0, 500)}`);
  }

  const openAiReply = await withTimeout(
    getOpenAiChatReply({
      message,
      assistantType,
      history,
      extraContext: extraContext.filter(Boolean).join("\n"),
      detectedIntent: detected,
      publicMode: true,
    }),
    20000,
    null
  );

  if (!openAiReply) return null;

  let structured = mergeIntentIntoReply(openAiReply.structuredMessage, detected);

  if (detected.needsProfitCalc || extractProfitFromMessage(message)) {
    structured = applyProfitCalc(structured, message);
  }
  if (webSearch?.ok && webSearch.answer && detected.needsWebSearch) {
    structured = {
      ...structured,
      knowledgeSource: "openai+web",
      keyPoints: [
        ...structured.keyPoints.slice(0, 4),
        `🌐 Live: ${webSearch.answer.slice(0, 160)}`,
      ].slice(0, 7),
    };
  }

  structured = enrichPublicAiReply(structured, message);
  structured.knowledgeSource = structured.knowledgeSource || "openai";

  return {
    message: openAiReply.message,
    structuredMessage: structured,
    source: "openai",
  };
}

export async function runCopilotEngine(input: CopilotEngineInput): Promise<CopilotEngineResult> {
  const { message, assistantType, history, language: explicitLang, confirmAction, conversationId: inputConvId, publicMode } = input;

  if (publicMode) {
    const publicResult = await runPublicCopilotEngine(input);
    if (publicResult) return publicResult;

    const fallback = getMarketingChatReply(message, history);
    return {
      message: fallback.message,
      structuredMessage: {
        mode: "logistics_copilot",
        displayStyle: "card",
        assistantName: "Alpha Freight AI",
        modeLabel: "Alpha Freight AI",
        knowledgeSource: "marketing-fallback",
        confidence: 70,
        title: "Alpha Freight AI",
        shortExplanation: fallback.message,
        keyPoints: [],
        recommendation: "",
        nextStep: "Try again in a few seconds — Alpha Freight AI is reconnecting.",
        quickActions: [],
        rawText: fallback.message,
      },
      source: "marketing-fallback",
    };
  }

  const supabase = input.request ? createAuthedSupabaseFromRequest(input.request) : null;

  const lang = detectLanguage(message, explicitLang);
  const detected = detectIntent(message, assistantType);
  const fetchCtx = Boolean(supabase && needsUserContext(detected, Boolean(confirmAction)));

  if (detected.needsHandoff) {
    const handoff = buildHandoffReply(undefined);
    if (supabase) void logHandoffRequest(supabase, null, message, assistantType);
    return { message: handoff.rawText || handoff.shortExplanation, structuredMessage: handoff, source: "handoff" };
  }

  if (detected.needsPodHelp && !fetchCtx && !detected.needsWebSearch) {
    const podInfo = buildPodHelpReply(analyzePodText(message));
    const structured: StructuredAssistantReply = {
      mode: "logistics_copilot",
      displayStyle: "card",
      title: podInfo.title,
      shortExplanation: podInfo.shortExplanation,
      keyPoints: podInfo.keyPoints,
      recommendation: podInfo.recommendation,
      nextStep: "Upload POD in app under My Loads.",
      quickActions: [],
      knowledgeSource: "pod-guide",
    };
    return { message: podInfo.shortExplanation, structuredMessage: structured, source: "pod-guide" };
  }

  if (isDieselOrFuelQuery(message) && !fetchCtx) {
    const webSearch = await withTimeout(searchWeb(message), 3000, null);
    if (webSearch?.ok && webSearch.answer) {
      const fast = buildWebSearchFastReply(webSearch, message);
      if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, fast.structuredMessage, assistantType);
      return { ...fast, source: "web_search" };
    }
    const diesel = buildDieselPriceReply(assistantType);
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, diesel.structuredMessage, assistantType);
    return { ...diesel, source: "instant" };
  }

  const [userCtx, webSearch] = await Promise.all([
    fetchCtx && supabase
      ? withTimeout(fetchCopilotUserContext(supabase, assistantType), 2500, null)
      : Promise.resolve(null),
    detected.needsWebSearch
      ? searchWeb(message)
      : Promise.resolve(null as WebSearchResult | null),
  ]);

  const alerts = buildProactiveAlerts(userCtx);

  const profitFast = buildProfitFastReply(message, assistantType);
  if (profitFast && detected.needsProfitCalc) {
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, profitFast.structuredMessage, assistantType);
    return { ...profitFast, source: "instant", alerts };
  }

  if (userCtx && detected.platformIntent) {
    const platformFast = buildPlatformFastReply(userCtx, detected, message, assistantType);
    if (platformFast) {
      if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, platformFast.structuredMessage, assistantType);
      return { ...platformFast, source: "platform-fast", alerts };
    }
  }

  if (webSearch?.ok && webSearch.answer && detected.needsWebSearch) {
    const fast = buildWebSearchFastReply(webSearch, message);
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, fast.structuredMessage, assistantType);
    return { ...fast, alerts };
  }

  if (isGreetingOrThanks(message)) {
    const instant = buildInstantMarketingReply(message, assistantType, history);
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, instant.structuredMessage, assistantType);
    return { ...instant, source: "instant", alerts };
  }

  const extraContext: string[] = [getLanguageInstruction(lang)];
  const glossary = buildGlossaryContext(message);
  if (glossary) extraContext.push(glossary);
  if (needsKbContext(message)) extraContext.push(buildKbContext(message));
  if (userCtx) extraContext.push(formatUserContextForPrompt(userCtx));
  if (detected.platformIntent) {
    extraContext.push(`Intent: ${JSON.stringify(detected.platformIntent)}`);
  }
  if (webSearch?.ok && webSearch.answer) {
    extraContext.push(`Web: ${webSearch.answer.slice(0, 400)}`);
  }

  if (!isOpenAiConfigured()) {
    const fallback = getMarketingChatReply(message, history);
    return {
      message: fallback.message,
      structuredMessage: fallback.structuredMessage || {
        mode: "logistics_copilot",
        title: "Alpha Freight",
        shortExplanation: fallback.message,
        keyPoints: [],
        recommendation: "",
        nextStep: "",
        quickActions: [],
      },
      source: "marketing-fallback",
      alerts,
    };
  }

  const openAiReply = await withTimeout(
    getOpenAiChatReply({
      message,
      assistantType,
      history,
      extraContext: extraContext.filter(Boolean).join("\n"),
      detectedIntent: detected,
    }),
    10000,
    null
  );

  if (!openAiReply) {
    if (webSearch?.ok && webSearch.answer) {
      const fast = buildWebSearchFastReply(webSearch, message);
      return { ...fast, alerts };
    }
    if (userCtx && detected.platformIntent) {
      const platformFast = buildPlatformFastReply(userCtx, detected, message, assistantType);
      if (platformFast) return { ...platformFast, source: "platform-fast", alerts };
    }
    if (!isGenericMarketingFallback(message, history)) {
      const instant = buildInstantMarketingReply(message, assistantType, history);
      return { ...instant, source: "instant", alerts };
    }
    const retry = buildOpenAiRetryReply(assistantType);
    return { message: retry.message, structuredMessage: retry.structuredMessage, source: "openai-retry", alerts };
  }

  let structured = mergeIntentIntoReply(openAiReply.structuredMessage, detected);

  if (detected.needsPodHelp) structured = applyPodHelp(structured, message);
  if (detected.needsProfitCalc || extractProfitFromMessage(message)) {
    structured = applyProfitCalc(structured, message);
  }
  if (webSearch?.ok && webSearch.answer && detected.needsWebSearch) {
    structured = {
      ...structured,
      knowledgeSource: "web_search",
      keyPoints: [
        ...structured.keyPoints.slice(0, 3),
        `🌐 Live: ${webSearch.answer.slice(0, 180)}`,
      ].slice(0, 5),
    };
  }

  if (userCtx) {
    structured = enrichPlatformReply(structured, userCtx, message);
    if (confirmAction && structured.actionRequest?.type === "create_load") {
      structured = await withTimeout(
        executeCreateLoad(supabase!, { ...structured, actionRequest: { ...structured.actionRequest!, status: "ready" } }),
        4000,
        structured
      );
    } else if (
      structured.actionRequest?.type === "create_load" &&
      structured.actionRequest.status === "ready" &&
      !confirmAction
    ) {
      structured = {
        ...structured,
        actionRequest: {
          ...structured.actionRequest,
          status: "needs_input",
          prompt: "Say 'confirm post load' to publish.",
        },
        nextStep: "Say 'confirm post load' to publish.",
      };
    }
  }

  structured.knowledgeSource = structured.knowledgeSource || "openai";

  if (supabase) {
    saveChatMessagesAsync(supabase, inputConvId, message, structured, assistantType);
  }

  return {
    message: openAiReply.message,
    structuredMessage: structured,
    source: "openai",
    conversationId: inputConvId,
    alerts,
  };
}
