"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AUTH } from "@/components/auth/auth-styles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) throw resetError;

      setMessage("Password reset link sent. Check your inbox and spam folder.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={AUTH.header}>
        <h2 className={AUTH.title}>Reset password</h2>
        <p className={AUTH.subtitle}>Enter your email and we&apos;ll send a secure reset link.</p>
      </div>

      <AnimatePresence>
        {error ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={AUTH.error}>
            {error}
          </motion.div>
        ) : null}
        {message ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={AUTH.form}>
        <div className={AUTH.field}>
          <label className={AUTH.label}>Email</label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={AUTH.input}
          />
        </div>

        <button type="submit" disabled={isLoading} className={AUTH.btnPrimary}>
          {isLoading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
