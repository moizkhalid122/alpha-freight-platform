"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Globe,
  Package,
  Plane,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { airOnboardingStorageKey, type AirOnboardingData } from "@/lib/air-portal";
import {
  getDashboardTools,
  getForwarderActivity,
  getForwarderChartData,
  getForwarderDashboardStats,
  getForwarderLanePreview,
  type ForwarderDashboardStats,
} from "@/lib/air-dashboard";
import { DEMO_AWBS, getAirBookings } from "@/lib/air-storage";
import AirActivityFeed from "@/components/air/dashboard/AirActivityFeed";
import AirDashboardChart from "@/components/air/dashboard/AirDashboardChart";
import AirDashboardKpi from "@/components/air/dashboard/AirDashboardKpi";
import AirDashboardTools from "@/components/air/dashboard/AirDashboardTools";
import AirStatusBadge from "@/components/air/dashboard/AirStatusBadge";

export default function AirForwarderDashboard() {
  const [profile, setProfile] = useState<AirOnboardingData | null>(null);
  const [name, setName] = useState("Forwarder");
  const [stats, setStats] = useState<ForwarderDashboardStats | null>(null);
  const [chartData, setChartData] = useState(getForwarderChartData(""));
  const [activity, setActivity] = useState(getForwarderActivity(""));
  const [recentBookings, setRecentBookings] = useState(getAirBookings("").slice(0, 3));
  const [bookedAwbs, setBookedAwbs] = useState<string[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const stored = localStorage.getItem(airOnboardingStorageKey(user.id));
      if (stored) setProfile(JSON.parse(stored) as AirOnboardingData);

      setStats(getForwarderDashboardStats(user.id));
      setChartData(getForwarderChartData(user.id));
      setActivity(getForwarderActivity(user.id));
      setRecentBookings(getAirBookings(user.id).slice(0, 3));
      setBookedAwbs(getAirBookings(user.id).map((booking) => booking.awb));

      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (data?.full_name) setName(data.full_name);
    })();
  }, []);

  const quickActions = [
    { label: "Browse AWBs", href: "/air/forwarder/awbs", primary: true },
    { label: "My bookings", href: "/air/forwarder/bookings" },
    { label: "Add lane", href: "/air/forwarder/lanes" },
    { label: "Settlement", href: "/air/forwarder/settlement" },
  ];

  const lanes = getForwarderLanePreview(userId);
  const tools = getDashboardTools("carrier");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">Forwarder</p>
        <h1 className="air-font-display mt-2 text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl">
          Good day, <span className="air-font-script text-5xl sm:text-6xl">{name.split(" ")[0]}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          {profile?.primaryAirport
            ? `Hub: ${profile.primaryAirport} · Premium air freight operations`
            : "Your air freight command centre with every tool in one place."}
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
          label="Active AWBs"
          value={String(stats?.activeAwbs ?? DEMO_AWBS.length)}
          sub="Live marketplace"
          icon={Plane}
        />
        <AirDashboardKpi
          label="My bookings"
          value={String(stats?.bookingCount ?? 0)}
          sub={`${stats?.inTransit ?? 0} in transit`}
          icon={Globe}
          tone="text-emerald-600"
        />
        <AirDashboardKpi
          label="Revenue"
          value={stats?.revenueFormatted ?? "£0"}
          sub="From accepted AWBs"
          icon={Wallet}
          tone="text-amber-600"
        />
        <AirDashboardKpi
          label="Win rate"
          value={`${stats?.winRate ?? 0}%`}
          sub={`${stats?.laneCount ?? 0} published lanes`}
          icon={TrendingUp}
          tone="text-violet-600"
        />
      </div>

      <AirDashboardChart
        title="Revenue overview"
        subtitle="Monthly earnings from AWB bookings"
        data={chartData}
      />

      <AirDashboardTools tools={tools} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="shipments" className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="air-font-display text-2xl font-medium text-slate-900">Available AWBs</h2>
            <Link
              href="/air/forwarder/awbs"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {DEMO_AWBS.slice(0, 4).map((row) => (
              <div
                key={row.awb}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{row.awb}</p>
                  <p className="text-xs text-slate-500">
                    {row.route} · {row.weight}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="air-font-display text-lg text-slate-900">{row.rate}</p>
                  {bookedAwbs.includes(row.awb) ? (
                    <AirStatusBadge status="confirmed" />
                  ) : (
                    <Link
                      href="/air/forwarder/awbs"
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Accept
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="lanes" className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="air-font-display text-2xl font-medium text-slate-900">Priority lanes</h2>
            <Link href="/air/forwarder/lanes" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage
            </Link>
          </div>
          <ul className="space-y-4">
            {lanes.map((lane) => (
              <li key={lane} className="flex items-center gap-3 text-sm text-slate-700">
                <Package className="h-4 w-4 text-sky-600" />
                {lane}
              </li>
            ))}
          </ul>
          {profile?.shipmentTypes?.length ? (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Your specialisms
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.shipmentTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] capitalize text-slate-600"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section id="wallet" className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="air-font-display text-2xl font-medium text-slate-900">Settlement snapshot</h2>
            <Link href="/air/forwarder/settlement" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Open settlement
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending release</p>
              <p className="air-font-display mt-2 text-2xl text-slate-900">{stats?.pendingFormatted ?? "£0"}</p>
              <p className="mt-1 text-xs text-slate-500">{stats?.pendingSettlement ?? 0} confirmed bookings</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next payout</p>
              <p className="air-font-display mt-2 text-2xl text-slate-900">7 days</p>
              <p className="mt-1 text-xs text-slate-500">After delivery confirmation</p>
            </div>
          </div>
          <Link href="/air/forwarder/settlement" className="air-btn-primary mt-5 max-w-xs">
            Request settlement
          </Link>
        </section>

        <section className="air-card rounded-[28px] p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="air-font-display text-2xl font-medium text-slate-900">Recent bookings</h2>
            <Link href="/air/forwarder/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No bookings yet — accept an AWB to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{booking.awb}</p>
                    <p className="text-xs text-slate-500">
                      {booking.route} · {booking.rate}
                    </p>
                  </div>
                  <AirStatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AirActivityFeed
        items={activity}
        emptyMessage="Accept your first AWB to see activity here."
        viewAllHref="/air/forwarder/bookings"
      />
    </div>
  );
}
