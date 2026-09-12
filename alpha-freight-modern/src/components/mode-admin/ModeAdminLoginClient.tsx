"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";
import { userHasAdminAccess } from "@/lib/admin-session";

export default function ModeAdminLoginClient({
  homePath,
  title,
  description,
}: {
  homePath: string;
  title: string;
  description: string;
}) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || homePath;
  const accessDenied = searchParams.get("error") === "access_denied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    accessDenied ? "Access denied. This account is not authorised for this console." : null
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

      window.location.replace(redirectTo.startsWith(homePath) ? redirectTo : homePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-portal-bg flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <BrandMark textClassName="text-lg font-bold tracking-tight text-gray-900" />
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Secure access</p>
          <h1 className="air-font-display mt-1 text-2xl font-medium text-gray-900">{title}</h1>
          <p className="mt-2 text-[13px] text-gray-500">{description}</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <Shield className="h-4 w-4" />
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
