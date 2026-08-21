"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import CommercialDirectorLoginTransitionOverlay from "@/components/commercial-director/CommercialDirectorLoginTransitionOverlay";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import { supabase } from "@/lib/supabase";
import { userHasCommercialDirectorAccess } from "@/lib/commercial-director-session";
import { COMMERCIAL_DIRECTOR_PROFILE } from "@/lib/commercial-director-permissions";

export default function CommercialDirectorLoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || commercialDirectorRoute();
  const accessDenied = searchParams.get("error") === "access_denied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [targetPath, setTargetPath] = useState("");
  const [error, setError] = useState<string | null>(
    accessDenied
      ? "Access denied. This account is not authorised for the Commercial Director panel."
      : null
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

      const allowed = await userHasCommercialDirectorAccess(supabase, data.user);
      if (!allowed) {
        await supabase.auth.signOut();
        throw new Error("This account does not have Commercial Director access.");
      }

      const destination = redirectTo.startsWith(commercialDirectorRoute())
        ? redirectTo
        : commercialDirectorRoute();

      setTargetPath(destination);
      setShowTransition(true);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="cd-portal-bg flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <BrandMark textClassName="text-lg font-bold tracking-tight text-gray-900" />
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Commercial Director</p>
          <h1 className="air-font-display mt-1 text-2xl font-medium text-gray-900">Sign in to your panel</h1>
          <p className="mt-2 text-[13px] text-gray-500">
            For {COMMERCIAL_DIRECTOR_PROFILE.title} — sales, companies, team, and performance only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="cd-email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Email
            </label>
            <input
              id="cd-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="air-input h-11 rounded-xl"
              placeholder={COMMERCIAL_DIRECTOR_PROFILE.email}
            />
          </div>

          <div>
            <label htmlFor="cd-password" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="cd-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="air-input h-11 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={isLoading} className="air-btn-primary h-11 rounded-xl disabled:opacity-60">
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? "Verifying..." : "Sign in securely"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-gray-400">
          <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900">
            Back to website
          </Link>
        </p>
      </div>
      </div>

      <CommercialDirectorLoginTransitionOverlay
        isOpen={showTransition}
        onClose={() => setShowTransition(false)}
        targetPath={targetPath}
      />
    </>
  );
}
