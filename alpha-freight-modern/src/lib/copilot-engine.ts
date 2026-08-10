import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantKind, ChatHistoryItem, CopilotContextMemory, StructuredAssistantReply } from "@/lib/chat-types";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";
import { detectIntent } from "@/lib/copilot/intent-detector";
import { searchWeb, formatWebSearchContext, type WebSearchResult } from "@/lib/copilot/web-search";
import {
  buildClarificationReply,
  buildRpmCalculatorToolReply,
  detectClarificationNeeded,
  wantsRpmCalculatorForm,
} from "@/lib/copilot/query-clarifier";
import { inferGarbledQueryHint, normalizeUserQuery } from "@/lib/copilot/query-normalizer";
import { buildPublicRagContext, inferRagSourceLabel, shouldUsePublicRag } from "@/lib/copilot/public-rag";
import { buildKbContext } from "@/lib/copilot/knowledge-base";
import { fetchCopilotUserContext, formatUserContextForPrompt } from "@/lib/copilot/user-context";
import { enrichPlatformReply, executeCreateLoad } from "@/lib/copilot/platform-enrichment";
import { calculateProfit, extractProfitFromMessage } from "@/lib/copilot/profit-calculator";
import {
  buildCarrierIntelligenceReply,
  buildSupplierAdviseReply,
  fetchMarketRateLoads,
} from "@/lib/copilot/carrier-intelligence";
import { detectLanguage, getLanguageInstruction, buildGlossaryContext, prefersNaturalLanguageReply, type LanguagePreference } from "@/lib/copilot/language";
import { buildHandoffReply, logHandoffRequest } from "@/lib/copilot/handoff";
import { parseRouteQuery } from "@/lib/public-ai-widgets";
import {
  buildObservationPromptBlock,
  observeCarrierAiAssistantPage,
  observeSupplierAiAssistantPage,
} from "@/lib/copilot/page-observer";
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
  buildPublicKnowledgeReply,
} from "@/lib/copilot/fast-replies";
import { getOpenAiChatReply, isOpenAiConfigured, buildOpenAiRetryReply } from "@/lib/openai-chat";
import { buildEmployeeKnowledgeReply, buildEmployeeFastReply } from "@/lib/employee-team-ai-knowledge";
import { enrichPublicAiReply } from "@/lib/public-ai-growth";
import { getMarketingChatReply } from "@/lib/marketing-chat";
import { buildPublicInstantSocialReply } from "@/lib/public-ai-instant-replies";
import { formatMemoryForPrompt } from "@/lib/public-ai-memory";
import {
  buildWeatherOfflineReply,
  buildWeatherToolReply,
  fetchUkWeather,
  isWeatherQuery,
} from "@/lib/copilot/weather-provider";
import { isOpenAiReachable, markOpenAiUnreachable } from "@/lib/copilot/connectivity";
import { needsLiveWebSearch, isGeneralKnowledgeQuery } from "@/lib/public-ai-live-search";

export type CopilotEngineInput = {
  message: string;
  assistantType: AssistantKind;
  history: ChatHistoryItem[];
  language?: LanguagePreference;
  request?: NextRequest;
  confirmAction?: boolean;
  conversationId?: string;
  publicMode?: boolean;
  sessionMemory?: CopilotContextMemory;
  pageContext?: import("@/lib/chat-types").CopilotPageContext;
};

export type CopilotEngineResult = {
  message: string;
  structuredMessage: StructuredAssistantReply;
  source: string;
  conversationId?: string;
  alerts?: ReturnType<typeof buildProactiveAlerts>;
};

export type PublicStreamPrepareResult =
  | { mode: "complete"; result: CopilotEngineResult }
  | {
      mode: "stream";
      message: string;
      history: ChatHistoryItem[];
      assistantType: AssistantKind;
      extraContext: string;
    };

export async function preparePublicStreamChat(
  input: CopilotEngineInput
): Promise<PublicStreamPrepareResult> {
  const { assistantType, history, language: explicitLang, sessionMemory } = input;
  const message = normalizeUserQuery(input.message);

  const socialInstant = buildPublicInstantSocialReply(message, history);
  if (socialInstant) {
    return {
      mode: "complete",
      result: flattenPublicReply({ ...socialInstant, source: "instant" }),
    };
  }

  const clarification = detectClarificationNeeded(message, history);
  if (clarification) {
    const reply = buildClarificationReply(clarification);
    return {
      mode: "complete",
      result: flattenPublicReply({ ...reply, source: "clarification" }),
    };
  }

  if (wantsRpmCalculatorForm(message)) {
    const toolReply = buildRpmCalculatorToolReply();
    return {
      mode: "complete",
      result: flattenPublicReply({ ...toolReply, source: "tool" }),
    };
  }

  if (assistantType === "employee") {
    const employeeFast = buildEmployeeFastReply(message, history);
    if (employeeFast) {
      return {
        mode: "complete",
        result: flattenPublicReply({ ...employeeFast, source: "employee-knowledge" }),
      };
    }
  }

  if (isWeatherQuery(message)) {
    const live = await fetchUkWeather(message);
    if (live.ok) {
      const wx = buildWeatherToolReply(live);
      return {
        mode: "complete",
        result: flattenPublicReply({ ...wx, source: "live_weather" }),
      };
    }
    const offline = buildWeatherOfflineReply(message);
    return {
      mode: "complete",
      result: flattenPublicReply({ ...offline, source: "offline_weather" }),
    };
  }

  const lang = detectLanguage(message, explicitLang);
  const detected = detectIntent(message, assistantType);

  const profitFast = buildProfitFastReply(message, assistantType);
  if (profitFast && detected.needsProfitCalc) {
    return {
      mode: "complete",
      result: flattenPublicReply({
        ...profitFast,
        structuredMessage: enrichPublicAiReply(profitFast.structuredMessage, message),
        source: "instant",
      }),
    };
  }

  if (!isOpenAiConfigured()) {
    return {
      mode: "complete",
      result: await buildPublicOfflineReply(message, history, assistantType),
    };
  }

  if (assistantType !== "employee") {
    const openAiUp = await isOpenAiReachable();
    if (!openAiUp) {
      return {
        mode: "complete",
        result: await buildPublicOfflineReply(message, history, assistantType),
      };
    }
  }

  const extraContext: string[] = [
    getLanguageInstruction(lang),
    assistantType === "employee" ? EMPLOYEE_TEAM_AI_CONTEXT : PUBLIC_AI_CONTEXT,
  ];

  if (isGeneralKnowledgeQuery(message)) {
    extraContext.push(
      "User asked a general knowledge question — give a full helpful answer (science/history/business/coding/English/health/geography). Do not refuse or redirect to freight only."
    );
  }

  const memoryHint = formatMemoryForPrompt(sessionMemory || {});
  if (memoryHint) extraContext.push(memoryHint);

  const garbled = inferGarbledQueryHint(message);
  if (garbled) extraContext.push(garbled);

  const glossary = buildGlossaryContext(message);
  if (glossary) extraContext.push(glossary);

  if (shouldUsePublicRag(message)) {
    const rag = buildPublicRagContext(message);
    if (rag) extraContext.push(rag);
  }

  const shouldSearchWeb =
    detected.needsWebSearch || needsLiveWebSearch(message) || isDieselOrFuelQuery(message);
  const webSearch = shouldSearchWeb ? await withTimeout(searchWeb(message), 4000, null) : null;
  if (webSearch?.ok && (webSearch.answer || webSearch.results.length > 0)) {
    extraContext.push(
      `Live web search results (use for weather, news, diesel, traffic, exchange rates — prefer over outdated knowledge):\n${formatWebSearchContext(webSearch).slice(0, 1400)}`
    );
  }

  const intentHint = detected
    ? `\nPre-detected intent: ${JSON.stringify({
        platformIntent: detected.platformIntent,
        actionRequest: detected.actionRequest,
      })}`
    : "";

  const ragLabel = inferRagSourceLabel(message);

  return {
    mode: "stream",
    message,
    history,
    assistantType,
    extraContext: extraContext.filter(Boolean).join("\n") + intentHint + `\nRAG priority: ${ragLabel}`,
  };
}

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
  const isWeather = /\b(weather|forecast|wather|rain|temperature)\b/i.test(message);
  const title = isWeather ? "🌤️ Live weather" : "🔎 Live update";
  const body = isWeather
    ? `### Quick Answer\n\n${answer}\n\n> [!INFO]\n> Live data — check [BBC Weather](https://www.bbc.co.uk/weather) or [Met Office](https://www.metoffice.gov.uk/) before critical travel decisions.\n\n### For your run\nIf weather affects your schedule, I can help with **loads, RPM, or backhaul** on your route.`
    : `### Quick Answer\n\n${answer}\n\n> [!TIP]\n> Live data — verify before booking or dispatch decisions.`;

  const structured: StructuredAssistantReply = {
    mode: "logistics_copilot",
    displayStyle: "plain",
    assistantName: "Alpha Freight AI",
    modeLabel: "Live Data",
    knowledgeSource: "web_search",
    confidence: 92,
    title: "",
    shortExplanation: body,
    keyPoints: search.results.slice(0, 2).map((r) => r.title),
    recommendation: "",
    nextStep: isWeather ? "Ask about loads or RPM for your lane." : "Ask a follow-up if you need more detail.",
    suggestedQuestions: isWeather
      ? ["Find loads in the UK", "What is RPM?", "UK diesel price today"]
      : ["UK diesel price today", "How do I find loads?", "What is RPM?"],
    quickActions: [],
    rawText: body,
  };
  return { message: body, structuredMessage: structured, source: "web_search" };
}

export async function buildPublicChatStreamFallback(
  message: string,
  history: ChatHistoryItem[],
  assistantType: AssistantKind = "general"
): Promise<CopilotEngineResult> {
  return buildPublicOfflineReply(message, history, assistantType);
}

export async function buildPublicOfflineReply(
  message: string,
  history: ChatHistoryItem[],
  assistantType: AssistantKind = "general"
): Promise<CopilotEngineResult> {
  const socialInstant = buildPublicInstantSocialReply(message, []);
  if (socialInstant) {
    return flattenPublicReply({ ...socialInstant, source: "instant" });
  }

  if (isWeatherQuery(message)) {
    const live = await fetchUkWeather(message);
    if (live.ok) {
      return flattenPublicReply({ ...buildWeatherToolReply(live), source: "live_weather" });
    }
    return flattenPublicReply({ ...buildWeatherOfflineReply(message), source: "offline_weather" });
  }

  const detected = detectIntent(message, assistantType);
  if (detected.needsWebSearch || needsLiveWebSearch(message)) {
    const web = await searchWeb(message);
    if (web.ok && (web.answer || web.results.length > 0)) {
      return flattenPublicReply(buildWebSearchFastReply(web, message));
    }
  }

  if (isDieselOrFuelQuery(message)) {
    return flattenPublicReply({
      ...buildDieselPriceReply(assistantType),
      source: "instant",
    });
  }

  if (assistantType === "employee") {
    return flattenPublicReply({
      ...buildEmployeeKnowledgeReply(message, history),
      source: "employee-knowledge",
    });
  }

  return flattenPublicReply({
    ...buildPublicKnowledgeReply(message, history, assistantType),
    source: "marketing-fallback",
  });
}

function flattenPublicReply(result: CopilotEngineResult): CopilotEngineResult {
  const sm = result.structuredMessage;
  if (sm.displayStyle === "plain") {
    const body = (sm.rawText || sm.shortExplanation || result.message).trim();
    return {
      ...result,
      message: body,
      structuredMessage: { ...sm, rawText: body, shortExplanation: body },
    };
  }

  const body = (
    sm.rawText ||
    [
      sm.shortExplanation,
      ...(sm.keyPoints || []),
      sm.recommendation,
      sm.nextStep,
    ]
      .filter(Boolean)
      .join("\n\n")
  ).trim();

  return {
    ...result,
    message: body,
    structuredMessage: {
      ...sm,
      displayStyle: "plain",
      title: "",
      shortExplanation: body,
      keyPoints: [],
      recommendation: "",
      nextStep: "",
      rawText: body,
      platformResult: sm.platformResult,
      routePreview: sm.routePreview,
      metrics: sm.metrics,
      inlineTool: sm.inlineTool,
      chartType: sm.chartType,
      quickActions: sm.quickActions?.length ? sm.quickActions : [],
    },
  };
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

const PUBLIC_AI_CONTEXT = `Public /ai guest chat. You are Alpha Freight AI — UK freight expert AND a capable general assistant. Answer science, history, business, coding, English, health, and geography fully. Use live web data when provided. Never refuse reasonable general questions. Never mention OpenAI.`;

const EMPLOYEE_TEAM_AI_CONTEXT = `Internal Team AI for Alpha Freight employees. You are a senior sales coach — give copy-paste scripts, email templates, CRM steps, objection handling, commission info, and UK freight knowledge. Never say you are "Alpha Freight AI" public bot. Never mention OpenAI. Always answer the employee's question directly with actionable content.`;

async function runPublicCopilotEngine(
  input: CopilotEngineInput
): Promise<CopilotEngineResult | null> {
  const { message, assistantType, history, language: explicitLang } = input;

  const socialInstant = buildPublicInstantSocialReply(message, history);
  if (socialInstant) {
    return flattenPublicReply({ ...socialInstant, source: "instant" });
  }

  if (!isOpenAiConfigured()) return null;

  const lang = detectLanguage(message, explicitLang);
  const detected = detectIntent(message, assistantType);

  const profitFast = buildProfitFastReply(message, assistantType);
  if (profitFast && detected.needsProfitCalc) {
    return flattenPublicReply({
      ...profitFast,
      structuredMessage: enrichPublicAiReply(profitFast.structuredMessage, message),
      source: "instant",
    });
  }

  if (isDieselOrFuelQuery(message)) {
    const webSearch = await withTimeout(searchWeb(message), 2500, null);
    if (webSearch?.ok && webSearch.answer) {
      const fast = buildWebSearchFastReply(webSearch, message);
      return flattenPublicReply({
        ...fast,
        structuredMessage: enrichPublicAiReply(fast.structuredMessage, message),
        source: "web_search",
      });
    }
    const diesel = buildDieselPriceReply(assistantType);
    return flattenPublicReply({
      ...diesel,
      structuredMessage: enrichPublicAiReply(diesel.structuredMessage, message),
      source: "instant",
    });
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

  if (!openAiReply) {
    return flattenPublicReply({
      ...buildPublicKnowledgeReply(message, history, assistantType),
      source: "marketing-fallback",
    });
  }

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

  return flattenPublicReply({
    message: openAiReply.message,
    structuredMessage: structured,
    source: "openai",
  });
}

export async function runCopilotEngine(input: CopilotEngineInput): Promise<CopilotEngineResult> {
  const { message, assistantType, history, language: explicitLang, confirmAction, conversationId: inputConvId, publicMode } = input;

  if (publicMode) {
    const socialInstant = buildPublicInstantSocialReply(message, history);
    if (socialInstant) {
      return flattenPublicReply({ ...socialInstant, source: "instant" });
    }

    const publicResult = await runPublicCopilotEngine(input);
    if (publicResult) return publicResult;

    const knowledge = buildPublicKnowledgeReply(message, history, assistantType);
    return flattenPublicReply({ ...knowledge, source: "marketing-fallback" });
  }

  const supabase = input.request ? createAuthedSupabaseFromRequest(input.request) : null;

  const lang = detectLanguage(message, explicitLang);
  const skipEnglishFastPaths = prefersNaturalLanguageReply(lang);
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
  let advisoryContextForLang: string | null = null;

  if (userCtx && supabase && assistantType === "carrier") {
    const marketLoads = await fetchMarketRateLoads(supabase);
    const carrierIntel = buildCarrierIntelligenceReply(userCtx, detected, message, marketLoads);
    if (carrierIntel) {
      if (skipEnglishFastPaths) {
        advisoryContextForLang = [
          carrierIntel.title,
          carrierIntel.shortExplanation,
          ...(carrierIntel.keyPoints || []).slice(0, 5),
          carrierIntel.recommendation,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        saveChatMessagesAsync(supabase, inputConvId, message, carrierIntel, assistantType);
        return {
          message: [carrierIntel.title, carrierIntel.shortExplanation].filter(Boolean).join("\n\n"),
          structuredMessage: carrierIntel,
          source: "carrier-intelligence",
          alerts,
        };
      }
    }
  }

  const profitFast = buildProfitFastReply(message, assistantType);
  if (profitFast && detected.needsProfitCalc) {
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, profitFast.structuredMessage, assistantType);
    return { ...profitFast, source: "instant", alerts };
  }

  if (userCtx && supabase && assistantType === "supplier") {
    const routeFromMessage = parseRouteQuery(message);
    const isPriceQuery =
      detected.platformIntent?.type === "load_advise" ||
      (/\b(price|rate|budget|offer|charge|cost|kitna|hinta|tarjous|budjetti|maksaa|paljonko)\b/i.test(message) &&
        routeFromMessage);

    if (isPriceQuery) {
      const marketLoads = await fetchMarketRateLoads(supabase);
      const draft = {
        origin:
          (detected.platformIntent?.type === "load_advise" && detected.platformIntent.origin) ||
          routeFromMessage?.origin ||
          undefined,
        destination:
          (detected.platformIntent?.type === "load_advise" && detected.platformIntent.destination) ||
          routeFromMessage?.destination ||
          undefined,
      };
      const supplierAdvise = buildSupplierAdviseReply(draft, marketLoads);

      if (skipEnglishFastPaths) {
        advisoryContextForLang = [
          supplierAdvise.title,
          supplierAdvise.shortExplanation,
          ...(supplierAdvise.keyPoints || []).slice(0, 4),
          supplierAdvise.recommendation,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        saveChatMessagesAsync(supabase, inputConvId, message, supplierAdvise, assistantType);
        return {
          message: [supplierAdvise.title, supplierAdvise.shortExplanation].filter(Boolean).join("\n\n"),
          structuredMessage: supplierAdvise,
          source: "supplier-load-advisor",
          alerts,
        };
      }
    }
  }

  if (userCtx && detected.platformIntent && !skipEnglishFastPaths) {
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

  if (isGreetingOrThanks(message, history) && !skipEnglishFastPaths) {
    const instant = buildInstantMarketingReply(message, assistantType, history);
    if (supabase) saveChatMessagesAsync(supabase, inputConvId, message, instant.structuredMessage, assistantType);
    return { ...instant, source: "instant", alerts };
  }

  const extraContext: string[] = [getLanguageInstruction(lang)];
  const glossary = buildGlossaryContext(message, lang);
  if (glossary) extraContext.push(glossary);
  if (advisoryContextForLang) {
    extraContext.push(`Live market/platform data — weave into your reply:\n${advisoryContextForLang}`);
  }
  if (needsKbContext(message)) extraContext.push(buildKbContext(message));
  if (userCtx) extraContext.push(formatUserContextForPrompt(userCtx));
  if (detected.platformIntent) {
    extraContext.push(`Intent: ${JSON.stringify(detected.platformIntent)}`);
  }
  if (webSearch?.ok && webSearch.answer) {
    extraContext.push(`Web: ${webSearch.answer.slice(0, 400)}`);
  }

  if (input.pageContext?.pageId === "supplier_ai_assistant") {
    const observation = observeSupplierAiAssistantPage({
      hasStarted: input.pageContext.hasStarted,
      messageCount: input.pageContext.messageCount,
      lastUserMessage: input.pageContext.lastUserMessage || message,
      idleMs: input.pageContext.idleMs,
    });
    extraContext.push(`Page observation:\n${buildObservationPromptBlock(observation)}`);
  } else if (input.pageContext?.pageId === "carrier_ai_assistant") {
    const observation = observeCarrierAiAssistantPage({
      hasStarted: input.pageContext.hasStarted,
      messageCount: input.pageContext.messageCount,
      lastUserMessage: input.pageContext.lastUserMessage || message,
      idleMs: input.pageContext.idleMs,
    });
    extraContext.push(`Page observation:\n${buildObservationPromptBlock(observation)}`);
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
