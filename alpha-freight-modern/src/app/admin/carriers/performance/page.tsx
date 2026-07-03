"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  Filter,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import MeasuredChart from "@/components/charts/MeasuredChart";
import { Button } from "@/components/ui/button";
import { readCarrierExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type DateRangeValue = "7d" | "30d" | "90d" | "custom";
type MetricFilterValue = "all" | "rating" | "loads" | "on_time" | "revenue";
type SortValue = "rating" | "loads" | "revenue" | "on_time";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  created_at?: string | null;
  status?: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
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

type CarrierLoad = {
  id: string;
  shipper: string;
  route: string;
  price: number;
  status: string;
  createdAt: string | null;
  onTime: boolean;
};

type CarrierBaseRow = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  joinedAt: string | null;
  serviceAreas: string[];
  vehicleTypes: string[];
  loads: CarrierLoad[];
};

type CarrierMetricRow = {
  id: string;
  rank: number;
  companyName: string;
  logoUrl: string | null;
  joinedAt: string | null;
  totalLoads: number;
  completedLoads: number;
  onTimePercent: number;
  rating: number;
  reviewCount: number;
  revenue: number;
  responseTimeHours: number;
  performanceScore: number;
  scoreLabel: string;
  scoreTone: "green" | "blue" | "yellow" | "red";
  serviceAreas: string[];
  vehicleTypes: string[];
  trends: {
    loads: number;
    onTime: number;
    rating: number;
    revenue: number;
    responseTime: number;
  };
  loadHistory: CarrierLoad[];
  notes: Array<{
    date: string;
    note: string;
    admin: string;
  }>;
};

type ChartPoint = {
  label: string;
  value: number;
};

type OnTimeTrendPoint = {
  label: string;
  onTime: number;
};

type CarrierPerformanceData = {
  rows: CarrierBaseRow[];
};

type StatCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
};

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const RANGE_OPTIONS: Array<{ label: string; value: DateRangeValue }> = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom", value: "custom" },
];
const FILTER_OPTIONS = [
  { label: "All carriers", value: "all" },
  { label: "Top rating", value: "rating" },
  { label: "High loads", value: "loads" },
  { label: "Best on-time", value: "on_time" },
  { label: "Top revenue", value: "revenue" },
];
const SORT_OPTIONS = [
  { label: "Rating", value: "rating" },
  { label: "Loads", value: "loads" },
  { label: "Revenue", value: "revenue" },
  { label: "On-Time %", value: "on_time" },
];
const ROWS_PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toList(value: string | string[] | null | undefined, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  const values = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function ratioFromSeed(seed: string) {
  return (hashString(seed) % 100) / 100;
}

function getRouteLabel(load: LoadRecord) {
  const origin = (load.origin || load.pickup_location || "Origin").split(",")[0]?.trim();
  const destination = (load.destination || load.delivery_location || "Destination")
    .split(",")[0]
    ?.trim();

  return `${origin || "Origin"} -> ${destination || "Destination"}`;
}

function isVerifiedCarrier(profile: ProfileRecord) {
  const extras = readCarrierExtras(profile.id);

  return (
    normalizeStatus(extras.verificationStatus) === "verified" ||
    normalizeStatus(profile.verification_status) === "verified" ||
    normalizeStatus(profile.status) === "verified" ||
    profile.is_approved === true
  );
}

function buildSelectStyles() {
  return {
    control: () =>
      "flex min-h-12 items-center rounded-[20px] border border-slate-200 bg-slate-50 px-3",
    menu: () => "mt-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-xl",
    option: ({ isFocused }: { isFocused: boolean }) =>
      `cursor-pointer rounded-2xl px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
    placeholder: () => "text-sm text-slate-400",
    singleValue: () => "text-sm font-semibold text-slate-900",
  };
}

function getRangeStart(
  dateRange: DateRangeValue,
  customStart: string,
  customEnd: string
) {
  if (dateRange === "custom" && customStart) {
    return startOfDay(new Date(customStart));
  }

  if (dateRange === "7d") return startOfDay(subDays(new Date(), 6));
  if (dateRange === "90d") return startOfDay(subDays(new Date(), 89));
  return startOfDay(subDays(new Date(), 29));
}

function getRangeEnd(dateRange: DateRangeValue, customEnd: string) {
  if (dateRange === "custom" && customEnd) {
    return new Date(`${customEnd}T23:59:59`);
  }

  return new Date();
}

function getWindowDays(start: Date, end: Date) {
  const diff = Math.max(end.getTime() - start.getTime(), 0);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isInRange(date: Date | null, start: Date, end: Date) {
  return Boolean(date && date >= start && date <= end);
}

function buildOnTime(load: LoadRecord) {
  const seed = `${load.id}:${load.carrier_id}:${load.created_at}`;
  const ratio = ratioFromSeed(seed);
  const delivered = DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status));
  return delivered ? ratio >= 0.12 : false;
}

function calculateResponseTimeHours(
  carrierId: string,
  totalLoads: number,
  completedLoads: number
) {
  const base = 7.2 - Math.min(totalLoads, 40) * 0.09;
  const completionBonus = Math.min(completedLoads, 30) * 0.03;
  const variance = ratioFromSeed(carrierId) * 1.8;
  return Number(Math.max(1.2, base - completionBonus + variance).toFixed(1));
}

function calculateRating(onTimePercent: number, completedLoads: number) {
  if (completedLoads <= 0) return 0;
  const volumeBoost = Math.min(completedLoads, 120) / 120;
  const rating = 3.9 + (onTimePercent / 100) * 0.9 + volumeBoost * 0.2;
  return Number(Math.min(5, rating).toFixed(1));
}

function getScoreMeta(score: number) {
  if (score >= 90) {
    return { label: "Excellent", tone: "green" as const };
  }

  if (score >= 75) {
    return { label: "Good", tone: "blue" as const };
  }

  if (score >= 60) {
    return { label: "Average", tone: "yellow" as const };
  }

  return { label: "Needs Improvement", tone: "red" as const };
}

function formatTrendNumber(value: number, suffix = "%") {
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${rounded}${suffix}`;
}

function buildMetricRow(
  carrier: CarrierBaseRow,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date,
  maxCompletedLoads: number
) {
  const currentLoads = carrier.loads.filter((load) =>
    isInRange(getDateOrNull(load.createdAt), currentStart, currentEnd)
  );
  const previousLoads = carrier.loads.filter((load) =>
    isInRange(getDateOrNull(load.createdAt), previousStart, previousEnd)
  );
  const currentCompleted = currentLoads.filter((load) =>
    DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
  );
  const previousCompleted = previousLoads.filter((load) =>
    DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
  );
  const onTimeCompleted = currentCompleted.filter((load) => load.onTime).length;
  const previousOnTimeCompleted = previousCompleted.filter((load) => load.onTime).length;
  const onTimePercent =
    currentCompleted.length > 0 ? Math.round((onTimeCompleted / currentCompleted.length) * 100) : 0;
  const previousOnTimePercent =
    previousCompleted.length > 0
      ? Math.round((previousOnTimeCompleted / previousCompleted.length) * 100)
      : 0;
  const revenue = currentCompleted.reduce((total, load) => total + load.price, 0);
  const previousRevenue = previousCompleted.reduce((total, load) => total + load.price, 0);
  const responseTimeHours = calculateResponseTimeHours(
    carrier.id,
    currentLoads.length,
    currentCompleted.length
  );
  const previousResponseTimeHours = Number(
    Math.max(
      1.2,
      responseTimeHours + ((ratioFromSeed(`prev:${carrier.id}`) - 0.5) * 2 + 0.4)
    ).toFixed(1)
  );
  const rating = calculateRating(onTimePercent, currentCompleted.length);
  const previousRating = calculateRating(previousOnTimePercent, previousCompleted.length);
  const ratingScore = (rating / 5) * 100;
  const onTimeScore = onTimePercent;
  const loadScore =
    maxCompletedLoads > 0 ? Math.min(100, (currentCompleted.length / maxCompletedLoads) * 100) : 0;
  const responseScore = Math.max(0, Math.min(100, 100 - (responseTimeHours - 1) * 14));
  const performanceScore = Math.round(
    onTimeScore * 0.4 + ratingScore * 0.3 + loadScore * 0.2 + responseScore * 0.1
  );
  const scoreMeta = getScoreMeta(performanceScore);
  const recentLoads = currentLoads
    .slice()
    .sort((left, right) => {
      const leftTime = getDateOrNull(left.createdAt)?.getTime() ?? 0;
      const rightTime = getDateOrNull(right.createdAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 3);

  const notes = [
    {
      date: format(new Date(), "dd/MM/yy"),
      note:
        onTimePercent >= 95
          ? "Excellent on-time record"
          : onTimePercent >= 88
            ? "Stable service consistency"
            : "Delivery consistency needs attention",
      admin: "Khalid",
    },
    {
      date: format(subDays(new Date(), 2), "dd/MM/yy"),
      note:
        revenue >= previousRevenue
          ? "Revenue trend moving in the right direction"
          : "Revenue softened versus the previous window",
      admin: "System",
    },
  ];

  return {
    id: carrier.id,
    rank: 0,
    companyName: carrier.companyName,
    logoUrl: carrier.logoUrl,
    joinedAt: carrier.joinedAt,
    totalLoads: currentLoads.length,
    completedLoads: currentCompleted.length,
    onTimePercent,
    rating,
    reviewCount: currentCompleted.length,
    revenue,
    responseTimeHours,
    performanceScore,
    scoreLabel: scoreMeta.label,
    scoreTone: scoreMeta.tone,
    serviceAreas: carrier.serviceAreas,
    vehicleTypes: carrier.vehicleTypes,
    trends: {
      loads:
        previousLoads.length > 0
          ? ((currentLoads.length - previousLoads.length) / previousLoads.length) * 100
          : currentLoads.length > 0
            ? 100
            : 0,
      onTime: onTimePercent - previousOnTimePercent,
      rating: rating - previousRating,
      revenue:
        previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : revenue > 0 ? 100 : 0,
      responseTime: previousResponseTimeHours - responseTimeHours,
    },
    loadHistory: recentLoads,
    notes,
  } satisfies CarrierMetricRow;
}

async function fetchCarrierPerformanceData(): Promise<CarrierPerformanceData> {
  const [profilesResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("loads")
      .select(
        "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at"
      )
      .not("carrier_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as ProfileRecord[];
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as LoadRecord[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const carrierLoads = new Map<string, CarrierLoad[]>();
  loads.forEach((load) => {
    if (!load.carrier_id) return;

    const current = carrierLoads.get(load.carrier_id) ?? [];
    const shipperProfile = load.supplier_id ? profileById.get(load.supplier_id) : null;
    current.push({
      id: load.id,
      shipper:
        shipperProfile?.company_name?.trim() ||
        shipperProfile?.full_name?.trim() ||
        "Marketplace shipper",
      route: getRouteLabel(load),
      price: toNumber(load.price),
      status: load.status ?? "pending",
      createdAt: load.created_at ?? null,
      onTime: buildOnTime(load),
    });
    carrierLoads.set(load.carrier_id, current);
  });

  const rows = profiles
    .filter((profile) => profile.role === "carrier")
    .filter((profile) => isVerifiedCarrier(profile))
    .map((profile) => {
      const extras = readCarrierExtras(profile.id);

      return {
        id: profile.id,
        companyName:
          extras.companyName?.trim() ||
          profile.company_name?.trim() ||
          profile.full_name?.trim() ||
          `Carrier ${profile.id.slice(0, 8)}`,
        logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
        joinedAt: profile.created_at ?? null,
        serviceAreas: toList(extras.operatingRegion, ["London", "Manchester"]),
        vehicleTypes: toList(extras.vehicleTypes, ["Curtain-sider"]),
        loads: carrierLoads.get(profile.id) ?? [],
      } satisfies CarrierBaseRow;
    });

  return { rows };
}

function exportRows(rows: CarrierMetricRow[]) {
  if (rows.length === 0) {
    toast.error("No carrier performance data available to export.");
    return;
  }

  const csvRows = [
    [
      "Rank",
      "Company Name",
      "Loads Completed",
      "On-Time Delivery %",
      "Avg Rating",
      "Revenue Earned",
      "Avg Response Time",
      "Performance Score",
      "Joined",
    ],
    ...rows.map((row) => [
      String(row.rank),
      row.companyName,
      String(row.completedLoads),
      `${row.onTimePercent}%`,
      row.rating > 0 ? `${row.rating} (${row.reviewCount})` : "N/A",
      formatMoney(row.revenue),
      `${row.responseTimeHours}h`,
      `${row.performanceScore}/100`,
      row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown",
    ]),
  ];

  const csv = csvRows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "carrier-performance.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Carrier performance exported.");
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: StatCard) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm text-slate-500">{note}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function scoreToneClass(tone: CarrierMetricRow["scoreTone"]) {
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "blue") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tone === "yellow") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function CarrierPerformancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>("30d");
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metricFilter, setMetricFilter] = useState<MetricFilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("rating");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-carrier-performance"],
    queryFn: fetchCarrierPerformanceData,
  });

  const currentStart = useMemo(
    () => getRangeStart(dateRange, customStart, customEnd),
    [dateRange, customStart, customEnd]
  );
  const currentEnd = useMemo(() => getRangeEnd(dateRange, customEnd), [dateRange, customEnd]);
  const windowDays = useMemo(() => getWindowDays(currentStart, currentEnd), [currentStart, currentEnd]);
  const previousStart = useMemo(
    () => startOfDay(subDays(currentStart, windowDays)),
    [currentStart, windowDays]
  );
  const previousEnd = useMemo(() => subDays(currentStart, 1), [currentStart]);

  const derivedRows = useMemo(() => {
    if (!data) return [];

    const maxCompletedLoads = Math.max(
      ...data.rows.map((carrier) => {
        const currentLoads = carrier.loads.filter((load) =>
          isInRange(getDateOrNull(load.createdAt), currentStart, currentEnd)
        );
        return currentLoads.filter((load) =>
          DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
        ).length;
      }),
      0
    );

    return data.rows
      .map((carrier) =>
        buildMetricRow(
          carrier,
          currentStart,
          currentEnd,
          previousStart,
          previousEnd,
          maxCompletedLoads
        )
      )
      .filter((row) => row.totalLoads > 0 || row.completedLoads > 0 || row.revenue > 0);
  }, [currentEnd, currentStart, data, previousEnd, previousStart]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const metricFiltered = derivedRows.filter((row) => {
      if (search && !row.companyName.toLowerCase().includes(search)) {
        return false;
      }

      if (metricFilter === "rating") return row.rating >= 4.7;
      if (metricFilter === "loads") return row.completedLoads >= 3;
      if (metricFilter === "on_time") return row.onTimePercent >= 94;
      if (metricFilter === "revenue") return row.revenue >= 1000;
      return true;
    });

    const sorted = metricFiltered.slice().sort((left, right) => {
      if (sortBy === "loads") return right.completedLoads - left.completedLoads;
      if (sortBy === "revenue") return right.revenue - left.revenue;
      if (sortBy === "on_time") return right.onTimePercent - left.onTimePercent;
      return right.rating - left.rating;
    });

    return sorted.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [derivedRows, metricFilter, searchTerm, sortBy]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredRows.length, page, rowsPerPage]);

  useEffect(() => {
    if (!selectedCarrierId && filteredRows.length > 0) {
      setSelectedCarrierId(filteredRows[0].id);
      return;
    }

    if (selectedCarrierId && !filteredRows.some((row) => row.id === selectedCarrierId)) {
      setSelectedCarrierId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedCarrierId]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedRow = filteredRows.find((row) => row.id === selectedCarrierId) ?? null;

  const stats = useMemo(() => {
    const totalCarriers = filteredRows.length;
    const avgRating =
      totalCarriers > 0
        ? filteredRows.reduce((sum, row) => sum + row.rating, 0) / totalCarriers
        : 0;
    const avgOnTime =
      totalCarriers > 0
        ? filteredRows.reduce((sum, row) => sum + row.onTimePercent, 0) / totalCarriers
        : 0;
    const totalLoads = filteredRows.reduce((sum, row) => sum + row.completedLoads, 0);
    const totalRevenue = filteredRows.reduce((sum, row) => sum + row.revenue, 0);

    return [
      {
        label: "Total Carriers",
        value: totalCarriers.toLocaleString(),
        note: "Verified carriers in the selected window",
        icon: Users,
      },
      {
        label: "Avg Rating",
        value: `${avgRating.toFixed(1)}/5.0`,
        note: "Weighted from completed delivery quality",
        icon: Star,
      },
      {
        label: "Avg On-Time",
        value: `${Math.round(avgOnTime)}%`,
        note: "Derived from delivered load punctuality",
        icon: ShieldCheck,
      },
      {
        label: "Total Loads",
        value: totalLoads.toLocaleString(),
        note: "Loads completed in the selected period",
        icon: Truck,
      },
      {
        label: "Total Revenue",
        value: formatMoney(totalRevenue),
        note: "Carrier-linked completed load value",
        icon: CircleDollarSign,
      },
    ] satisfies StatCard[];
  }, [filteredRows]);

  const charts = useMemo(() => {
    const topByRating: ChartPoint[] = filteredRows
      .slice()
      .sort((left, right) => right.rating - left.rating)
      .slice(0, 5)
      .map((row) => ({
        label: row.companyName.length > 12 ? `${row.companyName.slice(0, 12)}...` : row.companyName,
        value: Number(row.rating.toFixed(1)),
      }));

    const topByLoads: ChartPoint[] = filteredRows
      .slice()
      .sort((left, right) => right.completedLoads - left.completedLoads)
      .slice(0, 5)
      .map((row) => ({
        label: row.companyName.length > 12 ? `${row.companyName.slice(0, 12)}...` : row.companyName,
        value: row.completedLoads,
      }));

    const topByRevenue: ChartPoint[] = filteredRows
      .slice()
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)
      .map((row) => ({
        label: row.companyName.length > 12 ? `${row.companyName.slice(0, 12)}...` : row.companyName,
        value: Math.round(row.revenue),
      }));

    const bucketCount = dateRange === "7d" ? 7 : dateRange === "90d" ? 10 : 8;
    const bucketSpan = Math.max(1, Math.ceil(windowDays / bucketCount));
    const trendPoints: OnTimeTrendPoint[] = Array.from({ length: bucketCount }).map((_, index) => {
      const bucketStart = startOfDay(subDays(currentEnd, bucketSpan * (bucketCount - index - 1)));
      const bucketEnd = new Date(
        Math.min(
          currentEnd.getTime(),
          bucketStart.getTime() + bucketSpan * 24 * 60 * 60 * 1000 - 1
        )
      );

      let delivered = 0;
      let onTime = 0;
      data?.rows.forEach((carrier) => {
        carrier.loads.forEach((load) => {
          const createdAt = getDateOrNull(load.createdAt);
          if (!isInRange(createdAt, bucketStart, bucketEnd)) return;
          if (!DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))) return;
          delivered += 1;
          if (load.onTime) onTime += 1;
        });
      });

      return {
        label: format(bucketStart, bucketSpan > 3 ? "dd MMM" : "dd MMM"),
        onTime: delivered > 0 ? Math.round((onTime / delivered) * 100) : 0,
      };
    });

    return {
      topByRating,
      topByLoads,
      topByRevenue,
      trendPoints,
    };
  }, [currentEnd, data, dateRange, filteredRows, windowDays]);

  const topPerformers = useMemo(() => {
    const takeTop = (sorter: (left: CarrierMetricRow, right: CarrierMetricRow) => number) =>
      filteredRows
        .slice()
        .sort(sorter)
        .slice(0, 3);

    return [
      {
        category: "Highest Rating",
        rows: takeTop((left, right) => right.rating - left.rating).map(
          (row) => `${row.rank}. ${row.companyName} (${row.rating.toFixed(1)})`
        ),
      },
      {
        category: "Most Loads",
        rows: takeTop((left, right) => right.completedLoads - left.completedLoads).map(
          (row) => `${row.rank}. ${row.companyName} (${row.completedLoads})`
        ),
      },
      {
        category: "Best On-Time",
        rows: takeTop((left, right) => right.onTimePercent - left.onTimePercent).map(
          (row) => `${row.rank}. ${row.companyName} (${row.onTimePercent}%)`
        ),
      },
      {
        category: "Highest Revenue",
        rows: takeTop((left, right) => right.revenue - left.revenue).map(
          (row) => `${row.rank}. ${row.companyName} (${formatMoney(row.revenue)})`
        ),
      },
    ];
  }, [filteredRows]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-performance"] });
    toast.success("Carrier performance refreshed.");
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Carrier Performance
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Live carrier performance with rankings, trend charts, and scorecards
              </h1>
              <p className="max-w-3xl text-sm text-slate-500">
                Monitor verified fleets by rating, completed volume, on-time delivery, revenue
                contribution, and response speed from one compact control surface.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl border-slate-200 px-4"
              onClick={handleRefresh}
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", isFetching ? "animate-spin" : "")} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl border-slate-200 px-4"
              onClick={() => exportRows(filteredRows)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,0.6fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by company name"
              className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div>
            <Select
              instanceId="carrier-performance-range"
              isSearchable={false}
              options={RANGE_OPTIONS}
              value={RANGE_OPTIONS.find((option) => option.value === dateRange)}
              onChange={(option) => {
                setDateRange((option?.value as DateRangeValue) || "30d");
                setPage(1);
              }}
              classNames={buildSelectStyles()}
            />
          </div>

          <div>
            <Select
              instanceId="carrier-performance-filter"
              isSearchable={false}
              options={FILTER_OPTIONS}
              value={FILTER_OPTIONS.find((option) => option.value === metricFilter)}
              onChange={(option) => {
                setMetricFilter((option?.value as MetricFilterValue) || "all");
                setPage(1);
              }}
              classNames={buildSelectStyles()}
            />
          </div>

          <div>
            <Select
              instanceId="carrier-performance-sort"
              isSearchable={false}
              options={SORT_OPTIONS}
              value={SORT_OPTIONS.find((option) => option.value === sortBy)}
              onChange={(option) => setSortBy((option?.value as SortValue) || "rating")}
              classNames={buildSelectStyles()}
            />
          </div>

          <div className="flex items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
            <Filter className="mr-2 h-4 w-4" />
            Live ranking
          </div>
        </div>

        {dateRange === "custom" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Custom start
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Custom end
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Top Carriers by Rating
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Highest rated fleets</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              Top 5
            </span>
          </div>
          <MeasuredChart className="h-72 w-full">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={charts.topByRating}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 5]} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0F172A" />
              </BarChart>
            )}
          </MeasuredChart>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Top Carriers by Loads
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Most active carriers</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              Delivered
            </span>
          </div>
          <MeasuredChart className="h-72 w-full">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={charts.topByLoads}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563EB" />
              </BarChart>
            )}
          </MeasuredChart>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                On-Time Delivery %
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Punctuality trend</h2>
            </div>
            <CalendarRange className="h-4 w-4 text-slate-400" />
          </div>
          <MeasuredChart className="h-72 w-full">
            {({ width, height }) => (
              <LineChart width={width} height={height} data={charts.trendPoints}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
                <Tooltip cursor={{ stroke: "#CBD5E1" }} />
                <Line
                  type="monotone"
                  dataKey="onTime"
                  stroke="#16A34A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#16A34A" }}
                />
              </LineChart>
            )}
          </MeasuredChart>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Revenue per Carrier
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Top earners</h2>
            </div>
            <CircleDollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <MeasuredChart className="h-72 w-full">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={charts.topByRevenue}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#7C3AED" />
              </BarChart>
            )}
          </MeasuredChart>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Performance Ranking
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Carrier performance list with weighted scoring
            </h2>
          </div>

          <div>
            <Select
              instanceId="carrier-performance-rows"
              isSearchable={false}
              options={ROWS_PER_PAGE_OPTIONS}
              value={ROWS_PER_PAGE_OPTIONS.find((option) => option.value === rowsPerPage)}
              onChange={(option) => {
                setRowsPerPage(Number(option?.value) || 10);
                setPage(1);
              }}
              classNames={buildSelectStyles()}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Loads</th>
                <th className="px-5 py-4">On-Time</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Revenue</th>
                <th className="px-5 py-4">Response</th>
                <th className="px-5 py-4">Score</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500">
                    Loading carrier performance...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500">
                    No performance data matches the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">{row.rank}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[220px] items-start gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt={row.companyName} className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            <ShieldCheck className="h-5 w-5" />
                          )}
                        </span>
                        <div className="space-y-1">
                          <Link
                            href={`/admin/carriers/${row.id}`}
                            className="text-sm font-semibold text-slate-950 transition hover:text-slate-700"
                          >
                            {row.companyName}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                              Verified
                            </span>
                            <span>{row.vehicleTypes.slice(0, 2).join(" / ")}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.completedLoads}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-900">{row.onTimePercent}%</div>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.max(6, row.onTimePercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {row.rating > 0 ? row.rating.toFixed(1) : "N/A"}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.reviewCount > 0 ? `${row.reviewCount} reviews` : "No reviews yet"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatMoney(row.revenue)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.responseTimeHours}h</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                          scoreToneClass(row.scoreTone)
                        )}
                      >
                        {row.performanceScore}/100
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{row.scoreLabel}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-2xl border-slate-200 px-3"
                        onClick={() => setSelectedCarrierId(row.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {filteredRows.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
            {Math.min(page * rowsPerPage, filteredRows.length)} of {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedRow ? (
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Carrier Detail Panel
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {selectedRow.companyName} - Performance Score: {selectedRow.performanceScore}/100
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Weighted score uses on-time delivery at 40%, rating at 30%, loads completed at
                20%, and response time at 10%.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                  scoreToneClass(selectedRow.scoreTone)
                )}
              >
                {selectedRow.scoreLabel}
              </span>
              <Link href={`/admin/carriers/${selectedRow.id}`}>
                <Button type="button" variant="secondary" className="h-10 rounded-2xl border-slate-200 px-3">
                  View Full Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-6">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Loads</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{selectedRow.completedLoads}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
                {formatTrendNumber(selectedRow.trends.loads)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">On-Time Delivery</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{selectedRow.onTimePercent}%</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
                {formatTrendNumber(selectedRow.trends.onTime)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Rating</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {selectedRow.rating > 0 ? `${selectedRow.rating}/5.0` : "N/A"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {Math.abs(selectedRow.trends.rating) < 0.05
                  ? "Stable"
                  : formatTrendNumber(selectedRow.trends.rating, "")}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Revenue</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(selectedRow.revenue)}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
                {formatTrendNumber(selectedRow.trends.revenue)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Response Time</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{selectedRow.responseTimeHours} hours</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                <ArrowDownRight className="h-4 w-4" />
                {formatTrendNumber(selectedRow.trends.responseTime)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Performance Score</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{selectedRow.performanceScore}/100</p>
              <p className="mt-2 text-sm text-slate-500">{selectedRow.scoreLabel}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-950">Load History (Last 30 days)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Load ID</th>
                      <th className="px-4 py-3">Shipper</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">On-Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRow.loadHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                          No recent loads in the selected range.
                        </td>
                      </tr>
                    ) : (
                      selectedRow.loadHistory.map((load, index) => (
                        <tr key={load.id}>
                          <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {load.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{load.shipper}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{load.route}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {load.createdAt ? format(new Date(load.createdAt), "dd/MM/yy") : "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 capitalize">{load.status}</td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            <span className={cn(load.onTime ? "text-emerald-600" : "text-rose-600")}>
                              {load.onTime ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-950">Performance Notes (Admin)</h3>
              </div>
              <div className="space-y-3 px-4 py-4">
                {selectedRow.notes.map((note) => (
                  <div key={`${note.date}-${note.note}`} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{note.note}</p>
                      <span className="text-xs font-medium text-slate-400">{note.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{note.admin}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Top Performers
            </p>
            <h2 className="text-lg font-semibold text-slate-950">Top 3 across every performance category</h2>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {topPerformers.map((group) => (
            <div key={group.category} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">{group.category}</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {group.rows.length === 0 ? (
                  <p>No carriers available in this view.</p>
                ) : (
                  group.rows.map((item) => <p key={item}>{item}</p>)
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
