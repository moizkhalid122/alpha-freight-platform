"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AUTH } from "@/components/auth/auth-styles";
import VideoOverlay from "@/components/VideoOverlay";
import EmployeeExistingSessionBanner from "@/components/employee/EmployeeExistingSessionBanner";
import { isEmployeeMetadata, withTimeout } from "@/lib/employee-auth-utils";
import {
  employeeOnboardingPath,
  employeeRoute,
  employeeSignupPath,
} from "@/lib/employee-path";
import { fetchEmployeeOnboarding, isLocalOnboardingComplete, markLocalOnboardingComplete } from "@/lib/employee-onboarding";
import { formatAuthError } from "@/lib/format-error";
import { userHasEmployeeAccess } from "@/lib/employee-session";
import { createFastAuthClient, supabase } from "@/lib/supabase";

async function syncSessionToCookies(
  session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>
) {
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

export default function EmployeeLoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || employeeRoute();
  const accessDenied = searchParams.get("error") === "access_denied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    accessDenied ? "Access denied. This account is not authorised for the team portal." : null
  );
  const [showVideo, setShowVideo] = useState(false);
  const [targetPath, setTargetPath] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const authClient = createFastAuthClient();
      const { data, error: authError } = await withTimeout(
        authClient.auth.signInWithPassword({ email: email.trim(), password }),
        20000,
        "Sign in"
      );

      if (authError) throw authError;
      if (!data.user || !data.session) throw new Error("Sign in failed. Check your email and password.");

      if (!isEmployeeMetadata(data.user)) {
        const isEmployee = await withTimeout(
          userHasEmployeeAccess(authClient, data.user),
          5000,
          "Employee access check"
        );
        if (!isEmployee) {
          await authClient.auth.signOut();
          throw new Error(
            "This account is not a team account. Create a new team account or ask your manager to set your role."
          );
        }
      }

      await syncSessionToCookies(data.session);

      const locallyOnboarded = isLocalOnboardingComplete(data.user.id);
      let destination = locallyOnboarded ? employeeRoute() : employeeOnboardingPath();

      if (!locallyOnboarded) {
        const record = await fetchEmployeeOnboarding(supabase, data.user.id);
        if (record?.onboarding_completed) {
          markLocalOnboardingComplete(data.user.id);
          destination = redirectTo.startsWith(employeeRoute()) ? redirectTo : employeeRoute();
        }
      } else if (redirectTo.startsWith(employeeRoute())) {
        destination = redirectTo;
      }

      setTargetPath(destination);
      setShowVideo(true);
      setIsLoading(false);
    } catch (err) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={AUTH.header}>
        <h2 className={AUTH.title}>Team sign in</h2>
        <p className={AUTH.subtitle}>Welcome back. Enter your work credentials to continue.</p>
      </div>

      <EmployeeExistingSessionBanner />

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={AUTH.error}
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={AUTH.form}>
        <div className={AUTH.field}>
          <label htmlFor="employee-email" className={AUTH.label}>
            Work email
          </label>
          <input
            id="employee-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@alphafreight.uk"
            className={AUTH.input}
          />
        </div>

        <div className={AUTH.field}>
          <label htmlFor="employee-password" className={AUTH.labelPlain}>
            Password
          </label>
          <div className="relative">
            <input
              id="employee-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`${AUTH.input} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.99 }} type="submit" disabled={isLoading} className={AUTH.btnPrimary}>
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
          ) : (
            "Sign in to Team Hub"
          )}
        </motion.button>
      </form>

      <p className={`${AUTH.footerText} mt-5 sm:mt-6`}>
        New team member?{" "}
        <Link href={employeeSignupPath()} className="font-bold text-slate-900 hover:underline underline-offset-4">
          Create account
        </Link>
      </p>

      <VideoOverlay isOpen={showVideo} onClose={() => setShowVideo(false)} targetPath={targetPath} />
    </div>
  );
}
