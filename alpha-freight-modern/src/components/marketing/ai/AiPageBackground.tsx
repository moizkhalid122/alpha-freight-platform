"use client";

import { motion } from "framer-motion";

const ORBS = [
  { size: 280, x: "8%", y: "12%", delay: 0 },
  { size: 200, x: "78%", y: "18%", delay: 1.2 },
  { size: 160, x: "62%", y: "72%", delay: 0.6 },
  { size: 120, x: "18%", y: "68%", delay: 1.8 },
];

export default function AiPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] via-white to-[#f7ffe8]/30" />
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#BFFF07]/[0.07] blur-3xl"
          style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
          animate={{ y: [0, -18, 0], x: [0, i % 2 ? 12 : -10, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 14 + i * 2, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
        />
      ))}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ai-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#0d0d0d" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ai-grid)" />
      </svg>
    </div>
  );
}
