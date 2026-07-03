"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import gsap from "gsap";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import {
  Layer as MapLayer,
  Marker as MapMarker,
  Source as MapSource,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/lib/mapbox";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  Loader2,
  MapPin,
  Navigation,
  PackageCheck,
  Route,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MeasuredChart from "@/components/charts/MeasuredChart";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-data-client";
import { readCarrierExtras } from "@/lib/profile-extras";

type KpiCard = {
  label: string;
  value: string;
  note: string;
  trend: string;
  trendPositive: boolean;
  icon: LucideIcon;
  sparkline: Array<{ index: number; value: number }>;
};

type QuickAction = {
  label: string;
  href: string;
  note: string;
  icon: LucideIcon;
};

type PulseItem = {
  id: string;
  type: "load" | "verification" | "finance" | "dispute";
  title: string;
  detail: string;
  time: string;
  actor: string;
};

type TableRow = {
  user: string;
  action: string;
  time: string;
  status: "Success" | "Pending" | "Failed";
};

type MapShipment = {
  id: string;
  city: string;
  status: "In Transit" | "Delivered" | "Pending";
  lng: number;
  lat: number;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  company_name?: string | null;
  role: string | null;
  created_at: string | null;
  verification_status?: string | null;
};

type PriorityTask = {
  label: string;
  href: string;
  tone: "rose" | "amber" | "slate";
};

type LoadStatusBreakdown = {
  label: string;
  value: number;
  tone: string;
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

const pulsePageSize = 4;
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
const IN_TRANSIT_LOAD_STATUSES = new Set(["loading", "in-transit", "assigned", "booked"]);
const PENDING_SHIPMENT_STATUSES = new Set(["pending", "active", "available"]);
const COMMISSION_RATE = 0.12;
const REGION_COORDINATES: Record<string, { lng: number; lat: number; region: string }> = {
  london: { lng: -0.1276, lat: 51.5072, region: "London" },
  birmingham: { lng: -1.8904, lat: 52.4862, region: "Midlands" },
  manchester: { lng: -2.2426, lat: 53.4808, region: "North West" },
  leeds: { lng: -1.5491, lat: 53.8008, region: "Midlands" },
  glasgow: { lng: -4.2518, lat: 55.8642, region: "Scotland" },
  bristol: { lng: -2.5879, lat: 51.4545, region: "South West" },
  liverpool: { lng: -2.9779, lat: 53.4084, region: "North West" },
  sheffield: { lng: -1.4701, lat: 53.3811, region: "Midlands" },
  newcastle: { lng: -1.6178, lat: 54.9783, region: "North East" },
  nottingham: { lng: -1.1581, lat: 52.9548, region: "Midlands" },
  southampton: { lng: -1.4044, lat: 50.9097, region: "South East" },
  cardiff: { lng: -3.1791, lat: 51.4816, region: "Wales" },
  edinburgh: { lng: -3.1883, lat: 55.9533, region: "Scotland" },
};
const STATIC_QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add Carrier",
    href: "/admin/carriers/add",
    note: "Manual carrier registration",
    icon: UserPlus,
  },
  {
    label: "Add Supplier",
    href: "/admin/suppliers/add",
    note: "Create shipper profile manually",
    icon: Building2,
  },
  {
    label: "Post Load",
    href: "/admin/loads",
    note: "Create a load on behalf of supplier",
    icon: Truck,
  },
  {
    label: "Generate Report",
    href: "/admin/analytics/custom-reports",
    note: "Export PDF or Excel reports",
    icon: FileSpreadsheet,
  },
  {
    label: "Send Notification",
    href: "/admin/settings/notifications",
    note: "Broadcast to carriers and suppliers",
    icon: Send,
  },
  {
    label: "View All",
    href: "/admin/users/activity-log",
    note: "Open complete admin activity area",
    icon: ArrowRight,
  },
];

const MapComponent = dynamic(
  () =>
    import("react-map-gl/mapbox").then((mod) => {
      const { Map } = mod;
      return function AdminMapWrapper(
        props: Record<string, unknown> & { children?: React.ReactNode }
      ) {
        return <Map {...props}>{props.children}</Map>;
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        Initialising Maps...
      </div>
    ),
  }
);

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getProfileName(profile: ProfileRecord | undefined) {
  if (!profile) return "Unknown account";
  return profile.company_name?.trim() || profile.full_name?.trim() || "Unknown account";
}

function getVerificationStatus(profile: ProfileRecord) {
  const extras = readCarrierExtras(profile.id);
  return normalizeStatus(
    extras.verificationStatus || profile.verification_status || "pending"
  );
}

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-[15px] font-bold text-slate-900";

function normalizeStatus(status: string | null | undefined) {
  return String(status || "pending").trim().toLowerCase();
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

function buildSparkline(values: number[]) {
  return values.map((value, index) => ({ index, value }));
}

function getCityToken(location: string | null | undefined) {
  const base = String(location || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  return base;
}

function getRegionInfo(location: string | null | undefined) {
  const token = getCityToken(location);
  return REGION_COORDINATES[token];
}

function getShipmentStatus(status: string | null | undefined): MapShipment["status"] {
  const normalized = normalizeStatus(status);
  if (DELIVERED_LOAD_STATUSES.has(normalized)) return "Delivered";
  if (IN_TRANSIT_LOAD_STATUSES.has(normalized)) return "In Transit";
  return "Pending";
}

function getRouteLabel(load: LoadRecord) {
  const origin = load.origin || load.pickup_location || "Pickup";
  const destination = load.destination || load.delivery_location || "Delivery";
  return `${origin} to ${destination}`;
}

async function fetchOverview() {
  const [profilesResponse, loadsResponse] = await Promise.all([
    adminFetch<{ profiles: ProfileRecord[] }>("/api/admin/profiles"),
    adminFetch<{ loads: LoadRecord[]; bids: BidRecord[] }>("/api/admin/loads"),
  ]);

  const profiles = profilesResponse.profiles ?? [];
  const loads = loadsResponse.loads ?? [];
  const bids = loadsResponse.bids ?? [];

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const loadById = new Map(loads.map((load) => [load.id, load]));

  const carriers = profiles.filter((profile) => profile.role === "carrier");
  const suppliers = profiles.filter((profile) => profile.role === "supplier");

  const todayStart = startOfDay(new Date());
  const yesterdayStart = startOfDay(subDays(todayStart, 1));
  const weekStart = startOfDay(subDays(new Date(), 6));
  const previousWeekStart = startOfDay(subDays(weekStart, 7));
  const monthStart = startOfDay(subDays(new Date(), 29));

  const activeLoads = loads.filter((load) => ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status)));
  const deliveredLoads = loads.filter((load) => DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)));
  const pendingLoads = loads.filter((load) => PENDING_SHIPMENT_STATUSES.has(normalizeStatus(load.status)));
  const matchedLoads = loads.filter(
    (load) => Boolean(load.carrier_id) || MATCHED_LOAD_STATUSES.has(normalizeStatus(load.status))
  );

  const verifiedCarriers: ProfileRecord[] = [];
  const pendingVerifications: ProfileRecord[] = [];

  carriers.forEach((profile) => {
    const status = getVerificationStatus(profile);
    if (status === "verified") {
      verifiedCarriers.push(profile);
    } else if (["pending", "needs_info", "rejected", "in_review", "review"].includes(status)) {
      pendingVerifications.push(profile);
    } else if (!profile.verification_status) {
      pendingVerifications.push(profile);
    }
  });

  const unmatchedLoads = loads.filter(
    (load) =>
      !load.carrier_id &&
      !DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)) &&
      ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
  );
  const inTransitLoads = loads.filter((load) =>
    IN_TRANSIT_LOAD_STATUSES.has(normalizeStatus(load.status))
  );
  const deliveredCount = deliveredLoads.length;

  const activeSupplierIds = new Set(
    loads
      .filter((load) => {
        const createdAt = getDateOrNull(load.created_at);
        return createdAt && createdAt >= monthStart;
      })
      .map((load) => load.supplier_id)
      .filter(Boolean)
  );
  const activeSuppliers = suppliers.filter((profile) => activeSupplierIds.has(profile.id));

  const thisWeekNewUsers = profiles.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= weekStart;
  }).length;
  const previousWeekNewUsers = profiles.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
  }).length;
  const thisWeekNewCarriers = carriers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= weekStart;
  }).length;
  const previousWeekNewCarriers = carriers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
  }).length;
  const thisWeekNewSuppliers = suppliers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= weekStart;
  }).length;
  const previousWeekNewSuppliers = suppliers.filter((profile) => {
    const createdAt = getDateOrNull(profile.created_at);
    return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
  }).length;

  const todayRevenue = loads.reduce((total, load) => {
    const createdAt = getDateOrNull(load.created_at);
    if (!createdAt || createdAt < todayStart) return total;
    return total + toNumber(load.price) * COMMISSION_RATE;
  }, 0);
  const yesterdayRevenue = loads.reduce((total, load) => {
    const createdAt = getDateOrNull(load.created_at);
    if (!createdAt || createdAt < yesterdayStart || createdAt >= todayStart) return total;
    return total + toNumber(load.price) * COMMISSION_RATE;
  }, 0);
  const pendingRevenue = pendingLoads.reduce((total, load) => total + toNumber(load.price) * COMMISSION_RATE, 0);

  const revenueTrend = Array.from({ length: 7 }).map((_, index) => {
    const dayStart = startOfDay(subDays(new Date(), 6 - index));
    const nextDay = startOfDay(subDays(new Date(), 5 - index));

    const revenue = loads.reduce((sum, load) => {
      const createdAt = getDateOrNull(load.created_at);
      if (!createdAt || createdAt < dayStart || createdAt >= nextDay) return sum;
      return sum + toNumber(load.price) * COMMISSION_RATE;
    }, 0);

    const cleared = loads.reduce((sum, load) => {
      const createdAt = getDateOrNull(load.created_at);
      if (!createdAt || createdAt < dayStart || createdAt >= nextDay) return sum;
      if (!DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))) return sum;
      return sum + toNumber(load.price) * COMMISSION_RATE;
    }, 0);

    return {
      day: format(dayStart, "EEE"),
      revenue,
      cleared,
    };
  });

  const loadsActivity = Array.from({ length: 6 }).map((_, index) => {
    const dayStart = startOfDay(subDays(new Date(), 5 - index));
    const nextDay = startOfDay(subDays(new Date(), 4 - index));
    const dayLoads = loads.filter((load) => {
      const createdAt = getDateOrNull(load.created_at);
      return createdAt && createdAt >= dayStart && createdAt < nextDay;
    });

    return {
      label: format(dayStart, "EEE"),
      posted: dayLoads.length,
      matched: dayLoads.filter(
        (load) => Boolean(load.carrier_id) || MATCHED_LOAD_STATUSES.has(normalizeStatus(load.status))
      ).length,
    };
  });

  const growthTrend = Array.from({ length: 4 }).map((_, index) => {
    const currentWeekStart = startOfDay(subDays(new Date(), (3 - index) * 7 + 6));
    const weekEnd = startOfDay(subDays(new Date(), (2 - index) * 7 + 6));

    return {
      week: `W${index + 1}`,
      carriers: carriers.filter((profile) => {
        const createdAt = getDateOrNull(profile.created_at);
        return createdAt && createdAt >= currentWeekStart && createdAt < weekEnd;
      }).length,
      suppliers: suppliers.filter((profile) => {
        const createdAt = getDateOrNull(profile.created_at);
        return createdAt && createdAt >= currentWeekStart && createdAt < weekEnd;
      }).length,
    };
  });

  const regionCounts = new Map<string, number>();
  loads.forEach((load) => {
    const region = getRegionInfo(load.origin || load.pickup_location)?.region;
    if (!region) return;
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  });

  const regionPalette = ["#10b981", "#6366f1", "#0f172a", "#94a3b8", "#cbd5e1"];
  const totalRegionLoads = Array.from(regionCounts.values()).reduce((sum, count) => sum + count, 0);
  const loadDistribution = Array.from(regionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value,
      percent: totalRegionLoads > 0 ? Math.round((value / totalRegionLoads) * 100) : 0,
      color: regionPalette[index] ?? "#CBD5E1",
    }));

  const shipmentCandidates = loads
    .map((load) => {
      const location = load.origin || load.pickup_location;
      const regionInfo = getRegionInfo(location);
      if (!regionInfo) return null;

      return {
        id: load.id,
        city: (location || "Unknown").split(",")[0],
        lng: regionInfo.lng,
        lat: regionInfo.lat,
        status: getShipmentStatus(load.status),
        createdAt: getDateOrNull(load.created_at)?.getTime() ?? 0,
      };
    })
    .filter((item): item is MapShipment & { createdAt: number } => Boolean(item))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map((shipment) => ({
      id: shipment.id,
      city: shipment.city,
      lng: shipment.lng,
      lat: shipment.lat,
      status: shipment.status,
    }));

  const pulseEvents = [
    ...loads.slice(0, 8).map((load) => {
      const supplier = profileById.get(load.supplier_id || "");
      return {
        timestamp: getDateOrNull(load.created_at)?.getTime() ?? 0,
        item: {
          id: `load-${load.id}`,
          type: "load" as const,
          title: `Load ${load.id.slice(0, 8)} posted by ${getProfileName(supplier)}`,
          detail: getRouteLabel(load),
          time: formatDistanceToNow(getDateOrNull(load.created_at) ?? new Date(), { addSuffix: true }),
          actor: getProfileName(supplier),
        },
      };
    }),
    ...bids.slice(0, 8).map((bid) => {
      const carrier = profileById.get(bid.carrier_id || "");
      const relatedLoad = loadById.get(bid.load_id || "");
      const bidStatus = normalizeStatus(bid.status);
      const pulseType = bidStatus === "rejected" ? "dispute" : bidStatus === "accepted" ? "finance" : "load";

      return {
        timestamp: getDateOrNull(bid.created_at)?.getTime() ?? 0,
        item: {
          id: `bid-${bid.id}`,
          type: pulseType as PulseItem["type"],
          title:
            bidStatus === "accepted"
              ? `${getProfileName(carrier)} accepted bid for ${relatedLoad?.id.slice(0, 8) || "a load"}`
              : bidStatus === "rejected"
                ? `Bid ${bid.id.slice(0, 8)} rejected for ${relatedLoad?.id.slice(0, 8) || "a load"}`
                : `New bid from ${getProfileName(carrier)}`,
          detail: relatedLoad ? getRouteLabel(relatedLoad) : `Bid amount £${toNumber(bid.amount).toLocaleString()}`,
          time: formatDistanceToNow(getDateOrNull(bid.created_at) ?? new Date(), { addSuffix: true }),
          actor: getProfileName(carrier),
        },
      };
    }),
    ...pendingVerifications.slice(0, 6).map((profile) => ({
      timestamp: getDateOrNull(profile.created_at)?.getTime() ?? 0,
      item: {
        id: `verification-${profile.id}`,
        type: "verification" as const,
        title: `${getProfileName(profile)} awaiting admin verification`,
        detail: "Carrier onboarding is complete and requires approval review.",
        time: formatDistanceToNow(getDateOrNull(profile.created_at) ?? new Date(), { addSuffix: true }),
        actor: "Compliance Queue",
      },
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)
    .map((entry) => entry.item);

  const carrierCompletedMap = new Map<string, number>();
  deliveredLoads.forEach((load) => {
    if (!load.carrier_id) return;
    carrierCompletedMap.set(load.carrier_id, (carrierCompletedMap.get(load.carrier_id) ?? 0) + 1);
  });

  const supplierSpendMap = new Map<string, number>();
  const supplierLoadMap = new Map<string, number>();
  loads.forEach((load) => {
    if (!load.supplier_id) return;
    supplierSpendMap.set(load.supplier_id, (supplierSpendMap.get(load.supplier_id) ?? 0) + toNumber(load.price));
    supplierLoadMap.set(load.supplier_id, (supplierLoadMap.get(load.supplier_id) ?? 0) + 1);
  });

  const laneMap = new Map<string, number>();
  loads.forEach((load) => {
    const lane = `${(load.origin || load.pickup_location || "Pickup").split(",")[0]} to ${(load.destination || load.delivery_location || "Delivery").split(",")[0]}`;
    laneMap.set(lane, (laneMap.get(lane) ?? 0) + 1);
  });

  const topCarriers = Array.from(carrierCompletedMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([carrierId, count]) => ({
      name: getProfileName(profileById.get(carrierId)),
      metric: `${count} completed loads`,
      note: "Real completion volume from delivered shipments",
    }));

  const topSuppliers = Array.from(supplierSpendMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([supplierId, spend]) => ({
      name: getProfileName(profileById.get(supplierId)),
      metric: `GBP ${Math.round(spend).toLocaleString()} spend`,
      note: `${supplierLoadMap.get(supplierId) ?? 0} posted loads on platform`,
    }));

  const trendingLanes = Array.from(laneMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lane, volume]) => ({
      name: lane,
      metric: `${volume} live loads`,
      note: "Based on posted route volume",
    }));

  const profitableLoads = [...loads]
    .sort((a, b) => toNumber(b.price) - toNumber(a.price))
    .slice(0, 3)
    .map((load) => ({
      name: load.id.slice(0, 8),
      metric: `GBP ${Math.round(toNumber(load.price) * COMMISSION_RATE).toLocaleString()} commission`,
      note: getRouteLabel(load),
    }));

  const activityTable = [
    ...loads.slice(0, 6).map((load) => ({
      timestamp: getDateOrNull(load.created_at)?.getTime() ?? 0,
      row: {
        user: getProfileName(profileById.get(load.supplier_id || "")),
        action: `Posted load ${load.id.slice(0, 8)}`,
        time: format(getDateOrNull(load.created_at) ?? new Date(), "HH:mm"),
        status: "Success" as const,
      },
    })),
    ...bids.slice(0, 6).map((bid) => ({
      timestamp: getDateOrNull(bid.created_at)?.getTime() ?? 0,
      row: {
        user: getProfileName(profileById.get(bid.carrier_id || "")),
        action:
          normalizeStatus(bid.status) === "accepted"
            ? `Accepted bid for ${(bid.load_id || "").slice(0, 8) || "load"}`
            : normalizeStatus(bid.status) === "rejected"
              ? `Rejected bid for ${(bid.load_id || "").slice(0, 8) || "load"}`
              : `Submitted bid ${(bid.id || "").slice(0, 8)}`,
        time: format(getDateOrNull(bid.created_at) ?? new Date(), "HH:mm"),
        status:
          normalizeStatus(bid.status) === "rejected"
            ? ("Failed" as const)
            : normalizeStatus(bid.status) === "pending"
              ? ("Pending" as const)
              : ("Success" as const),
      },
    })),
    ...pendingVerifications.slice(0, 4).map((profile) => ({
      timestamp: getDateOrNull(profile.created_at)?.getTime() ?? 0,
      row: {
        user: getProfileName(profile),
        action: "Submitted verification docs",
        time: format(getDateOrNull(profile.created_at) ?? new Date(), "HH:mm"),
        status: "Pending" as const,
      },
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)
    .map((entry) => entry.row);

  const revenueSparkline = buildSparkline(revenueTrend.map((point) => Math.round(point.revenue)));
  const carrierSparkline = buildSparkline(growthTrend.map((point) => point.carriers));
  const supplierSparkline = buildSparkline(growthTrend.map((point) => point.suppliers));
  const activeLoadSparkline = buildSparkline(loadsActivity.map((point) => point.posted));
  const verificationSparkline = buildSparkline(
    Array.from({ length: 7 }).map((_, index) => {
      const dayCutoff = startOfDay(subDays(new Date(), 6 - index));
      return pendingVerifications.filter((profile) => {
        const createdAt = getDateOrNull(profile.created_at);
        return createdAt && createdAt >= dayCutoff;
      }).length;
    })
  );
  const weeklyUserSparkline = buildSparkline(growthTrend.map((point) => point.carriers + point.suppliers));

  const priorityTasks: PriorityTask[] = [
    ...(pendingVerifications.length > 0
      ? [
          {
            label: `${pendingVerifications.length} carrier verification${pendingVerifications.length === 1 ? "" : "s"} waiting for review`,
            href: "/admin/carriers/pending-verifications",
            tone: "rose" as const,
          },
        ]
      : []),
    ...(unmatchedLoads.length > 0
      ? [
          {
            label: `${unmatchedLoads.length} load${unmatchedLoads.length === 1 ? "" : "s"} still waiting for carrier match`,
            href: "/admin/loads",
            tone: "amber" as const,
          },
        ]
      : []),
    ...(pendingLoads.length > 0
      ? [
          {
            label: `${pendingLoads.length} shipment${pendingLoads.length === 1 ? "" : "s"} in pending / available status`,
            href: "/admin/loads/available",
            tone: "slate" as const,
          },
        ]
      : []),
  ];

  if (priorityTasks.length === 0) {
    priorityTasks.push({
      label: "No urgent admin queue items right now — monitor live activity below.",
      href: "/admin/carriers",
      tone: "slate",
    });
  }

  const loadStatusBreakdown: LoadStatusBreakdown[] = [
    { label: "Available / pending", value: pendingLoads.length, tone: "text-amber-600" },
    { label: "Matched / in transit", value: inTransitLoads.length, tone: "text-blue-600" },
    { label: "Delivered", value: deliveredCount, tone: "text-emerald-600" },
    { label: "Unmatched active", value: unmatchedLoads.length, tone: "text-violet-600" },
  ];

  return {
    kpis: [
      {
        label: "Total Carriers",
        value: carriers.length.toLocaleString(),
        note: `${verifiedCarriers.length.toLocaleString()} verified and ${pendingVerifications.length.toLocaleString()} pending review`,
        trend: formatTrendValue(getTrendValue(thisWeekNewCarriers, previousWeekNewCarriers)),
        trendPositive: getTrendValue(thisWeekNewCarriers, previousWeekNewCarriers) >= 0,
        icon: Users,
        sparkline: carrierSparkline,
      },
      {
        label: "Total Suppliers",
        value: suppliers.length.toLocaleString(),
        note: `${activeSuppliers.length.toLocaleString()} active and ${(suppliers.length - activeSuppliers.length).toLocaleString()} inactive in 30 days`,
        trend: formatTrendValue(getTrendValue(thisWeekNewSuppliers, previousWeekNewSuppliers)),
        trendPositive: getTrendValue(thisWeekNewSuppliers, previousWeekNewSuppliers) >= 0,
        icon: Building2,
        sparkline: supplierSparkline,
      },
      {
        label: "Active Loads",
        value: activeLoads.length.toLocaleString(),
        note: `${matchedLoads.length.toLocaleString()} already matched or assigned`,
        trend: formatTrendValue(
          getTrendValue(
            activeLoads.filter((load) => {
              const createdAt = getDateOrNull(load.created_at);
              return createdAt && createdAt >= weekStart;
            }).length,
            activeLoads.filter((load) => {
              const createdAt = getDateOrNull(load.created_at);
              return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
            }).length
          )
        ),
        trendPositive:
          getTrendValue(
            activeLoads.filter((load) => {
              const createdAt = getDateOrNull(load.created_at);
              return createdAt && createdAt >= weekStart;
            }).length,
            activeLoads.filter((load) => {
              const createdAt = getDateOrNull(load.created_at);
              return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
            }).length
          ) >= 0,
        icon: Truck,
        sparkline: activeLoadSparkline,
      },
      {
        label: "Revenue Today",
        value: `GBP ${Math.round(todayRevenue).toLocaleString()}`,
        note: `GBP ${Math.round(pendingRevenue).toLocaleString()} estimated commission still pending`,
        trend: formatTrendValue(getTrendValue(todayRevenue, yesterdayRevenue)),
        trendPositive: getTrendValue(todayRevenue, yesterdayRevenue) >= 0,
        icon: CircleDollarSign,
        sparkline: revenueSparkline,
      },
      {
        label: "Pending Verifications",
        value: pendingVerifications.length.toLocaleString(),
        note: `${thisWeekNewCarriers.toLocaleString()} new carriers entered onboarding this week`,
        trend: formatTrendValue(
          getTrendValue(
            pendingVerifications.filter((profile) => {
              const createdAt = getDateOrNull(profile.created_at);
              return createdAt && createdAt >= weekStart;
            }).length,
            pendingVerifications.filter((profile) => {
              const createdAt = getDateOrNull(profile.created_at);
              return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
            }).length
          )
        ),
        trendPositive:
          getTrendValue(
            pendingVerifications.filter((profile) => {
              const createdAt = getDateOrNull(profile.created_at);
              return createdAt && createdAt >= weekStart;
            }).length,
            pendingVerifications.filter((profile) => {
              const createdAt = getDateOrNull(profile.created_at);
              return createdAt && createdAt >= previousWeekStart && createdAt < weekStart;
            }).length
          ) <= 0,
        icon: ShieldAlert,
        sparkline: verificationSparkline,
      },
      {
        label: "New Users",
        value: thisWeekNewUsers.toLocaleString(),
        note: "This week across carriers and suppliers",
        trend: formatTrendValue(getTrendValue(thisWeekNewUsers, previousWeekNewUsers)),
        trendPositive: getTrendValue(thisWeekNewUsers, previousWeekNewUsers) >= 0,
        icon: UserPlus,
        sparkline: weeklyUserSparkline,
      },
    ] as KpiCard[],
    revenueTrend,
    loadsActivity,
    growthTrend,
    loadDistribution,
    mapFilters: ["All", "In Transit", "Delivered", "Pending"],
    mapShipments: shipmentCandidates,
    pulse: pulseEvents as PulseItem[],
    quickActions: STATIC_QUICK_ACTIONS,
    topCarriers,
    topSuppliers,
    trendingLanes,
    profitableLoads,
    activityTable: activityTable as TableRow[],
    priorityTasks,
    loadStatusBreakdown,
    growthSummary: {
      carriersThisWeek: thisWeekNewCarriers,
      suppliersThisWeek: thisWeekNewSuppliers,
    },
    totals: {
      carriers: carriers.length,
      suppliers: suppliers.length,
      loads: loads.length,
      bids: bids.length,
    },
  };
}

function MiniSparkline({
  data,
  positive,
}: {
  data: Array<{ index: number; value: number }>;
  positive: boolean;
}) {
  return (
    <MeasuredChart className="h-12 w-full min-w-0">
      {({ width, height }) => (
        <AreaChart width={width} height={height} data={data}>
            <defs>
              <linearGradient
                id={positive ? "sparkPositive" : "sparkNegative"}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={positive ? "#84CC16" : "#F97316"}
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor={positive ? "#84CC16" : "#F97316"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={positive ? "#84CC16" : "#F97316"}
              strokeWidth={2.4}
              fill={`url(#${positive ? "sparkPositive" : "sparkNegative"})`}
            />
        </AreaChart>
      )}
    </MeasuredChart>
  );
}

export default function AdminDashboardPage() {
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const [pulseFilter, setPulseFilter] = useState<"all" | PulseItem["type"]>("all");
  const [pulseSearch, setPulseSearch] = useState("");
  const [pulsePage, setPulsePage] = useState(0);
  const [mapFilter, setMapFilter] = useState("All");
  const [mapViewState, setMapViewState] = useState({
    longitude: -2.4,
    latitude: 53.2,
    zoom: 4.8,
  });

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-overview-premium"],
    queryFn: fetchOverview,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!dashboardRef.current || !data) return;

    const elements = dashboardRef.current.querySelectorAll("[data-dashboard-item]");
    gsap.fromTo(
      elements,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.68,
        stagger: 0.05,
        ease: "power3.out",
      }
    );
  }, [data]);

  const kpis = data?.kpis ?? [];
  const revenueTrend = data?.revenueTrend ?? [];
  const loadsActivity = data?.loadsActivity ?? [];
  const growthTrend = data?.growthTrend ?? [];
  const loadDistribution = data?.loadDistribution ?? [];
  const mapShipments = data?.mapShipments;
  const mapFilters = data?.mapFilters ?? [];
  const quickActions = data?.quickActions ?? [];
  const activityTable = data?.activityTable ?? [];
  const priorityTasks = data?.priorityTasks ?? [];
  const loadStatusBreakdown = data?.loadStatusBreakdown ?? [];
  const growthSummary = data?.growthSummary ?? { carriersThisWeek: 0, suppliersThisWeek: 0 };
  const totals = data?.totals ?? { carriers: 0, suppliers: 0, loads: 0, bids: 0 };
  const lastUpdatedLabel = dataUpdatedAt
    ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true })
    : "just now";

  const filteredPulse = useMemo(() => {
    const items = data?.pulse ?? [];
    const term = pulseSearch.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter = pulseFilter === "all" || item.type === pulseFilter;
      const matchesSearch =
        term.length === 0 ||
        item.title.toLowerCase().includes(term) ||
        item.detail.toLowerCase().includes(term) ||
        item.actor.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [data?.pulse, pulseFilter, pulseSearch]);

  const paginatedPulse = useMemo(() => {
    const start = pulsePage * pulsePageSize;
    return filteredPulse.slice(start, start + pulsePageSize);
  }, [filteredPulse, pulsePage]);

  const pulsePageCount = Math.max(1, Math.ceil(filteredPulse.length / pulsePageSize));

  const filteredMapShipments = useMemo(() => {
    const shipments = mapShipments ?? [];
    if (mapFilter === "All") return shipments;
    return shipments.filter((shipment) => shipment.status === mapFilter);
  }, [mapFilter, mapShipments]);

  const featuredRoute = useMemo(() => {
    const points = filteredMapShipments.slice(0, 2);
    if (points.length < 2) return null;

    return {
      type: "LineString" as const,
      coordinates: points.map((point) => [point.lng, point.lat]),
    };
  }, [filteredMapShipments]);

  const highlightShipment = filteredMapShipments[0] ?? null;

  const performerGroups = useMemo(
    () => [
      {
        title: "Top Carriers",
        items: data?.topCarriers ?? [],
      },
      {
        title: "Top Suppliers",
        items: data?.topSuppliers ?? [],
      },
      {
        title: "Trending Lanes",
        items: data?.trendingLanes ?? [],
      },
      {
        title: "Most Profitable Loads",
        items: data?.profitableLoads ?? [],
      },
    ],
    [data?.profitableLoads, data?.topCarriers, data?.topSuppliers, data?.trendingLanes]
  );

  return (
    <div ref={dashboardRef} className="mx-auto max-w-[1400px] space-y-6">
      <header data-dashboard-item className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Live platform overview — carriers, suppliers, loads, revenue &amp; verifications
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200/60">
            Updated {lastUpdatedLabel}
          </span>
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </header>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-16 text-sm font-medium text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading live dashboard data from Supabase…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/60">
          Dashboard data could not be loaded. Check Supabase connection and try refresh.
        </div>
      ) : null}

      {!isLoading || data ? (
        <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((item, index) => {
          const Icon = item.icon;
          const TrendIcon = item.trendPositive ? ArrowUpRight : ArrowDownRight;

          return (
            <motion.div
              key={item.label}
              data-dashboard-item
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index, duration: 0.45 }}
              className={cn(CARD_CLASS, "relative overflow-hidden p-5")}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-slate-50 p-2.5 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    item.trendPositive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-orange-50 text-orange-700"
                  )}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {item.trend}
                </div>
              </div>
              <p className="mt-4 text-[11px] font-semibold text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-[28px] font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">{item.note}</p>
              <div className="mt-4">
                <MiniSparkline data={item.sparkline} positive={item.trendPositive} />
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <div data-dashboard-item className={cn(CARD_CLASS, "p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={SECTION_LABEL}>Revenue trend</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>
                Last seven days revenue momentum
              </h3>
            </div>
            <div className="inline-flex rounded-lg bg-slate-50 p-1 ring-1 ring-slate-200/60">
              {["7D", "30D", "90D"].map((range, index) => (
                <button
                  key={range}
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[11px] font-semibold",
                    index === 0 ? "bg-slate-900 text-white" : "text-slate-500"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <MeasuredChart className="mt-8 h-[300px] min-w-0">
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={revenueTrend}>
                <defs>
                  <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          Revenue: {formatGbp(Number(payload[0]?.value ?? 0))}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          Cleared: {formatGbp(Number(payload[1]?.value ?? 0))}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#adminRevenueFill)"
                />
                <Area
                  type="monotone"
                  dataKey="cleared"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            )}
          </MeasuredChart>
        </div>

        <div data-dashboard-item className={cn(CARD_CLASS, "p-6")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={SECTION_LABEL}>Loads activity</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>Posted vs matched</h3>
            </div>
            <ChartColumn className="h-5 w-5 text-slate-400" />
          </div>
          <MeasuredChart className="mt-6 h-[240px] min-w-0">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={loadsActivity} barGap={8}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
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
                      </div>
                    );
                  }}
                />
                <Bar dataKey="posted" fill="#CBD5E1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="matched" fill="#151B24" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div data-dashboard-item className={cn(CARD_CLASS, "flex h-full flex-col p-6")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={SECTION_LABEL}>Growth</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>Weekly registrations</h3>
            </div>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <MeasuredChart className="mt-6 h-[240px] min-w-0">
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={growthTrend}>
                <defs>
                  <linearGradient id="carrierGrowthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="carriers"
                  stroke="#151B24"
                  strokeWidth={2.5}
                  fill="url(#carrierGrowthFill)"
                />
                <Area
                  type="monotone"
                  dataKey="suppliers"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            )}
          </MeasuredChart>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-500">Carriers this week</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {growthSummary.carriersThisWeek.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-500">Suppliers this week</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {growthSummary.suppliersThisWeek.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div data-dashboard-item className={cn(CARD_CLASS, "flex h-full flex-col p-6")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={SECTION_LABEL}>Load distribution</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>By region</h3>
            </div>
            <PackageCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 grid flex-1 items-center gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <MeasuredChart className="mx-auto h-[240px] w-full max-w-[250px] min-w-0">
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={loadDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {loadDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </MeasuredChart>
            <div className="space-y-3">
              {loadDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">No regional load data yet.</p>
              ) : (
                loadDistribution.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {entry.percent}% <span className="font-medium text-slate-500">({entry.value})</span>
                  </span>
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px] 2xl:grid-cols-[minmax(0,1.34fr)_410px]">
        <div data-dashboard-item className={cn(CARD_CLASS, "p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={SECTION_LABEL}>Live map</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>
                Active shipments across the UK
              </h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {filteredMapShipments.length} shipment{filteredMapShipments.length === 1 ? "" : "s"} on map
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mapFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setMapFilter(filter)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[11px] font-semibold ring-1 ring-slate-200/60",
                    mapFilter === filter
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-slate-50 text-slate-500"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="relative h-[430px] overflow-hidden rounded-xl ring-1 ring-slate-200/60">
              <MapComponent
                {...mapViewState}
                onMove={(evt: { viewState: typeof mapViewState }) =>
                  setMapViewState(evt.viewState)
                }
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                scrollZoom={false}
              >
                {featuredRoute ? (
                <MapSource
                  id="admin-route"
                  type="geojson"
                  data={{ type: "Feature", geometry: featuredRoute, properties: {} }}
                >
                  <MapLayer
                    id="admin-route-layer"
                    type="line"
                    paint={{
                      "line-color": "#10b981",
                      "line-width": 3,
                      "line-opacity": 0.55,
                      "line-dasharray": [1, 1],
                    }}
                  />
                </MapSource>
                ) : null}

                {filteredMapShipments.map((shipment) => (
                  <MapMarker
                    key={shipment.id}
                    longitude={shipment.lng}
                    latitude={shipment.lat}
                  >
                    <div className="flex flex-col items-center group/marker">
                      <div
                        className={cn(
                          "rounded-full border-2 border-white p-2 shadow-lg transition-transform group-hover/marker:scale-110",
                          shipment.status === "Delivered" && "bg-emerald-500",
                          shipment.status === "Pending" && "bg-slate-900",
                          shipment.status === "In Transit" && "bg-blue-600"
                        )}
                      >
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="mt-1 rounded bg-slate-900 px-2 py-0.5 text-[8px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/marker:opacity-100">
                        {shipment.city}
                      </div>
                    </div>
                  </MapMarker>
                ))}
              </MapComponent>

              <div className="absolute left-4 top-4 right-4 rounded-xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200/60 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                    <Navigation className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Platform snapshot</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {totals.loads} loads · {totals.carriers} carriers · {totals.suppliers} suppliers
                    </p>
                  </div>
                </div>
              </div>

              {highlightShipment ? (
              <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200/60 backdrop-blur">
                <p className="text-[10px] font-semibold text-slate-500">Latest tracked shipment</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {highlightShipment.id.slice(0, 8).toUpperCase()} · {highlightShipment.city}
                </p>
                <p className="text-xs text-slate-500">Status: {highlightShipment.status}</p>
              </div>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.84fr_1.16fr]">
              <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                <p className="text-[10px] font-semibold text-slate-500">Load status breakdown</p>
                <div className="mt-4 grid gap-3">
                  {loadStatusBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60"
                    >
                      <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      <span className={cn("text-sm font-bold", item.tone)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
                <p className="text-[10px] font-semibold text-slate-500">Live shipments</p>
                <div className="mt-4 space-y-3">
                  {filteredMapShipments.length === 0 ? (
                    <p className="text-sm text-slate-500">No shipments match this filter.</p>
                  ) : (
                  filteredMapShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{shipment.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-slate-500">{shipment.city}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                        {shipment.status}
                      </span>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div data-dashboard-item className={cn(CARD_CLASS, "p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={SECTION_LABEL}>Quick actions</p>
                <h3 className={cn("mt-1", SECTION_TITLE)}>Admin shortcuts</h3>
              </div>
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-slate-700 ring-1 ring-slate-200/60">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.note}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-700" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div data-dashboard-item className={cn(CARD_CLASS, "p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={SECTION_LABEL}>Priority focus</p>
                <h3 className={cn("mt-1", SECTION_TITLE)}>Action queue</h3>
              </div>
              <ShieldAlert className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 space-y-2.5">
              {priorityTasks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-4 py-3.5 text-sm font-medium leading-6 ring-1 transition-colors hover:bg-white",
                    item.tone === "rose" && "bg-rose-50/80 text-rose-800 ring-rose-200/60",
                    item.tone === "amber" && "bg-amber-50/80 text-amber-900 ring-amber-200/60",
                    item.tone === "slate" && "bg-slate-50/80 text-slate-600 ring-slate-200/60"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div data-dashboard-item className={cn(CARD_CLASS, "p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={SECTION_LABEL}>Operations pulse</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>Live update feed</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "load", label: "Loads" },
                { key: "verification", label: "Verification" },
                { key: "finance", label: "Finance" },
                { key: "dispute", label: "Disputes" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setPulseFilter(tab.key as typeof pulseFilter);
                    setPulsePage(0);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[11px] font-semibold ring-1 ring-slate-200/60",
                    pulseFilter === tab.key
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-slate-50 text-slate-500"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={pulseSearch}
              onChange={(event) => {
                setPulseSearch(event.target.value);
                setPulsePage(0);
              }}
              placeholder="Search updates, actors, or status"
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-6 space-y-3">
            {paginatedPulse.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.type}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/60">
                    <Clock3 className="h-3.5 w-3.5" />
                    {item.time}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold tracking-tight text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {item.actor}
                </p>
              </div>
            ))}
            {paginatedPulse.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                No updates match the selected filters.
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-500">
              Page {pulsePage + 1} of {pulsePageCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPulsePage((current) => Math.max(0, current - 1))}
                disabled={pulsePage === 0}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPulsePage((current) => Math.min(pulsePageCount - 1, current + 1))
                }
                disabled={pulsePage >= pulsePageCount - 1}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div data-dashboard-item className={cn(CARD_CLASS, "p-6")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={SECTION_LABEL}>Top performers</p>
              <h3 className={cn("mt-1", SECTION_TITLE)}>Highest-value operators and lanes</h3>
            </div>
            <Route className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {performerGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60"
              >
                <p className="text-[10px] font-semibold text-slate-500">
                  {group.title}
                </p>
                <div className="mt-4 space-y-3">
                  {group.items.length === 0 ? (
                    <p className="text-sm text-slate-500">No data yet.</p>
                  ) : (
                  group.items.map((item, index) => (
                    <div
                      key={`${group.title}-${item.name}-${item.metric}-${index}`}
                      className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {item.metric}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                    </div>
                  ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        data-dashboard-item
        className={cn(CARD_CLASS, "p-6")}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={SECTION_LABEL}>Recent activity</p>
            <h3 className={cn("mt-1", SECTION_TITLE)}>Last platform actions</h3>
          </div>
          <Link href="/admin/users/activity-log">
            <Button variant="secondary" size="lg">
              Open full activity log
            </Button>
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200/60">
          <div className="grid grid-cols-[1.1fr_1.5fr_0.5fr_0.6fr] border-b border-slate-200 bg-slate-50 px-5 py-4 text-[11px] font-semibold text-slate-500">
            <span>User</span>
            <span>Action</span>
            <span>Time</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {activityTable.map((row) => (
              <div
                key={`${row.user}-${row.action}-${row.time}`}
                className="grid grid-cols-[1.1fr_1.5fr_0.5fr_0.6fr] items-center px-5 py-4 text-sm"
              >
                <span className="font-semibold text-slate-900">{row.user}</span>
                <span className="font-medium text-slate-600">{row.action}</span>
                <span className="font-semibold text-slate-500">{row.time}</span>
                <span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-[10px] font-semibold",
                      row.status === "Success" && "bg-emerald-50 text-emerald-700",
                      row.status === "Pending" && "bg-slate-100 text-slate-600",
                      row.status === "Failed" && "bg-red-100 text-red-600"
                    )}
                  >
                    {row.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
