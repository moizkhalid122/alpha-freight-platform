"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check } from "lucide-react";

type Step = { id: string; label: string; delay: number };

function buildSteps(query: string): Step[] {
  const steps: Step[] = [
    { id: "search", label: "Searching…", delay: 0 },
    { id: "kb", label: "Knowledge Base", delay: 600 },
    { id: "guide", label: "UK Freight Guide", delay: 1200 },
  ];
  if (/rpm|profit|margin|rate per mile/i.test(query)) {
    steps.push({ id: "rpm", label: "RPM Calculator", delay: 1800 });
  }
  if (/diesel|fuel|petrol/i.test(query)) {
    steps.push({ id: "fuel", label: "Fuel Price Data", delay: 1800 });
  }
  steps.push({ id: "gen", label: "Generating answer…", delay: 2400 });
  return steps;
}

export default function AiSearchEffect({ query }: { query: string }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    const steps = buildSteps(query);
    setVisibleCount(1);
    setCheckedCount(0);
    const timers: number[] = [];

    steps.forEach((step, index) => {
      if (index === 0) return;
      timers.push(
        window.setTimeout(() => setVisibleCount((c) => Math.max(c, index + 1)), step.delay)
      );
      timers.push(
        window.setTimeout(() => setCheckedCount((c) => Math.max(c, index)), step.delay + 400)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [query]);

  const steps = buildSteps(query);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-[#444]">
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain className="h-4 w-4 text-[#7a9900]" />
        </motion.span>
        <span>Thinking…</span>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {steps.slice(0, visibleCount).map((step, index) => {
            const isLast = step.id === "gen";
            const checked = !isLast && index < checkedCount;
            return (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-[#555]"
              >
                {isLast ? (
                  <motion.span
                    className="h-4 w-4 rounded-full border-2 border-[#BFFF07] border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : checked ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#BFFF07]/30 text-[#5a7300]">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full border border-[#ddd]" />
                )}
                <span className={checked ? "text-[#333]" : isLast ? "font-medium text-[#444]" : "text-[#777]"}>
                  {step.label}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
