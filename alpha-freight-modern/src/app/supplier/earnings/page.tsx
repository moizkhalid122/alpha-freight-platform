"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { calculateSupplierTotal } from "@/lib/load-commission";
import { useMarketCurrency } from "@/hooks/useMarketCurrency";
import { TrendingUp, BarChart3, PieChart, ArrowUpRight, Loader2, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type LoadRow = {
  id: string;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
};

type ChartPoint = { name: string; spending: number };

const ACTIVE_STATUSES = new Set(["active", "booked", "in-transit", "loading", "pending"]);

function buildMonthlyChart(loads: LoadRow[], currency: string): ChartPoint[] {
  const formatter = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const now = new Date();
  const points: ChartPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const spending = loads
      .filter((load) => {
        const created = load.created_at ? new Date(load.created_at) : null;
        return created && created >= monthDate && created < nextMonth;
      })
      .reduce(
        (sum, load) =>
          sum + calculateSupplierTotal(Number(load.price) || 0, currency).totalPayable,
        0
      );

    points.push({ name: formatter.format(monthDate), spending });
  }

  return points;
}

export default function SupplierEarnings() {
  const market = useMarketCurrency("supplier");
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<LoadRow[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoads([]);
          return;
        }

        const { data, error } = await supabase
          .from("loads")
          .select("id, price, status, created_at")
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setLoads((data ?? []) as LoadRow[]);
      } catch (error) {
        console.error("Error fetching supplier analytics:", error);
        setLoads([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalSpend = loads.reduce(
      (sum, load) =>
        sum + calculateSupplierTotal(Number(load.price) || 0, market.currency).totalPayable,
      0
    );
    const activeLoads = loads.filter((load) => ACTIVE_STATUSES.has(String(load.status || "").toLowerCase())).length;
    const avgLoadCost = loads.length > 0 ? totalSpend / loads.length : 0;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const thisMonthSpend = loads
      .filter((load) => {
        const created = load.created_at ? new Date(load.created_at) : null;
        return created && created >= monthStart;
      })
      .reduce(
        (sum, load) =>
          sum + calculateSupplierTotal(Number(load.price) || 0, market.currency).totalPayable,
        0
      );
    const lastMonthSpend = loads
      .filter((load) => {
        const created = load.created_at ? new Date(load.created_at) : null;
        return created && created >= lastMonthStart && created < monthStart;
      })
      .reduce(
        (sum, load) =>
          sum + calculateSupplierTotal(Number(load.price) || 0, market.currency).totalPayable,
        0
      );
    const spendChange =
      lastMonthSpend > 0
        ? Number((((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1))
        : 0;

    return { totalSpend, avgLoadCost, activeLoads, spendChange, loadCount: loads.length };
  }, [loads, market.currency]);

  const chartData = useMemo(
    () => buildMonthlyChart(loads, market.currency),
    [loads, market.currency]
  );

  const statCards = [
    {
      label: "Total Spending",
      value: market.formatMoney(stats.totalSpend),
      icon: <TrendingUp />,
      color: "blue",
      change: stats.spendChange === 0 ? "—" : `${stats.spendChange > 0 ? "+" : ""}${stats.spendChange}%`,
      positive: stats.spendChange <= 0,
    },
    {
      label: "Avg Load Cost",
      value: market.formatMoney(stats.avgLoadCost),
      icon: <BarChart3 />,
      color: "indigo",
      change: `${stats.loadCount} loads`,
      positive: true,
    },
    {
      label: "Active Loads",
      value: stats.activeLoads.toString(),
      icon: <PieChart />,
      color: "violet",
      change: "Live board",
      positive: true,
    },
    {
      label: "Currency",
      value: market.currency,
      icon: <ArrowUpRight />,
      color: "emerald",
      change: market.countryName,
      positive: true,
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[1600px] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 p-4 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">Analytics & Spending</h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Performance insights · {market.currency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            Last 6 months
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-black ${
                  stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Spending Trends</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly cost analysis ({market.currency})</p>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                tickFormatter={(value) => market.formatMoneyCompact(Number(value))}
              />
              <Tooltip
                formatter={(value) => [market.formatMoney(Number(value ?? 0)), "Spending"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              />
              <Area
                type="monotone"
                dataKey="spending"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSpending)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
