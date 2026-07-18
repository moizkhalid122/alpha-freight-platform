"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";

import type { CarrierMarginResult } from "@/lib/freight-calculators";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

export default function CarrierMarginForm() {
  const [bidAmount, setBidAmount] = useState("420");
  const [loadedMiles, setLoadedMiles] = useState("200");
  const [emptyMiles, setEmptyMiles] = useState("40");
  const [fuelPrice, setFuelPrice] = useState("1.48");
  const [otherCosts, setOtherCosts] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarrierMarginResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/public/carrier-margin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidAmount: Number(bidAmount),
          loadedMiles: Number(loadedMiles),
          emptyMiles: Number(emptyMiles),
          fuelPricePerLitre: Number(fuelPrice),
          otherCosts: Number(otherCosts),
        }),
      });
      const payload = (await response.json()) as { result?: CarrierMarginResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to calculate margin.");
      setResult(payload.result ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate margin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Carrier margin calculator</h2>
            <p className="text-sm text-slate-500">Bid − fuel − empty miles = estimated profit.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="margin-bid" className={toolLabelClass}>
                Your bid (GBP) <span className="text-red-500">*</span>
              </label>
              <input id="margin-bid" required type="number" min={1} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className={toolInputClass} />
            </div>
            <div>
              <label htmlFor="margin-loaded" className={toolLabelClass}>
                Loaded miles <span className="text-red-500">*</span>
              </label>
              <input id="margin-loaded" required type="number" min={1} value={loadedMiles} onChange={(e) => setLoadedMiles(e.target.value)} className={toolInputClass} />
            </div>
            <div>
              <label htmlFor="margin-empty" className={toolLabelClass}>
                Empty miles
              </label>
              <input id="margin-empty" type="number" min={0} value={emptyMiles} onChange={(e) => setEmptyMiles(e.target.value)} className={toolInputClass} />
            </div>
            <div>
              <label htmlFor="margin-fuel" className={toolLabelClass}>
                Diesel (£/litre)
              </label>
              <input id="margin-fuel" type="number" min={0.1} step={0.01} value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} className={toolInputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="margin-other" className={toolLabelClass}>
                Other costs (GBP)
              </label>
              <input id="margin-other" type="number" min={0} value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} className={toolInputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 hover:bg-[#d4ff4d] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calculate margin
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Estimated profit</p>
        {result ? (
          <div className="mt-5 space-y-5">
            <div className={`rounded-2xl border px-5 py-4 ${result.grossProfit >= 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Gross profit</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">£{result.grossProfit.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-600">{result.marginPct}% margin · £{result.profitPerLoadedMile}/loaded mi</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Fuel cost", value: `£${result.fuelCost}` },
                { label: "Total miles", value: `${result.totalMiles} mi` },
                { label: "Other costs", value: `£${result.otherCosts}` },
                { label: "Bid amount", value: `£${result.bidAmount}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                  <p className="mt-1 font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-sm leading-6 text-slate-600">{result.payoutNote}</p>
            <Link href="/7-day-payouts" className="text-sm font-semibold text-slate-800 hover:text-slate-900">
              Learn about 7-day payouts →
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Model your bid against fuel and empty miles before accepting a lane on Alpha Freight.
          </p>
        )}
      </section>
    </div>
  );
}
