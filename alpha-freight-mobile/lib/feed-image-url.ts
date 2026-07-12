const UNSplashHost = "images.unsplash.com";

export function optimizeFeedImageUrl(src?: string | null, width = 720) {
  const trimmed = src?.trim();
  if (!trimmed || trimmed.startsWith("data:")) return trimmed;

  if (trimmed.includes(UNSplashHost)) {
    try {
      const url = new URL(trimmed);
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "80");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
