import dns from "node:dns";
import type { AssistantKind, ChatHistoryItem, StructuredAssistantReply, CopilotPlatformIntent, CopilotActionRequest, CopilotMetric } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import { buildPublicAiSystemPrompt } from "@/lib/public-ai-prompt";
import { buildEmployeeTeamAiSystemPrompt } from "@/lib/employee-team-ai-prompt";
import {
  type AiTier,
  resolveAiTier,
  resolveHistoryLimits,
  resolveOpenAiMaxTokens,
  resolveOpenAiModel,
  resolveOpenAiTemperature,
} from "@/lib/openai-model-router";

// Prefer IPv4 — fixes intermittent OpenAI timeouts on some Windows networks
dns.setDefaultResultOrder("ipv4first");

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const SUPPORT_PHONE = "+44 7782 294718";

const ROLE_LABELS: Record<AssistantKind, string> = {
  general: "Alpha Freight AI",
  carrier: "Carrier Co-Pilot",
  supplier: "Supplier Co-Pilot",
  employee: "Team AI",
};

function buildSystemPrompt(assistantType: AssistantKind, extraContext?: string, publicMode?: boolean): string {
  const role = ROLE_LABELS[assistantType];

  if (publicMode) {
    const basePrompt =
      assistantType === "employee"
        ? buildEmployeeTeamAiSystemPrompt(extraContext)
        : buildPublicAiSystemPrompt(extraContext);

    return `${basePrompt}

Reply JSON only:
{"message":"Full markdown response using the structure above.","suggestedQuestions":["Follow up 1?","Follow up 2?","Follow up 3?"]}`;
  }

  const contextByType: Record<AssistantKind, string> = {
    general: `Alpha Freight — UK's free freight AI & load board. Post loads, find haulage, RPM, diesel, payouts, tracking, POD, signup. Brand: "Alpha Freight AI" / "UK Freight AI".`,
    carrier: `UK carriers: loads, bids, RPM, routes, wallet, payouts, tracking, POD.`,
    supplier: `UK suppliers: post loads, bids, pay instant/later, tracking, POD.`,
    employee: `Internal sales team: CRM, cold calls, follow-ups, commission, lead status, daily targets, scripts, objection handling.`,
  };

  return `You are ${role} for Alpha Freight (UK logistics).

${contextByType[assistantType]}

STYLE — DETAILED, STRONG & FRIENDLY (very important):
- Explain like a helpful expert — warm, professional, easy to understand.
- Match user language (English / Urdu / Roman Urdu / Finnish).
- Direct answer first, then WHY and HOW in simple words.
- Use real UK freight examples (RPM, booking loads, payouts).
- Every keyPoint MUST start with a relevant emoji (🚛 💰 📦 📍 ⛽ ✅ 💡 📌 etc).

INCLUDE:
- title: clear topic + 1 emoji
- shortExplanation: 2-4 sentences — full context so user truly understands
- keyPoints: 4-6 detailed bullets with emoji prefix — steps, tips, facts
- recommendation: 1-2 sentence pro tip with 💡
- nextStep: clear action on Alpha Freight
- suggestedQuestions: 2 follow-up questions
- platformIntent / actionRequest / metrics when relevant

Use LIVE CONTEXT when provided — never invent wallet/load IDs.
Support: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE}

${extraContext ? `\nLIVE CONTEXT:\n${extraContext.slice(0, 1400)}\n` : ""}

Reply JSON only:
{"title":"🚛 Clear title","shortExplanation":"2-4 sentences here.","keyPoints":["📌 Step 1","💡 Tip 2","✅ Step 3","🚛 Step 4"],"recommendation":"💡 Pro tip here.","nextStep":"Clear next action.","suggestedQuestions":["Follow up 1?","Follow up 2?"],"platformIntent":null,"actionRequest":null,"metrics":[]}`;
}

function normalizeHistory(
  history: ChatHistoryItem[],
  publicMode?: boolean,
  aiTier: AiTier = "guest"
): ChatHistoryItem[] {
  const { turnLimit, charLimit } = resolveHistoryLimits(aiTier, publicMode);

  return history
    .slice(-turnLimit)
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, charLimit),
    }));
}

type OpenAiJsonReply = {
  message?: string;
  title?: string;
  shortExplanation?: string;
  keyPoints?: string[];
  recommendation?: string;
  nextStep?: string;
  suggestedQuestions?: string[];
  platformIntent?: CopilotPlatformIntent | null;
  actionRequest?: CopilotActionRequest | null;
  metrics?: CopilotMetric[];
};

function parseJsonReply(raw: string): OpenAiJsonReply | null {
  const trimmed = raw.trim();
  const jsonText = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(jsonText) as OpenAiJsonReply;
  } catch {
    return null;
  }
}

function toPlainPublicReply(
  text: string,
  assistantType: AssistantKind,
  suggestedQuestions: string[] = []
): StructuredAssistantReply {
  const label = ROLE_LABELS[assistantType];
  const body = text.trim();

  return {
    mode: "logistics_copilot",
    displayStyle: "plain",
    assistantName: label,
    modeLabel: label,
    knowledgeSource: "openai",
    confidence: 94,
    title: "",
    shortExplanation: body,
    keyPoints: [],
    recommendation: "",
    nextStep: "",
    suggestedQuestions: suggestedQuestions.slice(0, 2),
    quickActions: [],
    rawText: body,
  };
}

function toStructuredReply(
  parsed: OpenAiJsonReply | null,
  plainText: string,
  assistantType: AssistantKind,
  publicMode?: boolean
): StructuredAssistantReply {
  const label = ROLE_LABELS[assistantType];

  if (publicMode) {
    const suggestedQuestions = (parsed?.suggestedQuestions || [])
      .map((q) => String(q).trim())
      .filter(Boolean)
      .slice(0, 2);

    const body = String(parsed?.message || parsed?.shortExplanation || plainText).trim();
    return toPlainPublicReply(body, assistantType, suggestedQuestions);
  }

  if (!parsed) {
    return {
      mode: "logistics_copilot",
      displayStyle: "card",
      assistantName: label,
      modeLabel: label,
      knowledgeSource: "openai",
      confidence: 88,
      title: label,
      shortExplanation: plainText.trim(),
      keyPoints: [],
      recommendation: "",
      nextStep: "",
      quickActions: [],
      rawText: plainText.trim(),
    };
  }

  const keyPoints = (parsed.keyPoints || [])
    .map((p) => String(p).trim())
    .filter(Boolean)
    .slice(0, 6);

  const suggestedQuestions = (parsed.suggestedQuestions || [])
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 2);

  const title = String(parsed.title || label).trim();
  const shortExplanation = String(parsed.shortExplanation || parsed.message || plainText).trim();
  const recommendation = String(parsed.recommendation || "").trim();
  const nextStep = String(parsed.nextStep || "").trim();

  const rawText = [
    title,
    shortExplanation,
    ...keyPoints,
    recommendation ? `Tip: ${recommendation}` : "",
    nextStep ? `Next: ${nextStep}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    mode: "logistics_copilot",
    displayStyle: "card",
    assistantName: label,
    modeLabel: label,
    knowledgeSource: "openai",
    confidence: 94,
    title,
    shortExplanation,
    keyPoints,
    recommendation,
    nextStep,
    suggestedQuestions,
    platformIntent: parsed.platformIntent || undefined,
    actionRequest: parsed.actionRequest || null,
    metrics: parsed.metrics || undefined,
    quickActions: [],
    rawText,
  };
}

import { isOpenAiConfigured } from "@/lib/openai-config";

export { isOpenAiConfigured };

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getOpenAiChatReply(options: {
  message: string;
  assistantType?: AssistantKind;
  history?: ChatHistoryItem[];
  extraContext?: string;
  detectedIntent?: DetectedIntent;
  publicMode?: boolean;
  aiTier?: AiTier;
  isGuest?: boolean;
}): Promise<{ message: string; structuredMessage: StructuredAssistantReply } | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const assistantType: AssistantKind =
    options.assistantType === "carrier" ||
    options.assistantType === "supplier" ||
    options.assistantType === "employee"
      ? options.assistantType
      : "general";

  const publicMode = Boolean(options.publicMode);
  const aiTier =
    options.aiTier ??
    resolveAiTier({
      isGuest: options.isGuest ?? publicMode,
      assistantType,
    });
  const model = resolveOpenAiModel({ aiTier });
  const history = normalizeHistory(options.history || [], publicMode, aiTier);

  const intentHint = options.detectedIntent
    ? `\nPre-detected intent: ${JSON.stringify({ platformIntent: options.detectedIntent.platformIntent, actionRequest: options.detectedIntent.actionRequest })}`
    : "";

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: buildSystemPrompt(assistantType, (options.extraContext || "") + intentHint, publicMode),
    },
    ...history.map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content,
    })),
    { role: "user", content: options.message.trim().slice(0, 2000) },
  ];

  const timeouts = publicMode ? (aiTier === "guest" ? [7000, 12000] : [9000, 16000, 22000]) : [10000, 16000];
  const maxTokens = resolveOpenAiMaxTokens({ aiTier, publicMode });

  for (let attempt = 0; attempt < timeouts.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: resolveOpenAiTemperature(aiTier),
            max_tokens: maxTokens,
            response_format: { type: "json_object" },
          }),
        },
        timeouts[attempt]
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, response.status, errorBody.slice(0, 200));
        continue;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) continue;

      const parsed = parseJsonReply(raw);
      const structuredMessage = toStructuredReply(parsed, raw, assistantType, publicMode);
      const message =
        structuredMessage.rawText ||
        structuredMessage.shortExplanation ||
        [structuredMessage.title, structuredMessage.shortExplanation]
          .filter(Boolean)
          .join("\n\n");

      return { message, structuredMessage };
    } catch (error) {
      console.error(`OpenAI request failed (attempt ${attempt + 1}):`, error);
    }
  }

  return null;
}

export function buildOpenAiRetryReply(
  assistantType: AssistantKind = "general"
): { message: string; structuredMessage: StructuredAssistantReply } {
  const label = ROLE_LABELS[assistantType];
  const message =
    "AI abhi connect nahi ho pa rahi — 10 seconds wait karke apna message dubara bhejein. Agar phir na chale to internet check karein.";

  return {
    message,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "card",
      assistantName: label,
      modeLabel: label,
      knowledgeSource: "openai",
      confidence: 60,
      title: "AI thori slow hai ⚡",
      shortExplanation: message,
      keyPoints: [
        "🔄 Apna sawal dubara bhejein (10 sec wait karke)",
        "🌐 Internet connection check karein",
        "📧 support@alphafreightuk.com par contact karein",
      ],
      recommendation: "Agar urgent ho to support@alphafreightuk.com par email karein.",
      nextStep: "Message dubara send karein — zyada tar dobara try par kaam ho jata hai.",
      quickActions: [],
      rawText: message,
    },
  };
}
