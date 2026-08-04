"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AUTH } from "@/components/auth/auth-styles";
import EmployeeExistingSessionBanner from "@/components/employee/EmployeeExistingSessionBanner";
import { employeeOnboardingPath, employeeRoute } from "@/lib/employee-path";
import { completeEmployeeSignup } from "@/lib/employee-signup";
import { formatAuthError } from "@/lib/format-error";
import { createFastAuthClient, supabase } from "@/lib/supabase";

export default function EmployeeSignupClient() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email")?.trim() || "";
  const prefilledName = searchParams.get("name")?.trim() || "";
  const prefilledPosition =
    searchParams.get("position")?.trim() || searchParams.get("job_title")?.trim() || "";

  const [fullName, setFullName] = useState(prefilledName);
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledName) setFullName(prefilledName);
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail, prefilledName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const authClient = createFastAuthClient();
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "employee",
            position: prefilledPosition || "Team Member",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account could not be created.");
      if (authData.user.identities?.length === 0) {
        throw new Error("This email is already registered. Please sign in instead.");
      }

      if (!authData.session) {
        setInfo("Account created. Please verify your email, then sign in.");
        setIsLoading(false);
        return;
      }

      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });

      const setup = await completeEmployeeSignup(supabase, {
        userId: authData.user.id,
        session: authData.session,
        fullName: fullName.trim(),
        position: prefilledPosition || "Team Member",
      });

      if (!setup.profileReady && !setup.hrReady && setup.warning) {
        console.warn("Employee profile setup deferred:", setup.warning);
      }

      window.location.assign(employeeOnboardingPath());
    } catch (err) {
      setError(formatAuthError(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={AUTH.header}>
        <h2 className={AUTH.title}>Join the team</h2>
        <p className={AUTH.subtitle}>Create your Alpha Freight employee account in under a minute.</p>
      </div>

      {prefilledPosition ? (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Invited as <strong>{prefilledPosition}</strong>
        </div>
      ) : null}

      <EmployeeExistingSessionBanner />

      <AnimatePresence>
        {error ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={AUTH.error}>
            {error}
            {error.includes("already registered") ? (
              <p className="mt-2">
                <Link href={employeeRoute("/login")} className="underline">
                  Go to sign in →
                </Link>
              </p>
            ) : null}
          </motion.div>
        ) : null}
        {info ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-700">
            {info}{" "}
            <Link href={employeeRoute("/login")} className="underline">
              Sign in →
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={AUTH.form}>
        <div className={AUTH.field}>
          <label htmlFor="emp-name" className={AUTH.label}>
            Full name
          </label>
          <input
            id="emp-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            readOnly={Boolean(prefilledName)}
            className={`${AUTH.input} ${prefilledName ? "bg-slate-50 text-slate-600" : ""}`}
            placeholder="Your full name"
          />
        </div>

        <div className={AUTH.field}>
          <label htmlFor="emp-email" className={AUTH.label}>
            Work email
          </label>
          <input
            id="emp-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={Boolean(prefilledEmail)}
            className={`${AUTH.input} ${prefilledEmail ? "bg-slate-50 text-slate-600" : ""}`}
            placeholder="you@alphafreight.uk"
          />
        </div>

        <div className={AUTH.field}>
          <label htmlFor="emp-password" className={AUTH.labelPlain}>
            Password
          </label>
          <div className="relative">
            <input
              id="emp-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={`${AUTH.input} pr-11`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={AUTH.field}>
          <label htmlFor="emp-confirm" className={AUTH.labelPlain}>
            Confirm password
          </label>
          <div className="relative">
            <input
              id="emp-confirm"
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`${AUTH.input} pr-11`}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.99 }} type="submit" disabled={isLoading} className={AUTH.btnPrimary}>
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
          ) : (
            "Create employee account"
          )}
        </motion.button>
      </form>

      <p className={`${AUTH.footerText} mt-5 sm:mt-6`}>
        Already registered?{" "}
        <Link href={employeeRoute("/login")} className="font-bold text-slate-900 hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
