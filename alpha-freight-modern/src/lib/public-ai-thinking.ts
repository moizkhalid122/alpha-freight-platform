export type ThinkingMode = "thinking" | "live_search";

export function detectThinkingMode(query: string): ThinkingMode {
  const text = query.toLowerCase();
  if (
    /\b(diesel|desile|fuel|petrol|traffic|weather|motorway|m1|m2|m6|m25|live|today|current|price|rac|aa fuel)\b/i.test(
      text
    )
  ) {
    return "live_search";
  }
  return "thinking";
}

export function getThinkingMessages(mode: ThinkingMode): string[] {
  if (mode === "live_search") {
    return [
      "Checking live UK data…",
      "Searching live freight data…",
      "Alpha Freight AI is fetching live info…",
    ];
  }
  return [
    "Alpha Freight AI is thinking…",
    "Searching our freight knowledge…",
    "Building your answer…",
  ];
}

export function buildShareUrl(query: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/ai?q=${encodeURIComponent(query.trim())}`;
}
