"use client";

import type { CopilotMode } from "@/lib/chat-types";

interface ChatModeSwitcherProps {
  value: CopilotMode;
  onChange: (mode: CopilotMode) => void;
  compact?: boolean;
}

const MODES: Array<{ key: CopilotMode; label: string; shortLabel: string }> = [
  { key: "logistics_copilot", label: "Logistics Copilot", shortLabel: "Copilot" },
  { key: "tracking_assistant", label: "Tracking Assistant", shortLabel: "Tracking" },
  { key: "load_analyst", label: "Load Analyst", shortLabel: "Analyst" },
  { key: "fleet_manager", label: "Fleet Manager", shortLabel: "Fleet" },
  { key: "dispatcher", label: "Dispatcher", shortLabel: "Dispatch" },
];

export default function ChatModeSwitcher({
  value,
  onChange,
  compact = false,
}: ChatModeSwitcherProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className={`flex w-max min-w-full gap-2 ${compact ? "pb-0.5" : "justify-center pb-1"}`}>
        {MODES.map((mode) => {
          const active = value === mode.key;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onChange(mode.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition sm:px-3.5 sm:py-2 sm:text-xs ${
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="sm:hidden">{mode.shortLabel}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
