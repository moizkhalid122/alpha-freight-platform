import dns from "node:dns";

/** Fixes intermittent OpenAI / external API timeouts on some Windows networks */
dns.setDefaultResultOrder("ipv4first");

export const OPENAI_STREAM_TIMEOUT_MS = 18000;
export const OPENAI_RETRY_TIMEOUT_MS = 12000;
export const WEB_SEARCH_TIMEOUT_MS = 3500;
export const WEATHER_FETCH_TIMEOUT_MS = 3000;
export const CONNECTIVITY_CHECK_MS = 3000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
