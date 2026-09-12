import type { LanguagePreference } from "@/lib/copilot/language";

const ROMAN_URDU_MARKERS =
  /\b(aap|tum|main|mujhe|mera|meri|kya|kaise|kyun|hai|hain|ho|hoon|chahiye|karna|karo|batao|sunao|theek|acha|accha|shukriya|bhai|yaar|nahi|nahin|bohat|bahut|zara|abhi|wala|wali|ke liye|samajh|madad|loads|carrier|supplier)\b/i;

const URDU_SCRIPT = /[\u0600-\u06FF]/;

export function detectSpokenLanguagePreference(text: string): LanguagePreference | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (URDU_SCRIPT.test(trimmed)) return "urdu";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;

  let romanHits = 0;
  for (const word of words) {
    if (ROMAN_URDU_MARKERS.test(word)) romanHits += 1;
  }

  const ratio = romanHits / words.length;
  if (romanHits >= 2 || ratio >= 0.22) return "roman_urdu";
  return null;
}

export function mergeLanguagePreference(
  current: LanguagePreference,
  detected: LanguagePreference | null,
): LanguagePreference {
  if (!detected) return current;
  if (current === "urdu" || current === "roman_urdu") return current;
  return detected;
}
