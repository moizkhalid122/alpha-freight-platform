"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { ABOUT_PROCESS } from "@/lib/awards-content";
import { ScrollReveal } from "./awards-shared";

export function AwardsAbout() {
  return (
    <section className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <ScrollReveal>
          <div className="overflow-hidden rounded-[2rem] bg-[#0a0a0a] text-white shadow-[0_40px_120px_rgba(0,0,0,0.18)]">
            <div className="border-b border-white/[0.08] px-8 py-8 sm:px-10 sm:py-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">
                About Alpha Freight Awards
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                How we recognise UK logistics excellence
              </h2>
            </div>

            <div className="divide-y divide-white/[0.08]">
              {ABOUT_PROCESS.map((item, index) => (
                <motion.article
                  key={item.step}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="grid lg:grid-cols-2"
                >
                  <div className="relative min-h-[240px] overflow-hidden sm:min-h-[300px] lg:min-h-[360px]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 lg:bg-transparent" />
                  </div>

                  <div className="flex flex-col justify-between px-8 py-10 sm:px-10 sm:py-12 lg:px-12">
                    <div>
                      <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                        <span className="tabular-nums text-white/50">{item.step}</span>
                        <span className="h-4 w-px bg-white/20" aria-hidden />
                        <span className="text-base font-semibold text-white">{item.title}</span>
                      </div>
                      <p className="mt-6 max-w-xl text-sm leading-[1.85] text-white/55 sm:text-[15px]">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-medium text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
