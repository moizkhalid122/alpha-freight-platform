export type AssistantKind = "general" | "carrier" | "supplier";

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

/** Skip typewriter for instant local replies only — OpenAI streams like ChatGPT */
export function shouldShowInstantReply(
  structured?: { knowledgeSource?: string } | null
): boolean {
  const source = structured?.knowledgeSource;
  return (
    source === "platform-fast" ||
    source === "openai-retry" ||
    source === "public-instant-social"
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
