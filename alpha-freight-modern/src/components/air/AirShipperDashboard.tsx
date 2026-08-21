"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Clock,
  Package,
  Plane,
  Receipt,
  Search,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { airOnboardingStorageKey, type AirOnboardingData } from "@/lib/air-portal";
import {
  getDashboardTools,
  getShipperActivity,
  getShipperChartData,
  getShipperDashboardStats,
  type ShipperDashboardStats,
} from "@/lib/air-dashboard";
import { DEMO_TRACK, getAirShipments } from "@/lib/air-storage";
import AirActivityFeed from "@/components/air/dashboard/AirActivityFeed";
import AirDashboardChart from "@/components/air/dashboard/AirDashboardChart";
import AirDashboardKpi from "@/components/air/dashboard/AirDashboardKpi";
import AirDashboardTools from "@/components/air/dashboard/AirDashboardTools";
import AirStatusBadge from "@/components/air/dashboard/AirStatusBadge";

export default function AirShipperDashboard() {
  const [profile, setProfile] = useState<AirOnboardingData | null>(null);
  const [name, setName] = useState("Shipper");
  const [stats, setStats] = useState<ShipperDashboardStats | null>(null);
  const [chartData, setChartData] = useState(getShipperChartData(""));
  const [activity, setActivity] = useState(getShipperActivity(""));
  const [recentShipments, setRecentShipments] = useState(getAirShipments("").slice(0, 4));

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const stored = localStorage.getItem(airOnboardingStorageKey(user.id));
      if (stored) setProfile(JSON.parse(stored) as AirOnboardingData);

      setStats(getShipperDashboardStats(user.id));
      setChartData(getShipperChartData(user.id));
      setActivity(getShipperActivity(user.id));
      setRecentShipments(getAirShipments(user.id).slice(0, 4));

      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (data?.full_name) setName(data.full_name);
    })();
  }, []);

  const quickActions = [
    { label: "Post shipment", href: "/air/shipper/post", primary: true },
    { label: "My shipments", href: "/air/shipper/shipments" },
    { label: "Track AWB", href: "/air/shipper/track" },
    { label: "Billing", href: "/air/shipper/billing" },
  ];

  const trackItems = [
    ...recentShipments.map((shipment) => ({
      awb: shipment.awb,
      status: shipment.status.replace(/_/g, " "),
      route: `${shipment.origin} → ${shipment.destination}`,
    })),
    ...DEMO_TRACK.slice(0, Math.max(0, 2 - recentShipments.length)),
  ].slice(0, 3);

  const tools = getDashboardTools("supplier");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">Shipper</p>
        <h1 className="air-font-display mt-2 text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl">
          Welcome, <span className="air-font-script text-5xl sm:text-6xl">{name.split(" ")[0]}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Post, track, bill, and manage premium air cargo — all tools connected from one dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  : "rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AirDashboardKpi
          label="My shipments"
          value={String(stats?.shipmentCount ?? 0)}
          sub={`${stats?.pendingCount ?? 0} awaiting booking`}
          icon={Plane}
        />
        <AirDashboardKpi
          label="In transit"
          value={String(stats?.inTransit ?? 0)}
          sub="Active AWB movements"
          icon={Clock}
          tone="text-amber-600"
        />
        <AirDashboardKpi
          label="Spend (MTD)"
          value={stats?.spendFormatted ?? "£0"}
          sub="Invoice total to date"
          icon={TrendingUp}
          tone="text-emerald-600"
        />
        <AirDashboardKpi
          label="On-time"
          value={`${stats?.onTimeRate ?? 96}%`}
          sub="Delivery performance"
          icon={Package}
          tone="text-violet-600"
        />
      </div>

      <AirDashboardChart
        title="Spend overview"
        subtitle="Monthly air freight invoice totals"
        data={chartData}
        accent="#10b981"
      />

      <AirDashboardTools tools={tools} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section id="post" className="air-card rounded-[28px] p-6 sm:p-8">
          <h2 className="air-font-display mb-2 text-2xl font-medium text-slate-900">Post a shipment</h2>
          <p className="mb-6 text-sm text-slate-600">
            Express lanes from {profile?.primaryAirport ?? "your hub"} — AWB issued on confirmation.
          </p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick post</p>
              <p className="mt-2 text-sm text-slate-700">Create a new air cargo request in under 2 minutes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Documents</p>
              <p className="mt-2 text-sm text-slate-700">AWB and customs docs generated after booking.</p>
            </div>
          </div>
          <Link href="/air/shipper/post" className="air-btn-primary inline-flex max-w-xs">
            Create air shipment
          </Link>
        </section>

        <section id="track" className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-sky-600" />
              <h2 className="air-font-display text-2xl font-medium text-slate-900">Track AWB</h2>
            </div>
            <Link href="/air/shipper/track" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Open tracker
            </Link>
          </div>
          <div className="space-y-3">
            {trackItems.map((row) => (
              <Link
                key={row.awb}
                href={`/air/shipper/track?q=${encodeURIComponent(row.awb)}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.awb}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {row.status} · {row.route}
                    </p>
                  </div>
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section id="billing" className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <h2 className="air-font-display text-2xl font-medium text-slate-900">Billing summary</h2>
            </div>
            <Link href="/air/shipper/billing" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Open billing
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding</p>
              <p className="air-font-display mt-2 text-2xl text-slate-900">
                {stats?.outstandingFormatted ?? "£0"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total spend</p>
              <p className="air-font-display mt-2 text-2xl text-slate-900">{stats?.spendFormatted ?? "£0"}</p>
            </div>
          </div>
          {(stats?.outstanding ?? 0) > 0 ? (
            <Link href="/air/shipper/billing" className="air-btn-primary mt-5 max-w-xs">
              Pay invoice
            </Link>
          ) : (
            <p className="mt-5 text-sm text-slate-500">No outstanding invoices right now.</p>
          )}
        </section>

        <section className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="air-font-display text-2xl font-medium text-slate-900">Recent shipments</h2>
            <Link href="/air/shipper/shipments" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {recentShipments.length === 0 ? (
            <p className="text-sm text-slate-500">No shipments yet — post your first air cargo request.</p>
          ) : (
            <div className="space-y-3">
              {recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{shipment.awb}</p>
                    <p className="text-xs text-slate-500">
                      {shipment.origin} → {shipment.destination} · {shipment.weightKg} kg
                    </p>
                  </div>
                  <AirStatusBadge status={shipment.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AirActivityFeed
        items={activity}
        emptyMessage="Post a shipment to start building your activity feed."
        viewAllHref="/air/shipper/shipments"
      />
    </div>
  );
}
