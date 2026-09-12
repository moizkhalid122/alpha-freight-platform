import { isVipPremiumVoiceEnabled } from "@/lib/concierge/concierge-cost";
import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";

const COMPLEX_PATTERNS =
  /\b(explain|detail|compare|pricing|how does|why|confused|don't understand|didn't understand|samajh nahi|kya matlab|step by step|tell me more|difference between|calculate|profit|rpm|legal|contract|insurance|vat|compliance)\b/i;

const SIMPLE_PATTERNS =
  /\b(carrier|supplier|signup|sign up|register|find loads|my name|email|referral|open|navigate|help me sign)\b/i;

export function isSmartRealtimeRouterEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_CONCIERGE_REALTIME_SMART_ROUTER?.trim() ||
    process.env.CONCIERGE_REALTIME_SMART_ROUTER?.trim() ||
    "true";
  return flag !== "false";
}

export function getRealtimeMiniModel(): string {
  return (
    process.env.OPENAI_REALTIME_MODEL_MINI?.trim() ||
    process.env.OPENAI_REALTIME_MODEL?.trim() ||
    "gpt-realtime-mini"
  );
}

export function getRealtimePremiumModel(): string {
  return (
    process.env.OPENAI_REALTIME_MODEL_PREMIUM?.trim() ||
    "gpt-realtime-2.1"
  );
}

export function scoreRealtimeComplexity(input: {
  lastUserText?: string;
  historyLength?: number;
  memory?: ConciergeVoiceMemory;
  pagePath?: string;
}): number {
  const text = (input.lastUserText || "").trim();
  let score = 0;

  if (text.length > 140) score += 2;
  if ((text.match(/\?/g) || []).length > 1) score += 2;
  if (COMPLEX_PATTERNS.test(text)) score += 3;
  if (/\b(repeat|again|what did you|kya bola|dobara)\b/i.test(text)) score += 2;
  if ((input.historyLength || 0) > 6) score += 1;
  if (input.memory?.activeTopic && text.length > 60) score += 1;

  if (SIMPLE_PATTERNS.test(text) && text.length < 90) score -= 2;
  if (/^i'?m a (carrier|supplier)/i.test(text)) score -= 2;

  return score;
}

export function pickRealtimeModel(input: {
  lastUserText?: string;
  historyLength?: number;
  memory?: ConciergeVoiceMemory;
  pagePath?: string;
  forcePremium?: boolean;
}): string {
  if (input.forcePremium || isVipPremiumVoiceEnabled()) return getRealtimePremiumModel();
  if (!isSmartRealtimeRouterEnabled()) return getRealtimeMiniModel();

  const score = scoreRealtimeComplexity(input);
  return score >= 5 ? getRealtimePremiumModel() : getRealtimeMiniModel();
}
