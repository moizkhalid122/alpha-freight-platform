function stripFormatting(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function stripConciergeFormatting(text: string): string {
  return stripFormatting(text);
}

/** Strip markdown / URLs so voice + caption feel human, not like a doc. */
export function humanizeConciergeText(text: string): string {
  let out = stripFormatting(text);

  const sentences = out.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [out];
  if (sentences.length > 5) {
    out = sentences.slice(0, 5).join(" ").trim();
    if (!/[.!?]$/.test(out)) out += ".";
  }

  return out;
}

export function humanizeConciergeSpeech(text: string, maxLength = 480): string {
  const cleaned = humanizeConciergeText(text);
  if (cleaned.length <= maxLength) return cleaned;
  const slice = cleaned.slice(0, maxLength);
  const lastStop = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  if (lastStop > 80) return slice.slice(0, lastStop + 1).trim();
  return `${slice.trim()}…`;
}
