"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  MapPin,
  Package,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import AirFlightRouteMap from "@/components/air/maps/AirFlightRouteMap";
import { AIR_SHIPMENT_TYPES } from "@/lib/air-portal";
import {
  AIR_COMMODITY_CATEGORIES,
  AIR_COUNTRY_OPTIONS,
  AIR_CURRENCIES,
  AIR_INCOTERMS,
  canAdvancePostStep,
  getAirHubsForCountry,
  getDefaultHubForCountry,
  getStepValidationHint,
  hubEntryLabel,
} from "@/lib/air-hubs-data";
import {
  estimateAirQuote,
  flightDistanceKm,
  formatFlightDuration,
  getHubCode,
} from "@/lib/air-hubs";
import { generateAwb, saveAirShipment, type AirShipment } from "@/lib/air-storage";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "route", label: "Route", icon: Globe },
  { id: "cargo", label: "Cargo", icon: Package },
  { id: "service", label: "Service", icon: Clock },
  { id: "contact", label: "Contact", icon: User },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", detail: "Best value · 3–5 day lane" },
  { value: "express", label: "Express", detail: "Priority uplift · 24–48h" },
  { value: "vip", label: "VIP", detail: "White-glove handling · dedicated lane" },
  { value: "same_day", label: "Same-day", detail: "Critical charter-ready" },
] as const;

const PACKAGING_OPTIONS = ["Pallets", "Cartons", "Crates", "ULD", "Loose"] as const;

const SPECIAL_HANDLING = [
  { id: "fragile", label: "Fragile" },
  { id: "temperature", label: "Temperature controlled" },
  { id: "pharma", label: "Pharma compliant" },
  { id: "aog", label: "AOG / Urgent parts" },
  { id: "high_value", label: "High value" },
] as const;

type FormState = {
  originCountry: string;
  destinationCountry: string;
  consigneeCountry: string;
  origin: string;
  destination: string;
  pickupAddress: string;
  deliveryAddress: string;
  weightKg: string;
  pieces: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  cargoType: string;
  commodityCategory: string;
  commodityDescription: string;
  hsCode: string;
  packaging: string;
  cargoValue: string;
  currency: string;
  incoterm: string;
  urgency: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  specialHandling: string[];
  shipperContact: string;
  consigneeName: string;
  consigneePhone: string;
  customsRequired: boolean;
  insurance: boolean;
  notes: string;
  agreementAccepted: boolean;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL_FORM: FormState = {
  originCountry: "GB",
  destinationCountry: "AE",
  consigneeCountry: "AE",
  origin: hubEntryLabel(getDefaultHubForCountry("GB")),
  destination: hubEntryLabel(getDefaultHubForCountry("AE")),
  pickupAddress: "",
  deliveryAddress: "",
  weightKg: "",
  pieces: "1",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  cargoType: AIR_SHIPMENT_TYPES[1].value,
  commodityCategory: AIR_COMMODITY_CATEGORIES[0],
  commodityDescription: "",
  hsCode: "",
  packaging: PACKAGING_OPTIONS[0],
  cargoValue: "",
  currency: "GBP",
  incoterm: "DAP",
  urgency: "vip",
  pickupDate: todayIsoDate(),
  pickupTime: "",
  deliveryDate: "",
  specialHandling: [],
  shipperContact: "",
  consigneeName: "",
  consigneePhone: "",
  customsRequired: false,
  insurance: true,
  notes: "",
  agreementAccepted: false,
};

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100/80";

const TEXTAREA = `${INPUT} min-h-[72px] resize-none leading-relaxed`;

export default function AirShipperPostPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [flightDistance, setFlightDistance] = useState(0);
  const [showValidation, setShowValidation] = useState(false);

  const originHubOptions = useMemo(
    () => getAirHubsForCountry(form.originCountry),
    [form.originCountry]
  );
  const destinationHubOptions = useMemo(
    () => getAirHubsForCountry(form.destinationCountry),
    [form.destinationCountry]
  );

  const validationHint = useMemo(() => getStepValidationHint(step, form), [step, form]);
  const canContinue = canAdvancePostStep(step, form);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        setForm((prev) => ({
          ...prev,
          shipperContact: profile?.phone ?? prev.shipperContact,
          consigneeName: profile?.full_name ?? prev.consigneeName,
        }));
      }
    })();
  }, []);

  useEffect(() => {
    setFlightDistance(flightDistanceKm(form.origin, form.destination));
  }, [form.origin, form.destination]);

  const quote = useMemo(() => {
    const weight = Number(form.weightKg) || 0;
    if (!weight) return 0;
    return estimateAirQuote({
      weightKg: weight,
      distanceKm: flightDistance,
      cargoType: form.cargoType,
      urgency: form.urgency,
    });
  }, [form.weightKg, form.cargoType, form.urgency, flightDistance]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setShowValidation(false);
  };

  const setOriginCountry = (countryCode: string) => {
    const hub = getDefaultHubForCountry(countryCode);
    setForm((prev) => ({
      ...prev,
      originCountry: countryCode,
      origin: hubEntryLabel(hub),
    }));
    setShowValidation(false);
  };

  const setDestinationCountry = (countryCode: string) => {
    const hub = getDefaultHubForCountry(countryCode);
    setForm((prev) => ({
      ...prev,
      destinationCountry: countryCode,
      destination: hubEntryLabel(hub),
      consigneeCountry: countryCode,
    }));
    setShowValidation(false);
  };

  const toggleHandling = (id: string) => {
    setForm((prev) => ({
      ...prev,
      specialHandling: prev.specialHandling.includes(id)
        ? prev.specialHandling.filter((item) => item !== id)
        : [...prev.specialHandling, id],
    }));
  };

  const nextStep = () => {
    if (!canContinue) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleDistanceChange = useCallback((distanceKm: number) => {
    setFlightDistance(distanceKm);
  }, []);

  const submit = async () => {
    if (!userId || !canContinue) {
      setShowValidation(true);
      return;
    }
    setSaving(true);

    const awb = generateAwb();
    const shipment: AirShipment = {
      id: crypto.randomUUID(),
      awb,
      origin: form.origin,
      destination: form.destination,
      weightKg: Number(form.weightKg),
      cargoType: form.cargoType,
      status: "pending",
      rate: `£${quote.toLocaleString("en-GB")}`,
      estimatedQuote: `£${quote.toLocaleString("en-GB")}`,
      createdAt: new Date().toISOString(),
      pickupAddress: form.pickupAddress.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      pieces: Number(form.pieces),
      lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
      widthCm: form.widthCm ? Number(form.widthCm) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      cargoValue: form.cargoValue ? Number(form.cargoValue) : undefined,
      packaging: form.packaging,
      urgency: form.urgency,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      deliveryDate: form.deliveryDate || undefined,
      specialHandling: form.specialHandling,
      shipperContact: form.shipperContact.trim(),
      consigneeName: form.consigneeName.trim(),
      consigneePhone: form.consigneePhone.trim() || undefined,
      customsRequired: form.customsRequired,
      insurance: form.insurance,
      notes: form.notes.trim() || undefined,
      flightDistanceKm: flightDistance,
      commodityCategory: form.commodityCategory,
      commodityDescription: form.commodityDescription.trim() || undefined,
      hsCode: form.hsCode.trim() || undefined,
      currency: form.currency,
      incoterm: form.incoterm,
      consigneeCountry: form.consigneeCountry,
    };

    saveAirShipment(userId, shipment);
    router.push(`/air/shipper/track?q=${encodeURIComponent(awb)}`);
  };

  const cargoLabel =
    AIR_SHIPMENT_TYPES.find((item) => item.value === form.cargoType)?.label ?? form.cargoType;
  const urgencyLabel =
    URGENCY_OPTIONS.find((item) => item.value === form.urgency)?.label ?? form.urgency;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/air/shipper/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          <Sparkles className="h-3 w-3" />
          VIP posting
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-600">Post air shipment</p>
            <h1 className="air-font-display mt-1 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">
              Create your <span className="air-font-script text-3xl sm:text-4xl">air cargo</span> request
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
              Five guided steps — route, cargo, service, compliance, and instant AWB quote.
            </p>
          </div>

          <div>
            <div className="mb-2 flex gap-1">
              {STEPS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  className={cn(
                    "h-1 flex-1 rounded-full transition",
                    index <= step ? "bg-sky-500" : "bg-slate-200",
                    index < step ? "cursor-pointer hover:bg-sky-400" : "cursor-default"
                  )}
                  aria-label={item.label}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="text-sky-600">{STEPS[step].label}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
                {step === 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="air-font-display text-xl font-medium text-slate-900">Route & lane</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Select airport hubs and pickup / delivery addresses.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Origin country">
                        <select
                          className={INPUT}
                          value={form.originCountry}
                          onChange={(e) => setOriginCountry(e.target.value)}
                        >
                          {AIR_COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Destination country">
                        <select
                          className={INPUT}
                          value={form.destinationCountry}
                          onChange={(e) => setDestinationCountry(e.target.value)}
                        >
                          {AIR_COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Origin airport">
                        <select className={INPUT} value={form.origin} onChange={(e) => updateForm("origin", e.target.value)}>
                          {originHubOptions.map((hub) => (
                            <option key={hub.code} value={hubEntryLabel(hub)}>
                              {hubEntryLabel(hub)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Destination airport">
                        <select className={INPUT} value={form.destination} onChange={(e) => updateForm("destination", e.target.value)}>
                          {destinationHubOptions.map((hub) => (
                            <option key={hub.code} value={hubEntryLabel(hub)}>
                              {hubEntryLabel(hub)}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Pickup address" hint="Warehouse, dock, or collection point">
                      <textarea
                        className={TEXTAREA}
                        placeholder="Unit 4, Heathrow Cargo Centre, TW6 2GW"
                        value={form.pickupAddress}
                        onChange={(e) => updateForm("pickupAddress", e.target.value)}
                      />
                    </Field>

                    <Field label="Delivery address" hint="Consignee facility or final delivery point">
                      <textarea
                        className={TEXTAREA}
                        placeholder="Dubai Logistics City, DWC, UAE"
                        value={form.deliveryAddress}
                        onChange={(e) => updateForm("deliveryAddress", e.target.value)}
                      />
                    </Field>

                    <div className="rounded-xl border border-sky-100/80 bg-sky-50/50 px-3 py-2.5 text-xs text-sky-900">
                      <p className="font-semibold">
                        {getHubCode(form.origin)} → {getHubCode(form.destination)}
                      </p>
                      <p className="mt-1 text-sky-800/80">
                        {flightDistance.toLocaleString()} km flight lane · {formatFlightDuration(flightDistance)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="air-font-display text-xl font-medium text-slate-900">Cargo details</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Weight, dimensions, and commodity profile for AWB classification.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Total weight (kg)">
                        <input
                          className={INPUT}
                          type="number"
                          min="1"
                          placeholder="250"
                          value={form.weightKg}
                          onChange={(e) => updateForm("weightKg", e.target.value)}
                        />
                      </Field>
                      <Field label="Pieces / units">
                        <input
                          className={INPUT}
                          type="number"
                          min="1"
                          value={form.pieces}
                          onChange={(e) => updateForm("pieces", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Length (cm)">
                        <input
                          className={INPUT}
                          type="number"
                          min="1"
                          placeholder="120"
                          value={form.lengthCm}
                          onChange={(e) => updateForm("lengthCm", e.target.value)}
                        />
                      </Field>
                      <Field label="Width (cm)">
                        <input
                          className={INPUT}
                          type="number"
                          min="1"
                          placeholder="80"
                          value={form.widthCm}
                          onChange={(e) => updateForm("widthCm", e.target.value)}
                        />
                      </Field>
                      <Field label="Height (cm)">
                        <input
                          className={INPUT}
                          type="number"
                          min="1"
                          placeholder="100"
                          value={form.heightCm}
                          onChange={(e) => updateForm("heightCm", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Cargo type">
                        <select
                          className={INPUT}
                          value={form.cargoType}
                          onChange={(e) => updateForm("cargoType", e.target.value)}
                        >
                          {AIR_SHIPMENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Commodity category">
                        <select
                          className={INPUT}
                          value={form.commodityCategory}
                          onChange={(e) => updateForm("commodityCategory", e.target.value)}
                        >
                          {AIR_COMMODITY_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Commodity description" hint="Brief description for AWB and customs">
                      <input
                        className={INPUT}
                        placeholder="e.g. Medical device components, non-hazardous"
                        value={form.commodityDescription}
                        onChange={(e) => updateForm("commodityDescription", e.target.value)}
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Packaging">
                        <select
                          className={INPUT}
                          value={form.packaging}
                          onChange={(e) => updateForm("packaging", e.target.value)}
                        >
                          {PACKAGING_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="HS code" hint="Optional">
                        <input
                          className={INPUT}
                          placeholder="8471.30"
                          value={form.hsCode}
                          onChange={(e) => updateForm("hsCode", e.target.value)}
                        />
                      </Field>
                      <Field label="Incoterms">
                        <select
                          className={INPUT}
                          value={form.incoterm}
                          onChange={(e) => updateForm("incoterm", e.target.value)}
                        >
                          {AIR_INCOTERMS.map((term) => (
                            <option key={term.value} value={term.value}>
                              {term.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Declared value" hint="For insurance and customs">
                        <input
                          className={INPUT}
                          type="number"
                          min="0"
                          placeholder="25000"
                          value={form.cargoValue}
                          onChange={(e) => updateForm("cargoValue", e.target.value)}
                        />
                      </Field>
                      <Field label="Currency">
                        <select
                          className={INPUT}
                          value={form.currency}
                          onChange={(e) => updateForm("currency", e.target.value)}
                        >
                          {AIR_CURRENCIES.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="air-font-display text-xl font-medium text-slate-900">Service & schedule</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Choose service tier and collection window.</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {URGENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateForm("urgency", option.value)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-left transition",
                            form.urgency === option.value
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white hover:border-sky-200"
                          )}
                        >
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p
                            className={cn(
                              "mt-0.5 text-[11px]",
                              form.urgency === option.value ? "text-slate-300" : "text-slate-500"
                            )}
                          >
                            {option.detail}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Pickup date">
                        <input
                          className={INPUT}
                          type="date"
                          value={form.pickupDate}
                          onChange={(e) => updateForm("pickupDate", e.target.value)}
                        />
                      </Field>
                      <Field label="Pickup time">
                        <input
                          className={INPUT}
                          type="time"
                          value={form.pickupTime}
                          onChange={(e) => updateForm("pickupTime", e.target.value)}
                        />
                      </Field>
                    </div>

                    <Field label="Requested delivery date" hint="Optional target delivery">
                      <input
                        className={INPUT}
                        type="date"
                        value={form.deliveryDate}
                        onChange={(e) => updateForm("deliveryDate", e.target.value)}
                      />
                    </Field>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Special handling
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SPECIAL_HANDLING.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleHandling(item.id)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                              form.specialHandling.includes(item.id)
                                ? "border-sky-500 bg-sky-50 text-sky-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="air-font-display text-xl font-medium text-slate-900">Contact & compliance</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Shipper and consignee details for AWB and customs.
                      </p>
                    </div>

                    <Field label="Shipper contact phone">
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          className={`${INPUT} pl-9`}
                          placeholder="+44 7700 900000"
                          value={form.shipperContact}
                          onChange={(e) => updateForm("shipperContact", e.target.value)}
                        />
                      </div>
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Consignee name">
                        <input
                          className={INPUT}
                          placeholder="Company or recipient"
                          value={form.consigneeName}
                          onChange={(e) => updateForm("consigneeName", e.target.value)}
                        />
                      </Field>
                      <Field label="Consignee country">
                        <select
                          className={INPUT}
                          value={form.consigneeCountry}
                          onChange={(e) => updateForm("consigneeCountry", e.target.value)}
                        >
                          {AIR_COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Consignee phone">
                      <input
                        className={INPUT}
                        placeholder="+971 4 000 0000"
                        value={form.consigneePhone}
                        onChange={(e) => updateForm("consigneePhone", e.target.value)}
                      />
                    </Field>

                    <Field label="Handling notes" hint="Security, access codes, or customs references">
                      <textarea
                        className={TEXTAREA}
                        placeholder="Temperature range 2–8°C. Customs invoice attached on collection."
                        value={form.notes}
                        onChange={(e) => updateForm("notes", e.target.value)}
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToggleCard
                        active={form.customsRequired}
                        onClick={() => updateForm("customsRequired", !form.customsRequired)}
                        title="Customs clearance"
                        detail="Broker support for import/export docs"
                        icon={FileText}
                      />
                      <ToggleCard
                        active={form.insurance}
                        onClick={() => updateForm("insurance", !form.insurance)}
                        title="Cargo insurance"
                        detail="Full declared value cover included"
                        icon={ShieldCheck}
                      />
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="air-font-display text-xl font-medium text-slate-900">Review & confirm</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Verify details before AWB issuance.</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryItem icon={Globe} label="Lane" value={`${getHubCode(form.origin)} → ${getHubCode(form.destination)}`} />
                        <SummaryItem icon={Plane} label="Flight distance" value={`${flightDistance.toLocaleString()} km`} />
                        <SummaryItem icon={Package} label="Cargo" value={`${form.weightKg} kg · ${cargoLabel}`} />
                        <SummaryItem icon={Box} label="Packaging" value={`${form.pieces} × ${form.packaging}`} />
                        <SummaryItem icon={Clock} label="Service" value={urgencyLabel} />
                        <SummaryItem icon={Calendar} label="Pickup" value={`${form.pickupDate || "—"} ${form.pickupTime || ""}`.trim()} />
                        <SummaryItem icon={MapPin} label="Pickup address" value={form.pickupAddress} />
                        <SummaryItem icon={MapPin} label="Delivery address" value={form.deliveryAddress} />
                        <SummaryItem icon={User} label="Consignee" value={form.consigneeName} />
                        <SummaryItem icon={Phone} label="Contact" value={form.shipperContact} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Estimated VIP quote
                          </p>
                          <p className="air-font-display mt-0.5 text-2xl text-emerald-900">
                            £{quote.toLocaleString("en-GB")}
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-800/80">
                            Subject to forwarder confirmation
                          </p>
                        </div>
                        <Wallet className="h-7 w-7 text-emerald-600/70" />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-3">
                      <input
                        type="checkbox"
                        checked={form.agreementAccepted}
                        onChange={(e) => updateForm("agreementAccepted", e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                      />
                      <span className="text-xs leading-relaxed text-slate-600">
                        I confirm the cargo details are accurate and agree to Alpha Freight air terms and VIP
                        handling policies.
                      </span>
                    </label>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              {showValidation && validationHint ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {validationHint}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                >
                  {saving ? "Creating AWB…" : "Confirm & create AWB"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                IATA-compliant AWB
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                VIP lane matching
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-500" />
                Customs & insurance ready
              </span>
            </div>
          </div>

          <div className="space-y-3 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
              <AirFlightRouteMap
                originHub={form.origin}
                destinationHub={form.destination}
                minHeight={220}
                className="h-[220px] sm:h-[260px] lg:h-[420px]"
                onDistanceChange={handleDistanceChange}
                overlayTopLeft={
                  <div className="rounded-xl border border-white/10 bg-slate-900/75 px-3 py-2 backdrop-blur">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-sky-300">Live preview</p>
                    <p className="text-xs font-semibold text-white">
                      {getHubCode(form.origin)} → {getHubCode(form.destination)}
                    </p>
                  </div>
                }
                overlayBottomLeft={
                  quote > 0 ? (
                    <div className="rounded-xl border border-white/10 bg-slate-900/75 px-3 py-2 backdrop-blur">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Live quote</p>
                      <p className="air-font-display text-lg text-white">£{quote.toLocaleString("en-GB")}</p>
                    </div>
                  ) : null
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2">
                <p className="font-bold uppercase tracking-wider text-slate-400">Distance</p>
                <p className="mt-0.5 font-semibold text-slate-900">{flightDistance.toLocaleString()} km</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2">
                <p className="font-bold uppercase tracking-wider text-slate-400">Est. flight</p>
                <p className="mt-0.5 font-semibold text-slate-900">{formatFlightDuration(flightDistance)}</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-3.5 w-3.5 text-sky-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xs font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ToggleCard({
  active,
  onClick,
  title,
  detail,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition",
        active ? "border-sky-400 bg-sky-50/80" : "border-slate-200/80 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("h-4 w-4", active ? "text-sky-600" : "text-slate-400")} />
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
        </div>
      </div>
    </button>
  );
}
