"use client";

import Image from "next/image";

interface AssistantMessageHeaderProps {
  assistantName?: string;
  timestamp?: string;
}

export default function AssistantMessageHeader({
  assistantName = "Alpha Freight AI",
  timestamp,
}: AssistantMessageHeaderProps) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-1.5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{assistantName}</p>
          {timestamp ? (
            <span className="text-[11px] font-medium text-slate-400">{timestamp}</span>
          ) : null}
        </div>
        <p className="text-[11px] font-medium text-slate-500">AI logistics response</p>
      </div>
    </div>
  );
}
