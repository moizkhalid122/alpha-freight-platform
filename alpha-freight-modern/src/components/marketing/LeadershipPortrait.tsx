"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Mail } from "lucide-react";
import type { LeadershipProfile } from "@/lib/leadership-content";

type LeadershipPortraitProps = {
  profile: LeadershipProfile;
  index: number;
  reversed?: boolean;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function LeadershipPortrait({ profile, index, reversed = false }: LeadershipPortraitProps) {
  const [imageError, setImageError] = useState(false);
  const initials = initialsFromName(profile.name);

  return (
    <motion.article
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      className={`grid items-center gap-10 lg:gap-16 ${
        reversed ? "lg:grid-cols-[1.1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1.1fr]"
      }`}
    >
      <div className={`relative ${reversed ? "lg:order-2" : ""}`}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.35)]">
          {!imageError ? (
            <Image
              src={profile.image}
              alt={profile.imageAlt}
              fill
              className="object-cover object-top transition-transform duration-700 hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority={index === 0}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
              <span
                className="text-6xl font-medium tracking-tight text-white/90"
                style={{ fontFamily: "var(--font-air-display), Georgia, serif" }}
              >
                {initials || "AF"}
              </span>
              <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]">
                Photo coming soon
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#BFFF07]">
              {profile.title}
            </div>
            <h3
              className="mt-2 text-3xl font-medium tracking-tight text-white md:text-4xl"
              style={{ fontFamily: "var(--font-air-display), Georgia, serif" }}
            >
              {profile.name}
            </h3>
          </div>
        </div>

        <div className="absolute -bottom-5 -right-5 hidden h-28 w-28 rounded-full border border-black/5 bg-[#BFFF07] md:block" />
        <div className="absolute -left-4 -top-4 hidden h-16 w-16 rounded-2xl border border-black/10 bg-white md:block" />
      </div>

      <div className={`space-y-8 ${reversed ? "lg:order-1" : ""}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-black/35">
            <span className="h-px w-10 bg-black/15" />
            Leadership Profile
          </div>

          <p className="max-w-xl text-lg font-medium leading-relaxed text-black/65 md:text-xl">
            {profile.bio}
          </p>
        </div>

        {profile.highlights.length > 0 && (
          <ul className="space-y-4">
            {profile.highlights.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#BFFF07]" />
                <span className="text-sm font-semibold uppercase tracking-wide text-black/45">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {(profile.email || profile.linkedin) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition hover:border-black hover:bg-black hover:text-white"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#BFFF07] hover:text-black"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
