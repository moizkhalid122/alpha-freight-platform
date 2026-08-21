"use client";

import { ClipboardList } from "lucide-react";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { useCommercialLoads, type CommercialLoadRow } from "@/lib/use-commercial-metrics";

export default function CommercialDirectorLoadsPage({
  initialLoads,
}: {
  initialLoads?: CommercialLoadRow[];
}) {
  const { data, isLoading, error, isFetching } = useCommercialLoads({ initialLoads });
  const loads = data?.loads?.length ? data.loads : (initialLoads ?? []);
  const showSkeleton = loads.length === 0 && (isLoading || isFetching) && !error;

  return (
    <CommercialPageShell
      title="Load operations view"
      description="Monitor marketplace loads and booking activity. Payment execution and refunds are not available in this panel."
    >
      <section className="air-card overflow-hidden rounded-[24px]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Live loads</p>
            <p className="text-[11px] text-gray-500">
              {showSkeleton ? "Loading live data..." : `${loads.length} records`}
              {isFetching && !showSkeleton ? " · refreshing" : ""}
            </p>
          </div>
        </div>

        {showSkeleton ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="cd-skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-[13px] text-red-600">
            {error instanceof Error ? error.message : "Unable to load loads."}
          </p>
        ) : loads.length === 0 ? (
          <p className="px-4 py-10 text-[13px] text-gray-500">No loads found yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="cd-table-head border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Posted</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => (
                  <tr key={load.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {load.origin || "—"} → {load.destination || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{load.title || "—"}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{load.status || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {load.price ? `£${Number(load.price).toLocaleString("en-GB")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {load.created_at ? new Date(load.created_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CommercialPageShell>
  );
}
