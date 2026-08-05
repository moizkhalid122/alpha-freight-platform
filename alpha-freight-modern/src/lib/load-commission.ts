import { getCommissionThresholds, type MarketCurrencyCode } from "@/lib/market-currency";
import { parseLoadMarketMeta } from "@/lib/load-market-meta";

export type LoadCommissionTier = "small" | "medium" | "large";

export const LOAD_COMMISSION_TIER_RATES: Record<LoadCommissionTier, number> = {
  small: 0.05,
  medium: 0.04,
  large: 0.03,
};

export const LOAD_COMMISSION_TIER_LABELS: Record<LoadCommissionTier, string> = {
  small: "Small (5%)",
  medium: "Medium (4%)",
  large: "Large (3%)",
};

export function getLoadCommissionRate(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): number {
  const value = Math.max(0, Number(loadValue) || 0);
  const { mediumMin, largeMin } = getCommissionThresholds(currency);
  if (value > largeMin) return LOAD_COMMISSION_TIER_RATES.large;
  if (value > mediumMin) return LOAD_COMMISSION_TIER_RATES.medium;
  return LOAD_COMMISSION_TIER_RATES.small;
}

export function getLoadCommissionTier(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): LoadCommissionTier {
  const value = Math.max(0, Number(loadValue) || 0);
  const { mediumMin, largeMin } = getCommissionThresholds(currency);
  if (value > largeMin) return "large";
  if (value > mediumMin) return "medium";
  return "small";
}

export type LoadCommissionBreakdown = {
  loadValue: number;
  commissionRate: number;
  commissionRatePercent: number;
  commissionAmount: number;
  tier: LoadCommissionTier;
  tierLabel: string;
  currency: MarketCurrencyCode | string;
};

export type SupplierCommissionResult = LoadCommissionBreakdown & {
  totalPayable: number;
};

export type CarrierCommissionResult = LoadCommissionBreakdown & {
  carrierReceives: number;
};

export function calculateLoadCommission(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): LoadCommissionBreakdown {
  const load = Math.max(0, Number(loadValue) || 0);
  const commissionRate = getLoadCommissionRate(load, currency);
  const tier = getLoadCommissionTier(load, currency);
  const commissionAmount = load * commissionRate;

  return {
    loadValue: load,
    commissionRate,
    commissionRatePercent: commissionRate * 100,
    commissionAmount,
    tier,
    tierLabel: LOAD_COMMISSION_TIER_LABELS[tier],
    currency,
  };
}

/** Supplier pays load budget plus platform commission. */
export function calculateSupplierTotal(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): SupplierCommissionResult {
  const breakdown = calculateLoadCommission(loadValue, currency);
  return {
    ...breakdown,
    totalPayable: breakdown.loadValue + breakdown.commissionAmount,
  };
}

/** Carrier sees and receives load budget minus platform commission. */
export function calculateCarrierPayout(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): CarrierCommissionResult {
  const breakdown = calculateLoadCommission(loadValue, currency);
  return {
    ...breakdown,
    carrierReceives: breakdown.loadValue - breakdown.commissionAmount,
  };
}

export function getLoadBudget(load: {
  price?: number | string | null;
  max_budget?: number | string | null;
}): number {
  return Number(load.price || load.max_budget || 0);
}

export function getCarrierDisplayPrice(
  load: {
    price?: number | string | null;
    max_budget?: number | string | null;
    notes?: string | null;
  },
  currency?: MarketCurrencyCode | string
): number {
  const meta = parseLoadMarketMeta(load.notes);
  const resolvedCurrency = currency ?? meta?.currency ?? "GBP";
  return calculateCarrierPayout(getLoadBudget(load), resolvedCurrency).carrierReceives;
}

export function getSupplierTotalPayable(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): number {
  return calculateSupplierTotal(loadValue, currency).totalPayable;
}

export function formatLoadCommissionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatLoadCommissionGbp(value: number): string {
  return `£${value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
