import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { ActivityItem } from "@/lib/air-dashboard";
import AirStatusBadge from "@/components/air/dashboard/AirStatusBadge";

type AirActivityFeedProps = {
  items: ActivityItem[];
  emptyMessage: string;
  viewAllHref?: string;
};

export default function AirActivityFeed({ items, emptyMessage, viewAllHref }: AirActivityFeedProps) {
  return (
    <section className="air-card rounded-[28px] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="air-font-display text-2xl font-medium text-slate-900">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-500">Latest updates across your air workspace.</p>
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View all
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {item.time}
                </span>
                <AirStatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
