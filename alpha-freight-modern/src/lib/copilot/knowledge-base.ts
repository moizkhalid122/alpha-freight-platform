import fs from "node:fs";
import path from "node:path";

const KB_DIR = path.join(process.cwd(), "knowledge-base");
let cachedFiles: Array<{ name: string; content: string }> | null = null;

function loadKbFiles(): Array<{ name: string; content: string }> {
  if (cachedFiles) return cachedFiles;
  try {
    const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".txt"));
    cachedFiles = files.map((name) => ({
      name,
      content: fs.readFileSync(path.join(KB_DIR, name), "utf8"),
    }));
  } catch {
    cachedFiles = [];
  }
  return cachedFiles;
}

function scoreChunk(query: string, chunk: string): number {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const lower = chunk.toLowerCase();
  return words.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
}

export function searchKnowledgeBase(query: string, limit = 3): string[] {
  const files = loadKbFiles();
  const chunks: Array<{ text: string; score: number }> = [];

  for (const file of files) {
    const sections = file.content.split(/\n{2,}/).filter((s) => s.trim().length > 40);
    for (const section of sections) {
      const score = scoreChunk(query, section);
      if (score > 0) chunks.push({ text: section.trim().slice(0, 800), score });
    }
  }

  return chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.text);
}

export function buildKbContext(query: string): string {
  const hits = searchKnowledgeBase(query);
  if (!hits.length) return "";
  return `Alpha Freight knowledge base:\n\n${hits.join("\n\n---\n\n")}`;
}
