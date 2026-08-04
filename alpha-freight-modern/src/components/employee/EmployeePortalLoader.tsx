"use client";

import { Loader2 } from "lucide-react";

type EmployeePortalLoaderProps = {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
};

export function EmployeePortalLoader({
  title = "Loading…",
  subtitle,
  fullScreen = true,
}: EmployeePortalLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#f0fdf4_0%,#f8fafc_45%,#ffffff_100%)] px-4"
          : "flex flex-col items-center justify-center py-12"
      }
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-emerald-400/10" />
        <Loader2 className="relative h-8 w-8 animate-spin text-slate-900" aria-hidden />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-900">{title}</p>
      {subtitle ? <p className="mt-1 max-w-xs text-center text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function EmployeePortalOverlay({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <EmployeePortalLoader title={title} subtitle={subtitle} fullScreen={false} />
    </div>
  );
}

export function OnboardingFormSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#f4f7fb_45%,#eef2f7_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl animate-pulse">
        <div className="mb-8 text-center">
          <div className="mx-auto h-3 w-40 rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-8 w-72 max-w-full rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
        </div>

        <div className="space-y-6 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="space-y-4">
            <div className="h-6 w-24 rounded bg-slate-200" />
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-slate-100" />
              <div className="h-24 flex-1 rounded-2xl bg-slate-100" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="mb-2 h-4 w-28 rounded bg-slate-200" />
                <div className="h-12 w-full rounded-2xl bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="h-6 w-28 rounded bg-slate-200" />
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
            </div>
          </div>

          <div className="h-12 rounded-2xl bg-slate-900/80" />
        </div>
      </div>
    </div>
  );
}
