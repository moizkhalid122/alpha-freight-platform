"use client";

import { motion } from "framer-motion";
import AiOrbLottie from "@/components/chat/AiOrbLottie";

interface ThinkingStateCardProps {
  states?: string[];
  activeIndex?: number;
}

export default function ThinkingStateCard(_props: ThinkingStateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 py-1"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-100">
        <AiOrbLottie className="h-9 w-9" />
      </div>
      <motion.p
        className="text-sm font-medium text-slate-500"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        Thinking…
      </motion.p>
    </motion.div>
  );
}
