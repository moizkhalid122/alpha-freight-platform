import {
  calculateFreightQuote,
  calculateUkDistance,
  compareRateToMarket,
  isValidUkLane,
  normalizeLocation,
  parseEquipmentQuery,
  resolveUkCityLabel,
  type EquipmentType,
  type FreightQuoteResult,
  type RateLoadRow,
} from "@/lib/freight-tools";
import { calculateSupplierTotal } from "@/lib/load-commission";
import { buildUkRouteQuery, isValidUkPostcode, normalizeUkPostcode } from "@/lib/uk-postcode";

export type SupplierLoadDraft = {
  title?: string;
  origin?: string;
  destination?: string;
  pickup_postcode?: string;
  delivery_postcode?: string;
  pickup_date?: string;
  pickup_time?: string;
  delivery_date?: string;
  delivery_time?: string;
  cargo_type?: string;
  cargo_description?: string;
  quantity?: string;
  packaging_type?: string;
  pallet_count?: string;
  dimension_length?: string;
  dimension_width?: string;
  dimension_height?: string;
  special_handling?: string[];
  declared_cargo_value?: string | number;
  weight?: string | number;
  volume?: string | number;
  equipment?: string;
  urgency?: string;
  load_price?: string | number;
  /** @deprecated use load_price */
  min_budget?: string | number;
  /** @deprecated use load_price */
  max_budget?: string | number;
  refrigerated?: boolean;
  tail_lift?: boolean;
  adr_certified?: boolean;
  forklift_required?: boolean;
  crane_required?: boolean;
  pallet_exchange_required?: boolean;
  other_vehicle_requirements?: string;
  description?: string;
};

export type LoadAdvisoryIssue = {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
};

export type SupplierLoadAdvisory = {
  suggestedPrice: number;
  priceLow: number;
  priceHigh: number;
  distanceMiles: number;
  marketRpm: number;
  readinessScore: number;
  issues: LoadAdvisoryIssue[];
  summary: string;
  recommendation: string;
  quote: FreightQuoteResult;
  totalPayable: number;
  commissionAmount: number;
};

function parseWeightKg(value?: string | number) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return 0;
  const num = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (raw.includes("t") && !raw.includes("kg")) return num * 1000;
  return num;
}

function mapSupplierEquipment(value?: string): EquipmentType {
  const normalized = String(value || "general").toLowerCase();
  if (normalized.includes("reef") || normalized.includes("fridge") || normalized.includes("chiller")) {
    return "refrigerated";
  }
  if (normalized.includes("flat")) return "flatbed";
  if (normalized.includes("curtain")) return "curtain";
  return "general";
}

function buildDateTime(date?: string, time?: string) {
  if (!date) return null;
  const value = time ? `${date}T${time}` : date;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGbp(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function analyzeSupplierLoadDraft(
  draft: SupplierLoadDraft,
  marketLoads: RateLoadRow[] = [],
  currency = "GBP"
): SupplierLoadAdvisory {
  const issues: LoadAdvisoryIssue[] = [];
  const originInput = buildUkRouteQuery(String(draft.origin || ""), draft.pickup_postcode);
  const destinationInput = buildUkRouteQuery(String(draft.destination || ""), draft.delivery_postcode);
  const origin = normalizeLocation(originInput);
  const destination = normalizeLocation(destinationInput);
  const equipment = mapSupplierEquipment(draft.equipment);
  const weightKg = parseWeightKg(draft.weight);
  const minBudget = Number(draft.load_price || draft.max_budget || draft.min_budget || 0);
  const maxBudget = Number(draft.load_price || draft.max_budget || draft.min_budget || 0);
  const originCity = resolveUkCityLabel(origin);
  const destinationCity = resolveUkCityLabel(destination);

  if (!origin) issues.push({ severity: "error", field: "origin", message: "Pickup location is required." });
  if (!destination) issues.push({ severity: "error", field: "destination", message: "Delivery location is required." });

  if (draft.pickup_postcode && !isValidUkPostcode(draft.pickup_postcode)) {
    issues.push({
      severity: "warning",
      field: "pickup_postcode",
      message: "Pickup postcode format looks invalid — use a UK format like M1 1AE or SW1A 1AA.",
    });
  }

  if (draft.delivery_postcode && !isValidUkPostcode(draft.delivery_postcode)) {
    issues.push({
      severity: "warning",
      field: "delivery_postcode",
      message: "Delivery postcode format looks invalid — use a UK format like M1 1AE or B1 1AA.",
    });
  }

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    issues.push({
      severity: "error",
      field: "route",
      message: "Origin and destination cannot be the same.",
    });
  }

  if (origin && destination && !isValidUkLane(origin, destination)) {
    issues.push({
      severity: "warning",
      field: "route",
      message: "Route may be outside standard UK lanes — double-check city names or postcodes.",
    });
  }

  if (origin && !originCity) {
    issues.push({
      severity: "warning",
      field: "origin",
      message: "Pickup city not recognised — use a major UK city or clear postcode for better carrier matching.",
    });
  }

  if (destination && !destinationCity) {
    issues.push({
      severity: "warning",
      field: "destination",
      message: "Delivery city not recognised — use a major UK city or clear postcode.",
    });
  }

  const pickupAt = buildDateTime(draft.pickup_date, draft.pickup_time);
  const deliveryAt = buildDateTime(draft.delivery_date, draft.delivery_time);
  if (pickupAt && deliveryAt && deliveryAt.getTime() < pickupAt.getTime()) {
    issues.push({
      severity: "error",
      field: "delivery_date",
      message: "Delivery cannot be scheduled before pickup.",
    });
  }

  if (minBudget > 0 && maxBudget > 0 && minBudget > maxBudget && !draft.load_price) {
    issues.push({
      severity: "error",
      field: "load_price",
      message: "Load price cannot be lower than min budget.",
    });
  }

  if (!String(draft.cargo_description || draft.description || "").trim() && draft.cargo_type) {
    issues.push({
      severity: "warning",
      field: "cargo_description",
      message: "Add a cargo description so carriers know exactly what they are moving.",
    });
  }

  if (!String(draft.quantity || "").trim() && draft.cargo_type) {
    issues.push({
      severity: "warning",
      field: "quantity",
      message: "Enter quantity (e.g. 20 pallets) for accurate vehicle matching.",
    });
  }

  if (weightKg > 26000) {
    issues.push({
      severity: "warning",
      field: "weight",
      message: "Weight exceeds typical artic payload — confirm equipment and carrier compliance.",
    });
  }

  if (weightKg > 3500 && String(draft.equipment || "").toLowerCase().includes("van")) {
    issues.push({
      severity: "error",
      field: "equipment",
      message: "Weight looks too heavy for a van/Luton — consider artic or 18t rigid.",
    });
  }

  if (draft.refrigerated && equipment !== "refrigerated") {
    issues.push({
      severity: "warning",
      field: "equipment",
      message: "Refrigeration is selected but equipment is not refrigerated — switch to refrigerated/chiller.",
    });
  }

  if (
    equipment === "refrigerated" &&
    !draft.refrigerated &&
    !String(draft.cargo_type || "").toLowerCase().match(/food|chilled|frozen|pharma|temp/)
  ) {
    issues.push({
      severity: "info",
      field: "cargo_type",
      message: "Refrigerated equipment selected — mention temperature requirements in cargo notes.",
    });
  }

  if (
    draft.adr_certified &&
    !String(draft.cargo_type || draft.description || "").toLowerCase().match(/adr|haz|danger|chemical/)
  ) {
    issues.push({
      severity: "info",
      field: "adr_certified",
      message: "ADR certified is enabled — ensure cargo details clearly state hazardous goods class.",
    });
  }

  const quote =
    origin && destination
      ? calculateFreightQuote({
          origin,
          destination,
          equipment,
          weightKg: weightKg || undefined,
          loads: marketLoads,
        })
      : {
          origin: originCity || origin || "TBC",
          destination: destinationCity || destination || "TBC",
          equipment,
          distanceMiles: 0,
          ratePerMile: 0,
          estimateLow: 0,
          estimateHigh: 0,
          estimateMid: 0,
          fuelNote: "",
          source: "model" as const,
          matchedLane: null,
        };

  if (draft.urgency === "same-day") {
    quote.estimateMid = Math.round(quote.estimateMid * 1.2);
    quote.estimateLow = Math.round(quote.estimateLow * 1.15);
    quote.estimateHigh = Math.round(quote.estimateHigh * 1.25);
  } else if (draft.urgency === "urgent") {
    quote.estimateMid = Math.round(quote.estimateMid * 1.1);
    quote.estimateLow = Math.round(quote.estimateLow * 1.08);
    quote.estimateHigh = Math.round(quote.estimateHigh * 1.12);
  }

  const userBudget = maxBudget > 0 ? maxBudget : minBudget;
  if (userBudget > 0 && origin && destination) {
    const comparison = compareRateToMarket({
      origin,
      destination,
      equipment,
      userRate: userBudget,
      loads: marketLoads,
    });

    if (comparison.verdict === "below") {
      issues.push({
        severity: "warning",
        field: "load_price",
        message: `Load price looks ${Math.abs(comparison.deltaPct).toFixed(0)}% below market for this lane — carriers may not bid.`,
      });
    } else if (comparison.verdict === "above") {
      issues.push({
        severity: "info",
        field: "load_price",
        message: "Load price is above corridor benchmark — good for fast carrier acceptance.",
      });
    }
  } else if (origin && destination) {
    issues.push({
      severity: "warning",
      field: "load_price",
      message: "Set your load price so carriers know the exact transport amount.",
    });
  }

  const distance =
    quote.distanceMiles > 0
      ? quote.distanceMiles
      : origin && destination
        ? calculateUkDistance(origin, destination).distanceMiles
        : 0;

  const supplierTotal = calculateSupplierTotal(quote.estimateMid, currency);

  let readinessScore = 100;
  for (const issue of issues) {
    if (issue.severity === "error") readinessScore -= 25;
    if (issue.severity === "warning") readinessScore -= 10;
    if (issue.severity === "info") readinessScore -= 3;
  }
  readinessScore = Math.max(0, Math.min(100, readinessScore));

  const summary =
    origin && destination
      ? `${quote.origin} → ${quote.destination} · ${distance} mi · Suggested ${formatGbp(quote.estimateMid)} (${formatGbp(quote.estimateLow)}–${formatGbp(quote.estimateHigh)})`
      : "Complete route details to get a market price suggestion.";

  const recommendation =
    issues.some((issue) => issue.severity === "error")
      ? "Fix the highlighted errors before posting — carriers need accurate route, timing, and load price."
      : issues.some((issue) => issue.severity === "warning")
        ? "Review warnings — adjusting load price or equipment will improve bid quality."
        : "Load details look strong — you can post with the suggested rate or fine-tune your load price.";

  return {
    suggestedPrice: quote.estimateMid,
    priceLow: quote.estimateLow,
    priceHigh: quote.estimateHigh,
    distanceMiles: distance,
    marketRpm: quote.ratePerMile,
    readinessScore,
    issues,
    summary,
    recommendation,
    quote,
    totalPayable: supplierTotal.totalPayable,
    commissionAmount: supplierTotal.commissionAmount,
  };
}
