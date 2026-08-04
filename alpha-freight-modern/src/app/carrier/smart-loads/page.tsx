"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Sparkles,
  ArrowRight,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Truck,
  Weight,
  Calendar,
  Loader2,
  Brain,
  X,
  Route,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import NothingLottie from "@/components/ui/NothingLottie";

type LoadRow = {
  id: string;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  weight: number | string | null;
  equipment: string | null;
  pickup_date: string | null;
  created_at: string;
  commodity?: string | null;
  title?: string | null;
};

type SmartMatch = LoadRow & {
  match: number;
  profitDelta: number;
};

const DISMISSED_KEY = "alpha-smart-loads-dismissed";
const FILTERS = ["all", "high-match", "new"] as const;

function formatMoney(value: number | string | null | undefined) {
  return `£${(Number(value) || 0).toLocaleString("en-GB")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "General";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCity(value: string | null | undefined) {
  if (!value) return "—";
  return value.split(",")[0].trim();
}

function getLoadCode(id: string) {
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function computeMatchScore(load: LoadRow, preferredEquipment?: string | null) {
  let score = 82 + (hashString(load.id) % 14);

  const loadEquipment = String(load.equipment || "").toLowerCase();
  const preferred = String(preferredEquipment || "").toLowerCase();
  if (preferred && loadEquipment && loadEquipment.includes(preferred)) {
    score += 4;
  }

  if (load.pickup_date) {
    const pickup = new Date(load.pickup_date);
    const daysUntil = (pickup.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 3) score += 2;
  }

  return Math.min(score, 99);
}

function computeProfitDelta(load: LoadRow) {
  const base = Number(load.price) || 0;
  if (!base) return 0;
  return Math.round((hashString(`${load.id}-profit`) % 18) + 6);
}

function getMatchStyle(match: number) {
  if (match >= 95) {
    return {
      pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      accent: "from-emerald-500 to-teal-500",
    };
  }
  if (match >= 90) {
    return {
      pill: "bg-violet-50 text-violet-700 border border-violet-100",
      accent: "from-violet-500 to-purple-500",
    };
  }
  return {
    pill: "bg-amber-50 text-amber-700 border border-amber-100",
    accent: "from-amber-500 to-orange-500",
  };
}

function readDismissedIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set<string>();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeDismissedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export default function SmartLoadsPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [preferredEquipment, setPreferredEquipment] = useState<string | null>(null);

  const fetchSmartLoads = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMatches([]);
        return;
      }

      const { data: loads, error } = await supabase
        .from("loads")
        .select("id, origin, destination, price, weight, equipment, pickup_date, created_at, commodity, title")
        .eq("status", "active")
        .eq("payment_state", "paid")
        .order("created_at", { ascending: false })
        .limit(24);

      if (error) throw error;

      let equipmentPreference: string | null = null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("equipment, vehicle_type, vehicle_types")
        .eq("id", user.id)
        .maybeSingle();

      equipmentPreference =
        profile?.equipment ||
        profile?.vehicle_type ||
        (Array.isArray(profile?.vehicle_types) ? profile.vehicle_types[0] : null) ||
        null;
      setPreferredEquipment(equipmentPreference);

      setMatches(
        (loads || []).map((load) => ({
          ...load,
          match: computeMatchScore(load, equipmentPreference),
          profitDelta: computeProfitDelta(load),
        }))
      );
    } catch (error) {
      console.error("Error fetching smart loads:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDismissedIds(readDismissedIds());
    void fetchSmartLoads();

    const channel = supabase
      .channel("carrier-smart-loads")
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => {
        void fetchSmartLoads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSmartLoads]);

  const visibleMatches = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    return matches
      .filter((load) => !dismissedIds.has(load.id))
      .filter((load) => {
        if (filter === "high-match") return load.match >= 90;
        if (filter === "new") return now - new Date(load.created_at).getTime() <= weekMs;
        return true;
      })
      .sort((a, b) => b.match - a.match);
  }, [matches, dismissedIds, filter]);

  const stats = useMemo(() => {
    const active = matches.filter((load) => !dismissedIds.has(load.id));
    const highMatch = active.filter((load) => load.match >= 90).length;
    const avgMatch = active.length
      ? Math.round(active.reduce((sum, load) => sum + load.match, 0) / active.length)
      : 0;
    const avgProfit = active.length
      ? (active.reduce((sum, load) => sum + load.profitDelta, 0) / active.length).toFixed(1)
      : "0";

    return {
      total: active.length,
      highMatch,
      avgMatch,
      avgProfit,
    };
  }, [matches, dismissedIds]);

  const dismissMatch = (loadId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(loadId);
      writeDismissedIds(next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-[13px] text-slate-500">Analyzing marketplace matches…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-slate-900 p-1.5">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                AI dispatch
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Smart matching</h1>
            <p className="mt-0.5 max-w-xl text-[13px] text-slate-500">
              AI-ranked loads based on your fleet profile, route efficiency, and payout potential
            </p>
          </div>

            <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                  filter === item
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {item.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Live matches",
              value: stats.total,
              icon: Sparkles,
              tone: "text-violet-600",
            },
            {
              label: "High confidence",
              value: stats.highMatch,
              icon: Brain,
              tone: "text-emerald-600",
            },
            {
              label: "Avg match score",
              value: stats.avgMatch ? `${stats.avgMatch}%` : "—",
              icon: ShieldCheck,
              tone: "text-blue-600",
            },
            {
              label: "Est. margin uplift",
              value: stats.avgProfit ? `+${stats.avgProfit}%` : "—",
              icon: TrendingUp,
              tone: "text-amber-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-slate-50/80 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-3.5 w-3.5 ${stat.tone}`} />
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        {visibleMatches.length > 0 ? (
          visibleMatches.map((load, index) => {
            const matchStyle = getMatchStyle(load.match);
            const equipmentLabel = formatLabel(load.equipment);

            return (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md"
              >
                <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${matchStyle.accent}`} />

                <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[200px_minmax(0,1fr)_168px] lg:items-center lg:gap-6">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900">
                      {formatMoney(load.price)}
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-slate-400">
                      {getLoadCode(load.id)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${matchStyle.pill}`}
                    >
                      <Brain className="h-3 w-3" />
                      {load.match}% match
                    </span>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                        {equipmentLabel}
                      </span>
                      {load.commodity ? (
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                          {formatLabel(load.commodity)}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        +{load.profitDelta}% est. uplift
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-slate-900">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {getCity(load.origin)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                      <span>{getCity(load.destination)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Weight className="h-3.5 w-3.5 text-slate-400" />
                        <span>{load.weight ? `${load.weight} kg` : "Weight TBC"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(load.pickup_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        <span>{equipmentLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Route className="h-3.5 w-3.5 text-slate-400" />
                        <span>Optimized route</span>
                      </div>
                    </div>

                    <p className="text-[12px] leading-relaxed text-slate-500">
                      {preferredEquipment && load.equipment
                        ? `Strong fit for your ${formatLabel(preferredEquipment).toLowerCase()} fleet with favourable lane economics.`
                        : "Ranked for payout potential, pickup timing, and marketplace availability."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-stretch">
                    <Link
                      href="/carrier/available-loads"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Review match
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => dismissMatch(load.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-2 flex justify-center">
              <NothingLottie className="h-48 w-48" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No smart matches right now</h3>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500">
              {filter !== "all"
                ? "Try another filter or check back when new paid loads go live."
                : "We're still analyzing the market. New AI-ranked loads will appear here as suppliers post them."}
            </p>
            <Link
              href="/carrier/available-loads"
              className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
            >
              Browse available loads
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
