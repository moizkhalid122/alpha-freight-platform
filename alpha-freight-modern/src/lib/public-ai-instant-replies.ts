import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

export type PublicSocialReplyKind =
  | "greeting"
  | "thanks"
  | "welcome"
  | "farewell"
  | "how_are_you";

function normalizeSocialText(message: string): string {
  return message
    .toLowerCase()
    .trim()
    .replace(/[!?.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const THANKS_PATTERN =
  /^(thanks?|thank you|thank u|thx|ty|cheers|much appreciated|appreciate it|shukriya|shukria|jazakallah|jazak allah|jazakallahu khair)[.!,\s]*$/i;

const FAREWELL_PATTERN =
  /^(bye+|goodbye|good bye|see+\s*ya|see+\s*you|take care|later|cya|allah hafiz|khuda hafiz|fi amanillah)[.!,\s]*$/i;

const SHORT_ACK_PATTERN =
  /^(ok|okay|k|cool|got it|alright|sure|yes|yep|no|nope|nice|perfect|great|fine|theek|thik|achha|accha|samajh gaya|understood)[.!,\s]*$/i;

/** After a real conversation, let OpenAI reply naturally with full context */
export function shouldUseOpenAiWithHistory(message: string, history: ChatHistoryItem[] = []): boolean {
  const prior = history.filter((h) => h.content?.trim());
  if (prior.length < 2) return false;

  const text = normalizeSocialText(message);
  if (SHORT_ACK_PATTERN.test(text)) return true;
  if (THANKS_PATTERN.test(text)) return true;
  if (FAREWELL_PATTERN.test(text)) return true;
  return false;
}

export function detectPublicSocialReplyKind(_message: string): PublicSocialReplyKind | null {
  return null;
}

export function isPublicInstantSocialReply(_message: string, _history: ChatHistoryItem[] = []): boolean {
  return false;
}

/** Greetings and social messages go through OpenAI for natural replies. */
export function buildPublicInstantSocialReply(
  _message: string,
  _history: ChatHistoryItem[] = []
): { message: string; structuredMessage: StructuredAssistantReply } | null {
  return null;
}
