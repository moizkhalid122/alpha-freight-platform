"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  analyzeSupplierLoadDraft,
  type SupplierLoadDraft,
  type SupplierLoadAdvisory,
} from "@/lib/copilot/supplier-load-advisor";
import { supabase } from "@/lib/supabase";

type SupplierLoadAiAdvisorProps = {
  draft: SupplierLoadDraft;
  currency?: string;
  formatMoney: (value: number) => string;
  onApplySuggestedPrice?: (price: number) => void;
};

async function buildAuthHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export default function SupplierLoadAiAdvisor({
  draft,
  currency = "GBP",
  formatMoney,
  onApplySuggestedPrice,
}: SupplierLoadAiAdvisorProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [advisory, setAdvisory] = useState<SupplierLoadAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftKey = useMemo(() => JSON.stringify(draft), [draft]);
  const hasRoute = Boolean(draft.origin && draft.destination);

  useEffect(() => {
    if (!hasRoute) {
      setAdvisory(null);
      return;
    }

    setAdvisory(analyzeSupplierLoadDraft(draft, [], currency));
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        setRefreshing(true);
        const headers = await buildAuthHeaders();
        const response = await fetch("/api/supplier/advise-load", {
          method: "POST",
          headers,
          body: JSON.stringify({ draft, currency }),
        });
        const payload = (await response.json()) as {
          advisory?: SupplierLoadAdvisory;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Unable to analyse load.");
        if (payload.advisory) setAdvisory(payload.advisory);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Analysis failed.");
      } finally {
        setRefreshing(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [draftKey, currency, draft, hasRoute]);

  const errors = advisory?.issues.filter((issue) => issue.severity === "error") || [];
  const warnings = advisory?.issues.filter((issue) => issue.severity === "warning") || [];

  return (
    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-violet-100 px-2 py-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">
              AI Load Advisor
            </span>
            {refreshing ? (
              <Loader2 className="h-3 w-3 animate-spin text-violet-500" aria-hidden />
            ) : null}
          </div>
          <h3 className="text-[15px] font-bold text-slate-900">Smart price & validation</h3>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-600">
            Checks route, weight, equipment mismatches, timing, and compares your budget to UK corridor
            benchmarks.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center sm:min-w-[180px]">
          {!hasRoute ? (
            <p className="text-[12px] text-slate-500">Enter route to get AI guidance</p>
          ) : advisory ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Suggested rate
              </p>
              <p className="text-2xl font-bold text-slate-900">{formatMoney(advisory.suggestedPrice)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {formatMoney(advisory.priceLow)} – {formatMoney(advisory.priceHigh)}
              </p>
              <p className="mt-2 text-[10px] font-semibold text-violet-700">
                Readiness {advisory.readinessScore}/100
              </p>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {advisory ? (
        <div className="mt-5 space-y-4">
          <p className="text-[13px] text-slate-700">{advisory.summary}</p>

          {advisory.issues.length > 0 ? (
            <div className="space-y-2">
              {errors.map((issue) => (
                <div
                  key={`${issue.field}-${issue.message}`}
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
              {warnings.map((issue) => (
                <div
                  key={`${issue.field}-${issue.message}`}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              No critical mismatches detected.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Distance</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{advisory.distanceMiles} mi</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Market RPM</p>
              <p className="mt-1 text-sm font-bold text-slate-900">£{advisory.marketRpm.toFixed(2)}/mi</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Total payable</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(advisory.totalPayable)}</p>
            </div>
          </div>

          <p className="text-[12px] text-slate-600">{advisory.recommendation}</p>

          {onApplySuggestedPrice && advisory.suggestedPrice > 0 ? (
            <button
              type="button"
              onClick={() => onApplySuggestedPrice(advisory.suggestedPrice)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-800"
            >
              <Wand2 className="h-4 w-4" />
              Apply suggested price to load price
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
