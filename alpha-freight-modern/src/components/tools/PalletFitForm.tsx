"use client";

import { useState, type FormEvent } from "react";
import { Boxes, Loader2 } from "lucide-react";

import type { PalletFitResult } from "@/lib/freight-calculators";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

export default function PalletFitForm() {
  const [palletCount, setPalletCount] = useState("24");
  const [weightKg, setWeightKg] = useState("18000");
  const [temperatureControlled, setTemperatureControlled] = useState(false);
  const [oversized, setOversized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PalletFitResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/public/pallet-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palletCount: Number(palletCount),
          weightKg: Number(weightKg),
          temperatureControlled,
          oversized,
        }),
      });
      const payload = (await response.json()) as { result?: PalletFitResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to calculate fit.");
      setResult(payload.result ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate fit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pallet & vehicle fit</h2>
            <p className="text-sm text-slate-500">Pallets and weight → equipment suggestion.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pallet-count" className={toolLabelClass}>
                Pallet count <span className="text-red-500">*</span>
              </label>
              <input
                id="pallet-count"
                required
                type="number"
                min={1}
                value={palletCount}
                onChange={(e) => setPalletCount(e.target.value)}
                className={toolInputClass}
              />
            </div>
            <div>
              <label htmlFor="pallet-weight" className={toolLabelClass}>
                Total weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                id="pallet-weight"
                required
                type="number"
                min={1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={toolInputClass}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={temperatureControlled}
                onChange={(e) => setTemperatureControlled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Temperature-controlled cargo
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={oversized}
                onChange={(e) => setOversized(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Oversized / non-standard dimensions
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 hover:bg-[#d4ff4d] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Suggest equipment
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className={toolCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Recommendation</p>
        {result ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-[#BFFF07]/40 bg-[#BFFF07]/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7da600]">Best fit</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{result.recommendedLabel}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Pallet fill</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{result.palletUtilisationPct}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Weight fill</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{result.weightUtilisationPct}%</p>
              </div>
            </div>

            {result.alternatives.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-800">Alternatives</p>
                <ul className="mt-2 space-y-2">
                  {result.alternatives.map((alt) => (
                    <li key={alt.type} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{alt.label}</span> — {alt.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.notes.length > 0 && (
              <ul className="space-y-2 text-sm leading-6 text-slate-500">
                {result.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Enter pallet count and total weight to see whether curtain-side, refrigerated, flatbed, or general haulage fits best.
          </p>
        )}
      </section>
    </div>
  );
}
