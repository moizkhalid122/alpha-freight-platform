const GENERAL_OPENERS = [
  "Great question.",
  "Here's the quick answer first…",
  "Good one — let me break this down clearly.",
  "Happy to help with this.",
];

const RPM_OPENERS = [
  "Great question.",
  "This is one of the most important metrics for UK carriers.",
  "RPM comes up constantly in haulage — here's what matters.",
];

const FUEL_OPENERS = [
  "Here's the quick answer first…",
  "Fuel cost directly affects every load you run — let me explain.",
  "Great question — diesel is the biggest variable in UK haulage profit.",
];

const LOAD_OPENERS = [
  "Great question.",
  "Finding the right load is half the battle — here's how it works.",
  "Here's the quick answer first…",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

const SHORT_SOCIAL_PATTERN =
  /^(ok|okay|k|cool|got it|alright|sure|yes|yep|no|nope|nice|perfect|great|fine|thanks?|thank you|thx|bye+|goodbye|see+\s*ya|see+\s*you|take care|later)[.!?\s]*$/i;

export function shouldSkipPersonalityPrefix(query: string): boolean {
  const text = query.trim();
  if (!text) return true;
  if (SHORT_SOCIAL_PATTERN.test(text)) return true;
  if (/^(hi|hello|hey|salam|aoa)/i.test(text)) return true;
  return false;
}

export function getPersonalityPrefix(query: string): string {
  if (shouldSkipPersonalityPrefix(query)) return "";
  const text = query.toLowerCase();
  if (/rpm|revenue per mile|rate per mile|profit|margin/i.test(text)) return pick(RPM_OPENERS);
  if (/diesel|fuel|petrol|cost/i.test(text)) return pick(FUEL_OPENERS);
  if (/load|haul|freight|carrier|bid|book/i.test(text)) return pick(LOAD_OPENERS);
  return pick(GENERAL_OPENERS);
}

export function prependPersonality(content: string, query: string): string {
  const prefix = getPersonalityPrefix(query);
  if (!prefix || content.startsWith(prefix)) return content;
  return `${prefix}\n\n${content}`;
}
