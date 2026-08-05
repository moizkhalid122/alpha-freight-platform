import type { MarketCurrencyCode } from "@/lib/market-currency";

const MARKET_META_REGEX = /\[\[af-market:([A-Z]{2})\|([A-Z]{3})\]\]\s*/i;

export type LoadMarketMeta = {
  countryCode: string;
  currency: MarketCurrencyCode;
};

export function encodeLoadMarketMeta(countryCode: string, currency: string): string {
  return `[[af-market:${countryCode.toUpperCase()}|${currency.toUpperCase()}]] `;
}

export function parseLoadMarketMeta(notes?: string | null): LoadMarketMeta | null {
  if (!notes) return null;
  const match = notes.match(MARKET_META_REGEX);
  if (!match) return null;
  return {
    countryCode: match[1].toUpperCase(),
    currency: match[2].toUpperCase() as MarketCurrencyCode,
  };
}

export function stripLoadMarketMeta(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(MARKET_META_REGEX, "").trim();
}

export function mergeLoadNotesWithMarketMeta(
  notes: string | undefined | null,
  countryCode: string,
  currency: string
): string {
  const cleaned = stripLoadMarketMeta(notes);
  const prefix = encodeLoadMarketMeta(countryCode, currency);
  return `${prefix}${cleaned}`.trim();
}
