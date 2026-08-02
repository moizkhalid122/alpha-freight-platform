"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";

import { AWARDS_EVENT, HERO_STATS } from "@/lib/awards-content";
import {
  AnimatedCounter,
  BlackGlassPanel,
  FloatingParticles,
  MagneticButton,
  Trophy3D,
} from "./awards-shared";

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

function Unit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-4 sm:min-w-[76px]">
      <AnimatedCounter value={value} className="text-2xl font-semibold text-white sm:text-3xl" />
      <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span>
    </div>
  );
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
    <section className="relative isolate overflow-hidden bg-white pt-28 pb-20 sm:pb-28">
      <div className="pointer-events-none absolute inset-0">
        <Image src="/header.jpg" alt="" fill sizes="100vw" className="object-cover opacity-[0.07]" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white" />
      </div>
      <FloatingParticles count={28} />

      <div className="relative z-[1] mx-auto max-w-4xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <BlackGlassPanel className="px-8 py-12 text-center sm:px-14 sm:py-16">
            <Trophy3D className="mb-8" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">London · 2027</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              {AWARDS_EVENT.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              {AWARDS_EVENT.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/45">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3B82F6]" />
                {AWARDS_EVENT.city}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3B82F6]" />
                {AWARDS_EVENT.displayDate}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-y border-white/[0.08] py-6">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-semibold text-white sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton
                href="#register"
                className="h-12 bg-[#3B82F6] px-8 text-sm text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:bg-[#2563EB]"
              >
                Nominate Company
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton
                href="#register"
                className="h-12 border border-white/15 bg-white/[0.06] px-8 text-sm text-white hover:border-[#3B82F6]/40 hover:bg-white/[0.1]"
              >
                Become Sponsor
              </MagneticButton>
            </div>

            <div className="mx-auto mt-10 max-w-lg border-t border-white/[0.08] pt-8">
              <div className="mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#93C5FD]">
                <Clock className="h-4 w-4" />
                {countdown.expired ? "Ceremony live" : "Countdown to ceremony"}
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <Unit label="Days" value={countdown.days} />
                <Unit label="Hours" value={countdown.hours} />
                <Unit label="Mins" value={countdown.minutes} />
                <Unit label="Secs" value={countdown.seconds} />
              </div>
            </div>
          </BlackGlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
