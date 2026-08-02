import type { StructuredAssistantReply } from "@/lib/chat-types";

const CARRIER_REFERRAL_REWARD = 50;
const SUPPLIER_REFERRAL_REWARD = 100;

const FREIGHT_PATTERN =
  /\b(freight|load|loads|haul|haulage|truck|hgv|lorry|carrier|supplier|rpm|diesel|fuel|pod|delivery|logistics|alpha|bid|wallet|payout|route|backhaul|margin|rate|quote|book|profit|mile|artic|van|reefer|dispatch|sign up|signup)\b/i;

export type ToolLink = {
  label: string;
  href: string;
  action: string;
};

export function isFreightQuery(message: string): boolean {
  return FREIGHT_PATTERN.test(message);
}

export function detectToolLinks(message: string): ToolLink[] {
  const text = message.toLowerCase();
  const links: ToolLink[] = [];

  if (
    /\b(£\s?\d|rate|good deal|worth it|margin|profit|rpm|800|320 miles)\b/i.test(text) &&
    /\b(mile|miles|rate|£|profit|worth)\b/i.test(text)
  ) {
    links.push({
      label: "Rate check tool",
      href: "/tools/rate-check",
      action: "Open the rate check tool for this lane",
    });
    links.push({
      label: "Carrier margin calc",
      href: "/tools/carrier-margin",
      action: "Calculate carrier margin for this load",
    });
  }

  if (/\b(manchester|london|birmingham|leeds|glasgow|miles|distance|how far)\b/i.test(text)) {
    links.push({
      label: "Distance calculator",
      href: "/tools/distance",
      action: "Calculate driving distance for this route",
    });
  }

  if (/\b(backhaul|empty|return load|deadhead)\b/i.test(text)) {
    links.push({
      label: "Backhaul finder",
      href: "/tools/backhaul",
      action: "Find backhaul loads on this route",
    });
  }

  if (/\b(diesel|fuel surcharge|fuel cost)\b/i.test(text)) {
    links.push({
      label: "Fuel surcharge tool",
      href: "/tools/fuel-surcharge",
      action: "Calculate fuel surcharge for this trip",
    });
  }

  if (/\b(quote|freight quote|ship)\b/i.test(text)) {
    links.push({
      label: "Freight quote",
      href: "/tools/freight-quote",
      action: "Get a freight quote estimate",
    });
  }

  return links;
}

function mergeQuickActions(
  reply: StructuredAssistantReply,
  extras: Array<{ label: string; href: string; action: string; variant?: "primary" | "secondary" | "ghost" }>
): StructuredAssistantReply["quickActions"] {
  const existing = reply.quickActions || [];
  const seen = new Set(existing.map((a) => a.href).filter(Boolean));
  const merged = [...existing];

  for (const item of extras) {
    if (item.href && seen.has(item.href)) continue;
    if (item.href) seen.add(item.href);
    merged.push({
      label: item.label,
      href: item.href,
      action: item.action,
      variant: item.variant || "secondary",
    });
  }

  return merged.slice(0, 6);
}

export function enrichPublicAiReply(
  reply: StructuredAssistantReply,
  message: string
): StructuredAssistantReply {
  const freight = isFreightQuery(message);
  const toolLinks = detectToolLinks(message);

  const growthActions: Array<{
    label: string;
    href: string;
    action: string;
    variant?: "primary" | "secondary" | "ghost";
  }> = toolLinks.map((t) => ({ ...t, variant: "secondary" as const }));

  if (freight) {
    growthActions.unshift({
      label: "Find live loads — sign up free",
      href: "/auth/select",
      action: "How do I sign up and find live loads?",
      variant: "primary",
    });
    growthActions.push({
      label: "Browse load board",
      href: "/find-loads",
      action: "Show me how to find loads in the UK",
      variant: "secondary",
    });
    growthActions.push({
      label: "Get mobile app",
      href: "/products/mobile-app",
      action: "Tell me about the Alpha Freight mobile app",
      variant: "ghost",
    });
  }

  let recommendation = reply.recommendation || "";
  if (freight && !/referral|invite|share with/i.test(recommendation)) {
    const referralLine = `💡 Share with a driver or shipper — earn up to £${CARRIER_REFERRAL_REWARD}–£${SUPPLIER_REFERRAL_REWARD} per qualified referral when they join Alpha Freight.`;
    recommendation = recommendation ? `${recommendation} ${referralLine}` : referralLine;
  }

  if (freight && /\b(app|mobile|track|on the go)\b/i.test(message) && !/mobile app/i.test(recommendation)) {
    recommendation += " 📱 Get the Alpha Freight app to track loads and upload POD on the go.";
  }

  let nextStep = reply.nextStep || "";
  if (freight && !/sign up|signup|account|auth\/select/i.test(nextStep)) {
    nextStep =
      "Find live loads — sign up free at Alpha Freight for unlimited AI, load board, bids & wallet.";
  }

  return {
    ...reply,
    recommendation,
    nextStep,
    quickActions: mergeQuickActions(reply, growthActions),
  };
}

export const WHATSAPP_SHARE_PREFIX =
  "I asked Alpha Freight AI about UK freight — try free:";

export function buildWhatsAppShareBody(answerText: string, shareUrl: string): string {
  const snippet = answerText.trim().slice(0, 420);
  return `${WHATSAPP_SHARE_PREFIX}\n\n${snippet}\n\n${shareUrl}`;
}
