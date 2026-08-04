import { fetchWithTimeout, CONNECTIVITY_CHECK_MS } from "@/lib/copilot/fetch-utils";

let openAiOk: boolean | null = null;
let openAiCheckedAt = 0;
const CACHE_MS = 3 * 60 * 1000;

export async function isOpenAiReachable(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return false;

  if (openAiOk !== null && Date.now() - openAiCheckedAt < CACHE_MS) {
    return openAiOk;
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/models",
      { headers: { Authorization: `Bearer ${apiKey}` } },
      CONNECTIVITY_CHECK_MS
    );
    openAiOk = response.ok || response.status === 401;
  } catch {
    openAiOk = false;
  }

  openAiCheckedAt = Date.now();
  return openAiOk;
}

export function markOpenAiUnreachable(): void {
  openAiOk = false;
  openAiCheckedAt = Date.now();
}
