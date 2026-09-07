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
    <div className="mb-1.5 flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80">
        <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-1" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-900">{assistantName}</p>
          {timestamp ? (
            <span className="text-[11px] font-normal text-slate-400">{timestamp}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
