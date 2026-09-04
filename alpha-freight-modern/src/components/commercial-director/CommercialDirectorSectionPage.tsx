"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import { COMMERCIAL_SECTION_CONFIG } from "@/lib/commercial-director-permissions";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import { useCommercialMetrics } from "@/lib/use-commercial-metrics";

function MetricSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="cd-kpi rounded-[20px] p-4">
          <div className="cd-skeleton h-3 w-20 rounded" />
          <div className="cd-skeleton mt-4 h-8 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number | null>>;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-[13px] text-gray-500">No live records yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead className="cd-table-head border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-gray-600">
                  {row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RELATED: Record<string, Array<{ label: string; href: string }>> = {
  leads: [
    { label: "Tasks & Follow-ups", href: commercialDirectorRoute("/tasks") },
    { label: "Employees", href: commercialDirectorRoute("/employees") },
  ],
  quotes: [
    { label: "Bookings", href: commercialDirectorRoute("/bookings") },
    { label: "Loads", href: commercialDirectorRoute("/loads") },
  ],
  bookings: [
    { label: "Loads", href: commercialDirectorRoute("/loads") },
    { label: "Shippers", href: commercialDirectorRoute("/shippers") },
  ],
  revenue: [
    { label: "Revenue Command Center", href: commercialDirectorRoute("/revenue-plan") },
    { label: "Targets", href: commercialDirectorRoute("/targets") },
    { label: "Reports", href: commercialDirectorRoute("/reports") },
  ],
  targets: [
    { label: "Revenue Command Center", href: commercialDirectorRoute("/revenue-plan") },
    { label: "Revenue", href: commercialDirectorRoute("/revenue") },
  ],
};

export default function CommercialDirectorSectionPage({
  slug,
  initialMetrics,
}: {
  slug: string;
  initialMetrics?: CommercialMetricsPayload;
}) {
  const config = COMMERCIAL_SECTION_CONFIG[slug];
  const { data, isLoading, isFetching } = useCommercialMetrics({ initialMetrics });
  if (!config) return null;
  const metricsSource = data ?? initialMetrics;
  const section = metricsSource?.sections[slug];
  const metrics = section?.metrics ?? config.metrics;
  const rows = section?.rows ?? [];
  const columns = section?.rowColumns ?? [];
  const showSkeleton = !metricsSource && (isLoading || isFetching);

  return (
    <CommercialPageShell eyebrow={config.eyebrow} title={config.title} description={config.description}>
      {showSkeleton ? (
        <MetricSkeleton />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="cd-kpi rounded-[20px] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{metric.label}</p>
              <p className="air-font-display mt-3 text-2xl font-medium text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="air-card overflow-hidden rounded-[24px]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Live records</h2>
              <p className="text-[11px] text-gray-500">Fast commercial data view</p>
            </div>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
          </div>
          {showSkeleton ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="cd-skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </section>

        <section className="air-card rounded-[24px] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">Workflow focus</h2>
          <div className="mt-4 space-y-2.5">
            {config.highlights.map((item) => (
              <div key={item} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-3 text-[13px] leading-6 text-gray-600">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                {item}
              </div>
            ))}
          </div>

          {(RELATED[slug] ?? []).length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Connected</p>
              {(RELATED[slug] ?? []).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </CommercialPageShell>
  );
}
