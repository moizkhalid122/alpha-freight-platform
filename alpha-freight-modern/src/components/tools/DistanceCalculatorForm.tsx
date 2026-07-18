"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, MapPinned } from "lucide-react";

import { UK_CITY_SUGGESTIONS, type DistanceResult } from "@/lib/freight-tools";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

export default function DistanceCalculatorForm() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DistanceResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ origin, destination });
      const response = await fetch(`/api/public/distance?${params.toString()}`);
      const payload = (await response.json()) as { distance?: DistanceResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to calculate distance.");
      setResult(payload.distance ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate distance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">UK haulage distance</h2>
            <p className="text-sm text-slate-500">Road-distance estimate between UK cities.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="distance-origin" className={toolLabelClass}>
              From <span className="text-red-500">*</span>
            </label>
            <input
              id="distance-origin"
              required
              list="uk-cities-distance"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. London"
              className={toolInputClass}
            />
          </div>
          <div>
            <label htmlFor="distance-destination" className={toolLabelClass}>
              To <span className="text-red-500">*</span>
            </label>
            <input
              id="distance-destination"
              required
              list="uk-cities-distance"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Manchester"
              className={toolInputClass}
            />
          </div>
          <datalist id="uk-cities-distance">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 transition hover:bg-[#d4ff4d] disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calculate distance
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Result</p>
        {result ? (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {result.origin} → {result.destination}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {result.method === "coordinates" ? "Coordinate-based road estimate" : "Approximate corridor estimate"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Distance</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{result.distanceMiles} mi</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Drive time</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {result.drivingHoursMin}–{result.drivingHoursMax}h
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/tools/freight-quote?origin=${encodeURIComponent(result.origin)}&destination=${encodeURIComponent(result.destination)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Get freight quote →
              </Link>
              <Link
                href={`/tools/rate-check?origin=${encodeURIComponent(result.origin)}&destination=${encodeURIComponent(result.destination)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Check your rate →
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Enter two UK cities to see estimated haulage miles and typical driving time for planning quotes and bids.
          </p>
        )}
      </section>
    </div>
  );
}
