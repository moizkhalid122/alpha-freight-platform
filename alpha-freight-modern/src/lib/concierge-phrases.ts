/** Split spoken text into short phrases — each replaces the previous caption. */
export function splitIntoPhrases(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const rawSentences =
    cleaned.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [cleaned];

  const phrases: string[] = [];

  for (const sentence of rawSentences) {
    if (sentence.length <= 80) {
      phrases.push(sentence);
      continue;
    }

    const commaParts = sentence.split(/,\s+/);
    for (const part of commaParts) {
      if (part.length <= 80) {
        phrases.push(part);
        continue;
      }

      const words = part.split(/\s+/);
      let buffer = "";
      for (const word of words) {
        const next = buffer ? `${buffer} ${word}` : word;
        if (next.length > 80 && buffer) {
          phrases.push(buffer);
          buffer = word;
        } else {
          buffer = next;
        }
      }
      if (buffer) phrases.push(buffer);
    }
  }

  return phrases.length > 0 ? phrases : [cleaned];
}
