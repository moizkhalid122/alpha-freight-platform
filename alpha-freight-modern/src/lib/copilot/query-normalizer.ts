const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\bdesile\b/gi, "diesel"],
  [/\bdesial\b/gi, "diesel"],
  [/\bdesel\b/gi, "diesel"],
  [/\binsurane\b/gi, "insurance"],
  [/\binsurnce\b/gi, "insurance"],
  [/\btraking\b/gi, "tracking"],
  [/\bpayouts\b/gi, "payout"],
  [/\bfright\b/gi, "freight"],
  [/\bloades\b/gi, "loads"],
  [/\bhaulage\b/gi, "haulage"],
  [/\bartic\b/gi, "artic"],
  [/\bprofitt\b/gi, "profit"],
  [/\bcalcuate\b/gi, "calculate"],
  [/\bcalculat\b/gi, "calculate"],
  [/\bwather\b/gi, "weather"],
  [/\bwheather\b/gi, "weather"],
  [/\bweater\b/gi, "weather"],
];

export function normalizeUserQuery(message: string): string {
  let text = message.trim().replace(/\s+/g, " ");
  for (const [pattern, replacement] of TYPO_FIXES) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

/** Hint for the model when the user writes broken / keyword-only English */
export function inferGarbledQueryHint(message: string): string | null {
  const lower = message.toLowerCase().replace(/[^\w\s£]/g, " ").replace(/\s+/g, " ").trim();
  const words = lower.split(/\s+/).filter(Boolean);

  if (words.length <= 6 && /\b(load|loads|freight|truck|lorry|haul)\b/i.test(lower)) {
    const cityMatch = lower.match(
      /\b(london|manchester|birmingham|leeds|glasgow|liverpool|bristol|sheffield|edinburgh|cardiff|nottingham|newcastle|southampton|coventry|leicester)\b/i
    );
    if (cityMatch) {
      return `User likely wants available truck loads near or from ${cityMatch[1]} — confirm briefly if unclear, then explain how to find loads on Alpha Freight.`;
    }
    if (words.length <= 3) {
      return "User may be searching for available loads or load booking help — interpret generously and confirm what they need.";
    }
  }

  if (words.length <= 4 && /\b(rpm|profit|margin|diesel|insurance|pod|payout)\b/i.test(lower)) {
    return null;
  }

  return null;
}
