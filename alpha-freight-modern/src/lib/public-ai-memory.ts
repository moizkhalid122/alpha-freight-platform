import type { ChatHistoryItem, CopilotContextMemory } from "@/lib/chat-types";

export type PublicAiSessionMemory = CopilotContextMemory & {
  fleetSize?: number | null;
};

const STORAGE_KEY = "af_public_ai_session_memory";

export function emptyPublicAiMemory(): PublicAiSessionMemory {
  return {};
}

export function loadPublicAiMemory(): PublicAiSessionMemory {
  if (typeof window === "undefined") return emptyPublicAiMemory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPublicAiMemory();
    return JSON.parse(raw) as PublicAiSessionMemory;
  } catch {
    return emptyPublicAiMemory();
  }
}

export function savePublicAiMemory(memory: PublicAiSessionMemory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function extractMemoryFromText(
  text: string,
  current: PublicAiSessionMemory = emptyPublicAiMemory()
): PublicAiSessionMemory {
  const next: PublicAiSessionMemory = { ...current };
  const lower = text.toLowerCase();

  if (/\b(i am|i'm|im|as a)\s+(a\s+)?carrier\b/i.test(lower) || /\bcarrier hu|main carrier\b/i.test(lower)) {
    next.role = "carrier";
  }
  if (/\b(i am|i'm|im|as a)\s+(a\s+)?supplier\b/i.test(lower) || /\bsupplier hu|main supplier\b/i.test(lower)) {
    next.role = "supplier";
  }

  const fleet = lower.match(/\b(\d+)\s*(truck|trucks|vehicle|vehicles|hgv|hgvs|lorry|lorries|artic|artics)\b/i);
  if (fleet) next.fleetSize = Number(fleet[1]);

  const location = lower.match(
    /\b(based in|from|operate in|operating in|located in|near|around|in)\s+([a-z][a-z\s-]{2,24}?)(?:\.|,|$|\band\b|\bwith\b|\bi\b)/i
  );
  if (location?.[2] && location[2].trim().length > 2) {
    const loc = location[2].trim();
    if (!/^(the|a|an|my|our|uk|haulage|freight)$/i.test(loc)) {
      next.userLocation = loc.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const equip = lower.match(/\b(artic|flatbed|reefer|curtain|box truck|sprinter|dry van|general haulage)\b/i);
  if (equip) next.equipmentType = equip[1];

  if (/\brpm|rate per mile|revenue per mile|profit per mile\b/i.test(lower)) next.activeTopic = "rpm";
  else if (/\bdiesel|fuel|petrol\b/i.test(lower)) next.activeTopic = "fuel";
  else if (/\b(load|haul|freight|bid|book)\b/i.test(lower)) next.activeTopic = "loads";
  else if (/\bpod|proof of delivery\b/i.test(lower)) next.activeTopic = "pod";
  else if (/\bpayout|wallet|payment\b/i.test(lower)) next.activeTopic = "payouts";

  return next;
}

export function mergeMemoryFromHistory(
  history: ChatHistoryItem[],
  current: PublicAiSessionMemory = emptyPublicAiMemory()
): PublicAiSessionMemory {
  let mem = { ...current };
  for (const item of history) {
    if (item.role === "user") {
      mem = extractMemoryFromText(item.content, mem);
    }
  }
  return mem;
}

export function formatMemoryForPrompt(memory: PublicAiSessionMemory): string {
  const lines: string[] = [];
  if (memory.role) lines.push(`User role: ${memory.role}`);
  if (memory.fleetSize) lines.push(`Fleet size: ${memory.fleetSize} truck(s)`);
  if (memory.equipmentType) lines.push(`Equipment: ${memory.equipmentType}`);
  if (memory.userLocation) lines.push(`Base / area: ${memory.userLocation}`);
  if (memory.activeTopic) lines.push(`Recent topic: ${memory.activeTopic}`);

  if (!lines.length) return "";
  return `Session memory (weave in naturally — e.g. "Since you run ${memory.fleetSize} trucks…" — don't list this block back to the user):\n${lines.join("\n")}`;
}
