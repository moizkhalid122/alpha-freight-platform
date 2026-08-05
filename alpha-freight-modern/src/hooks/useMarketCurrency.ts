"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  calculateCarrierPayout,
  calculateSupplierTotal,
  getCarrierDisplayPrice,
  getLoadBudget,
} from "@/lib/load-commission";
import {
  formatMarketMoney,
  formatMarketMoneyCompact,
  getCountryName,
  getCurrencyForCountry,
  getMarketForCountry,
  type MarketCurrencyCode,
} from "@/lib/market-currency";
import { parseLoadMarketMeta } from "@/lib/load-market-meta";
import { readCarrierExtras, readSupplierExtras, resolveCarrierExtras, resolveSupplierExtras } from "@/lib/profile-extras";

type MarketplaceRole = "carrier" | "supplier";

export function useMarketCurrency(role: MarketplaceRole) {
  const [countryCode, setCountryCode] = useState("GB");
  const [currency, setCurrency] = useState<MarketCurrencyCode>("GBP");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_extras")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      const extras =
        role === "carrier"
          ? resolveCarrierExtras(user.id, profile?.profile_extras)
          : resolveSupplierExtras(user.id, profile?.profile_extras);

      const nextCountry = extras.countryCode || "GB";
      setCountryCode(nextCountry);
      setCurrency(
        (extras.currency as MarketCurrencyCode | undefined) || getCurrencyForCountry(nextCountry)
      );
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [role]);

  const market = useMemo(() => getMarketForCountry(countryCode), [countryCode]);

  const formatMoney = (amount: number | string | null | undefined) =>
    formatMarketMoney(amount, currency, countryCode);

  const formatMoneyCompact = (amount: number | string | null | undefined) =>
    formatMarketMoneyCompact(amount, currency, countryCode);

  const formatLoadMoney = (load: {
    price?: number | string | null;
    max_budget?: number | string | null;
    notes?: string | null;
  }) => {
    const meta = parseLoadMarketMeta(load.notes);
    const loadCurrency = meta?.currency ?? currency;
    const value =
      role === "carrier"
        ? getCarrierDisplayPrice(load, loadCurrency)
        : getLoadBudget(load);
    return formatMarketMoney(value, loadCurrency, meta?.countryCode ?? countryCode);
  };

  const supplierTotal = (loadValue: number) =>
    calculateSupplierTotal(loadValue, currency);

  const carrierPayout = (loadValue: number) =>
    calculateCarrierPayout(loadValue, currency);

  return {
    loading,
    countryCode,
    countryName: getCountryName(countryCode),
    currency,
    market,
    formatMoney,
    formatMoneyCompact,
    formatLoadMoney,
    supplierTotal,
    carrierPayout,
    getCarrierPrice: (load: Parameters<typeof getCarrierDisplayPrice>[0]) =>
      getCarrierDisplayPrice(load, currency),
    getLoadBudget: (load: Parameters<typeof getLoadBudget>[0]) => getLoadBudget(load),
  };
}

export function readUserCountryFromCache(userId: string, role: MarketplaceRole) {
  const extras = role === "carrier" ? readCarrierExtras(userId) : readSupplierExtras(userId);
  return extras.countryCode || "GB";
}
