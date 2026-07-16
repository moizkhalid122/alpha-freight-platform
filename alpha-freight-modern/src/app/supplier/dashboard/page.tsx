"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Users,
  Search,
  CheckCircle2,
  Boxes,
  Wallet,
  MapPin,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/lib/supabase";

type KpiCardProps = {
  title: string;
  value: number | string;
  sub?: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DashboardStatus = "in-transit" | "delivered" | "available" | "booked" | "pending" | "accepted" | "rejected" | "completed" | string;

type RecentLoad = {
  id: string;
  route: string;
  carrier: string;
  price: number;
  status: DashboardStatus;
  date: string;
};

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
};

type InsightItem = {
  title: string;
  description: string;
  type: "trend" | "alert" | "saving" | "warning";
  icon: React.ComponentType<{ className?: string }>;
};

type RouteItem = {
  name: string;
  shipments: number;
  revenue: number;
};

type RevenuePoint = {
  key: string;
  name: string;
  value: number;
};

type CarrierPerformanceItem = {
  name: string;
  successRate: number;
};

type BidItem = {
  id: string;
  load_id: string | null;
  carrier_id: string | null;
  amount: number | string | null;
  status: DashboardStatus;
  created_at: string;
};

type LoadRecord = {
  id: string;
  supplier_id: string | null;
  carrier_id: string | null;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  status: DashboardStatus;
  created_at: string;
};

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

const formatMoney = (value: number) => `£${value.toLocaleString("en-GB")}`;

const getCity = (value: string | null | undefined) => {
  if (!value) return "—";
  return value.split(",")[0].trim();
};

const getShortCode = (id: string) => `AF-${id.slice(0, 8).toUpperCase()}`;

const ZERO_REVENUE_BREAKDOWN: RevenuePoint[] = [
  { key: "uk", name: "UK", value: 0 },
  { key: "eu", name: "EU", value: 0 },
  { key: "international", name: "International", value: 0 },
  { key: "express", name: "Express", value: 0 },
];

const buildRollingMonthlySpendData = (loads: LoadRecord[], monthsToShow = 12): RevenuePoint[] => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
  });
  const currentMonth = new Date();
  const firstMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (monthsToShow - 1), 1);

  const points = Array.from({ length: monthsToShow }, (_, index) => {
    const monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

    return {
      key,
      name: formatter.format(monthDate),
      value: 0,
    };
  });

  const pointMap = new Map(points.map((point) => [point.key, point]));

  loads.forEach((load) => {
    const loadDate = new Date(load.created_at);
    if (Number.isNaN(loadDate.getTime())) {
      return;
    }

    const key = `${loadDate.getFullYear()}-${loadDate.getMonth()}`;
    const point = pointMap.get(key);

    if (point) {
      point.value += Number(load.price) || 0;
    }
  });

  return points;
};

const KpiCard = ({ title, value, sub, tone, icon: Icon }: KpiCardProps) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${CARD} px-4 py-3`}>
    <div className={`mb-3 inline-flex rounded-lg p-2 ${tone}`}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-[11px] text-slate-500">{title}</p>
    <p className="mt-0.5 text-xl font-bold text-slate-900">
      {typeof value === "number" ? value.toLocaleString("en-GB") : value}
    </p>
    {sub ? <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p> : null}
  </motion.div>
);

const StatusBadge = ({ status }: { status: DashboardStatus }) => {
  const normalized = String(status || "active").replace("_", "-");
  const statusConfig: Record<string, string> = {
    active: "bg-blue-50 text-blue-700",
    "pending-payment": "bg-slate-100 text-slate-600",
    booked: "bg-amber-50 text-amber-700",
    "in-transit": "bg-violet-50 text-violet-700",
    completed: "bg-emerald-50 text-emerald-700",
    delivered: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${statusConfig[normalized] || statusConfig.active}`}>
      {normalized.replace("-", " ")}
    </span>
  );
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function PremiumSupplierDashboard() {
  // Dashboard state
  const [timeRange, setTimeRange] = useState("3M");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const [bidFeedback, setBidFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Live data states
  const [activeShipments, setActiveShipments] = useState(0);
  const [completedLoads, setCompletedLoads] = useState(0);
  const [totalFreight, setTotalFreight] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [recentLoads, setRecentLoads] = useState<RecentLoad[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<ActivityItem[]>([]);
  const [aiInsights, setAiInsights] = useState<InsightItem[]>([
    { title: "Demand Trends", description: "Manchester routes are 30% more in demand this week", type: "trend", icon: TrendingUp },
    { title: "Route Recommendations", description: "Avoid M6 due to heavy traffic - use alternative route", type: "alert", icon: AlertTriangle },
    { title: "Cost Optimization", description: "Potential savings of £245 on next shipment", type: "saving", icon: DollarSign },
    { title: "Shipment Risk Alert", description: "Weather warnings for Newcastle area tomorrow", type: "warning", icon: AlertTriangle }
  ]);
  const [topRoutes, setTopRoutes] = useState<RouteItem[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenuePoint[]>(ZERO_REVENUE_BREAKDOWN);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformanceItem[]>([]);
  const [incomingBids, setIncomingBids] = useState<BidItem[]>([]);
  const [supplierName, setSupplierName] = useState("Supplier");


  const handleBidAction = async (bidId: string, action: "accept" | "reject") => {
    try {
      setProcessingBidId(bidId);
      setBidFeedback(null);
      // Pehle bid ke details fetch karo taake load_id aur carrier_id mil jaye
      const { data: bid, error: bidFetchError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single<BidItem>();

      if (bidFetchError) throw bidFetchError;

      if (action === 'accept') {
        // 1. Yeh bid ko accepted status do
        const { error: updateBidError } = await supabase
          .from('bids')
          .update({ status: 'accepted' })
          .eq('id', bidId);

        if (updateBidError) throw updateBidError;

        // 2. Uss load par aur saari bids ko reject kar do
        const { error: rejectOtherBidsError } = await supabase
          .from('bids')
          .update({ status: 'rejected' })
          .eq('load_id', bid.load_id)
          .neq('id', bidId); // Is bid ko chhod ke

        if (rejectOtherBidsError) throw rejectOtherBidsError;

        // 3. Load ko update karo: carrier assign karo, status booked karo
        const { data: updatedLoad, error: updateLoadError } = await supabase
          .from('loads')
          .update({ 
            carrier_id: bid.carrier_id, 
            status: 'booked'
          })
          .eq('id', bid.load_id)
          .select('id, carrier_id, status')
          .maybeSingle();

        if (updateLoadError) throw updateLoadError;
        if (!updatedLoad || updatedLoad.carrier_id !== bid.carrier_id || updatedLoad.status !== 'booked') {
          throw new Error("Load update blocked by Supabase policy. Please fix `loads` table RLS/update policy.");
        }

      } else {
        // Sirf is bid ko reject karo
        const { error: rejectBidError } = await supabase
          .from('bids')
          .update({ status: 'rejected' })
          .eq('id', bidId);

        if (rejectBidError) throw rejectBidError;
      }
      
      // Refresh bids and loads after update
      await fetchData();
      setBidFeedback({
        type: "success",
        message: action === "accept" ? "Bid accepted successfully." : "Bid rejected successfully.",
      });
    } catch (error) {
      console.error("Error handling bid action:", error);
      setBidFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update bid right now.",
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIncomingBids([]);
        setActiveShipments(0);
        setCompletedLoads(0);
        setTotalFreight(0);
        setRevenue(0);
        setRecentLoads([]);
        setActivityTimeline([]);
        setTopRoutes([]);
        setRevenueBreakdown(ZERO_REVENUE_BREAKDOWN);
        setCarrierPerformance([]);
        setAiInsights([
          { title: "No Live Activity", description: "Post a new load to unlock bid and performance insights.", type: "trend", icon: TrendingUp },
          { title: "Carrier Response", description: "Incoming bids will appear here once carriers start responding.", type: "alert", icon: AlertTriangle },
          { title: "Cost Visibility", description: "Spending and lane value analytics will populate from your live loads.", type: "saving", icon: DollarSign },
          { title: "Shipment Monitoring", description: "Once you book a load, movement updates will appear here.", type: "warning", icon: AlertTriangle },
        ]);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", user.id)
        .maybeSingle();

      setSupplierName(profile?.company_name || profile?.full_name || "Supplier");

      // Get supplier loads from Supabase
      const { data: allLoads, error: allLoadsError } = await supabase
        .from('loads')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      const typedLoads = (allLoads || []) as LoadRecord[];
      const loadIds = typedLoads.map((load) => load.id);
      let allBids: BidItem[] = [];
      let bidsError: Error | null = null;

      if (loadIds.length > 0) {
        const bidsResponse = await supabase
          .from('bids')
          .select('*')
          .in('load_id', loadIds)
          .order('created_at', { ascending: false });

        allBids = (bidsResponse.data || []) as BidItem[];
        bidsError = bidsResponse.error;
      }

      if (!bidsError && allBids) {
        setIncomingBids(allBids);
      }

      if (!allLoadsError && typedLoads.length > 0) {
        // Use real loads if available
        const active = typedLoads.filter((load) => load.status === "active" || load.status === "booked" || load.status === "in-transit").length;
        const completed = typedLoads.filter((load) => load.status === "delivered" || load.status === "completed").length;
        const total = typedLoads.length;
        const totalRev = typedLoads.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

        setActiveShipments(active);
        setCompletedLoads(completed);
        setTotalFreight(total);
        setRevenue(totalRev);

        setRecentLoads(typedLoads.slice(0, 10).map((load) => ({
          id: load.id,
          route: `${getCity(load.origin)} → ${getCity(load.destination)}`,
          carrier: load.carrier_id?.slice(0, 8) || "Unassigned",
          price: Number(load.price) || 0,
          status: load.status,
          date: new Date(load.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        })));

        const activities = typedLoads.slice(0, 5).map((load) => ({
          id: load.id,
          type: "load",
          title: `Load #${load.id.slice(0, 6)} ${load.status}`,
          description: `${load.origin || "Unknown"} to ${load.destination || "Unknown"}`,
          time: new Date(load.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? "Today" : "Recently",
          icon: Package,
        }));
        setActivityTimeline(activities);

        setRevenueData(buildRollingMonthlySpendData(typedLoads));

        const pendingBidsCount = allBids.filter((bid) => bid.status === "pending").length;
        const bookedLoadsCount = typedLoads.filter((load) => load.status === "booked").length;
        const highValueLoadsCount = typedLoads.filter((load) => Number(load.price) >= 1000).length;
        const averageRevenue = total ? Math.round(totalRev / total) : 0;

        setAiInsights([
          {
            title: "Pending Bid Activity",
            description: pendingBidsCount > 0 ? `${pendingBidsCount} bid${pendingBidsCount === 1 ? "" : "s"} need review from your team.` : "No bids are waiting for approval right now.",
            type: pendingBidsCount > 0 ? "alert" : "trend",
            icon: pendingBidsCount > 0 ? AlertTriangle : TrendingUp,
          },
          {
            title: "Booked Load Volume",
            description: bookedLoadsCount > 0 ? `${bookedLoadsCount} shipment${bookedLoadsCount === 1 ? "" : "s"} already secured with carriers.` : "No booked loads yet. Accept a carrier bid to lock capacity.",
            type: bookedLoadsCount > 0 ? "trend" : "warning",
            icon: bookedLoadsCount > 0 ? CheckCircle2 : AlertTriangle,
          },
          {
            title: "Average Load Value",
            description: total > 0 ? `Current average freight value is £${averageRevenue.toLocaleString()} per load.` : "Post your first load to generate live value insights.",
            type: "saving",
            icon: DollarSign,
          },
          {
            title: "High Value Freight",
            description: highValueLoadsCount > 0 ? `${highValueLoadsCount} premium shipment${highValueLoadsCount === 1 ? "" : "s"} exceed the £1,000 mark.` : "No premium-value loads detected yet in your active board.",
            type: highValueLoadsCount > 0 ? "trend" : "warning",
            icon: highValueLoadsCount > 0 ? Sparkles : AlertTriangle,
          },
        ]);

        const routeMap = new Map<string, RouteItem>();
        typedLoads.forEach((load) => {
          const routeKey = `${load.origin || "Unknown"}-${load.destination || "Unknown"}`;
          const current = routeMap.get(routeKey) || { shipments: 0, revenue: 0 };
          routeMap.set(routeKey, {
            name: routeKey,
            shipments: current.shipments + 1,
            revenue: current.revenue + (Number(load.price) || 0),
          });
        });
        const sortedRoutes = Array.from(routeMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
        setTopRoutes(sortedRoutes);

        const uk = typedLoads
          .filter((load) => load.origin?.includes("UK") || load.destination?.includes("UK") || !load.origin?.includes(","))
          .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
        const eu = typedLoads
          .filter((load) => !load.origin?.includes("UK") && !load.destination?.includes("UK") && (load.origin?.includes("Europe") || load.origin?.includes(",") || load.destination?.includes(",")))
          .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
        setRevenueBreakdown([
          { key: "uk", name: "UK", value: uk },
          { key: "eu", name: "EU", value: eu },
          { key: "international", name: "International", value: 0 },
          { key: "express", name: "Express", value: 0 },
        ]);

        // Calculate real carrier performance
        const carrierMap = new Map<string, { name: string; totalLoads: number; deliveredLoads: number }>();
        typedLoads.forEach((load) => {
          const carrierId = load.carrier_id || "Unknown";
          const carrierName = load.carrier_id ? `${load.carrier_id.slice(0, 8)}...` : "Unknown Carrier";
          if (!carrierMap.has(carrierId)) {
            carrierMap.set(carrierId, { name: carrierName, totalLoads: 0, deliveredLoads: 0 });
          }
          const carrier = carrierMap.get(carrierId);
          if (!carrier) return;
          carrier.totalLoads++;
          if (load.status === "delivered" || load.status === "completed") {
            carrier.deliveredLoads++;
          }
        });

        // Convert to array and calculate success rate
        const carriers = Array.from(carrierMap.values()).map((carrier) => ({
          name: carrier.name,
          successRate: carrier.totalLoads > 0 ? Math.round((carrier.deliveredLoads / carrier.totalLoads) * 100) : 0,
        })).sort((a, b) => b.successRate - a.successRate).slice(0, 3);

        setCarrierPerformance(carriers);

      } else {
        // No loads, set everything to empty/zero
        setActiveShipments(0);
        setCompletedLoads(0);
        setTotalFreight(0);
        setRevenue(0);
        setRecentLoads([]);
        setActivityTimeline([]);
        
        // Initialize chart data with zeros
        setRevenueData(buildRollingMonthlySpendData([]));
        
        setTopRoutes([]);
        setRevenueBreakdown(ZERO_REVENUE_BREAKDOWN);
        setCarrierPerformance([]);
        setAiInsights([
          { title: "No Live Activity", description: "Post a new load to unlock bid and performance insights.", type: "trend", icon: TrendingUp },
          { title: "Carrier Response", description: "Incoming bids will appear here once carriers start responding.", type: "alert", icon: AlertTriangle },
          { title: "Cost Visibility", description: "Spending and lane value analytics will populate from your live loads.", type: "saving", icon: DollarSign },
          { title: "Shipment Monitoring", description: "Once you book a load, movement updates will appear here.", type: "warning", icon: AlertTriangle },
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // On error, set everything to empty/zero
      setActiveShipments(0);
      setCompletedLoads(0);
      setTotalFreight(0);
      setRevenue(0);
      setRecentLoads([]);
      setActivityTimeline([]);
      
      setRevenueData(buildRollingMonthlySpendData([]));
      
      setTopRoutes([]);
      setRevenueBreakdown(ZERO_REVENUE_BREAKDOWN);
      setCarrierPerformance([]);
      setAiInsights([
        { title: "Data Unavailable", description: "We could not load live dashboard intelligence right now.", type: "warning", icon: AlertTriangle },
        { title: "Retry Suggested", description: "Refresh the dashboard after checking your connection and session.", type: "alert", icon: AlertTriangle },
        { title: "Spend Sync Paused", description: "Financial analytics will reappear after the next successful sync.", type: "saving", icon: DollarSign },
        { title: "Tracking Feed Offline", description: "Shipment monitoring widgets are waiting for fresh load data.", type: "warning", icon: AlertTriangle },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads'
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLoads = recentLoads.filter((load) =>
    load.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRevenueData = useMemo(() => {
    const windowSize = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[timeRange] || 3;
    return revenueData.slice(-windowSize);
  }, [revenueData, timeRange]);

  const completionRate = totalFreight > 0 ? Math.round((completedLoads / totalFreight) * 100) : 0;
  const completionSummary = totalFreight > 0
    ? `${completedLoads} of ${totalFreight} loads completed`
    : "Post loads to unlock completion analytics";

  const pendingBidsCount = useMemo(
    () => incomingBids.filter((bid) => bid.status === "pending").length,
    [incomingBids]
  );

  const pendingBidsPreview = useMemo(
    () => incomingBids.filter((bid) => bid.status === "pending").slice(0, 4),
    [incomingBids]
  );
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-blue-600 p-1.5">
                <LayoutDashboard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Operations overview
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Welcome back, {supplierName}</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Live snapshot of your freight postings, bids, and spend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/supplier/my-posts"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              My posts
            </Link>
            {pendingBidsCount > 0 ? (
              <Link
                href="/supplier/my-bids"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {pendingBidsCount} pending bid{pendingBidsCount === 1 ? "" : "s"}
              </Link>
            ) : null}
            <Link
              href="/supplier/post-load"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Post a load
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard title="Active shipments" value={activeShipments} sub="Live, booked & in transit" tone="text-blue-600 bg-blue-50" icon={Boxes} />
          <KpiCard title="Completed" value={completedLoads} sub="Delivered or closed" tone="text-emerald-600 bg-emerald-50" icon={CheckCircle2} />
          <KpiCard title="Total loads" value={totalFreight} sub="All postings" tone="text-violet-600 bg-violet-50" icon={Package} />
          <KpiCard title="Freight spend" value={formatMoney(revenue)} sub="Lifetime posted value" tone="text-slate-700 bg-slate-100" icon={Wallet} />
        </div>
      </motion.div>

      {bidFeedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] font-semibold ${
            bidFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {bidFeedback.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Analytics</p>
              <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Spending overview</h3>
            </div>
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {["1M", "3M", "6M", "1Y"].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    timeRange === range ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `£${v}`} width={48} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                        <p className="text-[10px] text-slate-500">{payload[0].payload.name}</p>
                        <p className="text-[13px] font-bold text-slate-900">{formatMoney(Number(payload[0].value) || 0)}</p>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-blue-50 p-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Intelligence</p>
              <h3 className="text-[15px] font-bold text-slate-900">Freight insights</h3>
            </div>
          </div>
          <div className="space-y-2.5">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    insight.type === "alert" || insight.type === "warning"
                      ? "bg-amber-50 text-amber-600"
                      : insight.type === "saving"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <insight.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">{insight.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${CARD} p-5 sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marketplace</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Incoming bids</h3>
          </div>
          <Link href="/supplier/my-bids" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {pendingBidsPreview.length > 0 ? (
            pendingBidsPreview.map((bid) => (
              <div
                key={bid.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900">
                    {formatMoney(Number(bid.amount) || 0)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Load {bid.load_id ? getShortCode(bid.load_id) : "—"} · Carrier{" "}
                    {bid.carrier_id?.slice(0, 8) || "Unknown"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBidAction(bid.id, "reject")}
                    disabled={processingBidId === bid.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBidAction(bid.id, "accept")}
                    disabled={processingBidId === bid.id}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {processingBidId === bid.id ? "Saving…" : "Accept"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
              <Clock className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-900">No pending bids</p>
              <p className="mt-1 text-[12px] text-slate-500">Carrier offers will appear here when loads go live.</p>
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tracking</p>
              <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Live shipments</h3>
            </div>
            <Link href="/supplier/track" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
              Open live map
            </Link>
          </div>
          {recentLoads.length > 0 ? (
            <div className="space-y-2.5">
              {recentLoads.slice(0, 4).map((load) => (
                <Link
                  key={load.id}
                  href={`/supplier/track/${load.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-slate-900">{load.route}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {load.carrier} · {load.date}
                    </p>
                  </div>
                  <StatusBadge status={load.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
              <MapPin className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-900">No active routes</p>
              <p className="mt-1 text-[12px] text-slate-500">Post freight to start live tracking here.</p>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Timeline</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Recent activity</h3>
          </div>
          {activityTimeline.length > 0 ? (
            <div className="space-y-3">
              {activityTimeline.map((activity, index) => {
                const IconComponent = activity.icon || Package;
                return (
                  <div key={activity.id} className="relative pl-5">
                    {index < activityTimeline.length - 1 ? (
                      <div className="absolute bottom-0 left-[7px] top-5 w-px bg-slate-200" />
                    ) : null}
                    <div className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <div className="h-1 w-1 rounded-full bg-blue-600" />
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <IconComponent className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900">{activity.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{activity.description}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
              <Package className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-900">No activity yet</p>
              <p className="mt-1 text-[12px] text-slate-500">Updates appear when loads are posted and booked.</p>
            </div>
          )}
        </motion.section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Carriers</p>
          <h4 className="mt-0.5 text-[14px] font-bold text-slate-900">Performance</h4>
          <div className="mt-4 space-y-3">
            {carrierPerformance.length > 0 ? (
              carrierPerformance.map((carrier, i) => (
                <div key={carrier.name}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="truncate text-slate-600">{carrier.name}</span>
                    <span className="font-semibold text-slate-900">{carrier.successRate}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${carrier.successRate}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.8 }}
                      className="h-full rounded-full bg-blue-600"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-[12px] text-slate-500">No carrier data yet</p>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lanes</p>
          <h4 className="mt-0.5 text-[14px] font-bold text-slate-900">Top routes</h4>
          <div className="mt-4 space-y-2.5">
            {topRoutes.length > 0 ? (
              topRoutes.map((route) => (
                <div key={route.name} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-slate-900">{route.name}</p>
                    <p className="text-[10px] text-slate-500">{route.shipments} shipment{route.shipments === 1 ? "" : "s"}</p>
                  </div>
                  <p className="shrink-0 text-[12px] font-bold text-slate-900">{formatMoney(route.revenue)}</p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center">
                <MapPin className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-[12px] text-slate-500">No routes yet</p>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Spend</p>
          <h4 className="mt-0.5 text-[14px] font-bold text-slate-900">Breakdown</h4>
          <div className="mt-3 h-28">
            {revenueBreakdown.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={4} dataKey="value">
                    {revenueBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                          <p className="text-[10px] text-slate-500">{payload[0].name}</p>
                          <p className="text-[13px] font-bold text-slate-900">{formatMoney(Number(payload[0].value) || 0)}</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <Wallet className="mb-2 h-6 w-6 text-slate-300" />
                <p className="text-[12px] text-slate-500">No spend data</p>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Delivery</p>
          <h4 className="mt-0.5 text-[14px] font-bold text-slate-900">Completion rate</h4>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight text-slate-900">{completionRate}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.25, duration: 0.9 }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {completionSummary}
            </p>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className={`${CARD} overflow-hidden`}
      >
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shipments</p>
              <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Recent loads</h3>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search route or carrier…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100 p-2 sm:p-3">
          {filteredLoads.length > 0 ? (
            filteredLoads.map((load) => (
              <div
                key={load.id}
                className="flex flex-col gap-3 rounded-lg px-3 py-3 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{load.route}</p>
                    <p className="text-[11px] text-slate-500">
                      {load.carrier} · {load.date}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 pl-12 sm:pl-0">
                  <p className="text-[13px] font-bold text-slate-900">{formatMoney(load.price)}</p>
                  <StatusBadge status={load.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-900">No loads found</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {searchTerm ? "Try a different search term." : "Post a load to see shipments here."}
              </p>
              {!searchTerm ? (
                <Link
                  href="/supplier/post-load"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Post a load
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
