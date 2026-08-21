"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Globe, Phone, Plane, Sparkles } from "lucide-react";
import VideoOverlay from "@/components/VideoOverlay";
import {
  AIR_HUBS,
  AIR_PORTAL,
  AIR_SHIPMENT_TYPES,
  airDashboardPath,
  airOnboardingStorageKey,
  airRoleLabel,
  type AirOnboardingData,
  type AirRole,
} from "@/lib/air-portal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const STEPS = ["Profile", "Operations", "Contact", "Ready"] as const;

export default function AirOnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") === "carrier" ? "carrier" : "supplier") as AirRole;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<AirOnboardingData>({
    companyName: "",
    iataCode: "",
    primaryAirport: AIR_HUBS[0],
    shipmentTypes: ["express"],
    phone: "",
  });

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace(AIR_PORTAL.signup);
        return;
      }
      setUserId(data.user.id);
      setForm((prev) => ({
        ...prev,
        companyName: (data.user.user_metadata?.full_name as string) || prev.companyName,
      }));
    });
  }, [router]);

  const toggleShipmentType = (value: string) => {
    setForm((prev) => ({
      ...prev,
      shipmentTypes: prev.shipmentTypes.includes(value)
        ? prev.shipmentTypes.filter((v) => v !== value)
        : [...prev.shipmentTypes, value],
    }));
  };

  const canContinue = () => {
    if (step === 0) return form.companyName.trim().length > 1;
    if (step === 1) return form.shipmentTypes.length > 0 && form.primaryAirport;
    if (step === 2) return form.phone.trim().length >= 8;
    return true;
  };

  const finish = async () => {
    if (!userId) return;
    setLoading(true);

    const payload: AirOnboardingData = {
      ...form,
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem(airOnboardingStorageKey(userId), JSON.stringify(payload));

    await supabase
      .from("profiles")
      .update({
        full_name: form.companyName.trim(),
      })
      .eq("id", userId);

    setLoading(false);
    setShowVideo(true);
  };

  const dashboard = airDashboardPath(role);

  return (
    <div className="min-h-[100dvh] air-onboarding-bg text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#FAF9F6]/95 px-5 py-5 backdrop-blur-sm sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href={AIR_PORTAL.signup}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">
            Air onboarding
          </p>
          <span className="w-14" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 text-center">
          <p className="air-font-script text-4xl text-slate-800 sm:text-5xl">Welcome aboard</p>
          <h1 className="air-font-display mt-2 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            Set up your {airRoleLabel(role).toLowerCase()} profile
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Premium air freight — AWB-ready in minutes.
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1.5 w-12 rounded-full transition",
                i <= step ? "bg-sky-500" : "bg-slate-200"
              )}
            />
          ))}
        </div>

        <div className="air-onboarding-card rounded-[28px] p-6 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-sky-600">
                    <Building2 className="h-5 w-5" />
                    <h2 className="air-font-display text-xl font-medium text-slate-900">
                      Company profile
                    </h2>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Company name *
                    </label>
                    <input
                      className="air-onboarding-input"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Alpha Logistics Ltd"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      IATA code (optional)
                    </label>
                    <input
                      className="air-onboarding-input"
                      value={form.iataCode}
                      onChange={(e) => setForm({ ...form, iataCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. 1234567"
                    />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-sky-600">
                    <Globe className="h-5 w-5" />
                    <h2 className="air-font-display text-xl font-medium text-slate-900">Operations</h2>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Primary airport hub *
                    </label>
                    <select
                      className="air-onboarding-input"
                      value={form.primaryAirport}
                      onChange={(e) => setForm({ ...form, primaryAirport: e.target.value })}
                    >
                      {AIR_HUBS.map((hub) => (
                        <option key={hub} value={hub}>
                          {hub}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Shipment types *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AIR_SHIPMENT_TYPES.map((type) => {
                        const active = form.shipmentTypes.includes(type.value);
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleShipmentType(type.value)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                              active
                                ? "border-sky-300 bg-sky-50 text-sky-800"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-sky-600">
                    <Phone className="h-5 w-5" />
                    <h2 className="air-font-display text-xl font-medium text-slate-900">Contact</h2>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Operations phone *
                    </label>
                    <input
                      className="air-onboarding-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h2 className="air-font-display text-2xl font-medium text-slate-900">
                    You&apos;re cleared for takeoff
                  </h2>
                  <p className="text-sm text-slate-500">
                    {form.companyName} · {form.primaryAirport}
                    <br />
                    {form.shipmentTypes.length} shipment type
                    {form.shipmentTypes.length === 1 ? "" : "s"} selected
                  </p>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canContinue()}
                onClick={() => setStep((s) => s + 1)}
                className="air-onboarding-btn ml-auto w-auto min-w-[140px] gap-2 disabled:opacity-40"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={finish}
                className="air-onboarding-btn ml-auto w-auto min-w-[160px] gap-2 disabled:opacity-40"
              >
                {loading ? "Saving…" : "Enter dashboard"}
                <Plane className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <VideoOverlay isOpen={showVideo} onClose={() => setShowVideo(false)} targetPath={dashboard} />
    </div>
  );
}
