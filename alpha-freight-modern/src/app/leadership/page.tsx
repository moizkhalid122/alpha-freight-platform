"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import LeadershipTrackRecord from "@/components/marketing/LeadershipTrackRecord";
import LeadershipOnSection from "@/components/marketing/LeadershipOnSection";
import LeadershipImpactSection from "@/components/marketing/LeadershipImpactSection";
import { leadershipIntro } from "@/lib/leadership-content";

const displayFont = "var(--font-air-display), Georgia, 'Times New Roman', serif";
const serifFont = "var(--font-air-serif), Georgia, 'Times New Roman', serif";

export default function LeadershipPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black selection:bg-[#BFFF07] selection:text-black">
      <Navbar />

      <main>
        <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
          <Image
            src={leadershipIntro.heroImage}
            alt={leadershipIntro.heroImageAlt}
            fill
            priority
            className="object-cover object-[center_20%] md:object-[70%_center]"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/50 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10" />

          <div className="relative z-10 flex h-full items-end">
            <div className="w-full pb-12 pl-6 md:pb-16 md:pl-10 lg:pb-20 lg:pl-16 xl:pl-24">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-md space-y-5 md:max-w-lg"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-1 w-1 rounded-full bg-[#BFFF07]" />
                  <span
                    className="text-[9px] font-medium uppercase tracking-[0.32em] text-white/80"
                    style={{ fontFamily: serifFont }}
                  >
                    {leadershipIntro.eyebrow}
                  </span>
                </div>

                <h1
                  className="text-[clamp(1.65rem,3.2vw,2.65rem)] font-medium leading-[1.12] tracking-[-0.02em] text-white"
                  style={{ fontFamily: displayFont }}
                >
                  {leadershipIntro.headline}
                </h1>

                <p
                  className="max-w-sm text-[13px] font-normal leading-[1.7] text-white/65 md:text-sm"
                  style={{ fontFamily: serifFont }}
                >
                  {leadershipIntro.subtext}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#executives"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#BFFF07]"
                    style={{ fontFamily: displayFont }}
                  >
                    Meet The Executives
                    <ArrowDown className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 transition hover:border-white hover:bg-white/10"
                    style={{ fontFamily: displayFont }}
                  >
                    About Alpha Freight
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <LeadershipTrackRecord />

        <LeadershipOnSection />

        <LeadershipImpactSection />

        <CinematicCTA />
      </main>

      <Footer />
    </div>
  );
}
