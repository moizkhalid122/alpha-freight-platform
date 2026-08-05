import { findCountryOption } from "@/lib/country-options";

export type MarketCurrencyCode =
  | "GBP"
  | "PKR"
  | "INR"
  | "BDT"
  | "EUR"
  | "USD"
  | "BRL"
  | "EGP"
  | "GHS"
  | "MXN"
  | "NGN"
  | "NPR"
  | "PHP"
  | "LKR"
  | "TRY"
  | "VND";

export type MarketCurrencyConfig = {
  code: MarketCurrencyCode;
  locale: string;
  symbol: string;
  /** Medium tier starts above this (exclusive upper bound for small). */
  commissionMediumMin: number;
  /** Large tier starts above this. */
  commissionLargeMin: number;
  /** Suggested post-load base price hint. */
  suggestedBasePrice: number;
};

const MARKET_BY_COUNTRY: Record<string, MarketCurrencyConfig> = {
  GB: { code: "GBP", locale: "en-GB", symbol: "£", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  PK: { code: "PKR", locale: "en-PK", symbol: "₨", commissionMediumMin: 300_000, commissionLargeMin: 1_500_000, suggestedBasePrice: 120_000 },
  IN: { code: "INR", locale: "en-IN", symbol: "₹", commissionMediumMin: 100_000, commissionLargeMin: 500_000, suggestedBasePrice: 35_000 },
  BD: { code: "BDT", locale: "en-BD", symbol: "৳", commissionMediumMin: 120_000, commissionLargeMin: 600_000, suggestedBasePrice: 40_000 },
  AT: { code: "EUR", locale: "de-AT", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  BE: { code: "EUR", locale: "nl-BE", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  FR: { code: "EUR", locale: "fr-FR", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  DE: { code: "EUR", locale: "de-DE", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  GR: { code: "EUR", locale: "el-GR", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  NL: { code: "EUR", locale: "nl-NL", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  PT: { code: "EUR", locale: "pt-PT", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  ES: { code: "EUR", locale: "es-ES", symbol: "€", commissionMediumMin: 1000, commissionLargeMin: 5000, suggestedBasePrice: 350 },
  LB: { code: "USD", locale: "en-LB", symbol: "$", commissionMediumMin: 1200, commissionLargeMin: 6000, suggestedBasePrice: 450 },
  BR: { code: "BRL", locale: "pt-BR", symbol: "R$", commissionMediumMin: 6000, commissionLargeMin: 30_000, suggestedBasePrice: 2000 },
  EG: { code: "EGP", locale: "ar-EG", symbol: "E£", commissionMediumMin: 50_000, commissionLargeMin: 250_000, suggestedBasePrice: 15_000 },
  GH: { code: "GHS", locale: "en-GH", symbol: "₵", commissionMediumMin: 15_000, commissionLargeMin: 75_000, suggestedBasePrice: 5000 },
  MX: { code: "MXN", locale: "es-MX", symbol: "$", commissionMediumMin: 20_000, commissionLargeMin: 100_000, suggestedBasePrice: 7000 },
  NG: { code: "NGN", locale: "en-NG", symbol: "₦", commissionMediumMin: 1_500_000, commissionLargeMin: 7_500_000, suggestedBasePrice: 500_000 },
  NP: { code: "NPR", locale: "ne-NP", symbol: "Rs", commissionMediumMin: 150_000, commissionLargeMin: 750_000, suggestedBasePrice: 50_000 },
  PH: { code: "PHP", locale: "en-PH", symbol: "₱", commissionMediumMin: 70_000, commissionLargeMin: 350_000, suggestedBasePrice: 25_000 },
  LK: { code: "LKR", locale: "si-LK", symbol: "Rs", commissionMediumMin: 300_000, commissionLargeMin: 1_500_000, suggestedBasePrice: 100_000 },
  TR: { code: "TRY", locale: "tr-TR", symbol: "₺", commissionMediumMin: 35_000, commissionLargeMin: 175_000, suggestedBasePrice: 12_000 },
  VN: { code: "VND", locale: "vi-VN", symbol: "₫", commissionMediumMin: 30_000_000, commissionLargeMin: 150_000_000, suggestedBasePrice: 10_000_000 },
};

const DEFAULT_MARKET = MARKET_BY_COUNTRY.GB;

export function getMarketForCountry(countryCode?: string | null): MarketCurrencyConfig {
  const code = String(countryCode || "GB").trim().toUpperCase();
  return MARKET_BY_COUNTRY[code] ?? DEFAULT_MARKET;
}

export function getCurrencyForCountry(countryCode?: string | null): MarketCurrencyCode {
  return getMarketForCountry(countryCode).code;
}

export function getCountryName(countryCode?: string | null): string {
  const option = findCountryOption(countryCode);
  if (!option) return countryCode || "United Kingdom";
  return option.label.split(" (")[0]?.trim() || option.label;
}

function resolveMarketConfig(
  currencyCode?: MarketCurrencyCode | string | null,
  countryCode?: string | null
): MarketCurrencyConfig {
  if (currencyCode && typeof currencyCode === "string") {
    return (
      Object.values(MARKET_BY_COUNTRY).find((item) => item.code === currencyCode) ??
      getMarketForCountry(countryCode)
    );
  }
  return getMarketForCountry(countryCode);
}

export function formatMarketMoney(
  amount: number | string | null | undefined,
  currencyCode?: MarketCurrencyCode | string | null,
  countryCode?: string | null
): string {
  const market = resolveMarketConfig(currencyCode, countryCode);
  const value = Number(amount) || 0;
  const fractionDigits = market.code === "VND" || market.code === "PKR" ? 0 : 2;

  try {
    return new Intl.NumberFormat(market.locale, {
      style: "currency",
      currency: market.code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return `${market.symbol}${value.toLocaleString("en-GB")}`;
  }
}

export function formatMarketMoneyCompact(
  amount: number | string | null | undefined,
  currencyCode?: MarketCurrencyCode | string | null,
  countryCode?: string | null
): string {
  const market = resolveMarketConfig(currencyCode, countryCode);
  const value = Number(amount) || 0;

  try {
    return new Intl.NumberFormat(market.locale, {
      style: "currency",
      currency: market.code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    if (Math.abs(value) >= 1000) {
      return `${market.symbol}${(value / 1000).toFixed(1)}k`;
    }
    return formatMarketMoney(value, market.code, countryCode);
  }
}

export function getCommissionThresholds(currencyCode?: MarketCurrencyCode | string | null) {
  const market =
    Object.values(MARKET_BY_COUNTRY).find((item) => item.code === currencyCode) ?? DEFAULT_MARKET;
  return {
    mediumMin: market.commissionMediumMin,
    largeMin: market.commissionLargeMin,
  };
}
