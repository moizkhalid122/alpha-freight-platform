"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/80 shadow-sm ring-2 ring-[#BFFF07]/50 backdrop-blur-sm"
      >
        <Image src="/logo.png" alt="Alpha Freight AI" width={28} height={28} className="object-contain p-1" />
      </motion.div>
      <div className="min-w-0 flex-1 rounded-[20px] border border-white/60 bg-white/60 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <AiSearchEffect query={query} />
      </div>
    </motion.div>
  );
}
