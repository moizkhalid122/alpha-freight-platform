"use client";

import { motion } from "framer-motion";

interface ThinkingStateCardProps {
  states?: string[];
  activeIndex?: number;
}

export default function ThinkingStateCard(_props: ThinkingStateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 py-0.5"
    >
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full bg-slate-400"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </motion.div>
  );
}
