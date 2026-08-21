import type { ChatHistoryItem, CopilotContextMemory } from "@/lib/chat-types";
import type { AiTier } from "@/lib/openai-model-router";

export type PublicAiSessionMemory = CopilotContextMemory & {
  fleetSize?: number | null;
  userName?: string | null;
  languagePreference?: string | null;
  lastRoute?: string | null;
  lastRate?: string | null;
  lastMiles?: number | null;
  lastRpm?: string | null;
  lastDieselNote?: string | null;
  companyName?: string | null;
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

  if (/\b(i am|i'm|im|as a|main)\s+(a\s+)?carrier\b/i.test(lower) || /\bcarrier hu|main carrier\b/i.test(lower)) {
    next.role = "carrier";
  }
  if (/\b(i am|i'm|im|as a|main)\s+(a\s+)?supplier\b/i.test(lower) || /\bsupplier hu|main supplier\b/i.test(lower)) {
    next.role = "supplier";
  }

  const nameMatch = text.match(
    /\b(?:my name is|i am|i'm|im|call me|mera naam|naam)\s+([A-Za-z][A-Za-z\s'-]{1,24})\b/i
  );
  if (nameMatch?.[1]) {
    const name = nameMatch[1].trim();
    if (!/^(a|an|the|carrier|supplier|from|based|a\s+carrier|a\s+supplier)$/i.test(name)) {
      next.userName = name.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const companyMatch = text.match(/\b(?:company|business|firm)\s+(?:is\s+)?([A-Za-z0-9][A-Za-z0-9\s&'-]{2,40})/i);
  if (companyMatch?.[1]) next.companyName = companyMatch[1].trim();

  const fleet = lower.match(/\b(\d+)\s*(truck|trucks|vehicle|vehicles|hgv|hgvs|lorry|lorries|artic|artics)\b/i);
  if (fleet) next.fleetSize = Number(fleet[1]);

  const location = lower.match(
    /\b(based in|from|operate in|operating in|located in|near|around|in|se|routes?\s+from)\s+([a-z][a-z\s-]{2,24}?)(?:\.|,|$|\band\b|\bwith\b|\bi\b|\bhu\b|\bke\b)/i
  );
  if (location?.[2] && location[2].trim().length > 2) {
    const loc = location[2].trim();
    if (!/^(the|a|an|my|our|uk|haulage|freight|roman|urdu|detail|english)$/i.test(loc)) {
      next.userLocation = loc.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const routeMatch = text.match(
    /\b([A-Za-z][A-Za-z\s'-]{2,22}?)\s*(?:to|→|->|se)\s*([A-Za-z][A-Za-z\s'-]{2,22}?)(?:\s|$|,|\.|\?)/i
  );
  if (routeMatch?.[1] && routeMatch?.[2]) {
    const origin = routeMatch[1].trim();
    const dest = routeMatch[2].trim();
    if (!/^(what|how|from|load|the|a|an|tell|explain)$/i.test(origin) && !/^(what|how|load|the|a|an)$/i.test(dest)) {
      next.lastRoute = `${origin} → ${dest}`;
      if (!next.preferredRoutes) next.preferredRoutes = [];
      if (!next.preferredRoutes.includes(next.lastRoute)) {
        next.preferredRoutes = [...next.preferredRoutes, next.lastRoute].slice(-5);
      }
    }
  }

  const rateMatch = text.match(/£\s*(\d[\d,]*(?:\.\d+)?)/);
  if (rateMatch?.[1]) next.lastRate = `£${rateMatch[1].replace(/,/g, "")}`;

  const milesMatch = lower.match(/\b(\d{2,4})\s*(miles|mile|mi)\b/i);
  if (milesMatch?.[1]) next.lastMiles = Number(milesMatch[1]);

  const rpmMatch = text.match(/(?:rpm|rate per mile)[^\d]*£?\s*(\d+(?:\.\d+)?)/i);
  if (rpmMatch?.[1]) next.lastRpm = `£${rpmMatch[1]}/mile`;

  if (/\b(diesel|desil|desile|fuel price|petrol)\b/i.test(lower)) {
    next.lastDieselNote = text.trim().slice(0, 120);
  }

  const equip = lower.match(/\b(artic|flatbed|reefer|curtain|box truck|sprinter|dry van|general haulage|7\.5t|18t|26t)\b/i);
  if (equip) next.equipmentType = equip[1];

  if (/\broman urdu|urdu men|urdu mein|urdu main|اردو|roman mein\b/i.test(lower)) {
    next.languagePreference = "roman_urdu";
  } else if (/\benglish only|in english\b/i.test(lower)) {
    next.languagePreference = "english";
  }

  if (/\brpm|profit|margin|rate per mile\b/i.test(lower)) next.activeTopic = "rpm";
  else if (/\bdiesel|fuel|petrol|desil|desile\b/i.test(lower)) next.activeTopic = "fuel";
  else if (/\b(load|haul|freight|bid|book|backhaul)\b/i.test(lower)) next.activeTopic = "loads";
  else if (/\bpod|proof of delivery\b/i.test(lower)) next.activeTopic = "pod";
  else if (/\bpayout|wallet|payment|commission\b/i.test(lower)) next.activeTopic = "payouts";
  else if (/\balpha freight|sign up|signup|platform\b/i.test(lower)) next.activeTopic = "platform";

  return next;
}

export function mergeMemoryFromHistory(
  history: ChatHistoryItem[],
  current: PublicAiSessionMemory = emptyPublicAiMemory()
): PublicAiSessionMemory {
  let mem = { ...current };
  for (const item of history) {
    mem = extractMemoryFromText(item.content, mem);
  }
  return mem;
}

export function formatMemoryForPrompt(
  memory: PublicAiSessionMemory,
  aiTier: AiTier = "guest"
): string {
  const lines: string[] = [];
  if (memory.userName) lines.push(`Name: ${memory.userName} — greet naturally once, then use occasionally`);
  if (memory.role) lines.push(`Role: ${memory.role} — tailor advice (carrier = loads/RPM/bids; supplier = post loads/pay)`);
  if (memory.companyName) lines.push(`Company: ${memory.companyName}`);
  if (memory.fleetSize) lines.push(`Fleet: ${memory.fleetSize} truck(s)`);
  if (memory.equipmentType) lines.push(`Equipment: ${memory.equipmentType}`);
  if (memory.userLocation) lines.push(`Base / area: ${memory.userLocation}`);
  if (memory.lastRoute) lines.push(`Recent route: ${memory.lastRoute}`);
  if (memory.lastRate) lines.push(`Recent rate: ${memory.lastRate}`);
  if (memory.lastMiles) lines.push(`Recent distance: ${memory.lastMiles} miles`);
  if (memory.lastRpm) lines.push(`Recent RPM discussed: ${memory.lastRpm}`);
  if (memory.lastDieselNote) lines.push(`Diesel context: ${memory.lastDieselNote.slice(0, 80)}`);
  if (memory.languagePreference === "roman_urdu") lines.push(`Language: Roman Urdu — reply in natural Roman Urdu`);
  if (memory.languagePreference === "english") lines.push(`Language: English only`);
  if (memory.preferredRoutes?.length) {
    lines.push(`Known routes: ${memory.preferredRoutes.join("; ")}`);
  }
  if (memory.activeTopic) lines.push(`Active thread topic: ${memory.activeTopic} — follow-ups relate to this`);

  if (!lines.length) return "";

  const instruction =
    aiTier === "guest"
      ? "Use ALL facts below naturally in your reply — never ask for them again."
      : "Personalise using ALL facts below. Reference name, route, fleet, and numbers naturally — never re-ask.";

  return `USER MEMORY — ${instruction}\n${lines.join("\n")}`;
}

export function buildConversationRecap(history: ChatHistoryItem[], aiTier: AiTier = "guest"): string {
  if (history.length < 2) return "";

  const recent = history.slice(aiTier === "guest" ? -10 : -16);
  const lines = recent.map((item) => {
    const label = item.role === "user" ? "User" : "Assistant";
    const preview = item.content.trim().replace(/\s+/g, " ").slice(0, aiTier === "guest" ? 280 : 380);
    return `- ${label}: ${preview}${item.content.length > preview.length ? "…" : ""}`;
  });

  const lastUser = [...history].reverse().find((h) => h.role === "user")?.content?.trim() || "";

  return `CONVERSATION RECAP — read every line before replying:
${lines.join("\n")}

Latest user message: "${lastUser.slice(0, 200)}"

Continuity rules:
- Short follow-ups ("aur?", "detail", "same", "phir", "or?") refer to the thread above — continue that exact topic with MORE depth.
- Reuse all numbers, routes, names, and preferences already stated — do NOT ask again.
- If you already explained something, add new angles/examples — do not repeat the same intro.
- Match the user's latest language preference.`;
}
