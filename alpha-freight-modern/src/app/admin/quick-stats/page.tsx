"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  formatDistanceToNow,
  startOfDay,
  subDays,
} from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarRange,
  CircleDollarSign,
  Download,
  RefreshCcw,
  ShieldAlert,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MeasuredChart from "@/components/charts/MeasuredChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type RangeOption = 7 | 30 | 90;

type ProfileRecord = {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

type LoadRecord = {
  id: string;
  supplier_id: string | null;
  carrier_id: string | null;
  origin: string | null;
  destination: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
};

type BidRecord = {
  id: string;
  load_id: string | null;
  carrier_id: string | null;
  amount: number | string | null;
  status: string | null;
  created_at: string | null;
};

type QuickStatCard = {
  label: string;
  value: string;
  note: string;
  trend: string;
  trendPositive: boolean;
  icon: LucideIcon;
};

type LeaderboardItem = {
  name: string;
  metric: string;
  note: string;
};

type ActivityItem = {
  id: string;
  event: string;
  user: string;
  time: string;
};

type OverviewData = {
  cards: QuickStatCard[];
  revenueTrend: Array<{
    label: string;
    current: number;
    previous: number;
  }>;
  loadActivity: Array<{
    label: string;
    posted: number;
    matched: number;
    successRate: number;
  }>;
  topCarriers: LeaderboardItem[];
  topSuppliers: LeaderboardItem[];
  trendingLanes: LeaderboardItem[];
  activityFeed: ActivityItem[];
};

const ACTIVE_LOAD_STATUSES = new Set([
  "active",
  "available",
  "booked",
  "assigned",
  "pending",
  "loading",
  "in-transit",
]);
const MATCHED_LOAD_STATUSES = new Set([
  "booked",
  "assigned",
  "loading",
  "in-transit",
  "completed",
  "delivered",
]);
const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const COMMISSION_RATE = 0.12;
const RANGE_OPTIONS: Array<{ label: string; value: RangeOption }> = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(status: string | null | undefined) {
  return String(status || "pending").trim().toLowerCase();
}

function getProfileName(profile: ProfileRecord | undefined) {
  if (!profile) return "Unknown account";
  return profile.full_name || "Unknown account";
}

function getTrendValue(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function formatTrendValue(value: number) {
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${rounded}%`;
}

function formatMoney(value: number) {
  return `GBP ${Math.round(value).toLocaleString()}`;
}

function getRouteLabel(load: LoadRecord) {
  const origin = (load.origin || load.pickup_location || "Pickup").split(",")[0];
  const destination = (load.destination || load.delivery_location || "Delivery").split(",")[0];
  return `${origin} to ${destination}`;
}

function createChartBuckets(range: RangeOption) {
  const bucketCount = range === 90 ? 12 : range === 30 ? 10 : 7;
  const span = range === 90 ? 7 : range <= 7 ? 1 : 3;

  return Array.from({ length: bucketCount }).map((_, index) => {
    const daysAgoEnd = (bucketCount - 1 - index) * span;
    const bucketStart = startOfDay(subDays(new Date(), daysAgoEnd + span - 1));
    const bucketEnd = startOfDay(subDays(new Date(), daysAgoEnd - 1));

    return {
      label: format(bucketStart, span === 7 ? "dd MMM" : "dd MMM"),
      start: bucketStart,
      end: bucketEnd,
      previousStart: startOfDay(subDays(bucketStart, span)),
      previousEnd: bucketStart,
    };
  });
}

async function fetchQuickStats(range: RangeOption): Promise<OverviewData> {
  const [profilesResult, loadsResult, bidsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("loads")
      .select(
        "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("bids")
      .select("id, load_id, carrier_id, amount, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as ProfileRecord[];
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as LoadRecord[];
  const bids = (bidsResult.error ? [] : (bidsResult.data ?? [])) as BidRecord[];

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const carriers = profiles.filter((profile) => profile.role === "carrier");
  const suppliers = profiles.filter((profile) => profile.role === "supplier");

  const now = new Date();
  const rangeStart = startOfDay(subDays(now, range - 1));
  const previousRangeStart = startOfDay(subDays(rangeStart, range));
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(todayStart, 1));

  const rangeLoads = loads.filter((load) => {
    const createdAt = getDateOrNull(load.created_at);
    return createdAt && createdAt >= rangeStart;
  });

  const previousRangeLoads = loads.filter((load) => {
    const createdAt = getDateOrNull(load.created_at);
    return createdAt && createdAt >= previousRangeStart && createdAt < rangeStart;
  });

  const activeLoads = rangeLoads.filter((load) =>
    ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
  );

  const currentRevenueToday = loads.reduce((total, load) => {
    const createdAt = getDateOrNull(load.created_at);
    if (!createdAt || createdAt < todayStart) return total;
    return total + toNumber(load.price) * COMMISSION_RATE;
  }, 0);

  const previousRevenueToday = loads.reduce((total, load) => {
    const createdAt = getDateOrNull(load.created_at);
    if (!createdAt || createdAt < yesterdayStart || createdAt >= todayStart) return total;
    return total + toNumber(load.price) * COMMISSION_RATE;
  }, 0);

  const currentMatched = rangeLoads.filter(
    (load) => Boolean(load.carrier_id) || MATCHED_LOAD_STATUSES.has(normalizeStatus(load.status))
  );
  const previousMatched = previousRangeLoads.filter(
    (load) => Boolean(load.carrier_id) || MATCHED_LOAD_STATUSES.has(normalizeStatus(load.status))
  );

  const currentCarrierSignups = carriers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= rangeStart;
  }).length;
  const previousCarrierSignups = carriers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousRangeStart && createdAt < rangeStart;
  }).length;

  const currentSupplierSignups = suppliers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= rangeStart;
  }).length;
  const previousSupplierSignups = suppliers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousRangeStart && createdAt < rangeStart;
  }).length;

  const currentUserSignups = profiles.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= rangeStart;
  }).length;
  const previousUserSignups = profiles.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousRangeStart && createdAt < rangeStart;
  }).length;

  const activeSupplierIds = new Set(
    loads
      .filter((load) => {
        const createdAt = getDateOrNull(load.created_at);
        return createdAt && createdAt >= rangeStart;
      })
      .map((load) => load.supplier_id)
      .filter(Boolean)
  );

  const cards: QuickStatCard[] = [
    {
      label: "Total Carriers",
      value: carriers.length.toLocaleString(),
      note: `${currentCarrierSignups.toLocaleString()} joined in selected range`,
      trend: formatTrendValue(getTrendValue(currentCarrierSignups, previousCarrierSignups)),
      trendPositive: getTrendValue(currentCarrierSignups, previousCarrierSignups) >= 0,
      icon: Users,
    },
    {
      label: "Total Suppliers",
      value: suppliers.length.toLocaleString(),
      note: `${activeSupplierIds.size.toLocaleString()} active and ${(suppliers.length - activeSupplierIds.size).toLocaleString()} inactive`,
      trend: formatTrendValue(getTrendValue(currentSupplierSignups, previousSupplierSignups)),
      trendPositive: getTrendValue(currentSupplierSignups, previousSupplierSignups) >= 0,
      icon: Building2,
    },
    {
      label: "Active Loads",
      value: activeLoads.length.toLocaleString(),
      note: `${currentMatched.length.toLocaleString()} matched in selected range`,
      trend: formatTrendValue(getTrendValue(currentMatched.length, previousMatched.length)),
      trendPositive: getTrendValue(currentMatched.length, previousMatched.length) >= 0,
      icon: Truck,
    },
    {
      label: "Revenue Today",
      value: formatMoney(currentRevenueToday),
      note: `${formatMoney(previousRevenueToday)} yesterday`,
      trend: formatTrendValue(getTrendValue(currentRevenueToday, previousRevenueToday)),
      trendPositive: getTrendValue(currentRevenueToday, previousRevenueToday) >= 0,
      icon: CircleDollarSign,
    },
    {
      label: "Pending Verifications",
      value: "0",
      note: "Verification workflow is not yet modelled in live schema",
      trend: "0%",
      trendPositive: true,
      icon: ShieldAlert,
    },
    {
      label: "New Signups",
      value: currentUserSignups.toLocaleString(),
      note: `New users across the last ${range} days`,
      trend: formatTrendValue(getTrendValue(currentUserSignups, previousUserSignups)),
      trendPositive: getTrendValue(currentUserSignups, previousUserSignups) >= 0,
      icon: UserPlus,
    },
  ];

  const revenueTrend = createChartBuckets(range).map((bucket) => {
    const current = loads.reduce((sum, load) => {
      const createdAt = getDateOrNull(load.created_at);
      if (!createdAt || createdAt < bucket.start || createdAt >= bucket.end) return sum;
      return sum + toNumber(load.price) * COMMISSION_RATE;
    }, 0);

    const previous = loads.reduce((sum, load) => {
      const createdAt = getDateOrNull(load.created_at);
      if (!createdAt || createdAt < bucket.previousStart || createdAt >= bucket.previousEnd) return sum;
      return sum + toNumber(load.price) * COMMISSION_RATE;
    }, 0);

    return {
      label: bucket.label,
      current: Math.round(current),
      previous: Math.round(previous),
    };
  });

  const loadActivity = createChartBuckets(range).map((bucket) => {
    const posted = loads.filter((load) => {
      const createdAt = getDateOrNull(load.created_at);
      return createdAt && createdAt >= bucket.start && createdAt < bucket.end;
    }).length;

    const matched = loads.filter((load) => {
      const createdAt = getDateOrNull(load.created_at);
      if (!createdAt || createdAt < bucket.start || createdAt >= bucket.end) return false;
      return Boolean(load.carrier_id) || MATCHED_LOAD_STATUSES.has(normalizeStatus(load.status));
    }).length;

    return {
      label: bucket.label,
      posted,
      matched,
      successRate: posted > 0 ? Math.round((matched / posted) * 100) : 0,
    };
  });

  const carrierDeliveredMap = new Map<string, number>();
  const carrierInTransitMap = new Map<string, number>();
  loads.forEach((load) => {
    if (!load.carrier_id) return;
    const normalizedStatus = normalizeStatus(load.status);
    if (DELIVERED_LOAD_STATUSES.has(normalizedStatus)) {
      carrierDeliveredMap.set(
        load.carrier_id,
        (carrierDeliveredMap.get(load.carrier_id) ?? 0) + 1
      );
    }
    if (ACTIVE_LOAD_STATUSES.has(normalizedStatus)) {
      carrierInTransitMap.set(
        load.carrier_id,
        (carrierInTransitMap.get(load.carrier_id) ?? 0) + 1
      );
    }
  });

  const supplierVolumeMap = new Map<string, number>();
  const supplierSpendMap = new Map<string, number>();
  loads.forEach((load) => {
    if (!load.supplier_id) return;
    supplierVolumeMap.set(
      load.supplier_id,
      (supplierVolumeMap.get(load.supplier_id) ?? 0) + 1
    );
    supplierSpendMap.set(
      load.supplier_id,
      (supplierSpendMap.get(load.supplier_id) ?? 0) + toNumber(load.price)
    );
  });

  const laneMap = new Map<string, number>();
  loads.forEach((load) => {
    const lane = getRouteLabel(load);
    laneMap.set(lane, (laneMap.get(lane) ?? 0) + 1);
  });

  const topCarriers = Array.from(carrierDeliveredMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([carrierId, completed]) => ({
      name: getProfileName(profileById.get(carrierId)),
      metric: `${completed} completed loads`,
      note: `${carrierInTransitMap.get(carrierId) ?? 0} live loads in transit`,
    }));

  const topSuppliers = Array.from(supplierVolumeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([supplierId, volume]) => ({
      name: getProfileName(profileById.get(supplierId)),
      metric: `${volume} posted loads`,
      note: `${formatMoney(supplierSpendMap.get(supplierId) ?? 0)} total spend`,
    }));

  const trendingLanes = Array.from(laneMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lane, volume]) => ({
      name: lane,
      metric: `${volume} live requests`,
      note: "Based on total posted route volume",
    }));

  const activityFeed = [
    ...loads.slice(0, 8).map((load) => ({
      timestamp: getDateOrNull(load.created_at)?.getTime() ?? 0,
      item: {
        id: `load-${load.id}`,
        event: `Load ${load.id.slice(0, 8)} posted`,
        user: getProfileName(profileById.get(load.supplier_id || "")),
        time: formatDistanceToNow(getDateOrNull(load.created_at) ?? new Date(), {
          addSuffix: true,
        }),
      },
    })),
    ...profiles.slice(0, 8).map((profile) => ({
      timestamp: getDateOrNull(profile.created_at)?.getTime() ?? 0,
      item: {
        id: `profile-${profile.id}`,
        event: `New ${profile.role === "carrier" ? "carrier" : "supplier"} registered`,
        user: getProfileName(profile),
        time: formatDistanceToNow(getDateOrNull(profile.created_at) ?? new Date(), {
          addSuffix: true,
        }),
      },
    })),
    ...bids.slice(0, 8).map((bid) => ({
      timestamp: getDateOrNull(bid.created_at)?.getTime() ?? 0,
      item: {
        id: `bid-${bid.id}`,
        event:
          normalizeStatus(bid.status) === "accepted"
            ? "Bid accepted"
            : normalizeStatus(bid.status) === "rejected"
              ? "Bid rejected"
              : "New bid submitted",
        user: getProfileName(profileById.get(bid.carrier_id || "")),
        time: formatDistanceToNow(getDateOrNull(bid.created_at) ?? new Date(), {
          addSuffix: true,
        }),
      },
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)
    .map((entry) => entry.item);

  return {
    cards,
    revenueTrend,
    loadActivity,
    topCarriers,
    topSuppliers,
    trendingLanes,
    activityFeed,
  };
}

function ChartShell({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        {caption}
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function MetricCard({ item }: { item: QuickStatCard }) {
  const Icon = item.icon;
  const TrendIcon = item.trendPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
            item.trendPositive ? "bg-[#BFFF07]/15 text-slate-950" : "bg-orange-100 text-orange-700"
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {item.trend}
        </div>
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        {item.label}
      </p>
      <p className="mt-3 text-[30px] font-black tracking-tight text-slate-950">{item.value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{item.note}</p>
    </div>
  );
}

function LeaderboardCard({
  title,
  items,
}: {
  title: string;
  items: LeaderboardItem[];
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
        Quick Stats Table
      </p>
      <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${item.name}-${item.metric}-${index}`}
            className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">
                {index + 1}. {item.name}
              </p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                {item.metric}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.note}</p>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
            No live records available yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminQuickStatsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<RangeOption>(30);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-quick-stats", range],
    queryFn: () => fetchQuickStats(range),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const cards = data?.cards ?? [];
  const revenueTrend = data?.revenueTrend ?? [];
  const loadActivity = data?.loadActivity ?? [];
  const topCarriers = data?.topCarriers ?? [];
  const topSuppliers = data?.topSuppliers ?? [];
  const trendingLanes = data?.trendingLanes ?? [];
  const activityFeed = data?.activityFeed ?? [];

  const avgSuccessRate = useMemo(() => {
    if (loadActivity.length === 0) return 0;
    return Math.round(
      loadActivity.reduce((sum, item) => sum + item.successRate, 0) / loadActivity.length
    );
  }, [loadActivity]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-quick-stats"] });
  };

  const handleExport = () => {
    const rows = [
      ["Section", "Name", "Value", "Detail"],
      ...cards.map((card) => ["KPI", card.label, card.value, card.note]),
      ...topCarriers.map((item) => ["Top Carriers", item.name, item.metric, item.note]),
      ...topSuppliers.map((item) => ["Top Suppliers", item.name, item.metric, item.note]),
      ...trendingLanes.map((item) => ["Trending Lanes", item.name, item.metric, item.note]),
      ...activityFeed.map((item) => ["Recent Activity", item.event, item.user, item.time]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-quick-stats-${range}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              Quick Stats
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Platform snapshot with live operational signals
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Track carrier growth, supplier momentum, marketplace activity, and revenue movement in one dense executive surface.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]",
                    range === option.value ? "bg-[#151B24] text-white" : "text-slate-500"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setRange(30)}>
              <CalendarRange className="mr-2 h-4 w-4" />
              Set Date Range
            </Button>
            <Link href="/admin/users/activity-log">
              <Button size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <ChartShell title="Revenue Trend" caption={`Last ${range} days revenue`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Daily or grouped breakdown against the previous period.
            </p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Previous period compare
            </span>
          </div>
          <MeasuredChart className="h-[320px] min-w-0">
            {({ width, height }) => (
                <AreaChart width={width} height={height} data={revenueTrend}>
                  <defs>
                    <linearGradient id="quickStatsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">
                            Current: {formatMoney(Number(payload[0]?.value ?? 0))}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            Previous: {formatMoney(Number(payload[1]?.value ?? 0))}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fill="url(#quickStatsRevenueFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    stroke="#151B24"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
            )}
          </MeasuredChart>
        </ChartShell>

        <ChartShell title="Load Activity" caption="Posted vs matched">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Success rate average stays at {avgSuccessRate}% across the selected range.
            </p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {range <= 7 ? "Daily" : range === 30 ? "3-day view" : "Weekly view"}
            </span>
          </div>
          <MeasuredChart className="h-[320px] min-w-0">
            {({ width, height }) => (
                <BarChart width={width} height={height} data={loadActivity} barGap={8}>
                  <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const currentItem = loadActivity.find((item) => item.label === label);
                      return (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">
                            Posted: {payload[0]?.value}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            Matched: {payload[1]?.value}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            Success rate: {currentItem?.successRate ?? 0}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="posted" fill="#CBD5E1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="matched" fill="#151B24" radius={[8, 8, 0, 0]} />
                </BarChart>
            )}
          </MeasuredChart>
        </ChartShell>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <LeaderboardCard title="Top Carriers" items={topCarriers} />
        <LeaderboardCard title="Top Suppliers" items={topSuppliers} />
        <LeaderboardCard title="Trending Lanes" items={trendingLanes} />
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              Recent Activity
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Live timeline across the marketplace
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            Fresh registration, load, and bid events surface here automatically.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {activityFeed.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[150px_minmax(0,1fr)_220px]"
            >
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#BFFF07]" />
                <span className="text-sm font-black text-slate-950">{item.time}</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{item.event}</p>
              <p className="text-sm text-slate-500">
                {index + 1}. {item.user}
              </p>
            </div>
          ))}
          {activityFeed.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
              No recent platform activity is available yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
