"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PHRASES = [
  "UK freight empire",
  "logistics powerhouse",
  "haulage leader",
  "delivery network",
];

const INTERVAL_MS = 3200;

type HeroRotatingWordsProps = {
  className?: string;
};

export default function HeroRotatingWords({ className = "" }: HeroRotatingWordsProps) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % PHRASES.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <span className={`relative inline-block overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={PHRASES[index]}
          initial={reducedMotion ? false : { y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? undefined : { y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
