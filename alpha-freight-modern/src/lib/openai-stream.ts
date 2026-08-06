import type { AssistantKind, ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import { buildPublicAiSystemPrompt } from "@/lib/public-ai-prompt";
import { buildEmployeeTeamAiSystemPrompt } from "@/lib/employee-team-ai-prompt";
import { generalKnowledgeCategory } from "@/lib/public-ai-live-search";
import { fetchWithTimeout, OPENAI_STREAM_TIMEOUT_MS } from "@/lib/copilot/fetch-utils";
import { isValidImageDataUrl } from "@/lib/chat-image-upload";
import { VISION_ANALYSIS_CONTEXT } from "@/lib/openai-vision";

type OpenAiTextPart = { type: "text"; text: string };
type OpenAiImagePart = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
type OpenAiUserContent = string | Array<OpenAiTextPart | OpenAiImagePart>;

type OpenAiStreamMessage = {
  role: "system" | "user" | "assistant";
  content: OpenAiUserContent;
};

const ROLE_LABELS: Record<AssistantKind, string> = {
  general: "Alpha Freight AI",
  carrier: "Carrier Co-Pilot",
  supplier: "Supplier Co-Pilot",
  employee: "Team AI",
};

function normalizeHistory(history: ChatHistoryItem[]): ChatHistoryItem[] {
  return history
    .slice(-8)
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 900),
    }));
}

function buildPublicStreamSystemPrompt(extraContext?: string, assistantType: AssistantKind = "general"): string {
  if (assistantType === "employee") {
    return buildEmployeeTeamAiSystemPrompt(extraContext);
  }
  return buildPublicAiSystemPrompt(extraContext);
}

export function buildPublicPlainReply(
  text: string,
  assistantType: AssistantKind = "general",
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
    suggestedQuestions: suggestedQuestions.slice(0, 3),
    quickActions: [],
    rawText: body,
  };
}

export function inferPublicSuggestedQuestions(message: string, history: ChatHistoryItem[] = []): string[] {
  const lower = message.toLowerCase();
  const lastUser = [...history].reverse().find((h) => h.role === "user")?.content?.toLowerCase() || "";
  const lastAssistant = [...history].reverse().find((h) => h.role === "assistant")?.content?.toLowerCase() || "";

  if (/^(ok|okay|thanks?|thank you|see+\s*ya|see+\s*you|bye+|got it|take care|cool|sure|alright)[.!?\s]*$/i.test(message.trim())) {
    if (/rpm|profit|margin/i.test(lastUser) || /rpm|profit/i.test(lastAssistant)) {
      return ["Calculate profit for another load", "How do I find higher RPM loads?", "What is a good RPM in the UK?"];
    }
    if (/diesel|fuel/i.test(lastUser) || /diesel|fuel/i.test(lastAssistant)) {
      return ["What is RPM?", "Calculate fuel cost for a trip", "How do carrier payouts work?"];
    }
    if (/load|haul/i.test(lastUser) || /load/i.test(lastAssistant)) {
      return ["How do carrier payouts work?", "What is backhaul?", "How do I find loads in the UK?"];
    }
    return [];
  }

  if (/rpm|rate per mile|revenue per mile|profit|margin/i.test(lower)) {
    return ["Calculate profit for a specific load", "What is a good RPM in the UK?", "How do I find loads in the UK?"];
  }
  if (/insurance|git|liability|cover/i.test(lower)) {
    return ["What carrier insurance do I need?", "How does Alpha Freight vet carriers?", "What is Goods in Transit insurance?"];
  }
  if (/diesel|fuel|petrol|weather|forecast|wather|traffic|news/i.test(lower)) {
    if (/weather|forecast|wather|traffic/i.test(lower)) {
      return ["Find loads in the UK", "What is RPM?", "UK diesel price today"];
    }
    return ["What is RPM in haulage?", "Calculate fuel cost for a trip", "How do carrier payouts work?"];
  }
  if (/load|haul|freight|bid|book/i.test(lower)) {
    return ["How do I post a load as a supplier?", "What is RPM?", "How does live tracking work?"];
  }
  if (/pod|payout|wallet|pay/i.test(lower)) {
    return ["How does live tracking work?", "How do I find loads?", "What is the 7-day payout guarantee?"];
  }
  if (/sign up|signup|register|account/i.test(lower)) {
    return ["How do I sign up as a carrier?", "How do I sign up as a supplier?", "Is Alpha Freight free?"];
  }

  const category = generalKnowledgeCategory(message);
  if (category === "science") {
    return ["Explain another science topic", "How does this relate to everyday life?", "What is RPM in haulage?"];
  }
  if (category === "history") {
    return ["Tell me more about this period", "What caused this event?", "How do I find loads in the UK?"];
  }
  if (category === "business") {
    return ["Give a practical example", "How do startups raise funding?", "How does Alpha Freight work?"];
  }
  if (category === "coding") {
    return ["Show a simple code example", "Explain this in beginner terms", "What is RPM in haulage?"];
  }
  if (category === "english") {
    return ["Give more grammar examples", "How do I write more clearly?", "What is RPM?"];
  }
  if (category === "health") {
    return ["What are general wellness tips?", "Explain nutrition basics", "How do carrier payouts work?"];
  }
  if (category === "geography") {
    return ["Tell me about another country", "What is the capital?", "Find loads in the UK"];
  }
  if (/exchange|currency|gbp|usd|euro|forex/i.test(lower)) {
    return ["GBP to USD today", "UK diesel price today", "What is RPM?"];
  }
  if (/news|headline|breaking/i.test(lower)) {
    return ["UK diesel price today", "London weather today", "What is RPM?"];
  }

  return ["How do I find loads in the UK?", "What is RPM in haulage?", "Explain a general topic"];
}

function buildVisionUserContent(message: string, imageDataUrl: string): OpenAiUserContent {
  const parts: Array<OpenAiTextPart | OpenAiImagePart> = [
    { type: "text", text: message.trim().slice(0, 2000) },
    {
      type: "image_url",
      image_url: { url: imageDataUrl, detail: "auto" },
    },
  ];
  return parts;
}

export function buildPublicStreamMessages(options: {
  message: string;
  history?: ChatHistoryItem[];
  extraContext?: string;
  detectedIntent?: DetectedIntent;
  assistantType?: AssistantKind;
  imageDataUrl?: string;
}): OpenAiStreamMessage[] {
  const history = normalizeHistory(options.history || []);
  const userMessage = options.message.trim().slice(0, 2000);
  const last = history[history.length - 1];
  const historyForApi =
    last?.role === "user" && last.content.trim() === userMessage
      ? history.slice(0, -1)
      : history;
  const intentHint = options.detectedIntent
    ? `\nPre-detected intent: ${JSON.stringify({
        platformIntent: options.detectedIntent.platformIntent,
        actionRequest: options.detectedIntent.actionRequest,
      })}`
    : "";
  const assistantType = options.assistantType ?? "general";
  const hasImage = Boolean(options.imageDataUrl && isValidImageDataUrl(options.imageDataUrl));
  const visionContext = hasImage ? `\n\n${VISION_ANALYSIS_CONTEXT}` : "";

  return [
    {
      role: "system",
      content: buildPublicStreamSystemPrompt(
        (options.extraContext || "") + intentHint + visionContext,
        assistantType
      ),
    },
    ...historyForApi.map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content,
    })),
    {
      role: "user",
      content: hasImage
        ? buildVisionUserContent(userMessage, options.imageDataUrl!)
        : userMessage,
    },
  ];
}

async function* parseOpenAiSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const payload = trimmed.slice(6);
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}

export async function* streamPublicOpenAiReply(options: {
  message: string;
  history?: ChatHistoryItem[];
  extraContext?: string;
  detectedIntent?: DetectedIntent;
  assistantType?: AssistantKind;
  imageDataUrl?: string;
}): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return;

  const hasImage = Boolean(options.imageDataUrl && isValidImageDataUrl(options.imageDataUrl));
  const model =
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";
  const messages = buildPublicStreamMessages(options);

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
          temperature: 0.72,
          max_tokens: hasImage ? 1800 : 1600,
          stream: true,
        }),
      },
      OPENAI_STREAM_TIMEOUT_MS
    );

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => "");
      console.error("OpenAI stream error:", response.status, errText.slice(0, 200));
      return;
    }

    yield* parseOpenAiSseStream(response.body);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("OpenAI stream failed:", msg);
  }
}

export function isOpenAiStreamConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function getOpenAiVisionFallbackReply(options: {
  message: string;
  history?: ChatHistoryItem[];
  extraContext?: string;
  assistantType?: AssistantKind;
  imageDataUrl: string;
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !isValidImageDataUrl(options.imageDataUrl)) return null;

  const model =
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";
  const messages = buildPublicStreamMessages({
    message: options.message,
    history: options.history,
    extraContext: options.extraContext,
    assistantType: options.assistantType,
    imageDataUrl: options.imageDataUrl,
  });

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
          temperature: 0.65,
          max_tokens: 1600,
        }),
      },
      OPENAI_STREAM_TIMEOUT_MS
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
