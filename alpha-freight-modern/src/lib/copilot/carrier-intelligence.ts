import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CopilotMetric,
  CopilotPlatformLoad,
  CopilotQuickAction,
  StructuredAssistantReply,
} from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import type { CopilotUserContext } from "@/lib/copilot/user-context";
import { calculateCarrierPayout } from "@/lib/load-commission";
import { calculateProfit } from "@/lib/copilot/profit-calculator";
import {
  calculateFreightQuote,
  calculateUkDistance,
  compareRateToMarket,
  estimateDistanceMiles,
  findBackhaulLanes,
  parseEquipmentQuery,
  resolveUkCityLabel,
  type EquipmentType,
  type RateLoadRow,
} from "@/lib/freight-tools";
import { analyzeSupplierLoadDraft, type SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";

export type ScoredCarrierLoad = {
  id: string;
  route: string;
  origin: string;
  destination: string;
  price: number;
  equipment: string;
  miles: number;
  rpm: number;
  carrierReceives: number;
  platformFee: number;
  score: number;
  profitEstimate: number;
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function extractCity(text: string) {
  return text.split("→")[0]?.split(",")[0]?.trim() || text.trim();
}

function locationMatches(route: string, needle?: string | null) {
  if (!needle) return true;
  return route.toLowerCase().includes(needle.toLowerCase());
}

function scoreLoadForCarrier(
  load: { id: string; route: string; price: number; equipment: string },
  intent?: DetectedIntent["platformIntent"]
) {
  const [originPart, destPart] = load.route.split("→").map((part) => part.trim());
  const origin = originPart || "TBC";
  const destination = destPart || "TBC";
  const miles = Math.max(1, estimateDistanceMiles(origin, destination));
  const price = Math.max(0, load.price);
  const payout = calculateCarrierPayout(price);
  const rpm = price / miles;
  const profit = calculateProfit({
    rate: payout.carrierReceives,
    loadedMiles: miles,
    emptyMiles: Math.round(miles * 0.08),
  });

  let score = 68;
  if (rpm >= 2.5) score += 18;
  else if (rpm >= 2.0) score += 12;
  else if (rpm >= 1.6) score += 6;
  else score -= 8;

  if (profit.grossProfit > 150) score += 10;
  else if (profit.grossProfit > 60) score += 4;
  else score -= 6;

  const location = intent?.location?.toLowerCase();
  const equipment = intent?.equipmentType?.toLowerCase();
  if (location) {
    if (locationMatches(origin, location) || locationMatches(destination, location)) score += 12;
    else score -= 10;
  }
  if (equipment && load.equipment.toLowerCase().includes(equipment)) score += 8;

  return {
    id: load.id,
    route: load.route,
    origin,
    destination,
    price,
    equipment: load.equipment,
    miles,
    rpm: Number(rpm.toFixed(2)),
    carrierReceives: payout.carrierReceives,
    platformFee: payout.commissionAmount,
    score: Math.max(55, Math.min(99, score)),
    profitEstimate: profit.grossProfit,
  };
}

export function rankCarrierLoads(
  loads: CopilotUserContext["availableLoads"],
  intent?: DetectedIntent["platformIntent"]
) {
  return loads
    .map((load) => scoreLoadForCarrier(load, intent))
    .sort((a, b) => b.score - a.score);
}

function toCarrierLoadCard(scored: ScoredCarrierLoad): CopilotPlatformLoad {
  return {
    id: scored.id,
    title: scored.route,
    subtitle: `${scored.equipment} · ${scored.miles} mi · Score ${scored.score}`,
    score: scored.score,
    metrics: [
      { label: "Load rate", value: formatMoney(scored.price), icon: "💰" },
      { label: "You receive", value: formatMoney(scored.carrierReceives), icon: "✅", tone: "positive" },
      { label: "RPM", value: `£${scored.rpm.toFixed(2)}/mi`, icon: "📈", tone: scored.rpm >= 2 ? "positive" : "neutral" },
      { label: "Est. profit", value: formatMoney(scored.profitEstimate), icon: "⛽", tone: scored.profitEstimate > 0 ? "positive" : "warning" },
    ],
    primaryAction: {
      label: "View & Bid",
      href: `/carrier/available-loads?highlight=${scored.id}`,
      action: `Open load ${scored.id} to place a bid`,
      variant: "primary",
    },
    secondaryActions: [
      {
        label: "Calculate profit",
        action: `Calculate profit ${formatMoney(scored.carrierReceives)} for ${scored.miles} miles`,
        variant: "ghost",
        context: {
          origin: scored.origin,
          destination: scored.destination,
          rate: scored.carrierReceives,
          equipment: scored.equipment,
        },
      },
    ],
  };
}

export function buildLoadMatcherReply(
  ctx: CopilotUserContext,
  intent?: DetectedIntent["platformIntent"]
): StructuredAssistantReply | null {
  if (!ctx.availableLoads.length) return null;

  const ranked = rankCarrierLoads(ctx.availableLoads, intent).slice(0, 5);
  const best = ranked[0];
  if (!best) return null;

  return {
    mode: "load_analyst",
    displayStyle: "card",
    assistantName: "Carrier Co-Pilot",
    modeLabel: "Load Matcher",
    knowledgeSource: "carrier-intelligence",
    confidence: 96,
    title: best ? `Top match: ${best.route}` : "Available loads",
    shortExplanation: `I ranked ${ctx.availableLoads.length} live loads by RPM, estimated profit after fuel, route fit, and equipment match.`,
    keyPoints: ranked.slice(0, 3).map(
      (load) =>
        `🚛 ${load.route}: ${formatMoney(load.price)} · You receive ${formatMoney(load.carrierReceives)} · RPM £${load.rpm.toFixed(2)}/mi · Score ${load.score}`
    ),
    recommendation:
      best.rpm >= 2
        ? `${best.route} looks strong — verify pickup timing and deadhead before bidding.`
        : "Rates are tight on current board — compare RPM and empty miles before committing.",
    nextStep: "Open a load card to bid or run a deeper profit calculation.",
    metrics: best
      ? [
          { label: "Best RPM", value: `£${best.rpm.toFixed(2)}/mi`, tone: "positive" },
          { label: "Best profit est.", value: formatMoney(best.profitEstimate), tone: "positive" },
          { label: "Loads ranked", value: String(ranked.length) },
        ]
      : [],
    platformResult: {
      title: "Ranked load matches",
      subtitle: "Sorted by pay, RPM, and route fit",
      totalCount: ctx.availableLoads.length,
      loads: ranked.map(toCarrierLoadCard),
    },
    quickActions: [
      { label: "Find more loads", href: "/carrier/available-loads", action: "Show all available loads", variant: "primary" },
      { label: "My bids", href: "/carrier/my-bids", action: "Show my active bids", variant: "secondary" },
    ],
    suggestedQuestions: [
      "Calculate profit £950 for 204 miles",
      "Is £950 a good bid for Birmingham to Manchester?",
      "Find backhaul from London",
    ],
    platformIntent: intent,
  };
}

export function buildCarrierProfitReply(input: {
  rate: number;
  loadedMiles: number;
  emptyMiles?: number;
  deductPlatformFee?: boolean;
}): StructuredAssistantReply {
  const grossRate = Math.max(0, input.rate);
  const payout = calculateCarrierPayout(grossRate);
  const carrierReceives =
    input.deductPlatformFee === false ? grossRate : payout.carrierReceives;
  const commissionAmount = input.deductPlatformFee === false ? 0 : payout.commissionAmount;
  const commissionRate = input.deductPlatformFee === false ? 0 : payout.commissionRate;

  const profit = calculateProfit({
    rate: carrierReceives,
    loadedMiles: input.loadedMiles,
    emptyMiles: input.emptyMiles ?? Math.round(input.loadedMiles * 0.1),
  });

  return {
    mode: "load_analyst",
    displayStyle: "card",
    assistantName: "Carrier Co-Pilot",
    modeLabel: "Profit & RPM",
    knowledgeSource: "carrier-intelligence",
    confidence: 97,
    title: "Profit & RPM analysis",
    shortExplanation: profit.summary,
    keyPoints: [
      `Load rate: ${formatMoney(grossRate)}`,
      `Alpha Freight platform fee (${Math.round(commissionRate * 100)}%): ${formatMoney(commissionAmount)}`,
      `Carrier receives: ${formatMoney(carrierReceives)}`,
      `Estimated net after fuel: ${formatMoney(profit.grossProfit)}`,
      `RPM on loaded miles: £${profit.rpm.toFixed(2)}/mi`,
    ],
    recommendation: profit.recommendation,
    nextStep: "Compare this RPM with other loads on the board before bidding.",
    metrics: profit.metrics,
    quickActions: [
      { label: "Find loads", href: "/carrier/available-loads", action: "Show available loads", variant: "primary" },
    ],
    suggestedQuestions: ["Find loads near Birmingham", "Is £950 a good bid?"],
  };
}

export function buildCarrierLaneRateReply(input: {
  origin: string;
  destination: string;
  equipment?: string;
  marketLoads?: RateLoadRow[];
}): StructuredAssistantReply {
  const equipment = parseEquipmentQuery(input.equipment || "general");
  const quote = calculateFreightQuote({
    origin: input.origin,
    destination: input.destination,
    equipment,
    loads: input.marketLoads,
  });
  const marketMid = quote.estimateMid;
  const payout = calculateCarrierPayout(marketMid);
  const profit = calculateProfit({
    rate: payout.carrierReceives,
    loadedMiles: quote.distanceMiles,
    emptyMiles: Math.round(quote.distanceMiles * 0.1),
  });
  const sourceLabel =
    quote.source === "marketplace" ? "Live Alpha Freight board" : "UK corridor model + diesel index";

  return {
    mode: "load_analyst",
    displayStyle: "card",
    assistantName: "Carrier Co-Pilot",
    modeLabel: "Lane Rate",
    knowledgeSource: "carrier-intelligence",
    confidence: 95,
    title: `${quote.origin} → ${quote.destination} live rate`,
    shortExplanation: `${quote.distanceMiles} mile lane · Suggested bid ${formatMoney(marketMid)} (${formatMoney(quote.estimateLow)}–${formatMoney(quote.estimateHigh)}). ${quote.fuelNote}`,
    keyPoints: [
      `Market RPM: £${quote.ratePerMile.toFixed(2)}/mi`,
      `You receive ≈ ${formatMoney(payout.carrierReceives)} after platform fee`,
      `Estimated profit after fuel: ${formatMoney(profit.grossProfit)}`,
      `Data source: ${sourceLabel}`,
      `Competitive bid range: ${formatMoney(Math.round(marketMid * 0.95))} – ${formatMoney(Math.round(marketMid * 1.05))}`,
    ],
    recommendation:
      profit.grossProfit > 80
        ? "This lane looks profitable at market rate — bid near mid-rate for a strong win chance."
        : "Margin is tighter on this lane — bid strategically or look for a backhaul to improve day rate.",
    nextStep: "Open Find Loads and filter this corridor, or ask me to compare a specific bid amount.",
    metrics: [
      { label: "Mid rate", value: formatMoney(marketMid), tone: "positive" },
      { label: "Range", value: `${formatMoney(quote.estimateLow)}–${formatMoney(quote.estimateHigh)}` },
      { label: "Distance", value: `${quote.distanceMiles} mi` },
      { label: "RPM", value: `£${quote.ratePerMile.toFixed(2)}/mi` },
    ],
    quickActions: [
      { label: "Find loads", href: "/carrier/available-loads", action: "Show available loads", variant: "primary" },
      {
        label: "Calculate profit",
        action: `Calculate profit ${formatMoney(marketMid)} for ${quote.distanceMiles} miles`,
        variant: "secondary",
      },
    ],
    suggestedQuestions: [
      `Is ${formatMoney(Math.round(marketMid * 0.9))} a good bid on this lane?`,
      `Find backhaul from ${quote.destination.split(",")[0]}`,
    ],
  };
}

export function buildBidStrategyReply(input: {
  origin: string;
  destination: string;
  proposedBid: number;
  equipment?: string;
  marketLoads?: RateLoadRow[];
}): StructuredAssistantReply {
  const equipment = parseEquipmentQuery(input.equipment || "general");
  const comparison = compareRateToMarket({
    origin: input.origin,
    destination: input.destination,
    equipment,
    userRate: input.proposedBid,
    loads: input.marketLoads,
  });
  const payout = calculateCarrierPayout(input.proposedBid);
  const profit = calculateProfit({
    rate: payout.carrierReceives,
    loadedMiles: comparison.distanceMiles,
    emptyMiles: Math.round(comparison.distanceMiles * 0.1),
  });

  let bidAdvice = "Your bid sits near market — good balance of competitiveness and margin.";
  if (comparison.verdict === "below") {
    bidAdvice =
      "Your bid is below corridor benchmarks — you may win quickly but carrier margin could be thin after fuel and empty miles.";
  } else if (comparison.verdict === "above") {
    bidAdvice =
      "Your bid is above typical market levels — you may struggle to win unless urgency or special equipment justifies the premium.";
  }

  const suggestedBidLow = Math.round(comparison.marketRate * 0.95);
  const suggestedBidHigh = Math.round(comparison.marketRate * 1.05);

  return {
    mode: "load_analyst",
    displayStyle: "card",
    assistantName: "Carrier Co-Pilot",
    modeLabel: "Bid Strategist",
    knowledgeSource: "carrier-intelligence",
    confidence: 95,
    title: `Bid review: ${comparison.origin} → ${comparison.destination}`,
    shortExplanation: `You asked about ${formatMoney(input.proposedBid)} on a ${comparison.distanceMiles} mile lane. Market mid-rate is ${formatMoney(comparison.marketRate)} (${comparison.deltaLabel}).`,
    keyPoints: [
      `Your bid RPM: £${comparison.userRpm.toFixed(2)}/mi`,
      `Market RPM: £${comparison.marketRpm.toFixed(2)}/mi`,
      `You would receive ≈ ${formatMoney(payout.carrierReceives)} after platform fee`,
      `Estimated profit after fuel: ${formatMoney(profit.grossProfit)}`,
      `Suggested competitive range: ${formatMoney(suggestedBidLow)} – ${formatMoney(suggestedBidHigh)}`,
    ],
    recommendation: `${comparison.guidance} ${bidAdvice}`,
    nextStep: "Adjust your bid within the suggested range or open the load to compare live offers.",
    metrics: [
      { label: "Your bid", value: formatMoney(input.proposedBid) },
      { label: "Market mid", value: formatMoney(comparison.marketRate) },
      { label: "Verdict", value: comparison.verdict === "at" ? "On market" : comparison.verdict, tone: comparison.verdict === "below" ? "warning" : comparison.verdict === "above" ? "neutral" : "positive" },
      { label: "Est. profit", value: formatMoney(profit.grossProfit), tone: profit.grossProfit > 0 ? "positive" : "warning" },
    ],
    quickActions: [
      { label: "Available loads", href: "/carrier/available-loads", action: "Show loads on this lane", variant: "primary" },
      { label: "My bids", href: "/carrier/my-bids", action: "Review my bids", variant: "secondary" },
    ],
    suggestedQuestions: [
      `Calculate profit ${formatMoney(input.proposedBid)} for ${comparison.distanceMiles} miles`,
      `Find backhaul from ${comparison.destination}`,
    ],
  };
}

export function buildBackhaulPlannerReply(input: {
  fromCity: string;
  equipment?: string;
  marketLoads?: RateLoadRow[];
}): StructuredAssistantReply {
  const equipment = parseEquipmentQuery(input.equipment || "general");
  const backhaul = findBackhaulLanes({
    fromCity: input.fromCity,
    equipment,
    loads: input.marketLoads,
    limit: 6,
  });

  const lanes = backhaul.lanes.slice(0, 5);
  const quickActions: CopilotQuickAction[] = [
    { label: "Find loads", href: "/carrier/available-loads", action: `Find loads from ${backhaul.fromCity}`, variant: "primary" },
  ];

  return {
    mode: "dispatcher",
    displayStyle: "card",
    assistantName: "Carrier Co-Pilot",
    modeLabel: "Route Planner",
    knowledgeSource: "carrier-intelligence",
    confidence: 94,
    title: `Backhaul ideas from ${backhaul.fromCity}`,
    shortExplanation:
      lanes.length > 0
        ? `After delivering in ${backhaul.fromCity}, these return or corridor lanes can reduce empty miles.`
        : `No strong live backhaul matches from ${backhaul.fromCity} right now — check the full load board for nearby pickups.`,
    keyPoints: lanes.map(
      (lane) =>
        `↩ ${lane.origin} → ${lane.destination}: ${formatMoney(lane.rate)} · ${lane.miles} mi · £${lane.rpm.toFixed(2)}/mi (${lane.type})`
    ),
    recommendation:
      "Plan your next pickup before you unload — chaining a backhaul can add £150–£400/day versus running empty.",
    nextStep: "Open Find Loads filtered to your delivery city.",
    metrics: lanes[0]
      ? [
          { label: "Best backhaul RPM", value: `£${lanes[0].rpm.toFixed(2)}/mi`, tone: "positive" },
          { label: "Lanes found", value: String(lanes.length) },
          { label: "Source", value: backhaul.source === "marketplace" ? "Live board" : "Baseline" },
        ]
      : [],
    quickActions,
    suggestedQuestions: [
      `Find loads near ${backhaul.fromCity}`,
      "Calculate profit £800 for 320 miles",
    ],
  };
}

export function buildCarrierIntelligenceReply(
  ctx: CopilotUserContext,
  detected: DetectedIntent,
  message: string,
  marketLoads: RateLoadRow[] = []
): StructuredAssistantReply | null {
  const intent = detected.platformIntent;

  if (intent?.type === "bid_strategy" && intent.origin && intent.destination) {
    if (intent.proposedBid && intent.proposedBid > 0) {
      return buildBidStrategyReply({
        origin: intent.origin,
        destination: intent.destination,
        proposedBid: intent.proposedBid,
        equipment: intent.equipmentType || undefined,
        marketLoads,
      });
    }
    return buildCarrierLaneRateReply({
      origin: intent.origin,
      destination: intent.destination,
      equipment: intent.equipmentType || undefined,
      marketLoads,
    });
  }

  if (intent?.type === "backhaul_search" && intent.location) {
    return buildBackhaulPlannerReply({
      fromCity: intent.location,
      equipment: intent.equipmentType || undefined,
      marketLoads,
    });
  }

  if (detected.needsProfitCalc && detected.profitInputs?.rate && detected.profitInputs?.miles) {
    return buildCarrierProfitReply({
      rate: detected.profitInputs.rate,
      loadedMiles: detected.profitInputs.miles,
      emptyMiles: detected.profitInputs.emptyMiles,
    });
  }

  if (intent?.type === "loads_search" && ctx.availableLoads.length) {
    return buildLoadMatcherReply(ctx, intent);
  }

  const routeFromMessage = message.match(/\b([A-Za-z\s]+)\s+(?:to|→|-)\s+([A-Za-z\s]+)/i);
  if (/\b(what price|what rate|how much|market rate|kitna|offer)\b/i.test(message) && routeFromMessage) {
    const origin = resolveUkCityLabel(routeFromMessage[1]) || routeFromMessage[1].trim();
    const destination = resolveUkCityLabel(routeFromMessage[2]) || routeFromMessage[2].trim();
    if (origin && destination) {
      return buildCarrierLaneRateReply({ origin, destination, marketLoads });
    }
  }

  const routeMatch = message.match(/([a-z\s]+?)\s*(?:to|->|→)\s*([a-z\s]+)/i);
  if (/\b(backhaul|return load|empty miles|after delivery)\b/i.test(message) && routeMatch) {
    const city = resolveUkCityLabel(routeMatch[2]) || routeMatch[2].trim();
    return buildBackhaulPlannerReply({ fromCity: city, marketLoads });
  }

  if (/\b(good bid|bid strategy|should i bid|kitna bid|fair bid)\b/i.test(message)) {
    const bidMatch = message.match(/£?\s*(\d+(?:\.\d+)?)/);
    if (bidMatch && routeMatch) {
      return buildBidStrategyReply({
        origin: routeMatch[1].trim(),
        destination: routeMatch[2].trim(),
        proposedBid: Number(bidMatch[1]),
        marketLoads,
      });
    }
  }

  return null;
}

export async function fetchMarketRateLoads(supabase: SupabaseClient): Promise<RateLoadRow[]> {
  const { data } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, pickup_location, delivery_location, price, equipment, status, carrier_id, created_at, pickup_date, payment_state"
    )
    .in("status", ["active", "available"])
    .limit(120);

  return (data || []).filter((row) => String(row.payment_state || "paid") === "paid") as RateLoadRow[];
}

export function buildSupplierAdviseReply(
  draft: SupplierLoadDraft,
  marketLoads: RateLoadRow[] = []
): StructuredAssistantReply {
  const advisory = analyzeSupplierLoadDraft(draft, marketLoads);
  const errorCount = advisory.issues.filter((issue) => issue.severity === "error").length;
  const warningCount = advisory.issues.filter((issue) => issue.severity === "warning").length;

  const routeLabel =
    advisory.quote.origin && advisory.quote.destination && advisory.distanceMiles > 0
      ? `${advisory.quote.origin} → ${advisory.quote.destination}`
      : null;

  return {
    mode: "load_analyst",
    displayStyle: "card",
    assistantName: "Supplier Co-Pilot",
    modeLabel: "Load Advisor",
    knowledgeSource: "supplier-load-advisor",
    confidence: 95,
    title: routeLabel ? `${routeLabel} — live market rate` : "Load posting review",
    shortExplanation: advisory.summary,
    keyPoints: [
      ...advisory.issues.slice(0, 4).map((issue) => {
        const icon = issue.severity === "error" ? "⛔" : issue.severity === "warning" ? "⚠️" : "ℹ️";
        return `${icon} ${issue.message}`;
      }),
      `Readiness score: ${advisory.readinessScore}/100`,
      `Total payable incl. commission: £${advisory.totalPayable.toFixed(2)}`,
    ].slice(0, 6),
    recommendation: advisory.recommendation,
    nextStep:
      errorCount > 0
        ? "Fix errors on Post Load, then confirm payment to go live."
        : "Apply the suggested price or adjust your max budget before posting.",
    metrics: [
      { label: "Suggested rate", value: `£${advisory.suggestedPrice}`, tone: "positive" },
      { label: "Range", value: `£${advisory.priceLow}–£${advisory.priceHigh}` },
      { label: "Distance", value: `${advisory.distanceMiles} mi` },
      { label: "Market RPM", value: `£${advisory.marketRpm.toFixed(2)}/mi` },
      {
        label: "Readiness",
        value: `${advisory.readinessScore}/100`,
        tone: advisory.readinessScore >= 80 ? "positive" : advisory.readinessScore >= 60 ? "neutral" : "warning",
      },
    ],
    quickActions: [
      { label: "Post a load", href: "/supplier/post-load", action: "Open post load form", variant: "primary" },
      { label: "My posts", href: "/supplier/my-posts", action: "View my posted loads", variant: "secondary" },
    ],
    suggestedQuestions: [
      "What price should I offer Manchester to London?",
      "Review my load before posting",
    ],
  };
}
