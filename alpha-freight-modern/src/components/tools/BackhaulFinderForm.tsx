"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Route } from "lucide-react";

import { EQUIPMENT_OPTIONS, UK_CITY_SUGGESTIONS, type BackhaulResult } from "@/lib/freight-tools";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

export default function BackhaulFinderForm() {
  const [fromCity, setFromCity] = useState("");
  const [equipment, setEquipment] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backhaul, setBackhaul] = useState<BackhaulResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setBackhaul(null);

    try {
      const params = new URLSearchParams({ from: fromCity, equipment });
      const response = await fetch(`/api/public/backhaul?${params.toString()}`);
      const payload = (await response.json()) as { backhaul?: BackhaulResult; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to find backhaul lanes.");
      setBackhaul(payload.backhaul ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to find backhaul lanes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className={toolCardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Backhaul lane finder</h2>
            <p className="text-sm text-slate-500">Find return loads and corridors from your current UK location.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="backhaul-from" className={toolLabelClass}>
              Current location <span className="text-red-500">*</span>
            </label>
            <input
              id="backhaul-from"
              required
              list="uk-cities-backhaul"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder="e.g. Manchester (after delivery)"
              className={toolInputClass}
            />
          </div>
          <datalist id="uk-cities-backhaul">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <div>
            <label htmlFor="backhaul-equipment" className={toolLabelClass}>
              Equipment
            </label>
            <select
              id="backhaul-equipment"
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

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 transition hover:bg-[#d4ff4d] disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Find backhaul lanes
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          Best used after a delivery — we surface outbound lanes from your current city using Alpha Freight corridor data.
        </p>
      </section>

      <section className={toolCardClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Suggested lanes</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {backhaul ? `From ${backhaul.fromCity}` : "Backhaul opportunities"}
            </h3>
          </div>
          {backhaul ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {backhaul.source === "marketplace" ? "Live data" : "Baseline corridors"}
            </span>
          ) : null}
        </div>

        {backhaul && backhaul.lanes.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No corridor matches yet for this city — try the live load board instead.</p>
        ) : null}

        {backhaul && backhaul.lanes.length > 0 ? (
          <div className="mt-6 space-y-3">
            {backhaul.lanes.map((lane) => (
              <div key={lane.lane} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{lane.lane}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lane.miles} mi · {lane.type === "return" ? "Outbound from your location" : "Inbound corridor"}
                      {lane.sampleSize > 0 ? ` · ${lane.sampleSize} samples` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">£{lane.rate}</p>
                    <p className="text-xs font-medium text-[#7da600]">£{lane.rpm}/mi</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !backhaul ? (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Enter where your truck is now to see return lanes and high-fit corridors before deadheading empty.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tools/live-loads" className="text-sm font-semibold text-slate-800 hover:text-slate-900">
            Browse live loads →
          </Link>
          <Link href="/available-loads" className="text-sm font-semibold text-slate-800 hover:text-slate-900">
            Full load board →
          </Link>
        </div>
      </section>
    </div>
  );
}
