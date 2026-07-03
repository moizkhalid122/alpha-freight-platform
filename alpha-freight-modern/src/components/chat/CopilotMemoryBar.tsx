"use client";

import type { CopilotContextMemory } from "@/lib/chat-types";

interface CopilotMemoryBarProps {
  memory?: CopilotContextMemory | null;
}

export default function CopilotMemoryBar({ memory }: CopilotMemoryBarProps) {
  if (!memory) {
    return null;
  }

  const chips = [
    memory.persona ? `Mode: ${memory.persona}` : "",
    memory.truckType ? `Truck: ${memory.truckType}` : "",
    memory.userLocation ? `Location: ${memory.userLocation}` : "",
    memory.preferredRoutes?.[0] ? `Route: ${memory.preferredRoutes[0]}` : "",
    memory.previousSearches?.[0] ? `Recent Search: ${memory.previousSearches[0]}` : "",
  ].filter(Boolean);

  if (!chips.length) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Session Memory
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <div
            key={chip}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600"
          >
            {chip}
          </div>
        ))}
      </div>
    </div>
  );
}
