"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { TRANSPORT_MODES } from "@/lib/transport-modes";

export default function TransportModesPage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] font-sans">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 flex items-center justify-between">
          <BrandMark
            href="/"
            iconClassName="h-8 w-8"
            textClassName="text-base font-bold tracking-tight text-slate-900"
          />
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Choose your lane</p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            How do you move freight?
          </h1>
          <p className="mt-4 text-base text-slate-500 sm:text-lg">
            Select road, air, or sea — then sign in or create your account for that mode.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TRANSPORT_MODES.map((mode, index) => {
            const Icon = mode.icon;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className={`group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br ${mode.gradient} p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}
              >
                <div
                  className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                  style={{ backgroundColor: mode.accent, color: mode.id === "road" ? "#0f172a" : "#fff" }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{mode.label}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{mode.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{mode.description}</p>

                <div className="mt-6 space-y-2.5">
                  <Link
                    href={mode.loginPath}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                  <Link
                    href={mode.signupPath}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                </div>

                <Link
                  href={mode.selectPath}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 transition group-hover:text-slate-800"
                >
                  Continue with {mode.label}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Already know your account type?{" "}
          <Link href="/auth/select" className="font-bold text-slate-900 underline underline-offset-4">
            Carrier or supplier signup
          </Link>
        </p>
      </div>
    </div>
  );
}
