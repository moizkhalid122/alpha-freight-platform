"use client";

import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

import { AWARDS_EVENT, HERO_STATS } from "@/lib/awards-content";
import { BlackGlassPanel, MagneticButton, ScrollReveal } from "./awards-shared";

export function AwardsFinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <ScrollReveal>
          <BlackGlassPanel className="overflow-hidden px-8 py-14 text-center sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
            <div className="relative z-[1]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">Final call</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl lg:text-4xl lg:leading-[1.1]">
                Become part of the UK&apos;s most prestigious logistics awards.
              </h2>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-white/50">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#3B82F6]" />
                  {AWARDS_EVENT.city}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#3B82F6]" />
                  {AWARDS_EVENT.displayDate}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#3B82F6]" />
                  {HERO_STATS[0].value} companies
                </span>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <MagneticButton
                  href="#register"
                  className="h-12 bg-[#3B82F6] px-8 text-sm text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)] hover:bg-[#2563EB]"
                >
                  Nominate Your Company
                  <ArrowRight className="h-4 w-4" />
                </MagneticButton>
                <MagneticButton
                  href="#register"
                  className="h-12 border border-white/15 bg-white/[0.06] px-8 text-sm text-white hover:border-[#3B82F6]/40"
                >
                  Become a Sponsor
                </MagneticButton>
              </div>
            </div>
          </BlackGlassPanel>
        </ScrollReveal>
      </div>
    </section>
  );
}
