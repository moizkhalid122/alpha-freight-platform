"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Calculator, Loader2 } from "lucide-react";

import {
  EQUIPMENT_OPTIONS,
  UK_CITY_SUGGESTIONS,
  type FreightQuoteResult,
} from "@/lib/freight-tools";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#a8d900] focus:bg-white focus:ring-2 focus:ring-[#BFFF07]/25";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";

export default function FreightQuoteForm() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("general");
  const [weightKg, setWeightKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FreightQuoteResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const response = await fetch("/api/public/freight-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          equipment,
          weightKg: weightKg ? Number(weightKg) : undefined,
        }),
      });

      const payload = (await response.json()) as { quote?: FreightQuoteResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to calculate quote.");
      setQuote(payload.quote ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate quote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Instant freight quote</h2>
            <p className="text-sm text-slate-500">Estimate UK lane pricing in seconds.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="quote-origin" className={labelClass}>
              Pickup location <span className="text-red-500">*</span>
            </label>
            <input
              id="quote-origin"
              required
              list="uk-cities"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. London"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="quote-destination" className={labelClass}>
              Delivery location <span className="text-red-500">*</span>
            </label>
            <input
              id="quote-destination"
              required
              list="uk-cities"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Manchester"
              className={inputClass}
            />
          </div>
          <datalist id="uk-cities">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="quote-equipment" className={labelClass}>
                Equipment
              </label>
              <select
                id="quote-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className={inputClass}
              >
                {EQUIPMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quote-weight" className={labelClass}>
                Weight (kg) <span className="normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="quote-weight"
                type="number"
                min={0}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 10000"
                className={inputClass}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#BFFF07] text-[14px] font-semibold text-black transition hover:brightness-95 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {loading ? "Calculating..." : "Calculate quote"}
          </button>
        </form>
      </section>

      <aside className="space-y-6">
        {quote ? (
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Estimated range</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              £{quote.estimateLow.toLocaleString()} – £{quote.estimateHigh.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Mid estimate <span className="font-semibold text-slate-800">£{quote.estimateMid.toLocaleString()}</span>
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Lane</dt>
                <dd className="font-medium text-slate-900">
                  {quote.origin} → {quote.destination}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Distance</dt>
                <dd className="font-medium text-slate-900">{quote.distanceMiles} miles</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Rate / mile</dt>
                <dd className="font-medium text-slate-900">£{quote.ratePerMile.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Data source</dt>
                <dd className="font-medium text-slate-900">
                  {quote.source === "marketplace" ? "Live marketplace" : "Modelled estimate"}
                </dd>
              </div>
            </dl>

            {quote.matchedLane ? (
              <p className="mt-4 text-xs text-slate-500">Matched corridor: {quote.matchedLane}</p>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-slate-400">{quote.fuelNote}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/post-loads"
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-black"
              >
                Post this load
              </Link>
              <Link
                href="/tools/lane-rates"
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
              >
                View lane index
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6 text-sm leading-7 text-slate-500 sm:p-8">
            Enter pickup and delivery locations to see a UK freight estimate. Quotes use Alpha Freight marketplace
            lane data when available, with modelled fallback corridors otherwise.
          </div>
        )}

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-sm text-slate-600 sm:p-8">
          <p className="font-semibold text-slate-900">Need an exact carrier price?</p>
          <p className="mt-2 leading-6">
            Post the load on Alpha Freight and compare verified carrier bids within minutes.
          </p>
          <Link href="/auth/supplier-signup" className="mt-4 inline-block font-medium text-slate-800 hover:underline">
            Create supplier account →
          </Link>
        </div>
      </aside>
    </div>
  );
}
