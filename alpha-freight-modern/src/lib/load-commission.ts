import type { MarketCurrencyCode } from "@/lib/market-currency";
import { parseLoadMarketMeta } from "@/lib/load-market-meta";
import { parseLoadFormMeta } from "@/lib/load-form-meta";

/** Fixed supplier-side platform fee (added on top of load price). */
export const SUPPLIER_COMMISSION_RATE = 0.04;

/** Fixed carrier-side platform fee (deducted from displayed load price). */
export const CARRIER_COMMISSION_RATE = 0.03;

export type LoadCommissionBreakdown = {
  loadValue: number;
  commissionRate: number;
  commissionRatePercent: number;
  commissionAmount: number;
  currency: MarketCurrencyCode | string;
};

export type SupplierCommissionResult = LoadCommissionBreakdown & {
  totalPayable: number;
};

export type CarrierCommissionResult = LoadCommissionBreakdown & {
  carrierReceives: number;
};

export function getSupplierCommissionRate(): number {
  return SUPPLIER_COMMISSION_RATE;
}

export function getCarrierCommissionRate(): number {
  return CARRIER_COMMISSION_RATE;
}

function buildCommissionBreakdown(
  loadValue: number,
  commissionRate: number,
  currency: MarketCurrencyCode | string = "GBP"
): LoadCommissionBreakdown {
  const load = Math.max(0, Number(loadValue) || 0);

  return {
    loadValue: load,
    commissionRate,
    commissionRatePercent: commissionRate * 100,
    commissionAmount: load * commissionRate,
    currency,
  };
}

/** Supplier pays load price plus a fixed 4% platform commission. */
export function calculateSupplierTotal(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): SupplierCommissionResult {
  const breakdown = buildCommissionBreakdown(loadValue, SUPPLIER_COMMISSION_RATE, currency);
  return {
    ...breakdown,
    totalPayable: breakdown.loadValue + breakdown.commissionAmount,
  };
}

/** Carrier sees and receives load price minus a fixed 3% platform commission. */
export function calculateCarrierPayout(
  loadValue: number,
  currency: MarketCurrencyCode | string = "GBP"
): CarrierCommissionResult {
  const breakdown = buildCommissionBreakdown(loadValue, CARRIER_COMMISSION_RATE, currency);
  return {
    ...breakdown,
    carrierReceives: breakdown.loadValue - breakdown.commissionAmount,
  };
}

export function getLoadBudget(load: {
  price?: number | string | null;
  max_budget?: number | string | null;
  load_price?: number | string | null;
  notes?: string | null;
}): number {
  const fromNotes = load.notes ? parseLoadFormMeta(load.notes)?.load_price : undefined;
  return Number(load.price || load.load_price || fromNotes || load.max_budget || 0);
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
