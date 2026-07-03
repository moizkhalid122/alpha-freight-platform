"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { recordSupplierReferralFromSignup } from "@/lib/supplier-referrals";
import { recordCarrierReferralFromSignup } from "@/lib/carrier-referrals";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "carrier") as "carrier" | "supplier";
  const referralCode = (searchParams.get("ref") || "").trim().toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: role
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Account could not be created. Please try again.");
      }

      if (!authData.session) {
        setError("Account created. Please verify your email from your inbox, then sign in.");
        setIsLoading(false);
        return;
      }

      // Create profile in public.profiles table
      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: authData.user.id,
          full_name: formData.fullName,
          role: role,
          referred_by_code: referralCode || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      if (role === "supplier" && referralCode) {
        await recordSupplierReferralFromSignup({
          referredUserId: authData.user.id,
          referralCode,
        });
      }

      if (role === "carrier" && referralCode) {
        await recordCarrierReferralFromSignup({
          referredUserId: authData.user.id,
          referralCode,
        });
      }

      const onboardingParams = new URLSearchParams({ role });
      if (referralCode) onboardingParams.set("ref", referralCode);
      router.push(`/onboarding?${onboardingParams.toString()}`);
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {role === "supplier" ? "Supplier Sign up" : "Create an account"}
        </h2>
        <p className="text-slate-500 font-medium text-sm">Sign up and get started with Alpha Freight.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full name</label>
          <div className="relative">
            <input 
              type="text" 
              required
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-full py-4 px-6 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email</label>
          <div className="relative">
            <input 
              type="email" 
              required
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-full py-4 px-6 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Password</label>
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              required
              placeholder="••••••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-full py-4 px-6 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300 shadow-sm"
            />

            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          disabled={isLoading}
          className="w-full py-4.5 bg-[#FFD666] text-slate-900 rounded-full text-sm font-bold shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-3 transition-all hover:bg-[#ffcd3a] mt-4"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            "Submit"
          )}
        </motion.button>
      </form>

      <div className="mt-8">
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <svg viewBox="0 0 384 512" className="w-4 h-4 fill-slate-900">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            Apple
          </button>
          <button className="flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.11 0 5.72-1.03 7.63-2.78l-3.57-2.77c-.99.66-2.23 1.06-4.06 1.06-3.11 0-5.75-2.1-6.7-4.93H1.08v2.86C3.01 20.25 7.15 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 13.58c-.24-.72-.38-1.48-.38-2.28s.14-1.56.38-2.28V6.16H1.08C.39 7.54 0 9.1 0 10.74c0 1.64.39 3.2 1.08 4.58l4.22-2.31z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.69 0 3.2.58 4.39 1.72l3.28-3.28C17.72 1.3 15.11 0 12 0 7.15 0 3.01 2.75 1.08 6.16L5.3 8.47c.95-2.83 3.59-4.93 6.7-4.93z"
              />
            </svg>
            Google
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] font-medium text-slate-500">
        Already have an account? <Link href={`/auth/login${role ? `?role=${role}` : ""}`} className="text-slate-900 font-bold hover:underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
