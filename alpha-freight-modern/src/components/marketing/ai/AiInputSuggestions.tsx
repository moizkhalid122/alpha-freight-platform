"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import type { InputSuggestion } from "@/lib/ai-input-suggestions";

export default function AiInputSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: InputSuggestion[];
  onSelect: (value: string) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl border border-[#e5e5e5]/80 bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl"
      >
        <ul className="py-1">
          {suggestions.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(s.value);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#333] transition hover:bg-[#f7f7f8]"
              >
                <Search className="h-4 w-4 shrink-0 text-[#999]" />
                <span className="font-medium">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}
