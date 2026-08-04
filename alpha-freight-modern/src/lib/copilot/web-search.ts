import { fetchWithTimeout, WEB_SEARCH_TIMEOUT_MS } from "@/lib/copilot/fetch-utils";

const TAVILY_API_URL = "https://api.tavily.com/search";

export type WebSearchResult = {
  ok: boolean;
  query: string;
  answer: string | null;
  results: Array<{ title: string; url: string; content: string }>;
  error?: string;
};

function buildQuery(message: string): string {
  const trimmed = message
    .trim()
    .replace(/\bdesile\b/gi, "diesel")
    .replace(/\bdesial\b/gi, "diesel");
  const lower = trimmed.toLowerCase();

  if (/\b(exchange|currency|gbp|usd|eur|euro|dollar|forex|pound to)\b/i.test(lower)) {
    return `${trimmed} exchange rate today`;
  }
  if (/\b(news|headline|breaking)\b/i.test(lower)) {
    return `${trimmed} latest UK news today`;
  }
  if (/\b(traffic|congestion|delay|m\d+|motorway|closure)\b/i.test(lower)) {
    return `${trimmed} UK traffic live update today`;
  }
  if (/\b(diesel|fuel|petrol)\b/i.test(lower) && !/\buk\b/i.test(lower)) {
    return `${trimmed} UK price today`;
  }
  if (/\b(m\d+|motorway)\b/i.test(lower) && !/\buk\b/i.test(lower)) {
    return `${trimmed} UK traffic`;
  }
  if (/\b(weather|forecast|wather)\b/i.test(lower)) {
    return `${trimmed} UK weather forecast today`;
  }
  return trimmed;
}

export async function searchWeb(message: string): Promise<WebSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  const query = buildQuery(message);

  if (!apiKey) {
    return { ok: false, query, answer: null, results: [], error: "missing_api_key" };
  }

  try {
    const response = await fetchWithTimeout(
      TAVILY_API_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: 4,
          include_answer: true,
        }),
      },
      WEB_SEARCH_TIMEOUT_MS
    );

    if (!response.ok) {
      return { ok: false, query, answer: null, results: [], error: `http_${response.status}` };
    }

    const data = (await response.json()) as {
      answer?: string;
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };

    return {
      ok: true,
      query,
      answer: data.answer || null,
      results: (data.results || []).map((r) => ({
        title: r.title || "Result",
        url: r.url || "",
        content: r.content || "",
      })),
    };
  } catch (error) {
    return {
      ok: false,
      query,
      answer: null,
      results: [],
      error: error instanceof Error ? error.message : "search_failed",
    };
  }
}

export function formatWebSearchContext(result: WebSearchResult): string {
  const lines: string[] = [`Query: ${result.query}`];
  if (result.answer) lines.push(`Summary: ${result.answer}`);
  result.results.forEach((r, i) => {
    lines.push(`[${i + 1}] ${r.title}${r.url ? ` (${r.url})` : ""}\n${r.content.slice(0, 500)}`);
  });
  return lines.join("\n\n");
}
