export type AssistantKind = "general" | "carrier" | "supplier";

const THINKING_STATES: Record<AssistantKind, string[]> = {
  general: [
    "Reviewing freight context and recent conversation",
    "Checking logistics knowledge and operations flow",
    "Preparing a professional copilot recommendation",
  ],
  carrier: [
    "Reviewing route, RPM, and load quality",
    "Checking carrier-side operations and earnings factors",
    "Preparing a dispatch-style recommendation",
  ],
  supplier: [
    "Reviewing shipment requirements and service fit",
    "Checking supplier-side pricing and tracking guidance",
    "Preparing a clear operations-focused next step",
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
    "🚛 Find loads near me",
    "💰 Show highest paying loads",
    "📦 Explain shipment tracking",
    "📍 Find backhaul loads",
    "⛽ Calculate fuel cost",
    "📈 Maximize earnings",
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
    return 75;
  }

  if (/[,;:]$/.test(word)) {
    return 45;
  }

  if (word.length >= 10) {
    return 28;
  }

  return 16;
}

export async function waitForMinimumDuration(
  startedAt: number,
  minimumMs = 420
): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = minimumMs - elapsed;

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
