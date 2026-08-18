"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { leadershipTrackRecord } from "@/lib/leadership-content";

const displayFont = "var(--font-air-display), Georgia, 'Times New Roman', serif";

export default function LeadershipTrackRecord() {
  const { badge, headline, description, stats, footerText, footerLink } = leadershipTrackRecord;

  return (
    <section className="border-b border-black/[0.06] bg-[#F7F5F0] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl space-y-8 md:space-y-10"
        >
          <span className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-[11px] font-medium text-black/55">
            {badge}
          </span>

          <h2
            className="text-[clamp(2.25rem,5vw,4.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-black"
            style={{ fontFamily: displayFont }}
          >
            {headline[0]}
            <br />
            {headline[1]}
          </h2>

          <p className="max-w-2xl text-sm leading-[1.8] text-black/45 md:text-[15px]">{description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0 md:mt-20"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col justify-end sm:px-8 lg:px-12 ${
                index > 0 ? "border-t border-black/10 pt-8 sm:border-t-0 sm:border-l sm:pt-0" : ""
              }`}
            >
              <div
                className="text-[clamp(2.5rem,4vw,3.75rem)] font-medium leading-none tracking-[-0.03em] text-black"
                style={{ fontFamily: displayFont }}
              >
                {stat.value}
              </div>
              <div className="mt-3 text-[11px] font-medium text-black/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-14 flex flex-col gap-6 border-t border-black/10 pt-8 md:mt-16 md:flex-row md:items-end md:justify-between md:gap-10"
        >
          <p className="max-w-xl text-sm leading-[1.75] text-black/45 md:text-[15px]">{footerText}</p>

          <Link
            href={footerLink.href}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-black transition hover:text-black/60"
          >
            {footerLink.label}
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
