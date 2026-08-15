"use client";

import { motion } from "framer-motion";
import NavbarAiLottie from "@/components/NavbarAiLottie";
import AiSearchEffect from "@/components/marketing/ai/AiSearchEffect";

interface AiThinkingIndicatorProps {
  query: string;
}

export default function AiThinkingIndicator({ query }: AiThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-start gap-3 py-1"
    >
      <NavbarAiLottie className="mt-0.5 h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1 rounded-[20px] border border-white/60 bg-white/60 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <AiSearchEffect query={query} />
      </div>
    </motion.div>
  );
}
