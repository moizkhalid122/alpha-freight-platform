import type { CopilotContextMemory } from "@/lib/chat-types";
import type { LanguagePreference } from "@/lib/copilot/language";
import { detectSpokenLanguagePreference, mergeLanguagePreference } from "@/lib/concierge/concierge-language-detect";
import type { ConciergeOnboardingContext } from "@/lib/concierge/concierge-onboarding";

export type ConciergeVoiceMemory = CopilotContextMemory & {
  userName?: string | null;
  userEmail?: string | null;
  detectedLanguage?: LanguagePreference | null;
  signupStage?: "pre" | "form_filled" | "password" | "done" | null;
  pendingSignupGuide?: boolean;
  visitorId?: string | null;
  visitCount?: number;
  lastPage?: string | null;
  lastPageLabel?: string | null;
  firstVisitAt?: string | null;
  lastVisitAt?: string | null;
  knowledgeSnippets?: string[];
  userReferralCode?: string | null;
  userEmotion?: "neutral" | "confused" | "excited" | "frustrated" | null;
  onboardingContext?: ConciergeOnboardingContext | null;
};

const MEMORY_KEY = "alpha_concierge_memory";
const PREFILL_KEY = "alpha_concierge_prefill";

export type ConciergePrefillPayload = {
  form: "signup" | "contact";
  role?: "carrier" | "supplier";
  fields: Record<string, string>;
  path: string;
  ts: number;
};

export function loadConciergeMemory(): ConciergeVoiceMemory {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ConciergeVoiceMemory;
  } catch {
    return {};
  }
}

export function saveConciergeMemory(memory: ConciergeVoiceMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  return match?.[0]?.toLowerCase() || null;
}

function extractName(text: string): string | null {
  const patterns = [
    /\b(?:my name is|i am|i'm|call me|this is)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i,
    /\bmera naam\s+([A-Za-z][A-Za-z\s'-]{1,40})/i,
    /\bnaam\s+([A-Za-z][A-Za-z\s'-]{1,40})\s+hai/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1]?.trim();
    if (name && name.length > 1) return name.replace(/\s+/g, " ");
  }
  return null;
}

export function updateConciergeMemoryFromTurn(
  memory: ConciergeVoiceMemory,
  userText: string,
  assistantText: string,
): ConciergeVoiceMemory {
  const blob = `${userText} ${assistantText}`.toLowerCase();
  const next: ConciergeVoiceMemory = { ...memory };

  if (/\bcarrier\b/i.test(blob)) next.role = "carrier";
  if (/\bsupplier\b/i.test(blob)) next.role = "supplier";

  const email = extractEmail(userText) || extractEmail(assistantText);
  if (email) next.userEmail = email;

  const name = extractName(userText);
  if (name) next.userName = name;

  const detected = detectSpokenLanguagePreference(userText);
  if (detected) {
    next.detectedLanguage = mergeLanguagePreference(
      next.detectedLanguage || "english",
      detected,
    );
  }

  const routeMatch = userText.match(/\bfrom\s+([a-z\s]+?)\s+to\s+([a-z\s]+)/i);
  if (routeMatch) {
    next.preferredRoutes = [`${routeMatch[1].trim()} → ${routeMatch[2].trim()}`];
  }

  if (/\bpost load|signup|register|pricing|rpm|profit\b/i.test(blob)) {
    next.activeTopic = userText.slice(0, 80);
  }

  if (/\/auth\/signup/i.test(blob) || /\bsignup page\b/i.test(blob)) {
    next.signupStage = next.signupStage || "pre";
  }

  return next;
}

export function formatConciergeMemoryForPrompt(memory: ConciergeVoiceMemory): string {
  const lines: string[] = [];
  if (memory.userName) lines.push(`User name: ${memory.userName}`);
  if (memory.userEmail) lines.push(`User email: ${memory.userEmail}`);
  if (memory.role) {
    lines.push(
      `Role interest (memory only — do NOT open signup unless the user asks this session): ${memory.role}`,
    );
  }
  if (memory.userReferralCode) lines.push(`User referral code: ${memory.userReferralCode}`);
  if (memory.preferredRoutes?.length) {
    lines.push(`Preferred routes: ${memory.preferredRoutes.join("; ")}`);
  }
  if (memory.activeTopic) lines.push(`Current topic: ${memory.activeTopic}`);
  if ((memory.visitCount || 0) >= 2) {
    lines.push(
      "Returning visitor — greet them on their CURRENT page; do NOT auto-open a page from a past visit.",
    );
  }
  if (memory.signupStage === "form_filled") {
    lines.push("Signup form name/email were pre-filled — guide password + Create Account, then normal onboarding.");
  }
  if (memory.signupStage === "done") {
    lines.push("User just completed signup — celebrate briefly and offer to share their referral link if they have one.");
  }
  if (!lines.length) return "";
  return `Remember from this conversation:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

export function storeConciergePrefill(payload: Omit<ConciergePrefillPayload, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({ ...payload, ts: Date.now() } satisfies ConciergePrefillPayload),
    );
  } catch {
    /* ignore */
  }
}

export function consumeConciergePrefill(maxAgeMs = 120_000): ConciergePrefillPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConciergePrefillPayload;
    sessionStorage.removeItem(PREFILL_KEY);
    if (Date.now() - data.ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

export const CONCIERGE_PREFILL_KEY = PREFILL_KEY;
