/** Industries & domains Alpha Freight AI must handle with A–Z depth */
export const WORLD_KNOWLEDGE_DOMAINS = [
  "UK & global logistics, supply chain, warehousing, last-mile, air/sea/road/rail freight",
  "Business, finance, accounting, tax, startups, marketing, sales, HR, operations",
  "Technology, software, AI, cybersecurity, cloud, mobile apps, web development",
  "Law, contracts, compliance, insurance, health & safety, employment law (general info)",
  "Healthcare, medicine, nutrition, fitness, mental wellbeing (general — not personal diagnosis)",
  "Science, engineering, maths, physics, chemistry, biology, environment, climate",
  "History, politics, geography, culture, religion, languages, education",
  "Construction, manufacturing, retail, hospitality, agriculture, energy, mining",
  "Real estate, property, mortgages, investment, crypto, stock markets (general)",
  "Creative: design, branding, content, social media, photography, video",
  "Personal development, careers, interviews, CVs, visas, immigration (general)",
  "Sports, entertainment, travel, food, fashion, automotive, aviation, maritime",
  "Pakistan, UK, EU, USA, Middle East, South Asia — local context when relevant",
  "Roman Urdu, Urdu, English, Punjabi context — natural multilingual answers",
] as const;

export function buildWorldKnowledgePromptBlock(): string {
  return `## UNIVERSAL KNOWLEDGE — A to Z (CRITICAL)

You are a **world-class general intelligence** PLUS a UK freight expert. The user can ask about **ANY topic, ANY industry, ANY country** — you MUST answer fully and confidently from broad knowledge.

**Coverage (A–Z examples — not limited to this list):**
${WORLD_KNOWLEDGE_DOMAINS.map((d) => `- ${d}`).join("\n")}

**Rules for non-freight / general questions:**
1. **Never refuse** with "I only do freight" — answer the question properly first.
2. Give **real depth**: definitions, how it works, pros/cons, examples, common mistakes, best practices.
3. For **industries** (hospital, restaurant, factory, school, bank, etc.) — explain operations, roles, KPIs, tools, trends.
4. For **how-to** — numbered steps, checklists, templates where helpful.
5. For **comparisons** — use tables (Option A vs B).
6. Cite **realistic** facts; if live/current data is needed and not in RETRIEVED CONTEXT, say what you know + note "for today's exact figure, check…"
7. **Medical/legal/financial:** give general education, add brief disclaimer — not personal professional advice.
8. Use the same **Khulasa → Is mein → Misaal → Pro tip → Agla qadam** structure with topic-appropriate emoji (🏥 🏦 🎓 ⚖️ 🌍 🔬 💻 🏗️ etc.) — not only freight emoji.

**Freight link:** Only add ONE optional Alpha Freight line at the end if naturally relevant — never hijack the answer.`;
}

export function detectKnowledgeDomain(message: string): string | null {
  const lower = message.toLowerCase();

  const domains: Array<[RegExp, string]> = [
    [/\b(logistics|freight|haulage|hgv|lorry|rpm|diesel|load|pod|warehouse|supply chain)\b/i, "logistics"],
    [/\b(code|programming|software|app|website|javascript|python|ai|tech|computer)\b/i, "technology"],
    [/\b(business|startup|marketing|sales|profit|revenue|company|ceo|manager)\b/i, "business"],
    [/\b(law|legal|contract|court|lawyer|regulation|compliance|gdpr)\b/i, "legal"],
    [/\b(medicine|health|doctor|hospital|disease|symptom|treatment|nutrition)\b/i, "health"],
    [/\b(science|physics|chemistry|biology|math|engineering|research)\b/i, "science"],
    [/\b(history|war|empire|ancient|century|president|prime minister)\b/i, "history"],
    [/\b(country|capital|geography|continent|population|climate)\b/i, "geography"],
    [/\b(restaurant|hotel|hospitality|chef|menu|kitchen)\b/i, "hospitality"],
    [/\b(build|construction|architect|contractor|cement|plumbing)\b/i, "construction"],
    [/\b(bank|finance|loan|mortgage|invest|stock|crypto|tax|accounting)\b/i, "finance"],
    [/\b(school|university|education|exam|degree|teacher|student)\b/i, "education"],
    [/\b(fashion|clothing|brand|retail|shop|ecommerce|amazon)\b/i, "retail"],
    [/\b(farm|agriculture|crop|livestock|food production)\b/i, "agriculture"],
    [/\b(car|automotive|vehicle|mechanic|electric vehicle|ev)\b/i, "automotive"],
    [/\b(airline|airport|pilot|aviation|aircraft)\b/i, "aviation"],
    [/\b(ship|port|maritime|container|shipping|sea freight)\b/i, "maritime"],
    [/\b(religion|islam|christian|hindu|quran|bible|prayer)\b/i, "culture"],
    [/\b(sport|football|cricket|fitness|gym|training)\b/i, "sports"],
    [/\b(travel|visa|passport|tourism|flight booking)\b/i, "travel"],
    [/\b(recipe|cook|food|nutrition|diet)\b/i, "food"],
  ];

  for (const [pattern, label] of domains) {
    if (pattern.test(lower)) return label;
  }

  if (/\b(what is|who is|how to|explain|define|tell me|why|when|where)\b/i.test(lower)) {
    return "general";
  }

  return null;
}

export function buildDomainHint(message: string): string {
  const domain = detectKnowledgeDomain(message);
  if (!domain) return "";
  if (domain === "logistics") {
    return "Domain: UK logistics/freight — use expert haulage depth + platform knowledge.";
  }
  return `Domain detected: ${domain} — answer as a knowledgeable expert in this field with A–Z practical detail. Do NOT redirect to freight unless user asked about freight.`;
}
