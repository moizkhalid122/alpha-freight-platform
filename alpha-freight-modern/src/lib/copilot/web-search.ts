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
  if (/\b(diesel|fuel|petrol)\b/i.test(lower) && !/\buk\b/i.test(lower)) {
    return `${trimmed} UK haulage`;
  }
  if (/\b(m\d+|motorway)\b/i.test(lower) && !/\buk\b/i.test(lower)) {
    return `${trimmed} UK traffic`;
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
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 2,
        include_answer: true,
      }),
      signal: AbortSignal.timeout(5000),
    });

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
  const lines: string[] = [];
  if (result.answer) lines.push(`Summary: ${result.answer}`);
  result.results.forEach((r, i) => {
    lines.push(`[${i + 1}] ${r.title}\n${r.content.slice(0, 400)}`);
  });
  return lines.join("\n\n");
}
