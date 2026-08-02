"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

import { AWARDS_EVENT, HERO_STATS } from "@/lib/awards-content";
import { MagneticButton } from "./awards-shared";
import { AwardsHeroCanvas } from "./AwardsHeroCanvas";

type Countdown = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function getCountdown(iso: string): Countdown {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function AwardsHero() {
  const [countdown, setCountdown] = useState(() => getCountdown(AWARDS_EVENT.dateIso));

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(AWARDS_EVENT.dateIso));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-white pt-28 pb-10 sm:pt-32 sm:pb-14">
      <AwardsHeroCanvas />

      <div className="relative z-[1] mx-auto flex flex-1 w-full max-w-[1400px] flex-col items-center justify-center px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center"
        >
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.38em] text-violet-400 sm:mb-8">
            London · {AWARDS_EVENT.displayDate}
          </p>

          <h1 className="font-serif font-light leading-[0.95] tracking-[-0.02em] text-slate-800">
            <span className="block text-[clamp(2.25rem,8vw,5.5rem)] uppercase text-slate-700/90">
              Recognising the
            </span>

            <span className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 sm:mt-3 sm:gap-x-4 md:gap-x-5">
              <span className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-[clamp(2.25rem,8vw,5.5rem)] uppercase text-transparent">
                UK
              </span>
              <span className="relative inline-flex h-[clamp(3rem,9vw,5.5rem)] w-[clamp(5.5rem,18vw,11rem)] shrink-0 overflow-hidden rounded-2xl border border-violet-200/80 shadow-[0_20px_50px_rgba(167,139,250,0.25)] sm:rounded-[1.25rem]">
                <Image
                  src="/award.jpg"
                  alt="Alpha Freight Awards ceremony"
                  fill
                  sizes="(max-width: 768px) 40vw, 280px"
                  className="object-cover"
                  priority
                />
              </span>
              <span className="bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-[clamp(2.25rem,8vw,5.5rem)] uppercase text-transparent">
                Freight
              </span>
            </span>

            <span className="mt-2 block text-[clamp(2.25rem,8vw,5.5rem)] uppercase text-slate-700/90 sm:mt-3">
              Excellence (2027)
            </span>
          </h1>

          <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-400" />
              {AWARDS_EVENT.city}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-fuchsia-400" />
              {AWARDS_EVENT.displayDate}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton
              href="#register"
              className="h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 text-sm text-white shadow-[0_8px_32px_rgba(167,139,250,0.35)] hover:from-violet-600 hover:to-fuchsia-600"
            >
              Nominate Company
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton
              href="#register"
              className="h-11 border border-violet-200 bg-white/70 px-7 text-sm text-violet-700 backdrop-blur-sm hover:border-fuchsia-300 hover:bg-white"
            >
              Become Sponsor
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.8 }}
        className="relative z-[1] mx-auto w-full max-w-[1400px] border-t border-violet-100/80 px-5 pt-8 sm:px-8 lg:px-12"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:items-start lg:gap-10">
          <p className="max-w-md text-sm leading-relaxed text-slate-500">
            {AWARDS_EVENT.subheadline} Alpha Freight celebrates carriers, suppliers, and logistics
            partners who set the standard for trust, performance, and innovation across the UK.
          </p>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400/80">
              Award categories
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
              {["/ Carrier of the Year", "/ Supplier of the Year", "/ Innovation Award", "/ Company of the Year"].map(
                (item) => (
                  <span key={item}>{item}</span>
                )
              )}
            </div>
          </div>

          <div className="space-y-4 lg:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400/80">
                {countdown.expired ? "Ceremony live" : "Countdown"}
              </p>
              <p className="mt-2 font-serif text-2xl tracking-tight text-slate-800">
                {countdown.expired
                  ? "Now live"
                  : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-violet-100/80 pt-4 lg:ml-auto lg:max-w-xs">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-slate-800">{stat.value}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="#register"
              className="inline-flex items-center gap-2 text-sm text-violet-600 transition hover:text-fuchsia-600"
            >
              Register interest
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
