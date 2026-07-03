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
import { useState, useEffect } from "react";
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

  const handleOptimize = () => {
    setOptimizing(true);
    setOptimizationStep(1);
    
    setTimeout(() => setOptimizationStep(2), 1500);
    setTimeout(() => setOptimizationStep(3), 3000);
    setTimeout(() => {
      setOptimizing(false);
      setOptimizationStep(0);
      setIsOptimized(true);
    }, 4500);
  };

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
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-100 bg-[#FDFDFD] flex items-center justify-between px-8 sticky top-0 z-40">



        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.02, y: -1 }}
            className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:border-blue-100"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-white font-black shadow-lg ${
              carrierStats.isPremium ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' : 'bg-slate-700 shadow-slate-500/10'
            }`}>
              {carrierStats.isPremium ? 'P' : 'C'}
            </div>
            <span className="text-xs font-bold text-slate-700 tracking-tight">
              {carrierStats.isPremium ? 'Premium Carrier' : 'Standard Carrier'}
            </span>
            <div className={`flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md border ${
              carrierStats.isPremium ? 'bg-blue-50 border-blue-100/50' : 'bg-slate-50 border-slate-100'
            }`}>
              <TrendingUp className={`w-3 h-3 ${carrierStats.isPremium ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className={`text-[9px] font-black ${carrierStats.isPremium ? 'text-blue-600' : 'text-slate-500'}`}>
                Lvl {carrierStats.level}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, y: -1 }} 
              className="cursor-pointer group p-1 rounded-xl hover:bg-slate-50 transition-all"
              title="Activity"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-transparent group-hover:border-blue-100 shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -1 }} 
              className="cursor-pointer group p-1 rounded-xl hover:bg-slate-50 transition-all"
              title="Support"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-transparent group-hover:border-blue-100 shadow-sm">
                <Zap className="w-4 h-4" />
              </div>
            </motion.div>

            <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/carrier/ai-assistant")}
                className="cursor-pointer group p-1 rounded-xl hover:bg-slate-100 transition-all"
                title="AI Assistant"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shadow-slate-900/20 group-hover:bg-slate-800 transition-all">
                  <Sparkles className="w-4 h-4" />
                </div>
              </motion.button>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 border border-slate-800"
          >
            Get Verified
          </motion.button>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto bg-[#FDFDFD]">
        {/* Entrance Animation Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-10 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}
                </h1>
                <Sparkles className="w-4 h-4 text-blue-500/70 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 font-medium">Your fleet is currently performing at</p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full border border-blue-100 shadow-sm">
                  {Math.round(80 + (carrierStats.level * 2))}% efficiency
                </span>
              </div>
            </div>
            
            {/* AI Insights Quick View */}
            <div className="hidden lg:flex gap-3">
              {insights.map((insight) => (
                <motion.div 
                  key={insight.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-100/50 p-3 rounded-2xl flex items-center gap-3 shadow-sm max-w-[320px] hover:border-blue-100 transition-colors"
                >
                  <div className={`shrink-0 p-2.5 rounded-xl border shadow-sm relative overflow-hidden ${
                    insight.type === 'alert' 
                      ? 'bg-orange-50/50 border-orange-100/50 text-orange-500' 
                      : 'bg-blue-50/50 border-blue-100/50 text-blue-500'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent" />
                    <div className="relative z-10">{insight.icon}</div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-tight tracking-tight">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Optimization Success Banner */}
          <AnimatePresence>
            {isOptimized && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-900 leading-none mb-1">AI Route Optimization Active</p>
                    <p className="text-[11px] font-medium text-emerald-600">Your fleet is now running on the most fuel-efficient paths. Estimated savings: £420/week.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOptimized(false)}
                  className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:text-emerald-900 transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Loads */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group hover:border-indigo-100/50 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50/60 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform duration-500 border border-indigo-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                  <Boxes className="w-5 h-5 relative z-10" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Total Loads</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{stats.totalLoads}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-auto">All assigned loads</p>
            </motion.div>

            {/* Active Loads */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group hover:border-rose-100/50 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50/60 rounded-xl flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform duration-500 border border-rose-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent" />
                  <Zap className="w-5 h-5 relative z-10" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Active Loads</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{stats.activeLoads}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-auto">Currently moving</p>
            </motion.div>

            {/* Balance */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group hover:border-amber-100/50 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50/60 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform duration-500 border border-amber-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                  <Wallet className="w-5 h-5 relative z-10" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Balance</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">£{stats.balance}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-auto">Total earnings</p>
            </motion.div>

            {/* Completed */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group hover:border-sky-100/50 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sky-50/60 rounded-xl flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform duration-500 border border-sky-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent" />
                  <CheckCircle2 className="w-5 h-5 relative z-10" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Completed</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{stats.completedLoads}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-auto">Delivered safely</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-8 space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white border border-gray-100 rounded-[28px] p-7 shadow-sm relative overflow-hidden"
              >

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      Revenue Overview
                      <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full border border-emerald-100">
                        LIVE
                      </div>
                    </h2>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Weekly payout performance analysis</p>
                  </div>
                  <div className="flex gap-1.5">
                    {['1W', '1M', '3M'].map(p => (
                      <button key={p} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${p === '1W' ? 'bg-blue-600 text-white' : 'bg-[#FDFDFD] text-slate-400 border border-gray-100 hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[280px] w-full">
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
                className="bg-white border border-gray-100 rounded-[28px] p-7 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Fleet Operations <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 shadow-sm" /></h3>
                    <p className="text-[11px] font-medium text-gray-500 mt-1">Real-time GPS tracking of {vehicles.length} units</p>
                  </div>
                  <button className="px-4 py-1.5 bg-gray-50 text-blue-600 text-[10px] font-bold rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">Manage Fleet</button>
                </div>

                <div className="h-[400px] bg-[#FDFDFD] rounded-3xl border border-gray-100 relative overflow-hidden group shadow-inner">
                  {vehicles.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 z-20">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
                        <Truck className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">No Vehicles Registered</p>
                      <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Add units to start real-time tracking</p>
                      <button className="mt-6 px-6 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        Add Vehicle
                      </button>
                    </div>
                  ) : null}
                  <MapComponent
                    {...viewState}
                    onMove={(evt: any) => setViewState(evt.viewState)}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                  >
                    <NavigationControl position="top-right" />
                    
                    {/* Active Units as Markers */}
                    {vehicles.map((vehicle) => (
                      <Marker 
                        key={vehicle.id} 
                        latitude={vehicle.current_lat} 
                        longitude={vehicle.current_lng} 
                        anchor="bottom"
                      >
                        <div className="relative group/marker">
                          {vehicle.status === 'on-route' && (
                            <div className={`w-4 h-4 ${isOptimized ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full animate-ping absolute`} />
                          )}
                          <div className={`w-4 h-4 ${
                            vehicle.status === 'on-route' 
                              ? (isOptimized ? 'bg-emerald-600' : 'bg-blue-700') 
                              : 'bg-orange-500'
                          } rounded-full relative border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 cursor-pointer`}>
                            <Truck className="w-2 h-2 text-white" />
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
                              {vehicle.name || `Unit ${vehicle.id.slice(0,2)}`} • {vehicle.status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </Marker>
                    ))}
                  </MapComponent>
                  
                  {/* Weather & Traffic Alerts Overlay */}
                  <div className="absolute top-4 left-4 right-14 flex justify-between items-start z-10 pointer-events-none">
                    <div className="flex gap-2">
                      <motion.div 
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="px-3 py-1.5 bg-white/95 backdrop-blur shadow-md rounded-xl flex items-center gap-2 border border-orange-100 pointer-events-auto"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">TRAFFIC: M6 DELAY (25m)</span>
                      </motion.div>
                      <motion.div 
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 3, delay: 0.5, repeat: Infinity }}
                        className="px-3 py-1.5 bg-white/95 backdrop-blur shadow-md rounded-xl flex items-center gap-2 border border-blue-100 pointer-events-auto"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">WEATHER: HEAVY RAIN</span>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isOptimized && (
                        <motion.div 
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="px-4 py-2 bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 rounded-xl flex items-center gap-2 border border-emerald-400 pointer-events-auto"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">AI OPTIMIZED</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-6 left-6 flex gap-4 z-10">
                    <div className="px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-2xl flex items-center gap-3 border border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                      <span className="text-[11px] font-black text-slate-800 tracking-wider">{fleetStatus.onRoute} UNITS ON ROUTE</span>
                    </div>
                    <div className="px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-2xl flex items-center gap-3 border border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-[11px] font-black text-slate-800 tracking-wider">{fleetStatus.idle} UNITS IDLE</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Load Recommendations Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-white border border-gray-100 rounded-[28px] p-7 shadow-sm"
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

            {/* Sidebar Widgets with Glassmorphism */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div 
                whileHover={{ y: -2 }}
                className={`rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group transition-all duration-500 ${
                  carrierStats.isPremium 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/20' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-500/20'
                }`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <LayoutDashboard className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                      {carrierStats.isPremium ? 'Premium Carrier' : 'Standard Carrier'} 
                      {carrierStats.isPremium && <CheckCircle2 className="w-4 h-4 text-blue-200" />}
                    </h2>
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Level {carrierStats.level} Partner</p>
                  </div>
                  <div className="flex gap-1.5">
                    {carrierStats.isPremium && (
                      <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20" title="Top Rated">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    )}
                    <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20" title="On-time King">
                      <Clock className="w-3.5 h-3.5 text-blue-200" />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-bold mb-1.5 text-blue-100 uppercase tracking-widest">
                    <span>Next Level: {carrierStats.level + 1}</span>
                    <span>{Math.round(carrierStats.xpProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${carrierStats.xpProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-300 to-white h-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                    />
                  </div>
                  <p className="text-[9px] text-blue-200/70 mt-2 font-medium">Complete {carrierStats.loadsToNext} more loads to reach Level {carrierStats.level + 1}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 mb-6">
                  <div className="flex-1">
                    <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mb-1">Carrier ID</p>
                    <p className="text-sm font-mono font-bold tracking-wider">AF-{userProfile?.id?.slice(0, 8).toUpperCase() || 'LOADING'}</p>
                  </div>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
                <button className="w-full py-3 bg-white text-blue-600 rounded-xl text-sm font-black shadow-lg shadow-black/10 hover:bg-blue-50 transition-colors">
                  View Analytics
                </button>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-gray-900">Fuel & Profit Calculator</h2>
                  <Fuel className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="space-y-6">
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Estimated Fuel Cost</p>
                      <span className="text-[10px] font-bold text-slate-400">AVG. £1.42/L</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-900 tracking-tight">£{fuelProfitStats.fuelCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="mt-4 w-full bg-indigo-200/30 h-2 rounded-full overflow-hidden border border-indigo-100/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(fuelProfitStats.margin, 100)}%` }}
                        transition={{ duration: 1.2, delay: 0.8 }}
                        className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                      />
                    </div>
                    <p className="text-[9px] text-indigo-500 font-medium mt-2 italic">Calculated based on {fuelProfitStats.totalMiles} miles total</p>
                  </div>
                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <TrendingUp className="w-12 h-12 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Net Profit Projection</p>
                    <p className="text-2xl font-black text-emerald-900 tracking-tight">£{fuelProfitStats.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded tracking-tighter">{fuelProfitStats.margin > 20 ? 'HIGH MARGIN' : 'STABLE MARGIN'}</span>
                      <p className="text-[9px] text-emerald-600 font-bold">{fuelProfitStats.margin.toFixed(1)}% margin projection</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className={`w-full mt-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
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

              <AnimatePresence>
                {optimizing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-[32px] p-10 shadow-2xl max-w-sm w-full text-center border border-slate-100"
                    >
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-3xl animate-ping" />
                        {optimizationStep === 1 && <Search className="w-8 h-8 animate-pulse" />}
                        {optimizationStep === 2 && <Zap className="w-8 h-8 animate-bounce" />}
                        {optimizationStep === 3 && <CheckCircle2 className="w-8 h-8 scale-110" />}
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 mb-2">
                        {optimizationStep === 1 && "Analyzing Traffic..."}
                        {optimizationStep === 2 && "Optimizing Route..."}
                        {optimizationStep === 3 && "Route Secured!"}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        {optimizationStep === 1 && "Fetching real-time data from M6 and M25 motorways."}
                        {optimizationStep === 2 && "Calculating the most fuel-efficient path for your 40t truck."}
                        {optimizationStep === 3 && "Route saved! Estimated fuel savings: 12%."}
                      </p>

                      <div className="mt-8 flex gap-1 justify-center">
                        <div className={`h-1 rounded-full transition-all duration-500 ${optimizationStep >= 1 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-100'}`} />
                        <div className={`h-1 rounded-full transition-all duration-500 ${optimizationStep >= 2 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-100'}`} />
                        <div className={`h-1 rounded-full transition-all duration-500 ${optimizationStep >= 3 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-100'}`} />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm"
              >

                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-gray-900">Live Activity</h2>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-500">LIVE</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="relative pl-6 border-l-2 border-blue-100 space-y-8">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[29px] top-0 w-3 h-3 rounded-full bg-${activity.color}-500 border-2 border-white shadow-sm`} />
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
      </main>
    </div>
  );
}
