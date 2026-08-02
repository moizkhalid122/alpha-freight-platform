"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

import { AWARDS_TESTIMONIALS } from "@/lib/awards-content";
import { ScrollReveal, SectionShell } from "./awards-shared";

export function AwardsTestimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % AWARDS_TESTIMONIALS.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const item = AWARDS_TESTIMONIALS[index];

  return (
    <SectionShell eyebrow="Testimonials" title="CEO reviews" subtitle="Trusted by UK logistics leaders." centered>
      <ScrollReveal>
        <div className="relative mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.45 }}
              className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-12"
            >
              <Quote className="h-10 w-10 text-[#3B82F6]/40" />
              <div className="mt-4 flex gap-1">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#3B82F6] text-[#3B82F6]" />
                ))}
              </div>
              <p className="mt-5 text-lg leading-relaxed text-slate-700 sm:text-xl">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a0a0a] text-sm font-bold text-white">
                  {item.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.author}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.role}, {item.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() =>
                setIndex((prev) => (prev - 1 + AWARDS_TESTIMONIALS.length) % AWARDS_TESTIMONIALS.length)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#3B82F6]/30 hover:text-[#3B82F6]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {AWARDS_TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Testimonial ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-[#3B82F6]" : "w-1.5 bg-slate-200"}`}
              />
            ))}
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() => setIndex((prev) => (prev + 1) % AWARDS_TESTIMONIALS.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#3B82F6]/30 hover:text-[#3B82F6]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}
