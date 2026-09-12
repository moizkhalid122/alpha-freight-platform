import { formatKnowledgeForPrompt, searchConciergeKnowledge } from "@/lib/concierge/concierge-knowledge";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let query = "";
  try {
    const body = (await request.json()) as { query?: string; limit?: number };
    query = body.query?.trim() || "";
    const limit = Math.min(body.limit || 3, 5);
    const snippets = searchConciergeKnowledge(query, limit);
    return Response.json({
      snippets,
      promptBlock: formatKnowledgeForPrompt(snippets),
    });
  } catch {
    return Response.json({ snippets: [], promptBlock: "" });
  }
}
