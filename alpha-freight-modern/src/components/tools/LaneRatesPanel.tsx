"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";

import { EQUIPMENT_OPTIONS, type LaneRatesResponse, type LaneTrend } from "@/lib/freight-tools";

function TrendBadge({ trend }: { trend: LaneTrend }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <TrendingUp className="h-3.5 w-3.5" /> Up
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
        <TrendingDown className="h-3.5 w-3.5" /> Down
      </span>
    );
  }
  return <span className="text-xs font-semibold text-slate-400">Flat</span>;
}

export default function LaneRatesPanel() {
  const [equipment, setEquipment] = useState("general");
  const [data, setData] = useState<LaneRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetch(`/api/public/lane-rates?equipment=${equipment}`)
      .then(async (response) => {
        const payload = (await response.json()) as LaneRatesResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load lane rates.");
        if (active) setData(payload);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Unable to load lane rates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [equipment]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <aside className="space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Equipment type</h2>
          <div className="mt-4 grid gap-2">
            {EQUIPMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEquipment(option.value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  equipment === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {data ? (
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Market index</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">£{data.indexRpm.toFixed(2)}</p>
            <p className="mt-1 text-sm text-slate-500">avg rate per mile</p>
            <p
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                data.deltaPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {data.deltaLabel} vs prior samples
            </p>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Source: {data.source === "marketplace" ? "Alpha Freight live marketplace" : "UK baseline corridors"}
              {data.liveLoadCount ? ` · ${data.liveLoadCount} priced loads sampled` : ""}
            </p>
          </div>
        ) : null}
      </aside>

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live lane rate index</h2>
            <p className="mt-1 text-sm text-slate-500">UK corridors refreshed from marketplace activity.</p>
          </div>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : null}
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {!loading && data ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="py-3 pr-4">Lane</th>
                  <th className="py-3 pr-4">Miles</th>
                  <th className="py-3 pr-4">Rate</th>
                  <th className="py-3 pr-4">£/mile</th>
                  <th className="py-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.lanes.map((lane) => (
                  <tr key={lane.lane} className="border-b border-slate-50">
                    <td className="py-4 pr-4 font-medium text-slate-900">{lane.lane}</td>
                    <td className="py-4 pr-4 text-slate-600">{lane.miles}</td>
                    <td className="py-4 pr-4 font-semibold text-slate-900">£{lane.rate.toLocaleString()}</td>
                    <td className="py-4 pr-4 text-slate-600">£{lane.rpm.toFixed(2)}</td>
                    <td className="py-4">
                      <TrendBadge trend={lane.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tools/freight-quote"
            className="inline-flex h-11 items-center rounded-xl bg-[#BFFF07] px-5 text-sm font-semibold text-black hover:brightness-95"
          >
            Get instant quote
          </Link>
          <Link
            href="/post-loads"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Post a load
          </Link>
        </div>
      </section>
    </div>
  );
}
