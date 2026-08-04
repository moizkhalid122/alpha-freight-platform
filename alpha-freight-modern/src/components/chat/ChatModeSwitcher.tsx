"use client";

import type { CopilotMode } from "@/lib/chat-types";

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

export default function ChatModeSwitcher({
  value,
  onChange,
}: ChatModeSwitcherProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:gap-2">
      {MODES.map((mode) => {
        const active = value === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => onChange(mode.key)}
            className={`min-w-0 rounded-lg border px-1.5 py-1.5 text-center text-[10px] font-semibold leading-tight transition sm:rounded-full sm:px-3.5 sm:py-1.5 sm:text-[11px] lg:text-xs ${
              active
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="sm:hidden">{mode.mobileLabel}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
