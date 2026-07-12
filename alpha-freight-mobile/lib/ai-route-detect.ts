function cleanPlace(value = "") {
  return String(value || "")
    .trim()
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /\b(please|plz|batao|bata do|tell me|kitna|door|distance|time|route|driving|drive|travel|journey|ha|hai|ho|hoga|lagega|lagay ga)\b/gi,
      ""
    )
    .trim()
    .replace(/,\s*uk$/i, "")
    .replace(/\s+uk$/i, "");
}

export function parseRouteFromMessage(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;

  const patterns = [
    /\bfrom\s+(.+?)\s+(?:to|->|→)\s+(.+?)(?:\?|$)/i,
    /\b(.+?)\s+(?:se|say)\s+(.+?)\s+(?:tak|ka|ki|ke|door|distance|time)/i,
    /\bdistance\s+(?:from\s+)?(.+?)\s+(?:to|->|→|se)\s+(.+?)(?:\?|$)/i,
    /\bhow far(?:\s+is)?\s+(.+?)\s+(?:from|to)\s+(.+?)(?:\?|$)/i,
    /\b(.+?)\s+(?:to|->|→)\s+(.+?)\s+(?:distance|door|kitna|time|route|far|journey|drive)/i,
    /\b(.+?)\s+(?:to|->|→)\s+(.+?)(?:\?|$)/i,
    /\bbetween\s+(.+?)\s+and\s+(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match?.[1] || !match?.[2]) continue;

    const origin = cleanPlace(match[1]);
    const destination = cleanPlace(match[2]);

    if (
      origin.length >= 2 &&
      destination.length >= 2 &&
      origin.toLowerCase() !== destination.toLowerCase()
    ) {
      return { origin, destination };
    }
  }

  return null;
}

export function isRouteDistanceQuestion(text = "") {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized || normalized.length < 6) return false;

  const parsed = parseRouteFromMessage(text);
  if (!parsed) return false;

  const intentPatterns = [
    /\b(distance|door|far|kitna|how long|drive|driving|travel time|route|miles|mile|km|kilomet|motorway|journey|eta|time|lag(?:e|ay)?ga|batao|bata do|calculate|estimate)\b/i,
    /\b(from|to|se|tak|->|→|between)\b/i,
  ];

  return intentPatterns.some((pattern) => pattern.test(normalized));
}
