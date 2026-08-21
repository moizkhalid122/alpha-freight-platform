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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 py-1"
    >
      <NavbarAiLottie className="h-9 w-9 shrink-0" />
      <AiSearchEffect query={query} />
    </motion.div>
  );
}
