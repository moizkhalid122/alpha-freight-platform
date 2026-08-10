"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import LoadCommissionBreakdown from "@/components/marketplace/LoadCommissionBreakdown";
import { useMarketCurrency } from "@/hooks/useMarketCurrency";
import { mergeLoadNotesWithMarketMeta } from "@/lib/load-market-meta";
import {
  buildHumanReadableCargoSummary,
  mergeLoadNotesWithFormMeta,
  type LoadFormMeta,
} from "@/lib/load-form-meta";
import { buildUkRouteQuery, formatRouteLabel, isValidUkPostcode, normalizeUkPostcode } from "@/lib/uk-postcode";
import { calculateSupplierTotal } from "@/lib/load-commission";
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
  X,
  PlusCircle,
  Package,
  Layers,
  Ruler,
  Upload,
  ArrowLeftRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import 'mapbox-gl/dist/mapbox-gl.css';
import SupplierLoadAiAdvisor from "@/components/supplier/SupplierLoadAiAdvisor";
import PostLoadProactiveCopilot from "@/components/supplier/PostLoadProactiveCopilot";
import LoadRoutePreviewMap from "@/components/maps/LoadRoutePreviewMap";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200";

const DATETIME_INPUT =
  "h-10 min-h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 [color-scheme:light]";

const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-700";
const FIELD_HINT = "mt-1.5 text-[11px] leading-relaxed text-slate-500";
const POSTCODE_INPUT =
  "w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-900 placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200";

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

// Dynamically import Map marker for live marketplace loads on the route map
const MapMarker = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Marker), { ssr: false });

const SPECIAL_HANDLING_OPTIONS = [
  { id: "fragile", label: "Fragile" },
  { id: "temperature", label: "Temperature controlled" },
  { id: "adr", label: "ADR / Dangerous Goods" },
  { id: "oversized", label: "Oversized" },
] as const;

const PACKAGING_OPTIONS = ["Pallets", "Boxes", "Crates", "Loose", "Other"] as const;

export default function PostLoadPage() {
  const router = useRouter();
  const market = useMarketCurrency("supplier");
  const [currentStep, setCurrentStep] = useState(1);
  const [lastFormActivityAt, setLastFormActivityAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null); // in seconds
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null); // in meters

  const [formData, setFormData] = useState({
    title: "",
    urgency: "normal",
    origin: "",
    pickup_postcode: "",
    destination: "",
    delivery_postcode: "",
    pickup_date: "",
    pickup_time: "",
    delivery_date: "",
    delivery_time: "",
    cargo_type: "",
    cargo_description: "",
    quantity: "",
    packaging_type: "",
    pallet_count: "",
    dimension_length: "",
    dimension_width: "",
    dimension_height: "",
    special_handling: [] as string[],
    weight: "",
    volume: "",
    declared_cargo_value: "",
    cargo_photos: [] as File[],
    equipment: "curtainside",
    tail_lift: false,
    refrigerated: false,
    adr_certified: false,
    forklift_required: false,
    crane_required: false,
    pallet_exchange_required: false,
    other_vehicle_requirements: "",
    load_price: "",
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

  const loadBudget = useMemo(() => {
    const parsed = parseFloat(formData.load_price);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    if (suggestedPrice && suggestedPrice > 0) return suggestedPrice;
    return 0;
  }, [formData.load_price, suggestedPrice]);

  const commissionSummary = useMemo(
    () => calculateSupplierTotal(loadBudget, market.currency),
    [loadBudget, market.currency]
  );

  const handleRouteMetrics = useCallback(
    (metrics: { distanceMeters: number; durationSeconds: number } | null) => {
      setEstimatedDuration(metrics?.durationSeconds ?? null);
      setEstimatedDistance(metrics?.distanceMeters ?? null);
    },
    []
  );

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
            const feature = data.features[0];
            const address = feature.place_name;
            const postcodeContext = feature.context?.find((item: { id?: string; text?: string }) =>
              String(item.id || "").startsWith("postcode")
            );
            const postcode = postcodeContext?.text ? normalizeUkPostcode(postcodeContext.text) : "";
            setFormData(prev => ({
              ...prev,
              [field]: address,
              ...(field === "origin" && postcode ? { pickup_postcode: postcode } : {}),
              ...(field === "destination" && postcode ? { delivery_postcode: postcode } : {}),
            }));
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

  const advisorDraft = useMemo(
    () => ({
      title: formData.title,
      origin: formData.origin,
      pickup_postcode: formData.pickup_postcode,
      destination: formData.destination,
      delivery_postcode: formData.delivery_postcode,
      pickup_date: formData.pickup_date,
      pickup_time: formData.pickup_time,
      delivery_date: formData.delivery_date,
      delivery_time: formData.delivery_time,
      cargo_type: formData.cargo_type,
      cargo_description: formData.cargo_description,
      quantity: formData.quantity,
      packaging_type: formData.packaging_type,
      pallet_count: formData.pallet_count,
      dimension_length: formData.dimension_length,
      dimension_width: formData.dimension_width,
      dimension_height: formData.dimension_height,
      special_handling: formData.special_handling,
      declared_cargo_value: formData.declared_cargo_value,
      weight: formData.weight,
      volume: formData.volume,
      equipment: formData.equipment,
      urgency: formData.urgency,
      load_price: formData.load_price,
      refrigerated: formData.refrigerated,
      tail_lift: formData.tail_lift,
      adr_certified: formData.adr_certified,
      forklift_required: formData.forklift_required,
      crane_required: formData.crane_required,
      pallet_exchange_required: formData.pallet_exchange_required,
      other_vehicle_requirements: formData.other_vehicle_requirements,
      description: formData.cargo_description,
    }),
    [formData]
  );

  const toggleSpecialHandling = (id: string) => {
    setFormData((prev) => {
      const current = prev.special_handling;
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, special_handling: next };
    });
  };

  const uploadCargoPhotos = async (userId: string, files: File[]) => {
    const urls: string[] = [];
    for (const file of files.slice(0, 6)) {
      const path = `load-cargo/${userId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage.from("pods").upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from("pods").getPublicUrl(path);
        if (data.publicUrl) urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const validateStep = (step: number) => {
    if (step === 2) {
      if (!formData.cargo_description.trim()) {
        setToast({ message: "Cargo description is required.", type: "error" });
        return false;
      }
      if (!formData.quantity.trim()) {
        setToast({ message: "Quantity is required (e.g. 20 pallets).", type: "error" });
        return false;
      }
    }
    if (step === 4) {
      if (!formData.load_price || parseFloat(formData.load_price) <= 0) {
        setToast({ message: "Enter your load price — the exact transport amount.", type: "error" });
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    setLastFormActivityAt(Date.now());
  }, [formData, currentStep]);

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
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
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User data:", user);
      if (!user) throw new Error("No user found");

      const price = loadBudget;
      const photoUrls = formData.cargo_photos.length
        ? await uploadCargoPhotos(user.id, formData.cargo_photos)
        : [];

      const formMeta: LoadFormMeta = {
        pickup_postcode: normalizeUkPostcode(formData.pickup_postcode),
        delivery_postcode: normalizeUkPostcode(formData.delivery_postcode),
        cargo_description: formData.cargo_description,
        quantity: formData.quantity,
        packaging_type: formData.packaging_type,
        pallet_count: formData.pallet_count,
        dimension_length: formData.dimension_length,
        dimension_width: formData.dimension_width,
        dimension_height: formData.dimension_height,
        special_handling: formData.special_handling,
        declared_cargo_value: formData.declared_cargo_value,
        volume: formData.volume,
        forklift_required: formData.forklift_required,
        crane_required: formData.crane_required,
        pallet_exchange_required: formData.pallet_exchange_required,
        other_vehicle_requirements: formData.other_vehicle_requirements,
        tail_lift: formData.tail_lift,
        refrigerated: formData.refrigerated,
        adr_certified: formData.adr_certified,
        cargo_photo_urls: photoUrls,
        load_price: formData.load_price,
        urgency: formData.urgency,
      };

      const humanNotes = [
        buildHumanReadableCargoSummary(formMeta),
        formData.additional_notes.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      const notes = mergeLoadNotesWithFormMeta(
        humanNotes,
        formMeta,
        mergeLoadNotesWithMarketMeta("", market.countryCode, market.currency)
      );

      const { data, error } = await supabase
        .from('loads')
        .insert([{
          status: 'pending-payment',
          origin: formatRouteLabel(formData.origin, formData.pickup_postcode),
          destination: formatRouteLabel(formData.destination, formData.delivery_postcode),
          price: price,
          weight: formData.weight,
          equipment: formData.equipment,
          pickup_date: formData.pickup_date,
          delivery_date: formData.delivery_date,
          supplier_id: user.id,
          title: formData.title || `${formData.cargo_type || 'Freight'} Load`,
          commodity: formData.cargo_type,
          notes,
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
          amount: commissionSummary.totalPayable,
          title: formData.title || `${formData.cargo_type || "Freight"} Load`,
          origin: formatRouteLabel(formData.origin, formData.pickup_postcode),
          destination: formatRouteLabel(formData.destination, formData.delivery_postcode),
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
    if (!validateStep(4)) return;
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
          Route, cargo, vehicle, and load price — your load goes live after payment.
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

                  {commissionSummary.loadValue > 0 ? (
                    <div className="mt-5">
                      <LoadCommissionBreakdown
                        loadValue={commissionSummary.loadValue}
                        currency={market.currency}
                        countryCode={market.countryCode}
                      />
                    </div>
                  ) : null}

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

                    <section className="space-y-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route details</p>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                        <div className="space-y-2">
                          <label className={LABEL}>Pickup location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-blue-500" />
                            <input
                              required
                              type="text"
                              placeholder="e.g. London"
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
                              placeholder="e.g. Manchester"
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
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                        <div className="space-y-2">
                          <label className={LABEL}>Pickup postcode</label>
                          <div className="relative max-w-sm">
                            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              inputMode="text"
                              autoComplete="postal-code"
                              placeholder="e.g. SW1A 1AA"
                              className={POSTCODE_INPUT}
                              value={formData.pickup_postcode}
                              onChange={(e) =>
                                setFormData({ ...formData, pickup_postcode: e.target.value.toUpperCase() })
                              }
                              onBlur={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  pickup_postcode: normalizeUkPostcode(prev.pickup_postcode),
                                }))
                              }
                            />
                          </div>
                          <p className={FIELD_HINT}>
                            Exact UK pickup area — sharper route matching and live rates.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className={LABEL}>Delivery postcode</label>
                          <div className="relative max-w-sm">
                            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              inputMode="text"
                              autoComplete="postal-code"
                              placeholder="e.g. M1 1AE"
                              className={POSTCODE_INPUT}
                              value={formData.delivery_postcode}
                              onChange={(e) =>
                                setFormData({ ...formData, delivery_postcode: e.target.value.toUpperCase() })
                              }
                              onBlur={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  delivery_postcode: normalizeUkPostcode(prev.delivery_postcode),
                                }))
                              }
                            />
                          </div>
                          <p className={FIELD_HINT}>
                            Exact UK delivery area — better lane rates from carriers.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
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
                    </section>
                  </div>

                  <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-slate-200 lg:col-span-1 lg:min-h-[500px]">
                    {isClient ? (
                      <LoadRoutePreviewMap
                        origin={formData.origin}
                        destination={formData.destination}
                        pickupPostcode={formData.pickup_postcode}
                        deliveryPostcode={formData.delivery_postcode}
                        enabled={currentStep === 1}
                        className="h-full min-h-[420px] rounded-xl lg:min-h-[500px]"
                        minHeight="100%"
                        onMetrics={handleRouteMetrics}
                        overlayTopLeft={
                          <div className="pointer-events-none flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                              <Navigation className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route preview</p>
                              <p className="text-[12px] font-semibold text-slate-900">
                                {liveLoadMarkers.length
                                  ? `${liveLoadMarkers.length} live load${liveLoadMarkers.length === 1 ? "" : "s"} nearby`
                                  : formData.origin && formData.destination
                                    ? `${formData.origin} → ${formData.destination}`
                                    : "Enter locations to preview"}
                              </p>
                            </div>
                          </div>
                        }
                        overlayBottomLeft={
                          liveLoadMarkers.length ? (
                            <div className="rounded-xl border border-white bg-white/95 px-3 py-2 shadow-lg">
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                                Other active loads
                              </div>
                            </div>
                          ) : null
                        }
                      >
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
                      </LoadRoutePreviewMap>
                    ) : (
                      <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-6 text-center">
                        <Navigation className="h-8 w-8 text-slate-300" />
                        <p className="text-[13px] font-semibold text-slate-900">Map preview</p>
                        <p className="text-[12px] text-slate-500">
                          Enter pickup and delivery on step 1 to preview your route.
                        </p>
                      </div>
                    )}
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

                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                          min="0"
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
                          min="0"
                          placeholder="e.g. 12"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        />
                      </div>
                      <p className={FIELD_HINT}>
                        Total space your cargo needs in cubic metres. Example: 10 pallets ≈ 12 m³.
                        Not sure? Estimate length × width × height in metres, or fill dimensions below.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Declared cargo value (£)</label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.declared_cargo_value}
                          onChange={(e) => setFormData({ ...formData, declared_cargo_value: e.target.value })}
                        />
                      </div>
                      <p className={FIELD_HINT}>
                        Insured value of the goods only — not your transport/load price on step 4.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={LABEL}>Cargo description *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. Palletised steel components"
                        className={`${INPUT} min-h-[88px] resize-none bg-white px-3 py-2.5 leading-normal`}
                        value={formData.cargo_description}
                        onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                      />
                      <p className={FIELD_HINT}>
                        Describe what is being moved — material, packaging, and any handling notes.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Quantity *</label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="text"
                          placeholder="e.g. 20 pallets"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        />
                      </div>
                      <p className={FIELD_HINT}>
                        How many items you are shipping — e.g. 20 pallets, 8 crates, or 1 machine.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className={LABEL}>Packaging type</label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          className={`${INPUT} appearance-none pl-10 pr-3`}
                          value={formData.packaging_type}
                          onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                        >
                          <option value="">Select packaging</option>
                          {PACKAGING_OPTIONS.map((option) => (
                            <option key={option} value={option.toLowerCase()}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>Number of pallets / units</label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. 20"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.pallet_count}
                          onChange={(e) => setFormData({ ...formData, pallet_count: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={LABEL}>Dimensions (cm)</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { key: "dimension_length", label: "Length" },
                        { key: "dimension_width", label: "Width" },
                        { key: "dimension_height", label: "Height" },
                      ].map((field) => (
                        <div key={field.key} className="relative">
                          <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            placeholder={field.label}
                            className={`${INPUT} pl-10 pr-3`}
                            value={formData[field.key as keyof typeof formData] as string}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={LABEL}>Special handling</label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIAL_HANDLING_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleSpecialHandling(option.id)}
                          className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                            formData.special_handling.includes(option.id)
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, special_handling: [] }))}
                        className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                          formData.special_handling.length === 0
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={LABEL}>Upload photos / documents (optional)</label>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-white">
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-[12px] font-semibold text-slate-700">Choose files</span>
                      <span className="text-[11px] text-slate-500">Photos of cargo, packing list, or spec sheet</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length) {
                            setFormData((prev) => ({
                              ...prev,
                              cargo_photos: [...prev.cargo_photos, ...files].slice(0, 6),
                            }));
                          }
                        }}
                      />
                    </label>
                    {formData.cargo_photos.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {formData.cargo_photos.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              className="text-red-600"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  cargo_photos: prev.cargo_photos.filter((_, i) => i !== index),
                                }))
                              }
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
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

                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Site equipment</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      { id: 'forklift_required', label: 'Forklift required', icon: Package },
                      { id: 'crane_required', label: 'Crane required', icon: Truck },
                      { id: 'pallet_exchange_required', label: 'Pallet exchange required', icon: ArrowLeftRight },
                    ].map((req) => (
                      <label
                        key={req.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          formData[req.id as keyof typeof formData]
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData[req.id as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [req.id]: e.target.checked })}
                        />
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${formData[req.id as keyof typeof formData] ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {/* @ts-ignore */}
                          <req.icon className="h-5 w-5" />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-700">{req.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <label className={LABEL}>Other vehicle requirements</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Side loading only, must fit 2.4m height restriction, driver needs hi-vis..."
                    className={`${INPUT} min-h-[88px] resize-none bg-white px-3 py-2.5 leading-normal`}
                    value={formData.other_vehicle_requirements}
                    onChange={(e) => setFormData({ ...formData, other_vehicle_requirements: e.target.value })}
                  />
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
                <SupplierLoadAiAdvisor
                  draft={advisorDraft}
                  currency={market.currency}
                  formatMoney={market.formatMoney}
                  onApplySuggestedPrice={(price) => {
                    setSuggestedPrice(price);
                    setFormData((prev) => ({
                      ...prev,
                      load_price: String(price),
                    }));
                    setToast({ message: "Suggested price applied to load price.", type: "success" });
                  }}
                />

                <section className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Load price & payment</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-1">
                      <label className={LABEL}>Load price (£) *</label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="number"
                          placeholder="e.g. 4000"
                          className={`${INPUT} pl-10 pr-3`}
                          value={formData.load_price}
                          onChange={(e) => setFormData({ ...formData, load_price: e.target.value })}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Exact transport amount — separate from declared cargo value on step 2.
                      </p>
                    </div>
                  </div>

                  {loadBudget > 0 ? (
                    <LoadCommissionBreakdown
                      loadValue={loadBudget}
                      currency={market.currency}
                      countryCode={market.countryCode}
                    />
                  ) : null}
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {success ? "Load published" : "Continue to payment"}
              </button>
            )}
          </div>
        </form>
      </div>

      <PostLoadProactiveCopilot
        draft={advisorDraft}
        currentStep={currentStep}
        currency={market.currency}
        formatMoney={market.formatMoney}
        lastActivityAt={lastFormActivityAt}
        agreementAccepted={formData.agreement_accepted}
        onGoToStep={setCurrentStep}
        onApplyFixes={(fixes) => {
          setFormData((prev) => ({
            ...prev,
            ...(fixes.origin ? { origin: fixes.origin } : {}),
            ...(fixes.destination ? { destination: fixes.destination } : {}),
            ...(fixes.equipment ? { equipment: fixes.equipment } : {}),
            ...(fixes.weight ? { weight: String(fixes.weight) } : {}),
            ...(fixes.cargo_type ? { cargo_type: fixes.cargo_type } : {}),
            ...(fixes.load_price ? { load_price: String(fixes.load_price) } : {}),
            ...(fixes.pickup_date ? { pickup_date: fixes.pickup_date } : {}),
            ...(fixes.delivery_date ? { delivery_date: fixes.delivery_date } : {}),
            ...(fixes.urgency ? { urgency: fixes.urgency } : {}),
          }));
          if (fixes.load_price) {
            setSuggestedPrice(Number(fixes.load_price));
          }
          setToast({ message: "AI applied suggested updates to your form.", type: "success" });
        }}
      />
    </div>
  );
}
