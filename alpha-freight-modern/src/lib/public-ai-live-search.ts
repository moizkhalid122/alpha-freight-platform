/** Detect queries that need live web search (Tavily) before answering. */
export function needsLiveWebSearch(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (!lower) return false;

  const patterns = [
    /\b(weather|forecast|wather|temperature|rain|snow|sunny|cloudy)\b/i,
    /\b(news|headline|headlines|breaking|latest news|today'?s news)\b/i,
    /\b(diesel|petrol|fuel|gas)\b.*\b(price|prices|cost|rate)\b/i,
    /\b(price|prices|cost|rate)\b.*\b(diesel|petrol|fuel|uk)\b/i,
    /\b(traffic|congestion|delay|delays|accident|closure|closed|gridlock)\b/i,
    /\b(m\d+|motorway|a\d+)\b.*\b(traffic|closure|delay|accident|works)\b/i,
    /\b(exchange rate|currency|currencies|gbp|usd|eur|euro|dollar|pound to|forex)\b/i,
    /\b(stock market|ftse|nasdaq|bitcoin|crypto price|gold price)\b/i,
    /\b(live|real.?time|right now|today|current|latest|2025|2026)\b.*\b(update|status|price|news|rate|weather|traffic|law|regulation)\b/i,
    /\b(update|status|price|news|rate|weather|traffic)\b.*\b(today|now|current|latest|live)\b/i,
    /\b(who won|election result|prime minister now|chancellor|budget today)\b/i,
    /\b(interest rate|bank of england|inflation rate)\b.*\b(today|current|now|latest)\b/i,
  ];

  return patterns.some((p) => p.test(lower));
}

/** Any substantive question — AI should answer fully, not redirect to freight only. */
export function isGeneralKnowledgeQuery(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (lower.length < 3) return false;

  // Freight-specific — still full answer but not "general knowledge mode" hint
  if (/\b(rpm|haulage|alpha freight|load board|pod|backhaul|hgv)\b/i.test(lower)) {
    return false;
  }

  const topics = [
    /\b(science|physics|chemistry|biology|math|maths|mathematics|atom|gravity|evolution|engineering)\b/i,
    /\b(history|historical|war|ancient|empire|century|world war|roman|mughal|revolution|timeline)\b/i,
    /\b(business|marketing|startup|finance|accounting|economics|gdp|inflation|investment|entrepreneur|sales|hr)\b/i,
    /\b(code|coding|programming|javascript|python|html|css|react|sql|algorithm|debug|software|app|website|ai)\b/i,
    /\b(english|grammar|essay|vocabulary|writing|literature|urdu|roman urdu|punjabi|language)\b/i,
    /\b(health|medicine|medical|disease|symptom|nutrition|exercise|mental health|hospital|doctor)\b/i,
    /\b(geography|country|countries|capital|continent|climate|population|river|mountain|ocean|pakistan|india|uk|usa)\b/i,
    /\b(law|legal|contract|court|lawyer|visa|immigration|passport|tax|insurance)\b/i,
    /\b(restaurant|hotel|hospitality|retail|shop|ecommerce|construction|manufacturing|agriculture|mining|energy)\b/i,
    /\b(education|school|university|exam|degree|career|interview|cv|resume|job)\b/i,
    /\b(religion|islam|culture|art|music|film|sport|football|cricket|travel|food|recipe|fashion|car|aviation|ship)\b/i,
    /\b(who is|what is|explain|define|tell me about|how does|why does|when did|where is|how to|how do i|can you|kya hai|kya hota|samjhao|batao)\b/i,
  ];

  if (topics.some((p) => p.test(lower))) return true;

  // Default: any question mark or long query = treat as general knowledge capable
  if (lower.includes("?") && lower.length > 8) return true;
  if (lower.length > 20) return true;

  return false;
}

export function generalKnowledgeCategory(message: string): string | null {
  const lower = message.toLowerCase();
  if (/\b(science|physics|chemistry|biology|math|gravity|atom|engineering)\b/i.test(lower)) return "science";
  if (/\b(history|war|ancient|empire|century)\b/i.test(lower)) return "history";
  if (/\b(business|marketing|startup|finance|economics|sales)\b/i.test(lower)) return "business";
  if (/\b(code|coding|programming|javascript|python|html|sql|software)\b/i.test(lower)) return "coding";
  if (/\b(english|grammar|essay|vocabulary|writing|literature|urdu)\b/i.test(lower)) return "english";
  if (/\b(health|medicine|disease|symptom|nutrition|hospital)\b/i.test(lower)) return "health";
  if (/\b(geography|country|capital|continent|climate|population)\b/i.test(lower)) return "geography";
  if (/\b(law|legal|contract|court|visa|tax)\b/i.test(lower)) return "legal";
  if (/\b(restaurant|hotel|retail|construction|manufacturing)\b/i.test(lower)) return "industry";
  if (/\b(education|school|university|exam|career|job)\b/i.test(lower)) return "education";
  return "general";
}
