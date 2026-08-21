"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Eye, EyeOff, Truck } from "lucide-react";
import { AIR_PORTAL } from "@/lib/air-portal";
import { supabase } from "@/lib/supabase";
import { recordCarrierReferralFromSignup } from "@/lib/carrier-referrals";
import { recordSupplierReferralFromSignup } from "@/lib/supplier-referrals";
import { cn } from "@/lib/utils";

export default function AirSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"carrier" | "supplier">("supplier");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    referralCode: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = (searchParams.get("ref") || "").trim().toUpperCase();

  useEffect(() => {
    const urlRole = searchParams.get("role");
    if (urlRole === "carrier" || urlRole === "supplier") setRole(urlRole);
  }, [searchParams]);

  useEffect(() => {
    if (referralFromUrl) {
      setFormData((prev) => ({ ...prev, referralCode: referralFromUrl }));
    }
  }, [referralFromUrl]);

  const effectiveReferralCode = (formData.referralCode || referralFromUrl).trim().toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role,
            transport_mode: "air",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account could not be created. Please try again.");

      if (!authData.session) {
        setError("Account created. Please verify your email, then sign in.");
        setIsLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: authData.user.id,
          full_name: formData.fullName,
          role,
          referred_by_code: effectiveReferralCode || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      if (role === "supplier" && effectiveReferralCode) {
        await recordSupplierReferralFromSignup({
          referredUserId: authData.user.id,
          referralCode: effectiveReferralCode,
        });
      }

      if (role === "carrier" && effectiveReferralCode) {
        await recordCarrierReferralFromSignup({
          referredUserId: authData.user.id,
          referralCode: effectiveReferralCode,
        });
      }

      const onboardingParams = new URLSearchParams({ role });
      if (effectiveReferralCode) onboardingParams.set("ref", effectiveReferralCode);
      router.push(`${AIR_PORTAL.onboarding}?${onboardingParams.toString()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="air-font-display text-2xl font-medium tracking-tight text-slate-900">Create air account</h2>
        <p className="mt-1.5 text-sm text-slate-500">Join Alpha Freight air freight in under a minute.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {[
          { id: "supplier" as const, label: "Shipper", icon: Building2 },
          { id: "carrier" as const, label: "Forwarder", icon: Truck },
        ].map((option) => {
          const Icon = option.icon;
          const active = role === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setRole(option.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition",
                active
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c3.11 0 5.72-1.03 7.63-2.78l-3.57-2.77c-.99.66-2.23 1.06-4.06 1.06-3.11 0-5.75-2.1-6.7-4.93H1.08v2.86C3.01 20.25 7.15 23 12 23z" />
          <path fill="#FBBC05" d="M5.3 13.58c-.24-.72-.38-1.48-.38-2.28s.14-1.56.38-2.28V6.16H1.08C.39 7.54 0 9.1 0 10.74c0 1.64.39 3.2 1.08 4.58l4.22-2.31z" />
          <path fill="#EA4335" d="M12 4.75c1.69 0 3.2.58 4.39 1.72l3.28-3.28C17.72 1.3 15.11 0 12 0 7.15 0 3.01 2.75 1.08 6.16L5.3 8.47c.95-2.83 3.59-4.93 6.7-4.93z" />
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-[0.2em]">
          <span className="bg-white px-3 text-slate-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Full name
          </label>
          <input
            type="text"
            required
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Referral code (optional)
          </label>
          <input
            type="text"
            placeholder={role === "supplier" ? "AF-SUP-XXXXXXXX" : "AF-CAR-XXXXXXXX"}
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/10"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            "Continue with email"
          )}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/air/login" className="font-bold text-slate-900 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
