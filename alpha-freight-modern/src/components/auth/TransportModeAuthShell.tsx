"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import type { TransportModeConfig } from "@/lib/transport-modes";

type TransportModeAuthShellProps = {
  mode: TransportModeConfig;
  children: React.ReactNode;
};

export default function TransportModeAuthShell({ mode, children }: TransportModeAuthShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] font-sans">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#FAF9F6]/95 backdrop-blur-sm">
        <div className="mx-auto grid h-16 max-w-[1560px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <Link
            href="/auth/modes"
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 transition hover:text-slate-900"
          >
            Change mode
          </Link>

          <div className="flex justify-end">
            <BrandMark
              href="/"
              iconClassName="h-7 w-7"
              textClassName="text-sm font-bold tracking-tight text-slate-900"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1560px] flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 lg:w-[42%] lg:flex-none lg:px-12 lg:py-10">
          <div className="mx-auto w-full max-w-[520px]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p
                className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{ backgroundColor: `${mode.accent}22`, color: mode.accent }}
              >
                {mode.label} freight
              </p>
              <h1 className="air-font-display text-4xl font-light leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                {mode.tagline}
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500 sm:text-base">
                {mode.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-8 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8"
            >
              {children}
            </motion.div>

            <p className="mt-6 text-center text-[11px] text-slate-400">
              By continuing, you agree to our{" "}
              <Link href="/terms-of-service" className="underline underline-offset-4 hover:text-slate-600">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-slate-600">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="hidden items-center justify-center p-6 lg:flex lg:w-[58%] lg:flex-none lg:p-8">
          <div className="relative h-[540px] w-full max-w-none overflow-hidden rounded-[36px] shadow-[0_30px_80px_rgba(15,23,42,0.18)] xl:h-[580px]">
            {mode.heroVideo ? (
              <video
                src={mode.heroVideo}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img src={mode.heroImage} alt={mode.title} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">Alpha Freight</p>
              <p className="mt-2 font-serif text-3xl font-light italic">{mode.title}</p>
              <p className="mt-2 max-w-sm text-sm text-white/80">{mode.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
