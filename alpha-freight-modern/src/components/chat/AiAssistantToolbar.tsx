"use client";

import { History, Headphones } from "lucide-react";

interface AiAssistantToolbarProps {
  onOpenHistory: () => void;
  onHandoff: () => void;
}

export default function AiAssistantToolbar({ onOpenHistory, onHandoff }: AiAssistantToolbarProps) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-end gap-2 px-1 py-2">
      <button
        type="button"
        onClick={onOpenHistory}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <History className="h-3.5 w-3.5" /> History
      </button>
      <button
        type="button"
        onClick={onHandoff}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <Headphones className="h-3.5 w-3.5" /> Human Support
      </button>
    </div>
  );
}
