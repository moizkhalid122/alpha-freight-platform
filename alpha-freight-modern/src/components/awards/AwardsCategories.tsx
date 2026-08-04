"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Lightbulb,
  Package,
  Star,
  TrendingUp,
  Trophy,
  Truck,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { AWARD_CATEGORIES } from "@/lib/awards-content";
import { ScrollReveal } from "./awards-shared";

const ICONS: Record<string, LucideIcon> = {
  carrier: Truck,
  supplier: Package,
  warehouse: Warehouse,
  innovation: Lightbulb,
  delivery: Zap,
  service: Star,
  growth: TrendingUp,
  green: Leaf,
  company: Trophy,
};

function CategoryCard({
  title,
  desc,
  longDesc,
  icon: Icon,
  large = false,
  flushRight = false,
}: {
  title: string;
  desc: string;
  longDesc?: string;
  icon: LucideIcon;
  large?: boolean;
  flushRight?: boolean;
}) {
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden border border-white/[0.08] bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:border-[#3B82F6]/40 hover:shadow-[0_24px_80px_rgba(59,130,246,0.15)] ${
        flushRight ? "rounded-2xl lg:rounded-r-none" : "rounded-2xl"
      } ${large ? "p-8 sm:p-10 lg:p-12" : "p-6 sm:p-7"}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08)_0%,transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div
        className={`relative z-[1] flex items-center justify-center rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#93C5FD] ${
          large ? "h-14 w-14" : "h-12 w-12"
        }`}
      >
        <Icon className={large ? "h-7 w-7" : "h-6 w-6"} strokeWidth={1.5} />
      </div>
      <h3 className={`relative z-[1] mt-5 font-semibold leading-snug text-white ${large ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg"}`}>
        {title}
      </h3>
      {large && longDesc ? (
        <div className="relative z-[1] mt-4 max-w-3xl space-y-4">
          <p className="text-base leading-[1.85] text-white/70 sm:text-lg">{desc}</p>
          <p className="text-sm leading-[1.85] text-white/50 sm:text-base lg:max-w-[90%]">{longDesc}</p>
        </div>
      ) : (
        <p className={`relative z-[1] mt-3 flex-1 leading-relaxed text-white/55 ${large ? "max-w-3xl text-base sm:text-lg" : "text-sm"}`}>
          {desc}
        </p>
      )}
    </div>
  );
}

export function AwardsCategories() {
  const slides = useMemo(() => {
    const chunks: (typeof AWARD_CATEGORIES)[number][][] = [];
    for (let i = 0; i < AWARD_CATEGORIES.length; i += 3) {
      chunks.push(AWARD_CATEGORIES.slice(i, i + 3));
    }
    return chunks;
  }, []);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const slide = slides[index];
  const featured = slide[0];
  const secondary = slide.slice(1);
  const FeaturedIcon = ICONS[featured.id] ?? Award;

  return (
    <section id="categories" className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px] px-6 text-center lg:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3B82F6]">Award categories</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.06]">
          Nine categories. One prestigious celebration.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
          Premium recognition for verified marketplace performance — transparent, data-driven, no voting.
        </p>
      </div>

      <ScrollReveal className="mt-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5 lg:pl-[max(1.5rem,calc((100vw-1320px)/2+2.5rem))]"
          >
            <div className="grid shrink-0 gap-4 px-6 sm:grid-cols-2 lg:w-[380px] lg:grid-cols-1 lg:px-0">
              {secondary.map((cat) => {
                const Icon = ICONS[cat.id] ?? Award;
                return (
                  <div key={cat.id} className="min-h-[180px] lg:min-h-[200px]">
                    <CategoryCard title={cat.title} desc={cat.desc} icon={Icon} />
                  </div>
                );
              })}
            </div>

            <div className="min-h-[320px] min-w-0 flex-1 px-6 lg:min-h-[420px] lg:px-0">
              <CategoryCard
                large
                flushRight
                title={featured.title}
                desc={featured.desc}
                longDesc={featured.longDesc}
                icon={FeaturedIcon}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </ScrollReveal>

      <div className="mt-8 flex items-center justify-center gap-4 px-6">
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Category slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-[#3B82F6]" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next categories"
          onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
