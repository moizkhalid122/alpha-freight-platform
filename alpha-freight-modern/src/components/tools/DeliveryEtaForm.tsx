"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Clock3, Loader2 } from "lucide-react";

import type { DeliveryEtaResult } from "@/lib/freight-calculators";
import { UK_CITY_SUGGESTIONS } from "@/lib/freight-tools";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function DeliveryEtaForm() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distanceMiles, setDistanceMiles] = useState("");
  const [useMilesOnly, setUseMilesOnly] = useState(false);
  const [pickupAt, setPickupAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeliveryEtaResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/public/delivery-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: useMilesOnly ? undefined : origin,
          destination: useMilesOnly ? undefined : destination,
          distanceMiles: useMilesOnly ? Number(distanceMiles) : undefined,
          pickupAt,
        }),
      });
      const payload = (await response.json()) as { result?: DeliveryEtaResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to estimate delivery.");
      setResult(payload.result ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to estimate delivery.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Delivery ETA estimator</h2>
            <p className="text-sm text-slate-500">Miles + pickup time → rough UK delivery window.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useMilesOnly}
              onChange={(e) => setUseMilesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Enter distance in miles only
          </label>

          {!useMilesOnly ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="eta-origin" className={toolLabelClass}>
                  From <span className="text-red-500">*</span>
                </label>
                <input id="eta-origin" required={!useMilesOnly} list="uk-cities-eta" value={origin} onChange={(e) => setOrigin(e.target.value)} className={toolInputClass} />
              </div>
              <div>
                <label htmlFor="eta-destination" className={toolLabelClass}>
                  To <span className="text-red-500">*</span>
                </label>
                <input id="eta-destination" required={!useMilesOnly} list="uk-cities-eta" value={destination} onChange={(e) => setDestination(e.target.value)} className={toolInputClass} />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="eta-miles" className={toolLabelClass}>
                Distance (miles) <span className="text-red-500">*</span>
              </label>
              <input id="eta-miles" required={useMilesOnly} type="number" min={1} value={distanceMiles} onChange={(e) => setDistanceMiles(e.target.value)} className={toolInputClass} />
            </div>
          )}

          <datalist id="uk-cities-eta">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <div>
            <label htmlFor="eta-pickup" className={toolLabelClass}>
              Pickup date & time <span className="text-red-500">*</span>
            </label>
            <input
              id="eta-pickup"
              required
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
              className={toolInputClass}
            />
          </div>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 hover:bg-[#d4ff4d] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Estimate delivery
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Delivery window</p>
        {result ? (
          <div className="mt-5 space-y-5">
            {result.origin && result.destination ? (
              <h3 className="text-xl font-bold text-slate-900">
                {result.origin} → {result.destination}
              </h3>
            ) : null}
            <p className="text-sm text-slate-500">{result.distanceMiles} miles · {result.driveHours}h driving</p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Estimated arrival</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatDateTime(result.deliveryEarliest)}</p>
              <p className="text-sm text-slate-500">to {formatDateTime(result.deliveryLatest)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Breaks", value: `${result.breakHours}h` },
                { label: "Rest", value: `${result.restHours}h` },
                { label: "Loading", value: `${result.loadingBufferHours}h` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                  <p className="mt-1 font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-1.5 text-sm text-slate-500">
              {result.assumptions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            <Link href="/tools/distance" className="text-sm font-semibold text-slate-800 hover:text-slate-900">
              Calculate exact miles →
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Plan a realistic delivery window using simplified UK HGV driving hours and break rules.
          </p>
        )}
      </section>
    </div>
  );
}
