"use client";

import type { CopilotMode } from "@/lib/chat-types";
import { motion } from "framer-motion";

interface ChatModeSwitcherProps {
  value: CopilotMode;
  onChange: (mode: CopilotMode) => void;
  compact?: boolean;
}

const MODES: Array<{ key: CopilotMode; label: string; mobileLabel: string }> = [
  { key: "logistics_copilot", label: "Logistics Copilot", mobileLabel: "Copilot" },
  { key: "tracking_assistant", label: "Tracking Assistant", mobileLabel: "Tracking" },
  { key: "load_analyst", label: "Load Analyst", mobileLabel: "Analyst" },
];

export default function ChatModeSwitcher({ value, onChange }: ChatModeSwitcherProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {MODES.map((mode) => {
        const active = value === mode.key;
        return (
          <motion.button
            key={mode.key}
            type="button"
            onClick={() => onChange(mode.key)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 sm:text-xs ${
              active
                ? "border-slate-900/10 bg-slate-900 text-white shadow-sm shadow-slate-900/10"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="sm:hidden">{mode.mobileLabel}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
