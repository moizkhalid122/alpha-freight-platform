"use client";

import { motion } from "framer-motion";

export function AwardsStatement() {
  return (
    <section className="bg-[#0a0a0a] px-6 py-28 sm:py-36 lg:py-44">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[920px] text-center"
      >
        <p className="font-serif text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.28] tracking-[-0.02em]">
          <span className="text-white">
            True recognition follows verified performance, not popularity. We start with{" "}
          </span>
          <span className="text-white/35">
            platform data, sharpen the scoring, then honour companies impossible to ignore.
          </span>
        </p>
      </motion.div>
    </section>
  );
}
