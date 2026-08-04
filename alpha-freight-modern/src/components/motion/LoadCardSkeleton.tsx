export function LoadCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-8 flex-1 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
