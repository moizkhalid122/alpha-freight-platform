"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { MAPBOX_TOKEN } from "@/lib/mapbox";
import NothingLottie from "@/components/ui/NothingLottie";
import InstantBookSuccessOverlay from "@/components/carrier/InstantBookSuccessOverlay";
import {
  Search,
  MapPin,
  Truck,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Box,
  AlertCircle,
  X,
  Calendar,
  Weight,
  Fuel,
  CheckCircle2,
  Loader2,
  Zap,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  List,
  Route,
  Gavel,
  Star,
} from "lucide-react";

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

const FILTERS = ["all", "high-value", "pickup-soon", "saved"] as const;
const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "highest-pay", label: "Highest pay" },
  { id: "pickup-date", label: "Pickup soon" },
] as const;

const SAVED_KEY = "alpha-carrier-saved-loads";

type LoadRow = {
  id: string;
  origin?: string | null;
  destination?: string | null;
  pickup_location?: string | null;
  delivery_location?: string | null;
  price?: number | string | null;
  max_budget?: number | string | null;
  weight?: number | string | null;
  cargo_weight?: number | string | null;
  equipment?: string | null;
  vehicle_type?: string | null;
  pickup_date?: string | null;
  delivery_date?: string | null;
  created_at?: string | null;
  commodity?: string | null;
  title?: string | null;
  status?: string | null;
  notes?: string | null;
  special_instructions?: string | null;
};

const MapComponent = dynamic(
  () =>
    import("react-map-gl/mapbox").then((mod) => {
      const { Map } = mod;
      return function MapWrapper(props: Record<string, unknown>) {
        return <Map {...props}>{props.children as React.ReactNode}</Map>;
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[11px] font-medium text-slate-400">
        Loading map…
      </div>
    ),
  }
);

const MapSource = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Source), {
  ssr: false,
});
const MapLayer = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Layer), {
  ssr: false,
});
const MapMarker = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Marker), {
  ssr: false,
});

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

function getLoadOrigin(load: LoadRow) {
  return load.pickup_location || load.origin || "";
}

function getLoadDestination(load: LoadRow) {
  return load.delivery_location || load.destination || "";
}

function getLoadPrice(load: LoadRow) {
  return Number(load.price || load.max_budget || 0);
}

function getLoadCode(id: string) {
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

function getTimeAgo(value?: string | null) {
  if (!value) return "Recently";
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.floor(hours * 60))}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function estimateRatePerMile(load: LoadRow) {
  const price = getLoadPrice(load);
  const miles = 80 + (hashString(load.id) % 220);
  if (!price) return null;
  return (price / miles).toFixed(2);
}

function isPickupSoon(value?: string | null) {
  if (!value) return false;
  const pickup = new Date(value);
  if (Number.isNaN(pickup.getTime())) return false;
  const days = (pickup.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 3;
}

function readSavedIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return new Set<string>();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeSavedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

function calculateFuel(distanceMeters: number | null) {
  if (!distanceMeters) return null;
  const distanceKm = distanceMeters / 1000;
  return Math.round(distanceKm / 8);
}

export default function AvailableLoadsPage() {
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("all");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["id"]>("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedLoad, setSelectedLoad] = useState<LoadRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [instantBookSuccess, setInstantBookSuccess] = useState<{
    loadCode: string;
    routeLabel: string;
    amountLabel: string;
  } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const [originCoords, setOriginCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [routeData, setRouteData] = useState<GeoJSON.Geometry | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [mapViewState, setMapViewState] = useState({
    longitude: -1.5,
    latitude: 52.5,
    zoom: 5,
  });

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchLoads = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("status", "active")
        .eq("payment_state", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data || []);
    } catch (error) {
      console.error("Error fetching loads:", error);
      showToast("error", "Unable to load marketplace shipments right now.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setSavedIds(readSavedIds());
    setPortalReady(true);
    void fetchLoads();

    const channel = supabase
      .channel("carrier-available-loads")
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => {
        void fetchLoads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLoads]);

  useEffect(() => {
    const hasOverlay = Boolean(selectedLoad || showBidModal);
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedLoad, showBidModal]);

  useEffect(() => {
    if (!selectedLoad) {
      setOriginCoords(null);
      setDestCoords(null);
      setRouteData(null);
      setEstimatedDuration(null);
      setEstimatedDistance(null);
      return;
    }

    const origin = getLoadOrigin(selectedLoad);
    const destination = getLoadDestination(selectedLoad);

    const geocode = async (query: string, setCoords: (coords: { lng: number; lat: number }) => void) => {
      if (!query || query.length < 3) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        );
        const data = await res.json();
        if (data.features?.length) {
          const [lng, lat] = data.features[0].center;
          setCoords({ lng, lat });
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };

    void geocode(origin, setOriginCoords);
    void geocode(destination, setDestCoords);
  }, [selectedLoad]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!originCoords || !destCoords) {
        setRouteData(null);
        setEstimatedDuration(null);
        setEstimatedDistance(null);
        return;
      }

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        if (data.routes?.[0]) {
          setRouteData(data.routes[0].geometry);
          setEstimatedDuration(data.routes[0].duration);
          setEstimatedDistance(data.routes[0].distance);

          const minLng = Math.min(originCoords.lng, destCoords.lng);
          const maxLng = Math.max(originCoords.lng, destCoords.lng);
          const minLat = Math.min(originCoords.lat, destCoords.lat);
          const maxLat = Math.max(originCoords.lat, destCoords.lat);

          setMapViewState((prev) => ({
            ...prev,
            longitude: (minLng + maxLng) / 2,
            latitude: (minLat + maxLat) / 2,
            zoom: 6,
          }));
        }
      } catch (error) {
        console.error("Route error:", error);
      }
    };

    void fetchRoute();
  }, [originCoords, destCoords]);

  const toggleSaved = (loadId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(loadId)) next.delete(loadId);
      else next.add(loadId);
      writeSavedIds(next);
      return next;
    });
  };

  const stats = useMemo(() => {
    const prices = loads.map(getLoadPrice).filter(Boolean);
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const avgRate =
      prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newToday = loads.filter(
      (load) => load.created_at && new Date(load.created_at) >= todayStart
    ).length;
    const pickupSoonCount = loads.filter((load) => isPickupSoon(load.pickup_date)).length;

    return {
      total: loads.length,
      avgRate,
      newToday,
      pickupSoonCount,
      totalValue,
    };
  }, [loads]);

  const filteredLoads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const highValueThreshold =
      loads.length > 0
        ? [...loads.map(getLoadPrice)].sort((a, b) => b - a)[Math.floor(loads.length * 0.3)] || 400
        : 400;

    let result = loads.filter((load) => {
      const origin = getLoadOrigin(load).toLowerCase();
      const destination = getLoadDestination(load).toLowerCase();
      const matchesSearch =
        !query ||
        origin.includes(query) ||
        destination.includes(query) ||
        load.id.toLowerCase().includes(query) ||
        getLoadCode(load.id).toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (activeFilter === "high-value") return getLoadPrice(load) >= highValueThreshold;
      if (activeFilter === "pickup-soon") return isPickupSoon(load.pickup_date);
      if (activeFilter === "saved") return savedIds.has(load.id);
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "highest-pay") return getLoadPrice(b) - getLoadPrice(a);
      if (sortBy === "pickup-date") {
        const aTime = a.pickup_date ? new Date(a.pickup_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.pickup_date ? new Date(b.pickup_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bCreated - aCreated;
    });

    return result;
  }, [loads, searchQuery, activeFilter, sortBy, savedIds]);

  const handleSubmitBid = async () => {
    if (!selectedLoad || !bidAmount) return;

    try {
      setBidLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const { error } = await supabase.from("bids").insert({
        load_id: selectedLoad.id,
        carrier_id: user.id,
        amount: Number(bidAmount),
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setBidSuccess(true);
      showToast("success", "Bid submitted. The supplier will review your offer.");
      window.setTimeout(() => {
        setShowBidModal(false);
        setBidSuccess(false);
        setBidAmount("");
      }, 1800);
    } catch (error) {
      console.error("Bid submit error:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not submit bid right now."
      );
    } finally {
      setBidLoading(false);
    }
  };

  const handleBookInstantly = async () => {
    if (!selectedLoad) return;

    try {
      setBookLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const amount = getLoadPrice(selectedLoad);
      const { data: bidData, error: bidError } = await supabase
        .from("bids")
        .insert({
          load_id: selectedLoad.id,
          carrier_id: user.id,
          amount,
          status: "accepted",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();

      if (bidError) throw bidError;
      if (!bidData?.id) throw new Error("Bid could not be created.");

      await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("load_id", selectedLoad.id)
        .neq("id", bidData.id);

      const { data: updatedLoad, error: updateLoadError } = await supabase
        .from("loads")
        .update({ carrier_id: user.id, status: "booked" })
        .eq("id", selectedLoad.id)
        .select("id, carrier_id, status")
        .maybeSingle();

      if (updateLoadError) throw updateLoadError;
      if (!updatedLoad || updatedLoad.carrier_id !== user.id || updatedLoad.status !== "booked") {
        throw new Error("Load update blocked. Run carrier-platform-rls-fix.sql in Supabase.");
      }

      setInstantBookSuccess({
        loadCode: getLoadCode(selectedLoad.id),
        routeLabel: `${getCity(getLoadOrigin(selectedLoad))} → ${getCity(getLoadDestination(selectedLoad))}`,
        amountLabel: formatMoney(amount),
      });
      setSelectedLoad(null);
      setShowBidModal(false);
      void fetchLoads();
    } catch (error) {
      console.error("Instant book error:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not book this load right now."
      );
    } finally {
      setBookLoading(false);
    }
  };

  const openBidModal = (load: LoadRow) => {
    setSelectedLoad(load);
    const maxBudget = getLoadPrice(load);
    setBidAmount(maxBudget > 0 ? String(Math.floor(maxBudget * 0.95)) : "");
    setShowBidModal(true);
  };

  const renderLoadCard = (load: LoadRow, index: number) => {
    const price = getLoadPrice(load);
    const ratePerMile = estimateRatePerMile(load);
    const isSaved = savedIds.has(load.id);
    const equipment = formatLabel(load.equipment || load.vehicle_type);
    const pickupSoon = isPickupSoon(load.pickup_date);

    if (viewMode === "grid") {
      return (
        <motion.div
          key={load.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 transition hover:shadow-md hover:ring-slate-300/80"
          onClick={() => setSelectedLoad(load)}
        >
          <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-blue-500 to-cyan-500" />
          <div className="p-4 pl-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-slate-900">{formatMoney(price)}</p>
                <p className="font-mono text-[10px] font-semibold text-slate-400">{getLoadCode(load.id)}</p>
              </div>
              <button
                type="button"
                onClick={(event) => toggleSaved(load.id, event)}
                className={`rounded-lg border p-2 transition ${
                  isSaved
                    ? "border-amber-200 bg-amber-50 text-amber-600"
                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {equipment}
              </span>
              {pickupSoon ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Pickup soon
                </span>
              ) : null}
              {ratePerMile ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  £{ratePerMile}/mi est.
                </span>
              ) : null}
            </div>

            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <span>{getCity(getLoadOrigin(load))}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              <span>{getCity(getLoadDestination(load))}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formatDate(load.pickup_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Weight className="h-3 w-3" />
                {load.weight || load.cargo_weight || "TBC"} kg
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={load.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
              className="group relative overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 transition hover:shadow-md hover:ring-slate-300/80"
      >
        <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-blue-500 to-cyan-500" />

        <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[200px_minmax(0,1fr)_188px] lg:items-center lg:gap-6">
          <div className="space-y-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{formatMoney(price)}</p>
            <p className="font-mono text-[11px] font-semibold text-slate-400">{getLoadCode(load.id)}</p>
            <div className="flex flex-wrap gap-1.5">
              {ratePerMile ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  £{ratePerMile}/mi
                </span>
              ) : null}
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Instant book
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {equipment}
              </span>
              {load.commodity ? (
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                  {formatLabel(load.commodity)}
                </span>
              ) : null}
              {pickupSoon ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Pickup within 3 days
                </span>
              ) : null}
              <span className="text-[11px] text-slate-400">{getTimeAgo(load.created_at)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-slate-900">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{getCity(getLoadOrigin(load))}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              <span>{getCity(getLoadDestination(load))}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDate(load.pickup_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Weight className="h-3.5 w-3.5 text-slate-400" />
                <span>{load.weight || load.cargo_weight || "TBC"} kg</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Truck className="h-3.5 w-3.5 text-slate-400" />
                <span>{equipment}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Route className="h-3.5 w-3.5 text-slate-400" />
                <span>Live route preview</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSelectedLoad(load)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openBidModal(load);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Gavel className="h-3.5 w-3.5" />
              Place bid
            </button>
            <button
              type="button"
              onClick={(event) => toggleSaved(load.id, event)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                isSaved
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              {isSaved ? "Saved" : "Save load"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const detailModal =
    selectedLoad && !showBidModal ? (
      <div className={OVERLAY_CLASS} onClick={() => setSelectedLoad(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,820px)] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            <div className="relative h-[280px] border-b border-slate-100 bg-slate-50 lg:h-auto lg:border-b-0 lg:border-r">
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
                <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route preview</p>
                  <p className="text-[12px] font-semibold text-slate-900">Live lane map</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLoad(null)}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <MapComponent
                {...mapViewState}
                onMove={(evt: { viewState: typeof mapViewState }) => setMapViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
              >
                {routeData ? (
                  <MapSource
                    id="route"
                    type="geojson"
                    data={{ type: "Feature", geometry: routeData, properties: {} }}
                  >
                    <MapLayer
                      id="route-layer"
                      type="line"
                      paint={{ "line-color": "#0f172a", "line-width": 4, "line-opacity": 0.75 }}
                    />
                  </MapSource>
                ) : null}
                {originCoords ? (
                  <MapMarker longitude={originCoords.lng} latitude={originCoords.lat}>
                    <div className="rounded-full border-2 border-white bg-blue-600 p-1.5 shadow-lg">
                      <MapPin className="h-3.5 w-3.5 text-white" />
                    </div>
                  </MapMarker>
                ) : null}
                {destCoords ? (
                  <MapMarker longitude={destCoords.lng} latitude={destCoords.lat}>
                    <div className="rounded-full border-2 border-white bg-emerald-500 p-1.5 shadow-lg">
                      <MapPin className="h-3.5 w-3.5 text-white" />
                    </div>
                  </MapMarker>
                ) : null}
              </MapComponent>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-600">
                  {getLoadCode(selectedLoad.id)}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Paid & live
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {getCity(getLoadOrigin(selectedLoad))} → {getCity(getLoadDestination(selectedLoad))}
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">
                Pickup {formatDate(selectedLoad.pickup_date)}
                {selectedLoad.delivery_date ? ` · Delivery ${formatDate(selectedLoad.delivery_date)}` : ""}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Distance",
                    value: estimatedDistance ? `${(estimatedDistance / 1000).toFixed(1)} km` : "Calculating…",
                    icon: Navigation,
                  },
                  {
                    label: "Est. time",
                    value: estimatedDuration
                      ? `${Math.floor(estimatedDuration / 3600)}h ${Math.floor((estimatedDuration % 3600) / 60)}m`
                      : "Calculating…",
                    icon: Clock,
                  },
                  {
                    label: "Est. fuel",
                    value: calculateFuel(estimatedDistance)
                      ? `${calculateFuel(estimatedDistance)} L`
                      : "Calculating…",
                    icon: Fuel,
                  },
                  {
                    label: "Listed rate",
                    value: formatMoney(getLoadPrice(selectedLoad)),
                    icon: TrendingUp,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </div>
                    <p className="text-[15px] font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Equipment</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">
                    {formatLabel(selectedLoad.equipment || selectedLoad.vehicle_type)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weight</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">
                    {selectedLoad.weight || selectedLoad.cargo_weight || "TBC"} kg
                  </p>
                </div>
              </div>

              {(selectedLoad.notes || selectedLoad.special_instructions) && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Load notes</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-amber-900">
                    {selectedLoad.notes || selectedLoad.special_instructions}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(true);
                    const maxBudget = getLoadPrice(selectedLoad);
                    setBidAmount(maxBudget > 0 ? String(Math.floor(maxBudget * 0.95)) : "");
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Gavel className="h-4 w-4" />
                  Submit bid
                </button>
                <button
                  type="button"
                  onClick={handleBookInstantly}
                  disabled={bookLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {bookLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Book instantly
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ) : null;

  const bidModal = showBidModal && selectedLoad ? (
    <div className={OVERLAY_CLASS} onClick={() => setShowBidModal(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        className="fixed left-1/2 top-1/2 z-[202] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {bidSuccess ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Bid submitted</h3>
            <p className="mt-1 text-[13px] text-slate-500">Your offer was sent to the supplier.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Place your bid</h3>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {getCity(getLoadOrigin(selectedLoad))} → {getCity(getLoadDestination(selectedLoad))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBidModal(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Listed rate</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatMoney(getLoadPrice(selectedLoad))}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">Your bid (£)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-slate-400"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitBid}
                disabled={bidLoading || !bidAmount}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {bidLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                Submit bid
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  ) : null;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-xl border px-4 py-2.5 shadow-lg ${
                toast.type === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-rose-100 bg-rose-50 text-rose-700"
              }`}
            >
              <div className="flex items-center gap-2 text-[13px] font-medium">
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{toast.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="rounded-md bg-slate-900 p-1.5">
                  <Box className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Marketplace
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Available loads</h1>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Paid, live shipments ready for bid or instant booking
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/carrier/smart-loads"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 transition hover:text-violet-700"
              >
                <Zap className="h-3.5 w-3.5" />
                Smart matches
              </Link>
              <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-2 transition ${
                    viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-2 transition ${
                    viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Live loads", value: stats.total, icon: Truck },
              { label: "Avg rate", value: stats.avgRate ? formatMoney(stats.avgRate) : "—", icon: TrendingUp },
              { label: "New today", value: stats.newToday, icon: Star },
              { label: "Pickup soon", value: stats.pickupSoonCount, icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                </div>
                <p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="sticky top-0 z-20 flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search origin, destination, or load ID…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-lg bg-slate-100/80 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-slate-200/80"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                  activeFilter === filter
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {filter.replace("-", " ")}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as (typeof SORT_OPTIONS)[number]["id"])
            }
            className="h-10 shrink-0 cursor-pointer bg-transparent pr-1 text-[12px] font-medium text-slate-600 outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                Sort: {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[148px] animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))
            ) : filteredLoads.length > 0 ? (
              filteredLoads.map((load, index) => renderLoadCard(load, index))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`px-4 py-14 text-center ${viewMode === "grid" ? "col-span-full" : ""}`}
              >
                <div className="mx-auto mb-2 flex justify-center">
                  <NothingLottie className="h-48 w-48" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No loads match your filters</h3>
                <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500">
                  Try clearing search or switching filters. New paid loads appear here in real time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {portalReady && createPortal(
        <AnimatePresence>
          {detailModal}
          {bidModal}
          <InstantBookSuccessOverlay
            open={Boolean(instantBookSuccess)}
            loadCode={instantBookSuccess?.loadCode ?? ""}
            routeLabel={instantBookSuccess?.routeLabel ?? ""}
            amountLabel={instantBookSuccess?.amountLabel ?? ""}
            onClose={() => setInstantBookSuccess(null)}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
