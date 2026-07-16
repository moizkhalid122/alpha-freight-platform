export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-E57VQK86NV";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(url: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_path: url,
    page_title: document.title,
    page_location: window.location.href,
  });
}
