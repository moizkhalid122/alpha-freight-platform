"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gauge, Loader2 } from "lucide-react";

import {
  EQUIPMENT_OPTIONS,
  UK_CITY_SUGGESTIONS,
  type RateComparisonResult,
} from "@/lib/freight-tools";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

const verdictStyles = {
  below: "border-amber-200 bg-amber-50 text-amber-900",
  at: "border-emerald-200 bg-emerald-50 text-emerald-900",
  above: "border-rose-200 bg-rose-50 text-rose-900",
};

export default function RateCheckForm() {
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("general");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RateComparisonResult | null>(null);

  useEffect(() => {
    const originParam = searchParams.get("origin");
    const destinationParam = searchParams.get("destination");
    if (originParam) setOrigin(originParam);
    if (destinationParam) setDestination(destinationParam);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        equipment,
        rate,
      });
      const response = await fetch(`/api/public/rate-check?${params.toString()}`);
      const payload = (await response.json()) as { comparison?: RateComparisonResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to compare rate.");
      setComparison(payload.comparison ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to compare rate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Rate vs market</h2>
            <p className="text-sm text-slate-500">See if your load rate matches UK corridor benchmarks.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="rate-origin" className={toolLabelClass}>
                From <span className="text-red-500">*</span>
              </label>
              <input
                id="rate-origin"
                required
                list="uk-cities-rate"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="London"
                className={toolInputClass}
              />
            </div>
            <div>
              <label htmlFor="rate-destination" className={toolLabelClass}>
                To <span className="text-red-500">*</span>
              </label>
              <input
                id="rate-destination"
                required
                list="uk-cities-rate"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Manchester"
                className={toolInputClass}
              />
            </div>
          </div>
          <datalist id="uk-cities-rate">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="rate-equipment" className={toolLabelClass}>
                Equipment
              </label>
              <select
                id="rate-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className={toolInputClass}
              >
                {EQUIPMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rate-value" className={toolLabelClass}>
                Your rate (GBP) <span className="text-red-500">*</span>
              </label>
              <input
                id="rate-value"
                required
                type="number"
                min={1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="420"
                className={toolInputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 transition hover:bg-[#d4ff4d] disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Compare to market
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Market check</p>
        {comparison ? (
          <div className="mt-5 space-y-5">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${verdictStyles[comparison.verdict]}`}
            >
              {comparison.deltaLabel}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {comparison.origin} → {comparison.destination}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{comparison.matchedLane ?? "Corridor benchmark estimate"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Your rate", value: `£${comparison.userRate}` },
                { label: "Market mid", value: `£${comparison.marketRate}` },
                { label: "Your £/mile", value: `£${comparison.userRpm}` },
                { label: "Market £/mile", value: `£${comparison.marketRpm}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-sm leading-6 text-slate-600">{comparison.guidance}</p>

            <Link
              href="/tools/lane-rates"
              className="inline-block text-sm font-semibold text-slate-800 hover:text-slate-900"
            >
              View full lane rate index →
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Enter your lane and all-in rate to compare against Alpha Freight marketplace benchmarks before you post or bid.
          </p>
        )}
      </section>
    </div>
  );
}
