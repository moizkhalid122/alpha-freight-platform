"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";

import { adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";
import { userHasAdminAccess } from "@/lib/admin-session";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || adminRoute();
  const accessDenied = searchParams.get("error") === "access_denied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    accessDenied ? "Access denied. This account is not authorised for the admin console." : null
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Sign in failed.");

      const isAdmin = await userHasAdminAccess(supabase, data.user);
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }

      router.replace(redirectTo.startsWith(adminRoute()) ? redirectTo : adminRoute());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#eef2ff_0%,#f8fafc_45%,#ffffff_100%)] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Secure access</p>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Admin Console Login</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ring-violet-500/30 transition focus:ring-2"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm outline-none ring-violet-500/30 transition focus:ring-2"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {isLoading ? "Verifying..." : "Sign in securely"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
          Authorised personnel only. All sign-in attempts are monitored.
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="/" className="font-semibold text-slate-600 hover:text-slate-900">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
