import type { AssistantKind } from "@/lib/chat-types";

export type AiTier = "guest" | "member" | "pro";

export const DEFAULT_GUEST_MODEL = "gpt-4o";
export const DEFAULT_MEMBER_MODEL = "gpt-4o";
export const DEFAULT_PRO_MODEL = "gpt-4o";

export type ResolveAiTierInput = {
  isGuest?: boolean;
  assistantType?: AssistantKind;
};

export function resolveAiTier(input: ResolveAiTierInput = {}): AiTier {
  if (input.isGuest) return "guest";
  if (input.assistantType === "employee") return "pro";
  return "member";
}

export function resolveOpenAiModel(options: {
  aiTier?: AiTier;
  hasImage?: boolean;
}): string {
  const tier = options.aiTier ?? "guest";

  if (options.hasImage) {
    const visionOverride = process.env.OPENAI_VISION_MODEL?.trim();
    if (visionOverride) return visionOverride;
  }

  if (tier === "guest") {
    return process.env.OPENAI_MODEL_GUEST?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_GUEST_MODEL;
  }

  if (tier === "pro") {
    return (
      process.env.OPENAI_MODEL_EMPLOYEE?.trim() ||
      process.env.OPENAI_MODEL_MEMBER?.trim() ||
      DEFAULT_PRO_MODEL
    );
  }

  return process.env.OPENAI_MODEL_MEMBER?.trim() || DEFAULT_MEMBER_MODEL;
}

export function resolveOpenAiMaxTokens(options: {
  aiTier?: AiTier;
  publicMode?: boolean;
  hasImage?: boolean;
}): number {
  const tier = options.aiTier ?? "guest";

  if (options.hasImage) {
    return tier === "guest" ? 2200 : 3600;
  }

  if (options.publicMode) {
    return tier === "guest" ? 4200 : 5500;
  }

  return tier === "guest" ? 900 : 1400;
}

export function resolveOpenAiTemperature(aiTier: AiTier = "guest"): number {
  if (aiTier === "guest") return 0.68;
  if (aiTier === "pro") return 0.58;
  return 0.62;
}

export function resolveHistoryLimits(aiTier: AiTier = "guest", publicMode?: boolean): {
  turnLimit: number;
  charLimit: number;
} {
  if (publicMode) {
    return aiTier === "guest"
      ? { turnLimit: 16, charLimit: 1600 }
      : { turnLimit: 24, charLimit: 2000 };
  }

  return aiTier === "guest"
    ? { turnLimit: 6, charLimit: 700 }
    : { turnLimit: 10, charLimit: 1000 };
}

export function buildMemberProPromptBlock(): string {
  return `PRO MEMBER — personalised, friendly, **detailed** replies:
- Default to **long thorough answers** — explain properly with examples, steps, and context.
- Match length to user: short/brief → concise; medium/summary → moderate; default → **full detail**.
- Write like a trusted advisor in chat — warm opening, direct answer, then depth (why, how, tips).
- Use selective emoji on key points (rates 💰, routes 📍, tips 💡, freight 🚛) — 2–6 per long answer.
- Read session memory + conversation recap — weave name, fleet, route, and rates naturally.
- Never re-ask for facts already given. Follow-ups continue the same thread with **more depth**.
- Roman Urdu when preferred. Worked £ examples for freight maths.
- Do NOT mention AI model names or "Pro" tier.`;
}

export function getModelLabelForTier(aiTier: AiTier): string {
  return resolveOpenAiModel({ aiTier });
}
