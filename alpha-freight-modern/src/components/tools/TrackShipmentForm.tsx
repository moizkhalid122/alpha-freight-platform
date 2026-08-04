"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MapPin, PackageSearch, Radio } from "lucide-react";

import { type PublicTrackingResult } from "@/lib/freight-tools";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#a8d900] focus:bg-white focus:ring-2 focus:ring-[#BFFF07]/25";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";

export default function TrackShipmentForm() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<PublicTrackingResult | null>(null);

  const lookup = async (ref: string) => {
    const trimmed = ref.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setTracking(null);

    try {
      const response = await fetch(`/api/public/track?ref=${encodeURIComponent(trimmed)}`);
      const payload = (await response.json()) as { tracking?: PublicTrackingResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to find shipment.");
      setTracking(payload.tracking ?? null);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Unable to find shipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get("ref");
    if (initial) {
      setReference(initial.toUpperCase());
      void lookup(initial);
    }
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lookup(reference);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Track by reference</h2>
            <p className="text-sm text-slate-500">Use your Alpha Freight load reference (e.g. AF-1A2B3C4D).</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="track-ref" className={labelClass}>
              Load reference <span className="text-red-500">*</span>
            </label>
            <input
              id="track-ref"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="AF-1A2B3C4D"
              className={inputClass}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#BFFF07] text-[14px] font-semibold text-black transition hover:brightness-95 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
            {loading ? "Searching..." : "Track shipment"}
          </button>
        </form>
      </section>

      {tracking ? (
        <section className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{tracking.reference}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{tracking.statusLabel}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                {tracking.origin} → {tracking.destination}
              </p>
            </div>
            {tracking.liveTrackingActive ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Radio className="h-3.5 w-3.5" /> Live GPS active
              </span>
            ) : null}
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#BFFF07] transition-all"
              style={{ width: `${tracking.progress}%` }}
            />
          </div>

          <ol className="mt-8 space-y-4">
            {tracking.timeline.map((step) => (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.complete
                      ? "bg-[#BFFF07] text-black"
                      : step.current
                        ? "border-2 border-[#BFFF07] bg-white text-[#7a9900]"
                        : "border border-slate-200 bg-white text-slate-300"
                  }`}
                >
                  {step.complete ? "✓" : ""}
                </span>
                <div>
                  <p className={`text-sm font-medium ${step.complete || step.current ? "text-slate-900" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  {step.current ? <p className="text-xs text-[#7a9900]">Current stage</p> : null}
                </div>
              </li>
            ))}
          </ol>

          {tracking.lastUpdate ? (
            <p className="mt-6 text-xs text-slate-400">
              Last update: {new Date(tracking.lastUpdate).toLocaleString("en-GB")}
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-slate-400">
            For full live GPS and account actions, sign in to your supplier portal.
          </p>
          <Link href="/support" className="mt-3 inline-block text-sm font-medium text-slate-700 hover:underline">
            Need help with this shipment?
          </Link>
        </section>
      ) : null}
    </div>
  );
}
