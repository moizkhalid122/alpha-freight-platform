"use client";

import { useState, type FormEvent } from "react";
import { Fuel, Loader2 } from "lucide-react";

import type { FuelSurchargeResult } from "@/lib/freight-calculators";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

export default function FuelSurchargeForm() {
  const [baseRate, setBaseRate] = useState("400");
  const [fscPercent, setFscPercent] = useState("12");
  const [miles, setMiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FuelSurchargeResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/public/fuel-surcharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRate: Number(baseRate),
          fscPercent: Number(fscPercent),
          miles: miles ? Number(miles) : undefined,
        }),
      });
      const payload = (await response.json()) as { result?: FuelSurchargeResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to calculate surcharge.");
      setResult(payload.result ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate surcharge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Fuel surcharge calculator</h2>
            <p className="text-sm text-slate-500">Base linehaul rate + FSC % for suppliers and carriers.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fsc-base" className={toolLabelClass}>
                Base rate (GBP) <span className="text-red-500">*</span>
              </label>
              <input id="fsc-base" required type="number" min={1} value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className={toolInputClass} />
            </div>
            <div>
              <label htmlFor="fsc-percent" className={toolLabelClass}>
                Fuel surcharge % <span className="text-red-500">*</span>
              </label>
              <input id="fsc-percent" required type="number" min={0} step={0.1} value={fscPercent} onChange={(e) => setFscPercent(e.target.value)} className={toolInputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="fsc-miles" className={toolLabelClass}>
                Miles (optional)
              </label>
              <input id="fsc-miles" type="number" min={1} value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="For £/mile total" className={toolInputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 hover:bg-[#d4ff4d] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calculate total
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Total rate</p>
        {result ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">All-in rate</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">£{result.totalRate.toLocaleString()}</p>
              {result.totalRpm ? <p className="mt-1 text-sm text-slate-500">£{result.totalRpm}/mile over {result.miles} mi</p> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Base</p>
                <p className="mt-1 font-bold text-slate-900">£{result.baseRate}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">FSC ({result.fscPercent}%)</p>
                <p className="mt-1 font-bold text-slate-900">£{result.fuelSurcharge}</p>
              </div>
            </div>

            <p className="text-sm text-slate-500">{result.formulaNote}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Apply a fuel surcharge percentage to your base haulage rate — common for UK supplier contracts and carrier bids.
          </p>
        )}
      </section>
    </div>
  );
}
