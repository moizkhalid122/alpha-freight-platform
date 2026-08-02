"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import type { ThinkingMode } from "@/lib/public-ai-thinking";

interface AiThinkingIndicatorProps {
  message: string;
  mode?: ThinkingMode;
}

export default function AiThinkingIndicator({ message, mode = "thinking" }: AiThinkingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#ececec]">
          <Image src="/logo.png" alt="Alpha Freight AI" width={28} height={28} className="object-contain p-1" />
        </div>
        {mode === "live_search" && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef6ff] ring-2 ring-white">
            <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
          </div>
        )}
      </div>

      <div className="min-w-0 pt-1">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-[#666]"
        >
          {message}
        </motion.p>
        <div className="mt-2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#999]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
