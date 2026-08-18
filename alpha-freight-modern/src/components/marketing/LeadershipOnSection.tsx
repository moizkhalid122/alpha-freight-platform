"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { leadershipOnSection, leadershipProfiles } from "@/lib/leadership-content";
import type { LeadershipProfile } from "@/lib/leadership-content";

const displayFont = "var(--font-air-display), Georgia, 'Times New Roman', serif";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ExecutiveProfile({ profile, index }: { profile: LeadershipProfile; index: number }) {
  const [imageError, setImageError] = useState(false);
  const reversed = index % 2 === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.08 }}
      className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 xl:gap-20"
    >
      <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#151515] md:rounded-3xl ${reversed ? "lg:order-2" : ""}`}>
        {!imageError ? (
          <Image
            src={profile.image}
            alt={profile.imageAlt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 42vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#151515] md:rounded-3xl">
            <span className="text-5xl text-white/20" style={{ fontFamily: displayFont }}>
              AF
            </span>
          </div>
        )}
      </div>

      <div className={`space-y-5 lg:py-6 ${reversed ? "lg:order-1" : ""}`}>
        <p className="text-[11px] font-medium text-white/45">{profile.title}</p>

        <h3
          className="text-[clamp(2rem,3.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
          style={{ fontFamily: displayFont }}
        >
          {profile.name}
        </h3>

        <p className="max-w-xl text-sm leading-[1.85] text-white/55 md:text-[15px]">{profile.bio}</p>

        {profile.linkedin && (
          <Link
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${profile.name} on LinkedIn`}
            className="inline-flex text-white/70 transition hover:text-white"
          >
            <LinkedInIcon className="h-5 w-5" />
          </Link>
        )}
      </div>
    </motion.article>
  );
}

export default function LeadershipOnSection() {
  return (
    <section id="executives" className="scroll-mt-28 bg-[#0A0A0A] py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl space-y-6"
        >
          <span className="inline-flex rounded-full border border-white/15 bg-white px-4 py-1.5 text-[11px] font-medium text-black">
            {leadershipOnSection.badge}
          </span>

          <h2
            className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
            style={{ fontFamily: displayFont }}
          >
            {leadershipOnSection.headline}
          </h2>

          <p className="max-w-xl text-sm leading-[1.8] text-white/50 md:text-[15px]">
            {leadershipOnSection.description}
          </p>
        </motion.div>

        <div className="mt-16 space-y-24 md:mt-20 md:space-y-28 lg:space-y-32">
          {leadershipProfiles.map((profile, index) => (
            <ExecutiveProfile key={profile.id} profile={profile} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
