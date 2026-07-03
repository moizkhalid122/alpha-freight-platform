"use client";

import dynamic from 'next/dynamic';

// Dynamically import Map components to avoid SSR and build issues
const MapComponent = dynamic(() => import('react-map-gl/mapbox').then(mod => {
  const { Map, Marker, NavigationControl } = mod;
  return function MapWrapper(props: any) {
    return <Map {...props} />;
  };
}), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Map Engine...</div>
});

const Marker = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Marker), { ssr: false });
const NavigationControl = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.NavigationControl), { ssr: false });

import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Clock, 
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Plus,
  Box,
  Zap,
  Wallet,
  CheckCircle,
  Truck,
  MapPin,
  Boxes,
  Search,
  AlertCircle,
  ShieldAlert,
  Fuel,
  Bell,
  MessageSquare,
  Loader2
} from "lucide-react";
import FeatureCard from "@/components/dashboard/FeatureCard";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const carrierQuickActions = [
  {
    title: "Available Loads",
    description: "Browse 500+ daily loads across the UK and Europe.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
  },
  {
    title: "Active Bids",
    description: "Track and manage your current load bids in real-time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    title: "Smart Matching",
    description: "AI-powered load recommendations based on your route history.",
    badge: "NEW",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M15 3h6v6"></path>
        <path d="M10 14 21 3"></path>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      </svg>
    ),
  },
  {
    title: "Wallet",
    description: "View earnings, payouts, and manage your bank details.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    ),
  },
];

const insights = [
  { 
    id: 1, 
    type: 'alert', 
    text: 'Heavy traffic on M6. AF-1290 may be delayed by 25 mins.',
    icon: <Clock className="w-4 h-4 text-orange-500" />
  },
  { 
    id: 2, 
    type: 'tip', 
    text: 'Fuel prices are 5% lower in Manchester today. Plan your refuel.',
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />
  }
];

// Replace with your Mapbox Public Token
import { MAPBOX_TOKEN } from "@/lib/mapbox";

const CARRIER_ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "in-transit", "loading"];
const CARRIER_COMPLETED_STATUSES = ["completed", "delivered"];

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

const formatMoney = (value: number) => `£${value.toLocaleString("en-GB")}`;

const ACTIVITY_DOT_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
};

const OPTIMIZATION_STEPS = [
  {
    title: "Analyzing live traffic",
    description: "Pulling motorway data for M6, M25, and your active corridors.",
    Icon: Search,
  },
  {
    title: "Optimizing fleet routes",
    description: "Calculating fuel-efficient paths based on your current loads.",
    Icon: Zap,
  },
  {
    title: "Routes secured",
    description: "Optimization saved. Estimated fuel savings up to 12% this week.",
    Icon: CheckCircle2,
  },
] as const;

export default function CarrierDashboard() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    latitude: 52.4862,
    longitude: -1.8904,
    zoom: 6
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalLoads: 0,
    activeLoads: 0,
    balance: 0,
    completedLoads: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [fuelProfitStats, setFuelProfitStats] = useState({
    fuelCost: 0,
    netProfit: 0,
    totalMiles: 0,
    margin: 0
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrierStats, setCarrierStats] = useState({
    level: 1,
    xpProgress: 0,
    loadsToNext: 5,
    isPremium: false
  });
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fleetStatus, setFleetStatus] = useState({
    onRoute: 0,
    idle: 0
  });
  const optimizeTimeoutsRef = useRef<number[]>([]);

  const clearOptimizeTimeouts = () => {
    optimizeTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    optimizeTimeoutsRef.current = [];
  };

  const handleOptimize = () => {
    if (optimizing) return;

    clearOptimizeTimeouts();
    setOptimizing(true);
    setOptimizationStep(1);

    optimizeTimeoutsRef.current.push(
      window.setTimeout(() => setOptimizationStep(2), 1400),
      window.setTimeout(() => setOptimizationStep(3), 2800),
      window.setTimeout(() => {
        setOptimizing(false);
        setOptimizationStep(0);
        setIsOptimized(true);
        clearOptimizeTimeouts();
      }, 4200)
    );
  };

  useEffect(() => {
    if (!optimizing) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [optimizing]);

  useEffect(() => () => clearOptimizeTimeouts(), []);

  useEffect(() => {
    async function getDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch Profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setUserProfile(profile);

          const { data: assignedLoads } = await supabase
            .from('loads')
            .select('id, price, status, created_at, origin, destination, pickup_location, delivery_location')
            .eq('carrier_id', user.id)
            .order('created_at', { ascending: false });

          const safeAssignedLoads = assignedLoads || [];
          const total = safeAssignedLoads.length;
          const active = safeAssignedLoads.filter((load) => CARRIER_ACTIVE_STATUSES.includes(load.status)).length;
          const completedLoads = safeAssignedLoads.filter((load) => CARRIER_COMPLETED_STATUSES.includes(load.status));
          const completedCount = completedLoads.length;
          const totalBalance = completedLoads.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

          setStats({
            totalLoads: total || 0,
            activeLoads: active || 0,
            balance: totalBalance,
            completedLoads: completedCount || 0
          });

          // Calculate Real Carrier Level & XP
          const completed = completedCount;
          const loadsPerLevel = 5;
          const currentLevel = Math.floor(completed / loadsPerLevel) + 1;
          const xpInCurrentLevel = completed % loadsPerLevel;
          const progressPercent = (xpInCurrentLevel / loadsPerLevel) * 100;
          const remaining = loadsPerLevel - xpInCurrentLevel;
          
          setCarrierStats({
            level: currentLevel,
            xpProgress: progressPercent,
            loadsToNext: remaining,
            isPremium: currentLevel >= 3 // Example: Premium status at Level 3+
          });

          // Fetch Vehicles (Real-time Fleet Tracking)
          try {
            const { data: vehicleData, error: vehicleError } = await supabase
              .from('vehicles')
              .select('*')
              .eq('carrier_id', user.id);

            if (!vehicleError && vehicleData) {
              setVehicles(vehicleData);
              setFleetStatus({
                onRoute: vehicleData.filter(v => v.status === 'on-route').length,
                idle: vehicleData.filter(v => v.status === 'idle').length
              });
            } else {
              setVehicles([]);
              setFleetStatus({ onRoute: 0, idle: 0 });
            }
          } catch (err) {
            console.error("Vehicle fetch error:", err);
            setVehicles([]);
            setFleetStatus({ onRoute: 0, idle: 0 });
          }

          // Fetch Real Recommendations (Loads with 'active' status)
          const { data: recLoads } = await supabase
            .from('loads')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(3);

          if (recLoads) {
            setRecommendations(recLoads.map(load => ({
              id: load.id,
              origin: load.origin,
              dest: load.destination,
              price: `£${load.price}`,
              weight: load.weight,
              type: load.equipment || 'General',
              match: `${Math.floor(Math.random() * (99 - 85 + 1) + 85)}%` // AI Match logic placeholder
            })));
          }

          // Calculate Fuel & Profit based on assigned/completed loads
          if (safeAssignedLoads.length > 0) {
            const totalRevenue = safeAssignedLoads.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
            const estimatedFuel = totalRevenue * 0.35; // 35% fuel cost assumption
            const overheads = totalRevenue * 0.10; // 10% overheads
            const profit = totalRevenue - estimatedFuel - overheads;
            const miles = totalRevenue / 1.45; // £1.45 per mile assumption
            
            setFuelProfitStats({
              fuelCost: estimatedFuel,
              netProfit: profit,
              totalMiles: Math.round(miles),
              margin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
            });
          } else {
            setFuelProfitStats({
              fuelCost: 0,
              netProfit: 0,
              totalMiles: 0,
              margin: 0
            });
          }

          if (safeAssignedLoads.length > 0) {
            setRecentActivity(safeAssignedLoads.slice(0, 3).map((a) => ({
              title: a.status === 'active' ? `New Load Available` : `Load #${a.id.slice(0, 6)} ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`,
              time: new Date(a.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 'Recently',
              color: a.status === 'completed' ? 'green' : a.status === 'active' ? 'blue' : 'orange'
            })));
          } else {
            setRecentActivity([]);
          }

          // Process data for chart
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const groupedData = safeAssignedLoads.reduce((acc: any, load) => {
            const date = new Date(load.created_at);
            const dayName = days[date.getDay()];
            if (!acc[dayName]) acc[dayName] = 0;
            acc[dayName] += Number(load.price) || 0;
            return acc;
          }, {});

          const formattedChartData = days.map(day => ({
            day,
            amount: groupedData?.[day] || 0
          }));

          setChartData(formattedChartData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    getDashboardData();

    const channel = supabase
      .channel('carrier-dashboard-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads'
        },
        () => {
          getDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        () => {
          getDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <div className={`rounded-md p-1.5 ${carrierStats.isPremium ? "bg-blue-600" : "bg-slate-800"}`}>
                <LayoutDashboard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Carrier operations
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                carrierStats.isPremium
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {carrierStats.isPremium ? "Premium" : "Standard"} · Lvl {carrierStats.level}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Welcome back, {userProfile?.full_name?.split(" ")[0] || "Carrier"}
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Fleet efficiency at{" "}
              <span className="font-semibold text-blue-600">
                {Math.round(80 + carrierStats.level * 2)}%
              </span>
              {" "}· {stats.activeLoads} active load{stats.activeLoads === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/carrier/available-loads")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Browse loads
            </button>
            <button
              type="button"
              onClick={() => router.push("/carrier/ai-assistant")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Assistant
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Get verified
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
          <div className={`${CARD} p-3 sm:p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600"><Boxes className="h-3.5 w-3.5" /></div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total loads</p>
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{stats.totalLoads}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">All assigned</p>
          </div>
          <div className={`${CARD} p-3 sm:p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600"><Zap className="h-3.5 w-3.5" /></div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active</p>
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{stats.activeLoads}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">In progress</p>
          </div>
          <div className={`${CARD} p-3 sm:p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600"><Wallet className="h-3.5 w-3.5" /></div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Balance</p>
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatMoney(stats.balance)}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Total earnings</p>
          </div>
          <div className={`${CARD} p-3 sm:p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /></div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Completed</p>
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{stats.completedLoads}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Delivered safely</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6"
      >

          {/* Optimization Success Banner */}
          <AnimatePresence>
            {isOptimized && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-900">AI route optimization active</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-700/90">
                        Your fleet is running on fuel-efficient paths. Estimated savings{" "}
                        <span className="font-semibold">£420/week</span>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOptimized(false)}
                    className="shrink-0 self-start rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:self-center"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr] xl:grid-cols-[1.4fr_0.6fr]">
            {/* Chart Area */}
            <div className="min-w-0 space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={`${CARD} relative overflow-hidden p-4 sm:p-5`}
              >

                <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Analytics</p>
                    <h2 className="mt-0.5 flex items-center gap-2 text-[15px] font-bold text-slate-900">
                      Revenue overview
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        LIVE
                      </span>
                    </h2>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {['1W', '1M', '3M'].map(p => (
                      <button key={p} type="button" className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${p === '1W' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-52 w-full sm:h-56 lg:h-64 xl:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 backdrop-blur shadow-2xl p-3 rounded-xl border border-white/10 text-white">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{payload[0].payload.day}</p>
                                <p className="text-base font-black text-blue-400">£{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: '#2563EB', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#2563EB" 
                        strokeWidth={3} 
                        fill="url(#premiumGradient)" 
                        animationDuration={2500}
                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Fleet Operations Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className={`${CARD} p-4 sm:p-5`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fleet</p>
                    <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">
                      Fleet operations
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm" />
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">Real-time GPS · {vehicles.length} units</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/carrier/vehicles")}
                    className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 transition hover:bg-slate-100"
                  >
                    Manage fleet
                  </button>
                </div>

                <div className="relative h-[240px] overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-inner sm:h-[280px] lg:h-[320px] xl:h-[360px]">
                  {!MAPBOX_TOKEN ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 p-4 text-center">
                      <p className="text-[12px] font-medium text-slate-500">Map unavailable. Add Mapbox token to enable live fleet tracking.</p>
                    </div>
                  ) : (
                  <MapComponent
                    {...viewState}
                    onMove={(evt: any) => setViewState(evt.viewState)}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: "100%", height: "100%" }}
                    attributionControl={false}
                  >
                    <NavigationControl position="top-right" showCompass={false} />
                    
                    {vehicles.map((vehicle) => (
                      <Marker 
                        key={vehicle.id} 
                        latitude={vehicle.current_lat} 
                        longitude={vehicle.current_lng} 
                        anchor="bottom"
                      >
                        <div className="relative group/marker">
                          {vehicle.status === "on-route" && (
                            <div className={`absolute h-4 w-4 rounded-full animate-ping ${isOptimized ? "bg-emerald-500" : "bg-blue-600"}`} />
                          )}
                          <div className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125 ${
                            vehicle.status === "on-route"
                              ? isOptimized ? "bg-emerald-600" : "bg-blue-700"
                              : "bg-orange-500"
                          }`}>
                            <Truck className="h-2 w-2 text-white" />
                          </div>
                          
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover/marker:opacity-100">
                            <div className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-xl">
                              {vehicle.name || `Unit ${vehicle.id.slice(0, 2)}`} · {vehicle.status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </Marker>
                    ))}
                  </MapComponent>
                  )}

                  {vehicles.length === 0 ? (
                    <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-900">No vehicles registered</p>
                          <p className="text-[11px] text-slate-500">Add a unit to start live GPS tracking.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/carrier/vehicles")}
                        className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-[12px] font-semibold text-white transition hover:bg-blue-700"
                      >
                        Add vehicle
                      </button>
                    </div>
                  ) : null}
                  
                  <div className="pointer-events-none absolute left-2 top-2 right-12 z-10 flex flex-col gap-1.5 sm:left-3 sm:top-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-orange-100 bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1.5">
                        <AlertCircle className="h-3 w-3 shrink-0 text-orange-500 sm:h-3.5 sm:w-3.5" />
                        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-800 sm:text-[9px]">M6 delay · 25m</span>
                      </div>
                      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-blue-100 bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1.5">
                        <ShieldAlert className="h-3 w-3 shrink-0 text-blue-500 sm:h-3.5 sm:w-3.5" />
                        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-800 sm:text-[9px]">Heavy rain</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOptimized && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="pointer-events-auto flex items-center gap-1.5 self-start rounded-lg border border-emerald-300 bg-emerald-500 px-2.5 py-1 text-white shadow-md sm:px-3 sm:py-1.5"
                        >
                          <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="text-[8px] font-bold uppercase tracking-wide sm:text-[9px]">AI optimized</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap gap-1.5 sm:bottom-3 sm:left-3 sm:right-auto">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm sm:px-3 sm:py-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                      <span className="text-[9px] font-bold tracking-wide text-slate-800 sm:text-[10px]">{fleetStatus.onRoute} on route</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm sm:px-3 sm:py-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-[9px] font-bold tracking-wide text-slate-800 sm:text-[10px]">{fleetStatus.idle} idle</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Load Recommendations Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className={`${CARD} p-4 sm:p-7`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Recommended for You
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500 mt-1">Based on your recent activity and location</p>
                  </div>
                  <button className="text-blue-600 text-[11px] font-bold hover:underline">View All</button>
                </div>

                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, i) => (
                      <div key={rec.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm relative">
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">{rec.origin} → {rec.dest}</p>
                              <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">{rec.type}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{rec.weight} • AI MATCH: <span className="text-emerald-500 font-bold">{rec.match}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{rec.price}</p>
                          <div className="flex items-center gap-1 justify-end">
                             <span className="text-[8px] text-slate-400 font-bold">EXCELLENT MATCH</span>
                             <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                      <div className="relative w-44 h-44 mb-2 opacity-80">
                        <video 
                          src="/no-loads.mp4" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-1 h-1 rounded-full bg-slate-200 mb-3" />
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Marketplace Quiet</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
                          No matching loads found <br /> for recommendation
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar Widgets */}
            <div className="min-w-0 space-y-4">
              <motion.div 
                whileHover={{ y: -1 }}
                className={`relative overflow-hidden rounded-xl p-4 sm:p-5 text-white shadow-lg transition-all duration-300 ${
                  carrierStats.isPremium 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/15' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-500/15'
                }`}
              >
                <div className="absolute -right-4 -top-4 opacity-10">
                  <LayoutDashboard className="h-24 w-24" />
                </div>
                <div className="relative mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-1.5 text-[15px] font-bold">
                      {carrierStats.isPremium ? 'Premium Carrier' : 'Standard Carrier'} 
                      {carrierStats.isPremium && <CheckCircle2 className="h-3.5 w-3.5 text-blue-200" />}
                    </h2>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/90">Level {carrierStats.level} partner</p>
                  </div>
                  <div className="flex gap-1">
                    {carrierStats.isPremium && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10">
                        <Sparkles className="h-3 w-3 text-amber-300" />
                      </div>
                    )}
                    <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10">
                      <Clock className="h-3 w-3 text-blue-200" />
                    </div>
                  </div>
                </div>

                <div className="relative mb-4">
                  <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                    <span>Next level: {carrierStats.level + 1}</span>
                    <span>{Math.round(carrierStats.xpProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${carrierStats.xpProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-300 to-white" 
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-blue-200/80">{carrierStats.loadsToNext} loads to level {carrierStats.level + 1}</p>
                </div>

                <div className="relative mb-4 flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">Carrier ID</p>
                    <p className="truncate font-mono text-xs font-bold">AF-{userProfile?.id?.slice(0, 8).toUpperCase() || 'LOADING'}</p>
                  </div>
                </div>
                <button type="button" className="relative w-full rounded-lg bg-white py-2.5 text-[13px] font-bold text-blue-600 transition hover:bg-blue-50">
                  View analytics
                </button>
              </motion.div>

              <motion.div 
                whileHover={{ y: -1 }}
                className={`${CARD} p-4 sm:p-5`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Calculator</p>
                    <h2 className="mt-0.5 text-[15px] font-bold text-slate-900">Fuel & profit</h2>
                  </div>
                  <Fuel className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Fuel cost</p>
                      <span className="text-[10px] font-medium text-slate-400">£1.42/L avg</span>
                    </div>
                    <p className="text-xl font-bold text-indigo-900">£{fuelProfitStats.fuelCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="mt-4 w-full bg-indigo-200/30 h-2 rounded-full overflow-hidden border border-indigo-100/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(fuelProfitStats.margin, 100)}%` }}
                        transition={{ duration: 1.2, delay: 0.8 }}
                        className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-indigo-500">{fuelProfitStats.totalMiles} miles total</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Net profit</p>
                    <p className="mt-1 text-xl font-bold text-emerald-900">£{fuelProfitStats.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">{fuelProfitStats.margin > 20 ? 'HIGH MARGIN' : 'STABLE'}</span>
                      <span className="text-[10px] font-medium text-emerald-600">{fuelProfitStats.margin.toFixed(1)}% margin</span>
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isOptimized 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                    : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Optimizing...
                    </>
                  ) : isOptimized ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recalculate Optimization
                    </>
                  ) : (
                    'Optimize Route'
                  )}
                </button>
              </motion.div>

              <motion.div 
                whileHover={{ y: -1 }}
                className={`${CARD} p-4 sm:p-5`}
              >

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Activity</p>
                    <h2 className="mt-0.5 text-[15px] font-bold text-slate-900">Live activity</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-blue-500">LIVE</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative space-y-5 border-l-2 border-blue-100 pl-5">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[29px] top-0 h-3 w-3 rounded-full border-2 border-white shadow-sm ${ACTIVITY_DOT_COLORS[activity.color] || "bg-slate-400"}`} />
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">{activity.title}</p>
                          <p className="text-xs text-gray-400 font-medium">{activity.time}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-medium text-slate-400">No recent activity found.</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50/50 rounded-2xl border border-green-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span className="text-[10px] font-black text-green-600 tracking-tight">OPERATIONAL</span>
                      </div>
                      <span className="text-[10px] font-bold text-green-500">99.9% Uptime</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
      </motion.div>

      <AnimatePresence>
        {optimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 backdrop-blur-md sm:items-center sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full max-w-md rounded-t-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const step = OPTIMIZATION_STEPS[Math.max(0, optimizationStep - 1)];
                const StepIcon = step?.Icon ?? Search;

                return (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI optimizer</p>
                          <p className="text-sm font-bold text-slate-900">Step {optimizationStep} of 3</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                        LIVE
                      </span>
                    </div>

                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100">
                      <div className="absolute inset-0 rounded-2xl bg-blue-500/10 animate-pulse" />
                      <StepIcon className="relative h-9 w-9" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{step?.title}</h3>
                      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                        {step?.description}
                      </p>
                    </div>

                    <div className="mt-8 space-y-2">
                      {OPTIMIZATION_STEPS.map((item, index) => {
                        const done = optimizationStep > index + 1;
                        const active = optimizationStep === index + 1;
                        const ItemIcon = item.Icon;

                        return (
                          <div
                            key={item.title}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                              active
                                ? "border-blue-200 bg-blue-50/70"
                                : done
                                  ? "border-emerald-200 bg-emerald-50/60"
                                  : "border-slate-100 bg-slate-50/60"
                            }`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active ? "bg-blue-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                            }`}>
                              {done ? <CheckCircle2 className="h-4 w-4" /> : <ItemIcon className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-[12px] font-semibold text-slate-900">{item.title}</p>
                              <p className="truncate text-[11px] text-slate-500">{item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                        initial={{ width: "8%" }}
                        animate={{ width: `${(optimizationStep / 3) * 100}%` }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
