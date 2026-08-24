"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

import { leadershipImpactSection } from "@/lib/leadership-content";

export default function LeadershipImpactSection() {
  const { headlineLead, headlineRest, paragraphs, checklist, cta, images } = leadershipImpactSection;

  return (
    <section className="overflow-hidden bg-white py-20 md:py-28 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 md:gap-14 md:px-10 lg:grid-cols-2 lg:gap-20 lg:px-16">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="order-2 space-y-8 lg:order-1"
        >
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.12] tracking-[-0.02em] text-black">
            <span className="relative inline-block">
              {headlineLead}
              <svg
                className="absolute -bottom-1 left-0 w-full text-[#BFFF07]"
                viewBox="0 0 120 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8C20 2 40 10 60 6C80 2 100 10 118 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            {headlineRest}
          </h2>

          <div className="space-y-5">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-[1.85] text-black/55 md:text-[15px]">
                {paragraph}
              </p>
            ))}
          </div>

          <ul className="space-y-4 pt-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black">
                  <Check className="h-3.5 w-3.5 text-[#BFFF07]" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-black/70 md:text-[15px]">{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href={cta.href}
            className="group mt-4 inline-flex items-center gap-3 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#BFFF07] hover:text-black"
          >
            {cta.label}
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative order-1 mx-auto w-full max-w-lg lg:order-2 lg:max-w-none"
        >
          <div className="pointer-events-none absolute -right-6 top-8 h-40 w-40 opacity-[0.07] md:h-56 md:w-56">
            <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <path
                d="M30 70V30M30 30L55 55M30 30L5 55"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-[#BFFF07]"
              />
            </svg>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm sm:max-w-md lg:max-w-none lg:min-h-[520px]">
            <div className="absolute left-0 top-0 z-10 h-[78%] w-[62%] overflow-hidden rounded-[1.75rem] shadow-xl md:rounded-[2rem]">
              <Image
                src={images.back.src}
                alt={images.back.alt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 55vw, 28vw"
              />
            </div>

            <div className="absolute bottom-0 right-0 z-20 h-[72%] w-[58%] overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl md:rounded-[2rem]">
              <Image
                src={images.front.src}
                alt={images.front.alt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 50vw, 26vw"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
