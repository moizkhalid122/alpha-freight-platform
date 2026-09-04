"use client";

import { Flame, Loader2, RefreshCw } from "lucide-react";
import { useCommercialDirectorMotivation } from "@/lib/use-commercial-director-motivation";

type Props = {
  actualMtd?: number;
  monthTarget?: number;
};

export default function CommercialDirectorMotivationBanner({ actualMtd, monthTarget }: Props) {
  const { motivation, loading, refresh } = useCommercialDirectorMotivation({
    actualMtd,
    monthTarget,
  });

  if (!motivation && !loading) return null;

  return (
    <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50/90 to-orange-50/60 px-4 py-3 sm:px-8 lg:px-12">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
          ) : (
            <Flame className="h-4 w-4 text-amber-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Hourly motivation · Commercial Director
            {motivation?.focus ? ` · ${motivation.focus}` : ""}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-amber-950">
            {loading && !motivation ? "Loading motivation…" : motivation?.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          title="Refresh motivation"
          className="shrink-0 rounded-lg border border-amber-200 bg-white/80 p-2 text-amber-700 transition hover:bg-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
