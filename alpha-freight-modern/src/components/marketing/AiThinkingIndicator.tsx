"use client";

import { motion } from "framer-motion";
import NavbarAiLottie from "@/components/NavbarAiLottie";
import AiSearchEffect from "@/components/marketing/ai/AiSearchEffect";
import { publicAiReplyFontClass } from "@/lib/public-ai-fonts";

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
      className={`flex items-center gap-2.5 py-1 sm:gap-3 ${publicAiReplyFontClass}`}
    >
      <NavbarAiLottie className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
      <AiSearchEffect query={query} />
    </motion.div>
  );
}
