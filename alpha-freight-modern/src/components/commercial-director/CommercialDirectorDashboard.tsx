"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Building2,
  ClipboardList,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import CommercialActivityFeed from "@/components/commercial-director/dashboard/CommercialActivityFeed";
import CommercialDashboardTools from "@/components/commercial-director/dashboard/CommercialDashboardTools";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import {
  getCommercialActivity,
  getCommercialChartData,
  getCommercialFocusItems,
  getCommercialTools,
} from "@/lib/commercial-director-dashboard";
import { COMMERCIAL_DIRECTOR_PROFILE } from "@/lib/commercial-director-permissions";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import { useCommercialMetrics } from "@/lib/use-commercial-metrics";

const AirDashboardChart = dynamic(() => import("@/components/air/dashboard/AirDashboardChart"), {
  ssr: false,
  loading: () => <div className="cd-skeleton min-h-[260px] rounded-[24px]" />,
});

function CompactKpi({
  label,
  value,
  sub,
  icon: Icon,
  tone = "text-blue-600",
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Building2;
  tone?: string;
}) {
  return (
    <div className="cd-kpi rounded-[20px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className="air-font-display text-2xl font-medium text-gray-900">{value}</p>
      <p className="mt-1 text-[11px] text-gray-500">{sub}</p>
    </div>
  );
}

export default function CommercialDirectorDashboard({
  initialMetrics,
}: {
  initialMetrics?: CommercialMetricsPayload;
}) {
  const { data, isLoading } = useCommercialMetrics({ initialMetrics });
  const metricsSource = data ?? initialMetrics;
  const overview = metricsSource?.overview;
  const firstName = COMMERCIAL_DIRECTOR_PROFILE.name.split(" ")[0];
  const chartData = getCommercialChartData(metricsSource);
  const tools = getCommercialTools();
  const activity = getCommercialActivity(overview, metricsSource);
  const focusItems = getCommercialFocusItems(metricsSource);
  const showSkeleton = !overview && isLoading;

  const quickActions = [
    { label: "Today's Tasks", href: commercialDirectorRoute("/tasks"), primary: true },
    { label: "Revenue Plan", href: commercialDirectorRoute("/revenue-plan") },
    { label: "Leads", href: commercialDirectorRoute("/leads") },
    { label: "Shippers", href: commercialDirectorRoute("/shippers") },
    { label: "Forwarders", href: commercialDirectorRoute("/forwarders") },
    { label: "Reports", href: commercialDirectorRoute("/reports") },
  ];

  return (
    <CommercialPageShell
      eyebrow="Commercial Director"
      title={`Good morning, ${firstName}`}
      description="Sales, companies, loads, team performance, and reporting — without banking or system controls."
    >
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={
              action.primary
                ? "rounded-lg bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-gray-800"
                : "rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
            }
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showSkeleton ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="cd-skeleton h-[104px] rounded-[20px]" />
          ))
        ) : (
          <>
            <CompactKpi label="Shippers" value={String(overview?.shippers ?? 0)} sub="Registered accounts" icon={Building2} tone="text-gray-700" />
            <CompactKpi label="Forwarders" value={String(overview?.forwarders ?? 0)} sub="Carrier network" icon={Truck} tone="text-emerald-600" />
            <CompactKpi label="Loads" value={String(overview?.loads ?? 0)} sub="Marketplace activity" icon={ClipboardList} tone="text-blue-600" />
            <CompactKpi label="Employees" value={String(overview?.employees ?? 0)} sub="Commercial team" icon={Users} tone="text-violet-600" />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[280px]">
          <AirDashboardChart
            title="Network momentum"
            subtitle="Loads posted per month (live Supabase data)"
            data={chartData}
            valuePrefix=""
            accent="#2563eb"
          />
        </div>
        <CommercialActivityFeed items={activity} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="air-card rounded-[24px] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="air-font-display text-xl font-medium text-gray-900">Performance focus</h2>
              <p className="text-[12px] text-gray-500">This week&apos;s commercial priorities</p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {focusItems.map((item) => (
              <div key={item} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5 text-[13px] text-gray-600">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="air-card rounded-[24px] p-4 sm:p-5">
          <h2 className="air-font-display text-xl font-medium text-gray-900">Executive shortcuts</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Revenue view", href: commercialDirectorRoute("/revenue") },
              { label: "Targets", href: commercialDirectorRoute("/targets") },
              { label: "Tasks", href: commercialDirectorRoute("/tasks") },
              { label: "Messages", href: commercialDirectorRoute("/messages") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-gray-100 bg-white px-3.5 py-3 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <CommercialDashboardTools tools={tools} />
    </CommercialPageShell>
  );
}
