import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

export type PublicSocialReplyKind =
  | "greeting"
  | "thanks"
  | "welcome"
  | "farewell"
  | "how_are_you";

const ASSISTANT_NAME = "Alpha Freight AI";

function normalizeSocialText(message: string): string {
  return message
    .toLowerCase()
    .trim()
    .replace(/[!?.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const GREETING_PATTERN =
  /^(hi+|hello+|hey+|hiya|yo+|sup|what'?s up|whats up|good morning|good afternoon|good evening|good day|salam|assalam|assalamu alaikum|as-salam|aslam|aoa|salaam|namaste|greetings?)[.!,\s]*$/i;

const THANKS_PATTERN =
  /^(thanks?|thank you|thank u|thx|ty|cheers|much appreciated|appreciate it|shukriya|shukria|jazakallah|jazak allah|jazakallahu khair)[.!,\s]*$/i;

const WELCOME_PATTERN =
  /^(welcome|you'?re welcome|you are welcome|khush amdeed|khush aamdeed)[.!,\s]*$/i;

const FAREWELL_PATTERN =
  /^(bye+|goodbye|good bye|see+\s*ya|see+\s*you|take care|later|cya|allah hafiz|khuda hafiz|fi amanillah)[.!,\s]*$/i;

const HOW_ARE_YOU_PATTERN =
  /^(how are you|how r u|how are u|how'?s it going|hows it going|how do you do|kaise ho|kese ho|theek ho)[.!,\s]*$/i;

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

export function detectPublicSocialReplyKind(message: string): PublicSocialReplyKind | null {
  const text = normalizeSocialText(message);
  if (!text) return null;
  if (THANKS_PATTERN.test(text)) return "thanks";
  if (WELCOME_PATTERN.test(text)) return "welcome";
  if (FAREWELL_PATTERN.test(text)) return "farewell";
  if (HOW_ARE_YOU_PATTERN.test(text)) return "how_are_you";
  if (GREETING_PATTERN.test(text)) return "greeting";
  return null;
}

export function isPublicInstantSocialReply(message: string, history: ChatHistoryItem[] = []): boolean {
  if (shouldUseOpenAiWithHistory(message, history)) return false;
  return detectPublicSocialReplyKind(message) !== null;
}

function greetingBody(message: string): string {
  const text = normalizeSocialText(message);

  if (/good morning/.test(text)) {
    return `## ☀️ Good morning

Good morning — hope the roads are kind to you today.

I'm **Alpha Freight AI**. Ask me anything about UK loads, **RPM**, payouts, or the platform — in English or Urdu.

What are you working on this morning?`;
  }

  if (/good afternoon/.test(text)) {
    return `## 🌤️ Good afternoon

Good afternoon! What can I help you with — loads, rates, or platform questions?`;
  }

  if (/good evening|good day/.test(text)) {
    return `## 🌙 Good evening

Good evening — still here if you need freight help before tomorrow's runs.`;
  }

  if (/salam|assalam|aslam|aoa|salaam/.test(text)) {
    return `## 🤲 Wa alaikum assalam

Khush amdeed! Main **Alpha Freight AI** hoon — UK freight, loads, RPM aur platform ke sawaalon ke liye yahan hoon.

Aaj kis cheez mein madad chahiye?`;
  }

  return `## 👋 Hello

Hi — I'm **Alpha Freight AI**, your UK freight copilot.

Ask me about loads, **RPM**, diesel, POD, payouts, or how Alpha Freight works. No sign-up needed to chat.

What's on your mind?`;
}

function buildBody(kind: PublicSocialReplyKind, message: string): string {
  switch (kind) {
    case "greeting":
      return greetingBody(message);
    case "thanks":
      return `You're welcome — glad that helped.

If anything else comes up on loads, rates, or the platform, just ask.`;
    case "welcome":
      return `Welcome! Tell me if you're mainly **booking loads** as a carrier or **posting freight** as a supplier — I'll tailor my answers.`;
    case "farewell":
      return `Take care and drive safe. Come back anytime — or email **support@alphafreightuk.com** if you need a human.`;
    case "how_are_you":
      return `All good on my side — ready to help. What freight question can I tackle for you today?`;
  }
}

function buildStructured(
  kind: PublicSocialReplyKind,
  message: string
): { message: string; structuredMessage: StructuredAssistantReply } {
  const body = buildBody(kind, message);

  return {
    message: body,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "plain",
      assistantName: ASSISTANT_NAME,
      modeLabel: ASSISTANT_NAME,
      knowledgeSource: "public-instant-social",
      confidence: 99,
      title: "",
      shortExplanation: body,
      keyPoints: [],
      recommendation: "",
      nextStep: "",
      quickActions: [],
      rawText: body,
    },
  };
}

export function buildPublicInstantSocialReply(
  message: string,
  history: ChatHistoryItem[] = []
): { message: string; structuredMessage: StructuredAssistantReply } | null {
  if (shouldUseOpenAiWithHistory(message, history)) return null;
  const kind = detectPublicSocialReplyKind(message);
  if (!kind) return null;
  return buildStructured(kind, message);
}
