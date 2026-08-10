import type { StructuredAssistantReply } from "@/lib/chat-types";

export type AssistantKind = "general" | "carrier" | "supplier" | "employee";

const THINKING_STATES: Record<AssistantKind, string[]> = {
  general: [
    "Reading your question and conversation context",
    "Matching UK freight knowledge to your request",
    "Polishing a clear, helpful response",
  ],
  carrier: [
    "Analyzing routes, RPM, and load quality",
    "Reviewing carrier ops and earnings factors",
    "Building your dispatch recommendation",
  ],
  supplier: [
    "Reviewing shipment requirements and fit",
    "Checking pricing, bids, and tracking flow",
    "Preparing your next best action",
  ],
  employee: [
    "Reviewing your sales question and CRM context",
    "Pulling scripts, objection handling, and freight tips",
    "Drafting a practical reply you can use right away",
  ],
};

const SUGGESTED_PROMPTS: Record<AssistantKind, string[]> = {
  general: [
    "🚛 Find loads near me",
    "💰 Show highest paying loads",
    "📦 Explain shipment tracking",
    "📍 Find backhaul loads",
    "⛽ Calculate fuel cost",
    "📈 Maximize earnings",
  ],
  carrier: [
    "🚛 Find loads near me",
    "💰 Show highest paying loads",
    "📦 Explain shipment tracking",
    "📍 Find backhaul loads",
    "⛽ Calculate fuel cost",
    "📈 Maximize earnings",
  ],
  supplier: [
    "📦 Post a new load",
    "💰 Review incoming bids",
    "🚛 Find best carrier for my route",
    "📍 Track active shipments",
    "💳 Pay instant vs pay later",
    "📄 POD upload guide",
  ],
  employee: [
    "Write a cold call opener for a UK carrier",
    "How do I handle price objections?",
    "Draft a follow-up email after a demo",
    "Explain our commission structure",
    "What should I log in CRM after a call?",
    "Calculate RPM profit: £800 load, 320 miles",
  ],
};

export function getThinkingStates(assistantType: AssistantKind): string[] {
  return THINKING_STATES[assistantType];
}

export function getSuggestedPrompts(assistantType: AssistantKind): string[] {
  return SUGGESTED_PROMPTS[assistantType];
}

export function getTypingDelay(word: string): number {
  if (!word.trim()) {
    return 0;
  }

  if (/[.!?]$/.test(word)) {
    return 28;
  }

  if (/[,;:]$/.test(word)) {
    return 16;
  }

  if (word.length >= 10) {
    return 10;
  }

  return 6;
}

export function hasStructuredCardContent(
  structured?: StructuredAssistantReply | null
): boolean {
  if (!structured) return false;
  return Boolean(
    structured.title?.trim() ||
      structured.shortExplanation?.trim() ||
      (structured.keyPoints?.length ?? 0) > 0 ||
      (structured.metrics?.length ?? 0) > 0 ||
      (structured.quickActions?.length ?? 0) > 0 ||
      structured.platformResult?.loads?.length ||
      structured.actionRequest
  );
}

export function shouldRenderStructuredCard(
  structured?: StructuredAssistantReply | null
): boolean {
  if (!structured) return false;
  if (!hasStructuredCardContent(structured)) return false;
  return (
    structured.displayStyle === "card" ||
    structured.knowledgeSource === "openai" ||
    structured.knowledgeSource === "carrier-intelligence" ||
    structured.knowledgeSource === "supplier-load-advisor" ||
    structured.knowledgeSource === "web_search" ||
    (structured.keyPoints?.length ?? 0) > 0 ||
    (structured.metrics?.length ?? 0) > 0 ||
    Boolean(structured.platformResult?.loads?.length) ||
    (structured.quickActions?.length ?? 0) > 0 ||
    Boolean(structured.actionRequest)
  );
}

/** Skip typewriter for instant local replies only — OpenAI streams like ChatGPT */
export function shouldShowInstantReply(
  structured?: { knowledgeSource?: string } | null
): boolean {
  const source = structured?.knowledgeSource;
  return (
    source === "platform-fast" ||
    source === "openai-retry" ||
    source === "public-instant-social" ||
    source === "carrier-intelligence" ||
    source === "supplier-load-advisor" ||
    source === "instant"
  );
}

export async function waitForMinimumDuration(
  startedAt: number,
  minimumMs = 120
): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = minimumMs - elapsed;

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
