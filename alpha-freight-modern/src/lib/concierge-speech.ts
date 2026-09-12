import { splitIntoPhrases } from "@/lib/concierge-phrases";
import { humanizeConciergeSpeech } from "@/lib/concierge/concierge-text";

/** Spoken version of a concierge reply — up to a few sentences, not one word. */
export function speechForConcierge(text: string, maxLength = 480): string {
  const cleaned = humanizeConciergeSpeech(text, maxLength).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned];
  let spoken = "";

  for (const sentence of sentences) {
    const next = `${spoken}${sentence}`.trim();
    if (next.length > maxLength) break;
    spoken = next;
  }

  if (spoken) return spoken;
  return cleaned.length <= maxLength ? cleaned : `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

/** Full voice playback plan — short phrase chain for long answers. */
export function speechPhrasePlan(text: string): string[] {
  const spoken = speechForConcierge(text);
  if (!spoken) return [];
  return splitIntoPhrases(spoken);
}
