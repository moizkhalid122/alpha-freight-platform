"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, CircleCheck } from "lucide-react";

import { REWARD_TIERS } from "@/lib/awards-content";
import { ScrollReveal, SectionShell } from "./awards-shared";

function RewardCard({ tier, index }: { tier: (typeof REWARD_TIERS)[number]; index: number }) {
  const isGold = tier.highlighted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-7 sm:p-8 ${
        isGold
          ? "z-[2] text-white shadow-[0_32px_100px_rgba(27,42,74,0.35)] lg:-my-4 lg:py-9"
          : "border border-dashed border-slate-300 bg-white text-slate-900 shadow-[0_8px_40px_rgba(15,23,42,0.04)]"
      }`}
    >
      {isGold ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/back.png')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-[#0a0a0a]/55" aria-hidden />
        </>
      ) : null}

      <div className="relative z-10 flex h-full flex-col">
        {isGold ? (
          <span className="absolute right-0 top-0 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-900">
            Popular
          </span>
        ) : null}

        <div>
          <h3 className={`font-serif text-2xl font-semibold tracking-tight sm:text-3xl ${isGold ? "text-white" : "text-slate-900"}`}>
            {tier.tier}
          </h3>
          <p className={`mt-3 text-sm leading-relaxed ${isGold ? "text-white/70" : "text-slate-500"}`}>
            {tier.desc}
          </p>
        </div>

        <div className="mt-7">
          <div className="flex items-end gap-1">
            <span className={`text-4xl font-semibold tracking-tight sm:text-5xl ${isGold ? "text-white" : "text-slate-900"}`}>
              {tier.perks.length}
            </span>
            <span className={`mb-1.5 text-sm ${isGold ? "text-white/55" : "text-slate-400"}`}>rewards</span>
          </div>
          <p className={`mt-2 text-xs ${isGold ? "text-white/50" : "text-slate-400"}`}>{tier.tagline}</p>
        </div>

        <Link
          href="#register"
          className={`mt-7 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition active:scale-[0.98] ${
            isGold
              ? "bg-white text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.28)] hover:bg-slate-100"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          Nominate now
        </Link>

        <div
          className={`mt-7 flex-1 rounded-2xl p-4 sm:p-5 ${
            isGold ? "bg-black/25 ring-1 ring-white/10 backdrop-blur-[2px]" : "bg-slate-50"
          }`}
        >
          <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${isGold ? "text-white/55" : "text-slate-400"}`}>
            What&apos;s included
          </p>
          <ul className="mt-4 space-y-2.5">
            {tier.perks.map((perk) => (
              <li key={perk} className={`flex items-start gap-2.5 text-[13px] sm:text-sm ${isGold ? "text-white/80" : "text-slate-600"}`}>
                {isGold ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#93C5FD]" />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                )}
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function AwardsRewards() {
  return (
    <SectionShell
      eyebrow="Rewards"
      title="Recognition that moves your business forward"
      subtitle="Crystal trophies, certificates, homepage features, press releases, and the official Trust Seal."
      centered
    >
      <ScrollReveal>
        <div className="mx-auto grid w-full max-w-[1280px] gap-6 lg:grid-cols-3 lg:items-center lg:gap-8">
          {REWARD_TIERS.map((tier, index) => (
            <RewardCard key={tier.tierKey} tier={tier} index={index} />
          ))}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}
