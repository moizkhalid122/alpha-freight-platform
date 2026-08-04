import type { CopilotMetric } from "@/lib/chat-types";

const DEFAULT_LITRES_PER_MILE = 0.58;
const DEFAULT_FUEL_GBP = 1.48;

export type ProfitCalcInput = {
  rate: number;
  loadedMiles: number;
  emptyMiles?: number;
  otherCosts?: number;
  fuelPricePerLitre?: number;
  litresPerMile?: number;
};

export type ProfitCalcResult = {
  metrics: CopilotMetric[];
  summary: string;
  recommendation: string;
  grossProfit: number;
  rpm: number;
  marginPct: number;
};

export function calculateProfit(input: ProfitCalcInput): ProfitCalcResult {
  const rate = Math.max(0, input.rate);
  const loadedMiles = Math.max(1, input.loadedMiles);
  const emptyMiles = Math.max(0, input.emptyMiles || 0);
  const otherCosts = Math.max(0, input.otherCosts || 0);
  const fuelPrice = input.fuelPricePerLitre ?? DEFAULT_FUEL_GBP;
  const litresPerMile = input.litresPerMile ?? DEFAULT_LITRES_PER_MILE;
  const totalMiles = loadedMiles + emptyMiles;
  const fuelCost = totalMiles * litresPerMile * fuelPrice;
  const grossProfit = rate - fuelCost - otherCosts;
  const rpm = rate / loadedMiles;
  const marginPct = rate > 0 ? (grossProfit / rate) * 100 : 0;

  const metrics: CopilotMetric[] = [
    { label: "Rate", value: `£${rate.toFixed(2)}`, icon: "💰" },
    { label: "Loaded miles", value: loadedMiles.toFixed(1), icon: "📍" },
    { label: "Fuel cost", value: `£${fuelCost.toFixed(2)}`, icon: "⛽", tone: "warning" },
    { label: "RPM", value: `£${rpm.toFixed(2)}/mi`, icon: "📈", tone: rpm >= 2 ? "positive" : "neutral" },
    {
      label: "Est. profit",
      value: `£${grossProfit.toFixed(2)}`,
      icon: "✅",
      tone: grossProfit > 0 ? "positive" : "warning",
    },
    { label: "Margin", value: `${marginPct.toFixed(1)}%`, tone: marginPct >= 20 ? "positive" : "neutral" },
  ];

  let recommendation = "";
  if (rpm >= 2.5 && grossProfit > 100) {
    recommendation = "Strong load — RPM and profit look healthy. Consider booking if route fits your schedule.";
  } else if (rpm >= 1.8) {
    recommendation = "Acceptable RPM — verify deadhead and loading times before committing.";
  } else {
    recommendation = "Low RPM — negotiate higher rate or look for better-paying loads on the load board.";
  }

  const summary = [
    `Rate £${rate.toFixed(2)} over ${loadedMiles.toFixed(0)} loaded miles gives RPM of £${rpm.toFixed(2)}/mi.`,
    `Estimated fuel cost: £${fuelCost.toFixed(2)} (${totalMiles.toFixed(0)} total miles incl. ${emptyMiles.toFixed(0)} empty).`,
    `Estimated gross profit after fuel${otherCosts ? " and other costs" : ""}: £${grossProfit.toFixed(2)} (${marginPct.toFixed(1)}% margin).`,
  ].join(" ");

  return { metrics, summary, recommendation, grossProfit, rpm, marginPct };
}

export function extractProfitFromMessage(message: string): Partial<ProfitCalcInput> | null {
  const lower = message.toLowerCase();
  if (!/\b(profit|rpm|margin|calculate|fuel)\b/i.test(lower)) return null;
  const rateMatch = message.match(/£?\s*(\d+(?:\.\d+)?)/);
  const milesMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:mile|miles|mi\b)/i);
  if (!rateMatch && !milesMatch) return null;
  return {
    rate: rateMatch ? Number(rateMatch[1]) : undefined,
    loadedMiles: milesMatch ? Number(milesMatch[1]) : undefined,
  };
}
