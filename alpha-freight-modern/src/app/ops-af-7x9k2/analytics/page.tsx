"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminLoadsQueryFn, adminLoadsQueryKey, adminQueryDefaults } from "@/lib/admin-query";

type ProfileRecord = {
  id: string;
  role?: string | null;
  created_at?: string | null;
};

type LoadRecord = {
  id: string;
  carrier_id?: string | null;
  status?: string | null;
  price?: number | null;
  created_at?: string | null;
};

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export default function AdminAnalyticsPage() {
  const loadsQuery = useQuery({
    queryKey: adminLoadsQueryKey(),
    queryFn: adminLoadsQueryFn(),
    ...adminQueryDefaults,
  });

  const analyticsCards = useMemo(() => {
    const profiles = (loadsQuery.data?.profiles ?? []) as ProfileRecord[];
    const loads = (loadsQuery.data?.loads ?? []) as LoadRecord[];
    const carriers = profiles.filter((profile) => normalizeStatus(profile.role) === "carrier");
    const suppliers = profiles.filter((profile) => normalizeStatus(profile.role) === "supplier");
    const matchedLoads = loads.filter(
      (load) => Boolean(load.carrier_id) || /booked|confirmed|assigned|in_transit|delivered|completed/i.test(String(load.status))
    );
    const fillRate = loads.length ? Math.round((matchedLoads.length / loads.length) * 100) : 0;

    return [
      { label: "Total loads", value: String(loads.length) },
      { label: "Load fill rate", value: `${fillRate}%` },
      { label: "Carriers", value: String(carriers.length) },
      { label: "Suppliers", value: String(suppliers.length) },
    ];
  }, [loadsQuery.data]);

  const isLoading = loadsQuery.isLoading && !loadsQuery.data;

  return (
    <div className="admin-page-stack space-y-4">
      <section className={`${ADMIN_CARD} p-5 sm:p-6`}>
        <p className={ADMIN_SECTION_LABEL}>Analytics</p>
        <h2 className={`${ADMIN_SECTION_TITLE} mt-1`}>Live marketplace signals</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Placeholder analytics have been removed. These KPIs are calculated from live Supabase profiles and loads.
        </p>

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live analytics...
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {analyticsCards.map((card) => (
              <div key={card.label} className={`${ADMIN_CARD} relative overflow-hidden p-4`}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`${ADMIN_CARD} p-6 sm:p-8`}>
        <p className="text-sm leading-6 text-slate-600">
          For deeper charts, revenue trends, and activity breakdowns, use the live quick stats dashboard.
        </p>
        <Link
          href="/ops-af-7x9k2/quick-stats"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Open quick stats
        </Link>
      </section>
    </div>
  );
}
