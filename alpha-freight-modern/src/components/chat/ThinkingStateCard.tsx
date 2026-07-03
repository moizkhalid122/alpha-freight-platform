"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface ThinkingStateCardProps {
  states: string[];
  activeIndex: number;
}

export default function ThinkingStateCard({
  states,
  activeIndex,
}: ThinkingStateCardProps) {
  return (
    <div className="flex justify-start gap-4">
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-1.5" />
      </div>
      <div className="min-w-[260px] max-w-[680px] rounded-[1.55rem] rounded-bl-md border border-slate-200/80 bg-white px-5 py-4 shadow-[0_24px_70px_-58px_rgba(15,23,42,0.22)]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-900">Alpha Freight AI is working</p>
        </div>
        <div className="space-y-3">
          {states.map((state, index) => {
            const active = index === activeIndex;
            return (
              <div
                key={state}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-slate-200/80 bg-slate-50/70"
                }`}
              >
                <motion.div
                  animate={active ? { opacity: [0.4, 1, 0.4], scale: [1, 1.08, 1] } : { opacity: 0.5, scale: 1 }}
                  transition={{ duration: 1.1, repeat: active ? Infinity : 0 }}
                  className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                <p className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-500"}`}>
                  {state}
                </p>
              </div>
            );
          })}
          <div className="flex gap-1.5 px-1 pt-1">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.95, repeat: Infinity, delay: dot * 0.12 }}
                className="h-2.5 w-2.5 rounded-full bg-slate-400"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
