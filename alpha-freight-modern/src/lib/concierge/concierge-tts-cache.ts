const MAX_ENTRIES = 24;

const cache = new Map<string, string>();

function cacheKey(text: string): string {
  return text.trim().toLowerCase();
}

export function getCachedTtsUrl(text: string): string | null {
  return cache.get(cacheKey(text)) ?? null;
}

export function setCachedTtsUrl(text: string, url: string): void {
  const key = cacheKey(text);
  if (cache.has(key)) return;
  if (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value;
    if (first) {
      const old = cache.get(first);
      if (old) URL.revokeObjectURL(old);
      cache.delete(first);
    }
  }
  cache.set(key, url);
}
