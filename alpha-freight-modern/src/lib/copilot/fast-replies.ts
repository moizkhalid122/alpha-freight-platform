import type { AssistantKind, ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import type { CopilotUserContext } from "@/lib/copilot/user-context";
import { enrichPlatformReply } from "@/lib/copilot/platform-enrichment";
import { calculateProfit, extractProfitFromMessage } from "@/lib/copilot/profit-calculator";
import { getMarketingChatReply } from "@/lib/marketing-chat";

const ROLE_LABELS: Record<AssistantKind, string> = {
  general: "Alpha Freight AI",
  carrier: "Carrier Co-Pilot",
  supplier: "Supplier Co-Pilot",
};

export function isGenericMarketingFallback(message: string, history: ChatHistoryItem[] = []): boolean {
  const reply = getMarketingChatReply(message, history);
  return reply.message.includes("Try asking something like");
}

export function isGreetingOrThanks(message: string): boolean {
  const text = message.toLowerCase().trim();
  return /^(hi|hello|hey|salam|assalam|good morning|good afternoon|thanks?|thank you|shukriya)[.!?]?$/i.test(
    text
  );
}

export function isDieselOrFuelQuery(message: string): boolean {
  const text = message.toLowerCase().replace(/\bdesile\b/g, "diesel").replace(/\bdesial\b/g, "diesel");
  return (
    /\b(diesel|fuel|petrol)\b.*\b(price|rate|cost)\b/i.test(text) ||
    /\b(price|rate|cost)\b.*\b(diesel|fuel|petrol|uk)\b/i.test(text) ||
    /\buk\b.*\b(diesel|fuel|desile)\b/i.test(text)
  );
}

export function buildDieselPriceReply(assistantType: AssistantKind): {
  message: string;
  structuredMessage: StructuredAssistantReply;
} {
  const label = ROLE_LABELS[assistantType];
  const message = `⛽ UK diesel prices change weekly — check RAC Fuel Watch or AA for today's rate. Typical haulage range: £1.45–£1.55/litre. Always factor fuel + deadhead into RPM before booking.`;

  return {
    message,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "card",
      assistantName: label,
      modeLabel: "Fuel Update",
      knowledgeSource: "instant",
      confidence: 90,
      title: "⛽ UK Diesel Price Guide",
      shortExplanation:
        "UK diesel rates move weekly by region. For accurate today price, check RAC Fuel Watch or AA Fuel Report — then plug the number into your RPM calculation.",
      keyPoints: [
        "📊 Typical range: £1.45–£1.55/litre (varies by region & station)",
        "🔗 RAC Fuel Watch: rac.co.uk/fuel-watch",
        "🔗 AA Fuel Prices: theaa.com (Driving → Fuel prices)",
        "💡 Formula: (miles ÷ MPG) × £/litre = fuel cost per trip",
        "✅ Subtract fuel + deadhead from rate before accepting any load",
      ],
      recommendation: "💡 Re-check fuel price weekly — a 5p/litre change can wipe profit on long runs.",
      nextStep: "Ask me: Calculate profit £800 for 320 miles at today's diesel rate.",
      suggestedQuestions: ["📈 What is RPM?", "💰 Calculate profit for my load"],
      quickActions: [],
      rawText: message,
    },
  };
}

export function buildInstantMarketingReply(
  message: string,
  assistantType: AssistantKind,
  history: ChatHistoryItem[] = []
): { message: string; structuredMessage: StructuredAssistantReply } {
  const { message: text } = getMarketingChatReply(message, history);
  const label = ROLE_LABELS[assistantType];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.slice(1).filter((l) => l.length > 2).slice(0, 5);

  return {
    message: text,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "card",
      assistantName: label,
      modeLabel: label,
      knowledgeSource: "instant",
      confidence: 92,
      title: `👋 ${label}`,
      shortExplanation: lines.slice(0, 2).join(" ") || text.slice(0, 300),
      keyPoints: bullets.map((b, i) => {
        const icons = ["📌", "💡", "✅", "🚛", "💰"];
        const cleaned = b.replace(/^[-*•\d.)]+\s*/, "").trim();
        if (/^[^\u{1F300}-\u{1FAFF}]/u.test(cleaned)) {
          return `${icons[i % icons.length]} ${cleaned}`;
        }
        return cleaned;
      }),
      recommendation: "💡 Ask me about loads, RPM, payouts, tracking, or posting freight.",
      nextStep: "Try a quick prompt below or type your question.",
      suggestedQuestions: ["🚛 Find loads near me", "💰 How do payouts work?"],
      quickActions: [],
      rawText: text,
    },
  };
}

export function buildPlatformFastReply(
  userCtx: CopilotUserContext,
  detected: DetectedIntent,
  message: string,
  assistantType: AssistantKind
): { message: string; structuredMessage: StructuredAssistantReply } | null {
  if (!detected.platformIntent) return null;

  const label = ROLE_LABELS[assistantType];
  const intent = detected.platformIntent;

  let base: StructuredAssistantReply = {
    mode: "logistics_copilot",
    displayStyle: "card",
    assistantName: label,
    modeLabel: label,
    knowledgeSource: "platform-fast",
    confidence: 95,
    title: `${label} 🚛`,
    shortExplanation: "",
    keyPoints: [],
    recommendation: "",
    nextStep: "",
    quickActions: [],
    platformIntent: intent,
  };

  if (intent.type === "loads_search" && userCtx.availableLoads.length > 0) {
    base.shortExplanation = `I found ${userCtx.availableLoads.length} active loads on the platform — ranked below.`;
  } else if (intent.type === "active_loads_lookup" && userCtx.myLoads.length > 0) {
    base.shortExplanation = `You have ${userCtx.myLoads.length} load(s) on your account.`;
  } else if (intent.type === "earnings_lookup" && userCtx.wallet) {
    base.shortExplanation = `Wallet: £${userCtx.wallet.available.toFixed(2)} available, £${userCtx.wallet.pending.toFixed(2)} pending.`;
  } else if (intent.type === "bids_lookup" && userCtx.bids.length > 0) {
    base.shortExplanation = `You have ${userCtx.bids.length} bid(s) — ${userCtx.bids.filter((b) => b.status === "pending").length} pending.`;
  } else {
    return null;
  }

  const enriched = enrichPlatformReply(base, userCtx, message);
  if (!enriched.platformResult && !enriched.metrics?.length) return null;

  enriched.recommendation =
    enriched.recommendation ||
    "💡 Compare RPM and deadhead before booking — highest rate isn't always best profit.";
  enriched.nextStep = enriched.nextStep || "Tap a load card to calculate profit or place a bid.";
  if (!enriched.keyPoints.length) {
    enriched.keyPoints = [
      "🚛 Loads ranked by pay and route fit",
      "💰 Check RPM before you bid",
      "✅ Use Calculate Profit on any load card",
    ];
  }

  const messageText = [enriched.title, enriched.shortExplanation].filter(Boolean).join("\n\n");
  return { message: messageText, structuredMessage: enriched };
}

export function buildProfitFastReply(
  message: string,
  assistantType: AssistantKind
): { message: string; structuredMessage: StructuredAssistantReply } | null {
  const inputs = extractProfitFromMessage(message);
  if (!inputs?.rate || !inputs?.loadedMiles) return null;

  const result = calculateProfit({ rate: inputs.rate, loadedMiles: inputs.loadedMiles });
  const label = ROLE_LABELS[assistantType];

  const structured: StructuredAssistantReply = {
    mode: "logistics_copilot",
    displayStyle: "card",
    assistantName: label,
    modeLabel: label,
    knowledgeSource: "instant",
    confidence: 96,
    title: "📊 Profit & RPM",
    shortExplanation: result.summary,
    keyPoints: [
      `💰 Est. profit: £${result.grossProfit.toFixed(2)}`,
      `📈 RPM: £${result.rpm.toFixed(2)}/mile`,
      `📊 Margin: ${result.marginPct.toFixed(1)}%`,
    ],
    recommendation: result.recommendation,
    nextStep: "Open Find Loads to compare with this RPM target.",
    metrics: result.metrics,
    quickActions: [],
    rawText: result.summary,
  };

  return { message: result.summary, structuredMessage: structured };
}
