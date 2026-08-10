"use client";

import { Info } from "lucide-react";
import { calculateSupplierTotal } from "@/lib/load-commission";
import { formatMarketMoney } from "@/lib/market-currency";
import type { MarketCurrencyCode } from "@/lib/market-currency";
import { formatLoadCommissionRate } from "@/lib/load-commission";

type LoadCommissionBreakdownProps = {
  loadValue: number;
  currency?: MarketCurrencyCode | string;
  countryCode?: string | null;
  variant?: "default" | "compact";
  className?: string;
};

export default function LoadCommissionBreakdown({
  loadValue,
  currency = "GBP",
  countryCode,
  variant = "default",
  className = "",
}: LoadCommissionBreakdownProps) {
  const breakdown = calculateSupplierTotal(loadValue, currency);
  const formatMoney = (value: number) => formatMarketMoney(value, currency, countryCode);

  if (breakdown.loadValue <= 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className={`rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[12px] text-slate-700 ${className}`}>
        <span className="font-semibold text-slate-900">{formatMoney(breakdown.totalPayable)}</span>
        {" "}total ({formatMoney(breakdown.loadValue)} load +{" "}
        {formatMoney(breakdown.commissionAmount)} commission at{" "}
        {formatLoadCommissionRate(breakdown.commissionRate)})
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <p className="text-[13px] font-bold text-slate-900">Platform commission</p>
          <p className="mt-0.5 text-[12px] text-slate-600">
            Fixed 4% Alpha Freight service fee on your load price — added to your total at checkout.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-[12px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Load price</span>
          <span className="font-semibold text-slate-900">{formatMoney(breakdown.loadValue)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">
            Alpha Freight service fee ({formatLoadCommissionRate(breakdown.commissionRate)})
          </span>
          <span className="font-semibold text-slate-900">{formatMoney(breakdown.commissionAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-blue-100 pt-2">
          <span className="font-semibold text-slate-900">Total to pay</span>
          <span className="text-[15px] font-bold text-slate-900">{formatMoney(breakdown.totalPayable)}</span>
        </div>
      </div>
    </div>
  );
}
