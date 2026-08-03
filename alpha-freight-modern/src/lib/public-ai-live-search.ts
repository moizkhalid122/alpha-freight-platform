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
    /\b(stock market|ftse|nasdaq|bitcoin|crypto price)\b/i,
    /\b(live|real.?time|right now|today|current|latest)\b.*\b(update|status|price|news|rate|weather|traffic)\b/i,
    /\b(update|status|price|news|rate|weather|traffic)\b.*\b(today|now|current|latest|live)\b/i,
  ];

  return patterns.some((p) => p.test(lower));
}

/** General knowledge topics — OpenAI should answer fully, not redirect to freight only. */
export function isGeneralKnowledgeQuery(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (lower.length < 4) return false;

  const topics = [
    /\b(science|physics|chemistry|biology|math|maths|mathematics|atom|gravity|evolution|photosynthesis|solar system|planet)\b/i,
    /\b(history|historical|war|ancient|empire|century|world war|roman|mughal|revolution|timeline)\b/i,
    /\b(business|marketing|startup|finance|accounting|economics|gdp|inflation|investment|entrepreneur)\b/i,
    /\b(code|coding|programming|javascript|python|html|css|react|sql|algorithm|debug|function|variable|api)\b/i,
    /\b(english|grammar|essay|vocabulary|writing|literature|poem|spelling|synonym|paragraph|tense)\b/i,
    /\b(health|medicine|medical|disease|symptom|nutrition|exercise|mental health|vitamin|doctor|hospital)\b/i,
    /\b(geography|country|countries|capital|continent|climate|population|river|mountain|ocean|map of)\b/i,
    /\b(who is|what is|explain|define|tell me about|how does|why does|when did|where is)\b/i,
  ];

  return topics.some((p) => p.test(lower));
}

export function generalKnowledgeCategory(message: string): string | null {
  const lower = message.toLowerCase();
  if (/\b(science|physics|chemistry|biology|math|gravity|atom)\b/i.test(lower)) return "science";
  if (/\b(history|war|ancient|empire|century)\b/i.test(lower)) return "history";
  if (/\b(business|marketing|startup|finance|economics)\b/i.test(lower)) return "business";
  if (/\b(code|coding|programming|javascript|python|html|sql)\b/i.test(lower)) return "coding";
  if (/\b(english|grammar|essay|vocabulary|writing|literature)\b/i.test(lower)) return "english";
  if (/\b(health|medicine|disease|symptom|nutrition)\b/i.test(lower)) return "health";
  if (/\b(geography|country|capital|continent|climate|population)\b/i.test(lower)) return "geography";
  return null;
}
