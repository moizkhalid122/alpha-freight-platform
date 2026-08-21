export type ThinkingMode = "simple" | "topic";

export type ThinkingPresentation = {
  mode: ThinkingMode;
  /** Shown first — generic pulse */
  introLabel: string;
  /** Shown after intro for topic queries (diesel, RPM, etc.) */
  topicLabel?: string;
};

export function detectThinkingMode(query: string): ThinkingMode {
  return resolveThinkingPresentation(query).mode;
}

export function resolveThinkingPresentation(query: string): ThinkingPresentation {
  const text = query.toLowerCase();

  if (/\b(diesel|desile|desil|fuel|petrol|gas oil)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Checking UK diesel prices…",
    };
  }

  if (/\b(rpm|profit|margin|rate per mile|£.*mile|mile.*£)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Calculating RPM & profit…",
    };
  }

  if (/\b(weather|forecast|rain|temperature|wather)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Checking UK weather…",
    };
  }

  if (/\b(traffic|motorway|m1|m6|m25|delay|congestion)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Checking route & traffic…",
    };
  }

  if (/\b(load|loads|haul|haulage|backhaul|find load|available)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Searching live UK loads…",
    };
  }

  if (/\b(pod|proof of delivery|delivery note)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Checking POD guidance…",
    };
  }

  if (/\b(sign up|signup|register|join|account)\b/i.test(text)) {
    return {
      mode: "topic",
      introLabel: "Thinking…",
      topicLabel: "Finding signup steps…",
    };
  }

  return {
    mode: "simple",
    introLabel: "Thinking…",
  };
}

export function getThinkingMessages(mode: ThinkingMode): string[] {
  if (mode === "topic") {
    return ["Checking live UK data…", "Fetching the latest info…", "Almost ready…"];
  }
  return ["Thinking…", "Building your answer…"];
}

export function buildShareUrl(query: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/ai?q=${encodeURIComponent(query.trim())}`;
}
