function normalizeMessage(message = "") {
  return String(message || "").trim().toLowerCase();
}

export function isWebSearchQuestion(message = "") {
  const normalized = normalizeMessage(message);
  if (!normalized || normalized.length < 4) {
    return false;
  }

  const internalOnlyPatterns = [
    /\b(my wallet|wallet balance|my bids?|my loads?|available loads?|place a bid|post a load)\b/i,
    /\b(alpha freight app|how do i (?:bid|post|track|withdraw))\b/i,
    /\bwhat is (?:pod|proof of delivery|rpm)\b/i,
  ];

  if (internalOnlyPatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  const webSearchPatterns = [
    /\b(diesel|petrol|fuel|desial) (?:price|prices|cost|rate)\b/i,
    /\b(?:uk|british) (?:diesel|fuel|petrol|hgv|desial)\b/i,
    /\b(today|current|latest|now|this week|right now)\b/i,
    /\b(news|closure|closed|traffic|delay|accident|weather|forecast)\b/i,
    /\b(m\d+|a\d+|motorway|highway|road)\b.*\b(closure|closed|traffic|delay|accident|works)\b/i,
    /\b(closure|closed|traffic|delay|accident|works)\b.*\b(m\d+|motorway|road|lane)\b/i,
    /\b(hgv|lorry|haulage|freight) (?:rules|regulations|law|limits|news)\b/i,
    /\b(weather|forecast)\b.*\b(london|manchester|birmingham|uk|england|scotland|wales)\b/i,
    /\b(london|manchester|birmingham|uk|england)\b.*\b(weather|forecast|temperature)\b/i,
    /\bsearch (?:the )?web\b/i,
    /\b(on the )?internet\b/i,
    /\b(live|real.?time)\b.*\b(update|status|price|news)\b/i,
  ];

  return webSearchPatterns.some((pattern) => pattern.test(normalized));
}
