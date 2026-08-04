import { buildKbContext, searchKnowledgeBase } from "@/lib/copilot/knowledge-base";
import { knowledgeBaseArticles } from "@/lib/knowledge-base-content";

const FREIGHT_QUERY =
  /\b(freight|load|loads|haul|haulage|truck|hgv|lorry|carrier|supplier|rpm|diesel|fuel|pod|delivery|logistics|alpha|bid|wallet|payout|route|backhaul|margin|rate|quote|book|profit|mile|artic|van|insurance|commission|vetting|signup|sign up|tracking|policy|terms|faq)\b/i;

function scoreText(query: string, text: string): number {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const lower = text.toLowerCase();
  return words.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
}

export function searchHelpArticles(query: string, limit = 2): string[] {
  const scored = knowledgeBaseArticles
    .map((article) => {
      const blob = [article.title, article.excerpt, ...article.content].join(" ");
      return { text: `${article.title}\n${article.content.join("\n")}`.slice(0, 700), score: scoreText(query, blob) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.text);
}

export function shouldUsePublicRag(query: string): boolean {
  return query.trim().length > 2 && FREIGHT_QUERY.test(query);
}

export function buildPublicRagContext(query: string): string {
  const parts: string[] = [];

  const kb = buildKbContext(query);
  if (kb) parts.push(kb);

  const articles = searchHelpArticles(query, 2);
  if (articles.length) {
    parts.push(`Help centre:\n${articles.join("\n\n---\n\n")}`);
  }

  return parts.join("\n\n").slice(0, 3200);
}

export type RagSourceLabel = "knowledge-base" | "help-centre" | "openai" | "web";

export function inferRagSourceLabel(query: string): RagSourceLabel {
  if (searchKnowledgeBase(query, 1).length) return "knowledge-base";
  if (searchHelpArticles(query, 1).length) return "help-centre";
  return "openai";
}
