import type { AssistantKind, ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import { buildPublicAiSystemPrompt } from "@/lib/public-ai-prompt";
import { fetchWithTimeout, OPENAI_STREAM_TIMEOUT_MS } from "@/lib/copilot/fetch-utils";

const ROLE_LABELS: Record<AssistantKind, string> = {
  general: "Alpha Freight AI",
  carrier: "Carrier Co-Pilot",
  supplier: "Supplier Co-Pilot",
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

function buildPublicStreamSystemPrompt(extraContext?: string): string {
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
  return ["How do I find loads in the UK?", "What is RPM in haulage?", "How does Alpha Freight work?"];
}

export function buildPublicStreamMessages(options: {
  message: string;
  history?: ChatHistoryItem[];
  extraContext?: string;
  detectedIntent?: DetectedIntent;
}): Array<{ role: "system" | "user" | "assistant"; content: string }> {
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

  return [
    {
      role: "system",
      content: buildPublicStreamSystemPrompt((options.extraContext || "") + intentHint),
    },
    ...historyForApi.map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content,
    })),
    { role: "user", content: userMessage },
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
}): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
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
          max_tokens: 1600,
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
