"use client";

import type { CopilotMode } from "@/lib/chat-types";

interface ChatModeSwitcherProps {
  value: CopilotMode;
  onChange: (mode: CopilotMode) => void;
  compact?: boolean;
}

const MODES: Array<{ key: CopilotMode; label: string }> = [
  { key: "logistics_copilot", label: "Logistics Copilot" },
  { key: "tracking_assistant", label: "Tracking Assistant" },
  { key: "load_analyst", label: "Load Analyst" },
  { key: "fleet_manager", label: "Fleet Manager" },
  { key: "dispatcher", label: "Dispatcher" },
];

export default function ChatModeSwitcher({
  value,
  onChange,
  compact = false,
}: ChatModeSwitcherProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
      {MODES.map((mode) => {
        const active = value === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => onChange(mode.key)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              active
                ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            } ${compact ? "text-[11px]" : ""}`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
