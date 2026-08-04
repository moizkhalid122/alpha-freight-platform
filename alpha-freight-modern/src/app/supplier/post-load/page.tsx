"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { upsertSupplierPaymentOrder } from "@/lib/supplier-payments";
import { 
  MapPin, 
  Truck, 
  PoundSterling, 
  Clock, 
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  AlertCircle,
  Box,
  Scale,
  Maximize2,
  ClipboardList,
  CreditCard,
  CheckSquare,
  Navigation,
  Compass,
  Sparkles,
  X,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import 'mapbox-gl/dist/mapbox-gl.css';

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200";

const DATETIME_INPUT =
  "h-10 min-h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 [color-scheme:light]";

const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-700";

const formatMoney = (value: number | null | undefined) =>
  value == null ? "—" : `£${value.toLocaleString("en-GB")}`;

// Mapbox Token — env first, project fallback for local dev
import { MAPBOX_TOKEN } from "@/lib/mapbox";

const isValidCoord = (lng?: number | null, lat?: number | null) =>
  Number.isFinite(lng) && Number.isFinite(lat);

type LiveLoadMarker = {
  id: string;
  origin: string;
  lng: number;
  lat: number;
};

// Dynamically import Map components to avoid SSR issues
const MapComponent = dynamic(() => import('react-map-gl/mapbox').then(mod => {
  const { Map, Source, Layer } = mod;
  return function MapWrapper(props: any) {
    return (
      <Map {...props}>
        {props.children}
      </Map>
    );
  };
}), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Initialising Maps...</div>
});

const MapSource = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Source), { ssr: false });
const MapLayer = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Layer), { ssr: false });
const MapMarker = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Marker), { ssr: false });

export default function PostLoadPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [originCoords, setOriginCoords] = useState<{lng: number, lat: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lng: number, lat: number} | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null); // in seconds
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null); // in meters
  const [mapViewState, setMapViewState] = useState({
    longitude: -1.5,
    latitude: 52.5,
    zoom: 5
  });

  const [formData, setFormData] = useState({
    title: "",
    urgency: "normal",
    origin: "",
    destination: "",
    pickup_date: "",
    pickup_time: "",
    delivery_date: "",
    delivery_time: "",
    cargo_type: "",
    weight: "",
    volume: "",
    value: "",
    equipment: "curtainside",
    description: "",
    tail_lift: false,
    refrigerated: false,
    adr_certified: false,
    white_glove: false,
    min_budget: "",
    max_budget: "",
    payment_method: "bank-transfer",
    additional_notes: "",
    agreement_accepted: false,
    save_as_template: false
  });

  const [isLocating, setIsLocating] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [isPaymentChoiceOpen, setIsPaymentChoiceOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [liveLoadMarkers, setLiveLoadMarkers] = useState<LiveLoadMarker[]>([]);

  const setSafeMapViewState = (next: { longitude: number; latitude: number; zoom: number }) => {
    if (!isValidCoord(next.longitude, next.latitude) || !Number.isFinite(next.zoom)) return;
    setMapViewState(next);
  };

  // Auto-hide toast
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadLiveMarketplaceLoads = async () => {
      if (!MAPBOX_TOKEN) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: activeLoads } = await supabase
        .from("loads")
        .select("id, origin, supplier_id")
        .in("status", ["active", "available"])
        .order("created_at", { ascending: false })
        .limit(12);

      if (!isActive || !activeLoads?.length) {
        if (isActive) setLiveLoadMarkers([]);
        return;
      }

      const uniqueOrigins = new Map<string, { id: string; origin: string }>();
      activeLoads.forEach((load) => {
        const origin = load.origin?.trim();
        if (!origin) return;
        if (user?.id && load.supplier_id === user.id) return;
        if (!uniqueOrigins.has(origin)) {
          uniqueOrigins.set(origin, { id: load.id, origin });
        }
      });

      const markers: LiveLoadMarker[] = [];

      for (const entry of uniqueOrigins.values()) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(entry.origin)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=gb`
          );
          const data = await res.json();
          const center = data.features?.[0]?.center;
          if (!center || center.length < 2) continue;
          const [lng, lat] = center;
          if (!isValidCoord(lng, lat)) continue;
          markers.push({ id: entry.id, origin: entry.origin, lng, lat });
        } catch {
          // Skip failed geocode for individual marketplace loads.
        }
      }

      if (isActive) setLiveLoadMarkers(markers);
    };

    void loadLiveMarketplaceLoads();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const useCurrentLocation = (field: 'origin' | 'destination') => {
    if (!navigator.geolocation) {
      setToast({ message: "Geolocation is not supported by your browser", type: 'error' });
      return;
    }

    setIsLocating(field);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            setFormData(prev => ({ ...prev, [field]: address }));
            if (field === 'origin') setOriginCoords({ lng: longitude, lat: latitude });
            else setDestCoords({ lng: longitude, lat: latitude });
            setSafeMapViewState({ longitude, latitude, zoom: 12 });
            setToast({ message: "Location updated successfully!", type: 'success' });
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setToast({ message: "Failed to get address details", type: 'error' });
        } finally {
          setIsLocating(null);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(null);
        setToast({ message: "Could not get your location. Please check permissions.", type: 'error' });
      }
    );
  };

  // Real Geocoding and Price Estimator
  useEffect(() => {
    const geocode = async (query: string, setCoords: (c: { lng: number; lat: number } | null) => void) => {
      if (!query || query.length < 3 || !MAPBOX_TOKEN) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=gb`
        );
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          if (!isValidCoord(lng, lat)) return;
          setCoords({ lng, lat });
          setSafeMapViewState({ longitude: lng, latitude: lat, zoom: 8 });
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    };

    const timer = setTimeout(() => {
      if (formData.origin) geocode(formData.origin, setOriginCoords);
      if (formData.destination) geocode(formData.destination, setDestCoords);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.origin, formData.destination]);

  // Fetch Route Line
  useEffect(() => {
    const fetchRoute = async () => {
      if (!originCoords || !destCoords || !MAPBOX_TOKEN) {
        setRouteData(null);
        setEstimatedDuration(null);
        return;
      }
      if (!isValidCoord(originCoords.lng, originCoords.lat) || !isValidCoord(destCoords.lng, destCoords.lat)) {
        return;
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          setRouteData(data.routes[0].geometry);
          setEstimatedDuration(data.routes[0].duration);
          setEstimatedDistance(data.routes[0].distance);
          
          // Fit map to show both points
          const minLng = Math.min(originCoords.lng, destCoords.lng);
          const maxLng = Math.max(originCoords.lng, destCoords.lng);
          const minLat = Math.min(originCoords.lat, destCoords.lat);
          const maxLat = Math.max(originCoords.lat, destCoords.lat);
          
          setSafeMapViewState({
            longitude: (minLng + maxLng) / 2,
            latitude: (minLat + maxLat) / 2,
            zoom: 5,
          });
        }
      } catch (err) {
        console.error("Route error:", err);
      }
    };
    fetchRoute();
  }, [originCoords, destCoords]);

  // Auto-calculate Delivery Time based on Route Duration
  useEffect(() => {
    if (estimatedDuration && formData.pickup_date && formData.pickup_time) {
      try {
        // Construct pickup date safely
        const [year, month, day] = formData.pickup_date.split('-').map(Number);
        const [hours, minutes] = formData.pickup_time.split(':').map(Number);
        const pickupDate = new Date(year, month - 1, day, hours, minutes);

        if (isNaN(pickupDate.getTime())) return;

        // Truck Factor: 20% slower than car + 1 hour for every 4.5 hours of driving (mandatory breaks)
        let totalSeconds = estimatedDuration * 1.25; 
        const drivingHours = totalSeconds / 3600;
        const breakTimeSeconds = Math.floor(drivingHours / 4.5) * 45 * 60; // 45 min break every 4.5 hours
        totalSeconds += breakTimeSeconds;

        const deliveryDate = new Date(pickupDate.getTime() + (totalSeconds * 1000));

        // Format for HTML inputs
        const dDate = deliveryDate.getFullYear() + '-' + 
                      String(deliveryDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(deliveryDate.getDate()).padStart(2, '0');
        const dTime = String(deliveryDate.getHours()).padStart(2, '0') + ':' + 
                      String(deliveryDate.getMinutes()).padStart(2, '0');

        // Only update if different to prevent unnecessary re-renders
        if (formData.delivery_date !== dDate || formData.delivery_time !== dTime) {
          setFormData(prev => ({
            ...prev,
            delivery_date: dDate,
            delivery_time: dTime
          }));
        }
      } catch (error) {
        console.error("Error calculating delivery time:", error);
      }
    }
  }, [estimatedDuration, formData.pickup_date, formData.pickup_time]);

  useEffect(() => {
    if (formData.origin && formData.destination && formData.weight) {
      setIsEstimating(true);
      const timer = setTimeout(() => {
        const base = 150;
        const weightFactor = parseFloat(formData.weight) * 0.05;
        const urgencyFactor = formData.urgency === 'urgent' ? 1.1 : formData.urgency === 'same-day' ? 1.25 : 1;
        setSuggestedPrice(Math.round((base + weightFactor) * urgencyFactor));
        setIsEstimating(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formData.origin, formData.destination, formData.weight, formData.urgency]);

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const steps = [
    { id: 1, title: "Route", icon: MapPin },
    { id: 2, title: "Cargo", icon: Box },
    { id: 3, title: "Vehicle", icon: Truck },
    { id: 4, title: "Review", icon: ClipboardList }
  ];

  const submitLoad = async (paymentTiming: "pay-now" | "pay-later") => {
    if (!formData.agreement_accepted) {
      setToast({ message: "Please accept the agreement before posting.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User data:", user);
      if (!user) throw new Error("No user found");

      const price = formData.max_budget ? parseFloat(formData.max_budget) : suggestedPrice || 0;

      console.log("Inserting load with data:", {
        status: 'pending-payment',
        origin: formData.origin,
        destination: formData.destination,
        price: price,
        weight: formData.weight,
        equipment: formData.equipment,
        pickup_date: formData.pickup_date,
        delivery_date: formData.delivery_date
      });

      const { data, error } = await supabase
        .from('loads')
        .insert([{
          status: 'pending-payment',
          origin: formData.origin,
          destination: formData.destination,
          price: price,
          weight: formData.weight,
          equipment: formData.equipment,
          pickup_date: formData.pickup_date,
          delivery_date: formData.delivery_date,
          supplier_id: user.id,
          title: formData.title || `${formData.cargo_type || 'Freight'} Load`,
          commodity: formData.cargo_type,
          notes: formData.description,
          payment_route: paymentTiming,
          payment_state: 'pending',
        }])
        .select();

      console.log("Supabase insert result:", { data, error });

      if (error) {
        console.error("Supabase error details:", error);
        const errorMessage =
          error.message?.includes("infinite recursion")
            ? "Database policy error. Run supplier-platform-rls-fix.sql in Supabase SQL Editor, then try again."
            : error.message || "Unable to post load.";
        setToast({ message: `Failed to post load: ${errorMessage}`, type: 'error' });
        return;
      }
      setIsPaymentChoiceOpen(false);
      const insertedLoad = Array.isArray(data) ? data[0] : null;
      const loadId = insertedLoad?.id;

      if (loadId) {
        await upsertSupplierPaymentOrder({
          loadId,
          supplierId: user.id,
          paymentRoute: paymentTiming,
          paymentState: "pending",
          amount: price,
          title: formData.title || `${formData.cargo_type || "Freight"} Load`,
          origin: formData.origin,
          destination: formData.destination,
          equipment: formData.equipment,
          createdAt: insertedLoad?.created_at || new Date().toISOString(),
          dueLabel: paymentTiming === "pay-later" ? "Due within 7 days" : "Awaiting card payment",
          paymentMethod: formData.payment_method,
        });
      }

      if (paymentTiming === "pay-now") {
        setToast({
          message: "Load saved. Complete payment to publish it on the marketplace.",
          type: "info",
        });
        router.push(loadId ? `/supplier/pay-instant?load=${loadId}` : "/supplier/pay-instant");
        return;
      }

      setSuccess(true);
      setToast({
        message: "Load saved. You can complete payment later from My Posts.",
        type: "success",
      });
      router.push(loadId ? `/supplier/pay-later?highlight=${loadId}` : "/supplier/pay-later");
    } catch (err) {
      console.error("Error posting load:", err);
      setToast({ message: "Something went wrong. Please try again.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreement_accepted) {
      setToast({ message: "Please accept the agreement before posting.", type: 'error' });
      return;
    }
    setIsPaymentChoiceOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="rounded-md bg-blue-600 p-1.5">
            <PlusCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marketplace</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Post a load</h1>
        <p className="text-[13px] text-slate-500">
          Route, cargo, vehicle, and budget — your load goes live after payment.
        </p>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed left-1/2 top-4 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <p className="flex-1 text-[13px] font-semibold">{toast.message}</p>
            <button type="button" onClick={() => setToast(null)} className="rounded-md p-1 hover:bg-black/5">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isClient &&
        createPortal(
          <AnimatePresence>
            {isPaymentChoiceOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex min-h-screen items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  className={`w-full max-w-2xl ${CARD} p-5 shadow-xl sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Payment</p>
                      <h3 className="mt-0.5 text-[17px] font-bold text-slate-900">How would you like to pay?</h3>
                      <p className="mt-1 text-[13px] text-slate-500">
                        Choose before publishing. Loads stay pending until payment is complete.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPaymentChoiceOpen(false)}
                      disabled={loading}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => submitLoad("pay-now")}
                      disabled={loading}
                      className="group rounded-xl border-2 border-slate-900 bg-slate-900 p-5 text-left text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div className="rounded-lg bg-white/10 p-2">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Recommended</span>
                      </div>
                      <h4 className="mt-4 text-[15px] font-bold">Pay now</h4>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
                        Continue to secure checkout. Your load goes live after payment is confirmed.
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold">
                        Continue
                        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => submitLoad("pay-later")}
                      disabled={loading}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white disabled:opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Flexible</span>
                      </div>
                      <h4 className="mt-4 text-[15px] font-bold text-slate-900">Pay later</h4>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                        Save the load now and pay from My Posts within 7 days.
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                        Continue
                        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting load…
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <div className="px-1 py-2">
        <div className="relative flex justify-between">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-100" />
          <motion.div
            className="absolute top-5 h-0.5 bg-slate-900"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition ${
                    isCompleted || isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold ${
                    isActive ? "text-slate-900" : isCompleted ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-full">
        <form onSubmit={handleSubmit} className={`${CARD} space-y-8 p-5 sm:p-6 lg:p-8`}>
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    <section className="space-y-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Load summary</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className={LABEL}>Load title</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              required
                              type="text"
                              placeholder="e.g. Electronics delivery"
                              className={`${INPUT} pl-10 pr-3`}
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={LABEL}>Urgency level</label>
                          <div className="relative">
                            <AlertCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              className={`${INPUT} appearance-none pl-10 pr-3`}
                              value={formData.urgency}
                              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                            >
                              <option value="normal">Normal</option>
                              <option value="urgent">Urgent (+10% premium)</option>
                              <option value="same-day">Same day (+25% premium)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route details</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className={LABEL}>Pickup location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-blue-500" />
                            <input
                              required
                              type="text"
                              placeholder="e.g. London, UK"
                              className={`${INPUT} pl-10 pr-3`}
                              value={formData.origin}
                              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => useCurrentLocation("origin")}
                            disabled={isLocating !== null}
                            className="flex items-center gap-2 rounded-lg px-1 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            {isLocating === "origin" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Navigation className="h-3 w-3" />
                            )}
                            Use current location
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className={LABEL}>Delivery location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                            <input
                              required
                              type="text"
                              placeholder="e.g. Manchester, UK"
                              className={`${INPUT} pl-10 pr-3`}
                              value={formData.destination}
                              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => useCurrentLocation("destination")}
                            disabled={isLocating !== null}
                            className="flex items-center gap-2 rounded-lg px-1 py-1 text-[11px] font-semibold text-emerald-600 transition hover:bg-emerald-50"
                          >
                            {isLocating === "destination" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Navigation className="h-3 w-3" />
                            )}
                            Use current location
                          </button>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className={LABEL}>Pickup date & time</label>
                              <div className="flex items-center gap-3">
                                <input
                                  required
                                  type="date"
                                  className={`${DATETIME_INPUT} flex-[1.15]`}
                                  value={formData.pickup_date}
                                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                                />
                                <input
                                  required
                                  type="time"
                                  className={`${DATETIME_INPUT} flex-1`}
                                  value={formData.pickup_time}
                                  onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className={LABEL}>Delivery date & time</label>
                              <div className="flex items-center gap-3">
                                <input
                                  required
                                  type="date"
                                  className={`${DATETIME_INPUT} flex-[1.15]`}
                                  value={formData.delivery_date}
                                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                                />
                                <input
                                  required
                                  type="time"
                                  className={`${DATETIME_INPUT} flex-1`}
                                  value={formData.delivery_time}
                                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                          {estimatedDuration ? (
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                              <p className="text-[11px] font-semibold text-emerald-700">Estimated delivery (truck speed)</p>
                              <p className="mt-0.5 text-[11px] text-slate-600">
                                Travel: {Math.floor((estimatedDuration * 1.25) / 3600)}h{" "}
                                {Math.floor(((estimatedDuration * 1.25) % 3600) / 60)}m
                                {estimatedDistance
                                  ? ` · ${(estimatedDistance / 1000).toFixed(1)} km / ${(estimatedDistance / 1609.34).toFixed(1)} mi`
                                  : ""}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Map Preview Sidebar */}
                  <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 lg:col-span-1 lg:min-h-[500px]">
                    {isClient && MAPBOX_TOKEN && isValidCoord(mapViewState.longitude, mapViewState.latitude) ? (
                    <MapComponent
                      longitude={mapViewState.longitude}
                      latitude={mapViewState.latitude}
                      zoom={mapViewState.zoom}
                      onMove={(evt: any) => {
                        const { longitude, latitude, zoom } = evt.viewState;
                        setSafeMapViewState({ longitude, latitude, zoom });
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/light-v11"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      scrollZoom={false}
                      interactiveLayerIds={[]}
                    >
                      {routeData && (
                        <MapSource id="route" type="geojson" data={{ type: 'Feature', geometry: routeData, properties: {} }}>
                          <MapLayer
                            id="route-layer"
                            type="line"
                            paint={{
                              'line-color': '#2563eb',
                              'line-width': 4,
                              'line-opacity': 0.6,
                              'line-dasharray': [1, 1]
                            }}
                          />
                        </MapSource>
                      )}
                      {liveLoadMarkers.map((marker) => (
                        <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat} anchor="center">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full border-2 border-white bg-amber-400 shadow-lg" />
                            <div className="mt-1 max-w-[120px] truncate rounded bg-white/95 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-slate-600 shadow">
                              Live load
                            </div>
                          </div>
                        </MapMarker>
                      ))}
                      {originCoords && isValidCoord(originCoords.lng, originCoords.lat) && (
                        <MapMarker longitude={originCoords.lng} latitude={originCoords.lat}>
                          <div className="flex flex-col items-center group/marker">
                            <div className="bg-blue-600 p-2 rounded-full shadow-2xl border-2 border-white transform group-hover/marker:scale-110 transition-transform">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="mt-1 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded shadow-lg opacity-0 group-hover/marker:opacity-100 transition-opacity">Pickup</div>
                          </div>
                        </MapMarker>
                      )}
                      {destCoords && isValidCoord(destCoords.lng, destCoords.lat) && (
                        <MapMarker longitude={destCoords.lng} latitude={destCoords.lat}>
                          <div className="flex flex-col items-center group/marker">
                            <div className="bg-emerald-500 p-2 rounded-full shadow-2xl border-2 border-white transform group-hover/marker:scale-110 transition-transform">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="mt-1 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded shadow-lg opacity-0 group-hover/marker:opacity-100 transition-opacity">Delivery</div>
                          </div>
                        </MapMarker>
                      )}
                    </MapComponent>
                    ) : (
                      <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-6 text-center">
                        <Navigation className="h-8 w-8 text-slate-300" />
                        <p className="text-[13px] font-semibold text-slate-900">Map preview</p>
                        <p className="text-[12px] text-slate-500">
                          Enter pickup and delivery on step 1 to preview your route.
                        </p>
                      </div>
                    )}
                    <div className="absolute left-3 right-3 top-3 flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                        <Navigation className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route preview</p>
                        <p className="text-[12px] font-semibold text-slate-900">
                          {liveLoadMarkers.length
                            ? `${liveLoadMarkers.length} live load${liveLoadMarkers.length === 1 ? "" : "s"} nearby`
                            : "Enter locations to preview"}
                        </p>
                      </div>
                    </div>
                    {liveLoadMarkers.length ? (
                      <div className="absolute bottom-4 left-4 rounded-xl border border-white bg-white/95 px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                          Other active loads
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cargo specification</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className={LABEL}>Cargo type</label>
                      <div className="relative">
                        <Box className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          required
                          className={`${INPUT} appearance-none pl-10 pr-3`}
                          value={formData.cargo_type}
                          onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                        >
                          <option value="">Select type</option>
                          <option value="general">General cargo</option>
                          <option value="fragile">Fragile</option>
                          <option value="hazardous">Hazardous</option>
                          <option value="refrigerated">Refrigerated</option>
                          <option value="liquid">Liquid</option>
                          <option value="machinery">Machinery</option>
                          <option value="electronics">Electronics</option>
                          <option value="furniture">Furniture</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Weight (kg)</label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="number"
                          placeholder="e.g. 1000"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Volume (m³)</label>
                      <div className="relative">
                        <Maximize2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 10"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Cargo value (£)</label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vehicle specification</p>
                  <div className="space-y-2">
                    <label className={LABEL}>Vehicle type</label>
                    <div className="relative max-w-xl">
                      <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        required
                        className={`${INPUT} appearance-none pl-10 pr-3`}
                        value={formData.equipment}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      >
                        <option value="van">Van</option>
                        <option value="small-truck">Small truck (3.5T)</option>
                        <option value="medium-truck">Medium truck (7.5T)</option>
                        <option value="large-truck">Large truck (18T)</option>
                        <option value="artic">Artic (44T)</option>
                        <option value="flatbed">Flatbed</option>
                        <option value="curtainside">Curtainside</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vehicle requirements</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { id: 'tail_lift', label: 'Tail Lift', icon: Compass },
                      { id: 'refrigerated', label: 'Refrigerated', icon: Zap },
                      { id: 'adr_certified', label: 'ADR Certified', icon: ShieldCheck },
                      { id: 'white_glove', label: 'White Glove', icon: Sparkles },
                    ].map((req) => (
                      <label 
                        key={req.id}
                        className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-4 transition ${
                          formData[req.id as keyof typeof formData]
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={formData[req.id as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({...formData, [req.id]: e.target.checked})}
                        />
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${formData[req.id as keyof typeof formData] ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {/* @ts-ignore */}
                          <req.icon className="w-6 h-6" />
                        </div>
                        <span className={`text-center text-[11px] font-semibold ${formData[req.id as keyof typeof formData] ? "text-slate-900" : "text-slate-500"}`}>
                          {req.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Smart Price Estimator */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1">
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Market estimate</span>
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-900">Suggested rate</h3>
                      <p className="mt-1 max-w-md text-[12px] text-slate-500">
                        Based on route, weight, and urgency — adjust min/max budget below.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center sm:min-w-[160px]">
                      {isEstimating ? (
                        <div className="space-y-2">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                          <p className="text-[11px] text-slate-500">Calculating…</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recommended</p>
                          <p className="text-2xl font-bold text-slate-900">{formatMoney(suggestedPrice ?? undefined)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Set your budget</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className={LABEL}>Min budget (£)</label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.min_budget}
                          onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Max budget (£)</label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.max_budget}
                          onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Payment method</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          required
                          className={`${INPUT} appearance-none pl-10 pr-3`}
                          value={formData.payment_method}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        >
                          <option value="bank-transfer">Bank transfer</option>
                          <option value="card">Card payment</option>
                          <option value="invoice">Invoice</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Additional Notes & Agreement */}
                <div className="space-y-10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Final details</p>

                  <div className="space-y-2">
                    <label className={LABEL}>Additional Notes</label>
                    <div className="relative">
                      <ClipboardList className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        rows={4}
                        placeholder="Any additional information or requirements..."
                        className={`${INPUT} min-h-[100px] resize-none bg-white pl-10 pt-3 leading-normal`}
                        value={formData.additional_notes}
                        onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                      <div className={`flex h-5 w-5 items-center justify-center rounded border ${formData.save_as_template ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                        {formData.save_as_template && <CheckSquare className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={formData.save_as_template}
                        onChange={(e) => setFormData({...formData, save_as_template: e.target.checked})}
                      />
                      <span className="text-[12px] font-medium text-slate-700">Save as template for future loads</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                      <div className={`flex h-5 w-5 items-center justify-center rounded border ${formData.agreement_accepted ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}>
                        {formData.agreement_accepted && <CheckSquare className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={formData.agreement_accepted}
                        onChange={(e) => setFormData({...formData, agreement_accepted: e.target.checked})}
                      />
                      <span className="text-[12px] font-medium text-slate-700">I agree to the terms & conditions</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className={`rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:invisible`}
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {success ? "Posted" : "Post load"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
