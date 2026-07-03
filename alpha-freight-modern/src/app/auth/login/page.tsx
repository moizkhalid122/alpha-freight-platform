"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import VideoOverlay from "@/components/VideoOverlay";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { AUTH } from "@/components/auth/auth-styles";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [targetDashboard, setTargetDashboard] = useState<string>("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const userRole = profile?.role || role || "carrier";
        const redirectPath = searchParams.get("redirect");
        const isSafeRedirect =
          redirectPath &&
          (redirectPath.startsWith("/supplier/") ||
            redirectPath.startsWith("/carrier/") ||
            redirectPath === "/supplier/dashboard" ||
            redirectPath === "/carrier/dashboard");

        const dashboard = isSafeRedirect
          ? redirectPath
          : userRole === "supplier"
            ? "/supplier/dashboard"
            : "/carrier/dashboard";

        setTargetDashboard(dashboard);
        setShowVideo(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={AUTH.header}>
        <h2 className={AUTH.title}>{role === "supplier" ? "Supplier sign in" : "Sign in"}</h2>
        <p className={AUTH.subtitle}>Welcome back. Enter your details to continue.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={AUTH.error}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={AUTH.form}>
        <div className={AUTH.field}>
          <label className={AUTH.label}>Email</label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={AUTH.input}
          />
        </div>

        <div className={AUTH.field}>
          <div className="flex items-center justify-between px-1 sm:px-3">
            <label className={AUTH.labelPlain}>Password</label>
            <Link href="#" className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${AUTH.input} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={isLoading}
          className={AUTH.btnPrimary}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
          ) : (
            "Sign in"
          )}
        </motion.button>
      </form>

      <div className="mt-5 sm:mt-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <button type="button" className={AUTH.btnSocial}>
            <svg viewBox="0 0 384 512" className="h-4 w-4 fill-slate-900">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Apple
          </button>
          <button type="button" className={AUTH.btnSocial}>
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c3.11 0 5.72-1.03 7.63-2.78l-3.57-2.77c-.99.66-2.23 1.06-4.06 1.06-3.11 0-5.75-2.1-6.7-4.93H1.08v2.86C3.01 20.25 7.15 23 12 23z" />
              <path fill="#FBBC05" d="M5.3 13.58c-.24-.72-.38-1.48-.38-2.28s.14-1.56.38-2.28V6.16H1.08C.39 7.54 0 9.1 0 10.74c0 1.64.39 3.2 1.08 4.58l4.22-2.31z" />
              <path fill="#EA4335" d="M12 4.75c1.69 0 3.2.58 4.39 1.72l3.28-3.28C17.72 1.3 15.11 0 12 0 7.15 0 3.01 2.75 1.08 6.16L5.3 8.47c.95-2.83 3.59-4.93 6.7-4.93z" />
            </svg>
            Google
          </button>
        </div>
      </div>

      <p className={`${AUTH.footerText} mt-5 sm:mt-6`}>
        Don&apos;t have an account?{" "}
        <Link href={`/auth/signup${role ? `?role=${role}` : ""}`} className="font-bold text-slate-900 hover:underline underline-offset-4">
          Sign up
        </Link>
      </p>

      <VideoOverlay isOpen={showVideo} onClose={() => setShowVideo(false)} targetPath={targetDashboard} />
    </div>
  );
}
