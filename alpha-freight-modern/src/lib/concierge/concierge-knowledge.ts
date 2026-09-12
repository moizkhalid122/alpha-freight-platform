import {
  getCarrierCommissionRate,
  getSupplierCommissionRate,
} from "@/lib/load-commission";

const supplierPct = Math.round(getSupplierCommissionRate() * 100);
const carrierPct = Math.round(getCarrierCommissionRate() * 100);

export type ConciergeKnowledgeChunk = {
  id: string;
  topics: string[];
  content: string;
};

export const CONCIERGE_KNOWLEDGE_BASE: ConciergeKnowledgeChunk[] = [
  {
    id: "pricing-supplier",
    topics: ["supplier fee", "supplier commission", "post load cost", "kitna lagta hai supplier"],
    content: `Suppliers pay a ${supplierPct}% platform service fee on top of the load price when freight moves. There is no monthly subscription to join Alpha Freight.`,
  },
  {
    id: "pricing-carrier",
    topics: ["carrier fee", "carrier commission", "how much carrier pays"],
    content: `Carriers pay a ${carrierPct}% platform fee deducted from the load rate when they haul. Joining is free — you only pay when you win and move a load.`,
  },
  {
    id: "payouts",
    topics: ["payout", "payment", "7 day", "when do carriers get paid"],
    content: "Alpha Freight targets 7-day carrier payouts after successful delivery and POD — faster than many traditional brokers.",
  },
  {
    id: "referral",
    topics: ["referral code", "refer a friend", "share alpha", "referral"],
    content:
      "Each member gets a referral code (AF-CAR-… for carriers, AF-SUP-… for suppliers). Share it at signup or from your referrals page — both sides benefit when someone joins and moves freight.",
  },
  {
    id: "carrier-signup",
    topics: ["carrier signup", "hgv driver join", "register carrier", "how to join carrier"],
    content:
      "Carrier signup: full name, email, password, optional referral code → Create Account → onboarding (profile, vehicles, verification) → browse loads and bid.",
  },
  {
    id: "supplier-signup",
    topics: ["supplier signup", "post loads signup", "shipper register"],
    content:
      "Supplier signup: full name, email, password, optional referral → Create Account → onboarding → post your first UK load and receive carrier bids.",
  },
  {
    id: "find-loads",
    topics: ["find loads", "load board", "available loads", "bid on loads"],
    content:
      "Carriers browse available UK loads on Find Loads or the carrier portal. Create a free account to bid, message suppliers, and track active jobs.",
  },
  {
    id: "verification",
    topics: ["verification", "verify email", "documents", "approved"],
    content:
      "Most users go straight into onboarding after signup. Email verification is only needed if the signup form shows a verify-email message.",
  },
  {
    id: "support",
    topics: ["contact support", "human help", "phone", "email support"],
    content: "Human support: support@alphafreight.co.uk or the Contact page. Alpha can open contact and pre-fill your details.",
  },
];

function scoreChunk(chunk: ConciergeKnowledgeChunk, query: string): number {
  const lower = query.toLowerCase();
  let score = 0;
  for (const topic of chunk.topics) {
    const t = topic.toLowerCase();
    if (lower.includes(t)) score += t.length > 8 ? 4 : 3;
    for (const word of t.split(/\s+/)) {
      if (word.length > 3 && lower.includes(word)) score += 1;
    }
  }
  if (lower.includes("commission") && chunk.id.includes("pricing")) score += 3;
  if (lower.includes("referral") && chunk.id === "referral") score += 5;
  return score;
}

export function searchConciergeKnowledge(query: string, limit = 3): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return CONCIERGE_KNOWLEDGE_BASE.map((chunk) => ({ chunk, score: scoreChunk(chunk, trimmed) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.chunk.content);
}

export function formatKnowledgeForPrompt(snippets: string[]): string {
  if (!snippets.length) return "";
  return `ALPHA FREIGHT FACTS (use these — do not guess pricing or policy):
${snippets.map((s) => `- ${s}`).join("\n")}`;
}
