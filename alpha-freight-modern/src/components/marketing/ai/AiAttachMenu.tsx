"use client";

import { Globe, ImageIcon, Paperclip, Truck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AiAttachMenuProps = {
  disabled?: boolean;
  onPickImage: () => void;
  onQuickPrompt: (prompt: string) => void;
  onWebSearch: () => void;
};

const QUICK_PROMPT = "How do I find loads in the UK?";

export default function AiAttachMenu({
  disabled = false,
  onPickImage,
  onQuickPrompt,
  onWebSearch,
}: AiAttachMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f4f4f4]/80 disabled:opacity-50"
        aria-label="Add attachment"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <PlusIcon />}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setOpen(false);
              onPickImage();
            }}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f7f7f8]"
          >
            <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-[#0d0d0d]" />
            <span>
              <span className="block text-sm font-medium text-[#0d0d0d]">Add photos & files</span>
              <span className="mt-0.5 block text-xs text-[#888]">Upload POD, receipt, or document</span>
            </span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setOpen(false);
              onQuickPrompt(QUICK_PROMPT);
            }}
            className="flex w-full items-start gap-3 border-t border-[#f0f0f0] px-4 py-3 text-left transition hover:bg-[#f7f7f8]"
          >
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#0d0d0d]" />
            <span>
              <span className="block text-sm font-medium text-[#0d0d0d]">Freight tools</span>
              <span className="mt-0.5 block text-xs text-[#888]">Loads, RPM, fuel, POD help</span>
            </span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setOpen(false);
              onWebSearch();
            }}
            className="flex w-full items-start gap-3 border-t border-[#f0f0f0] px-4 py-3 text-left transition hover:bg-[#f7f7f8]"
          >
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#7a9900]" />
            <span>
              <span className="block text-sm font-medium text-[#0d0d0d]">Web search</span>
              <span className="mt-0.5 block text-xs text-[#888]">Live diesel, traffic, and news</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function AiImagePreview({
  imageUrl,
  onRemove,
}: {
  imageUrl: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative mb-2 inline-flex max-w-[180px] overflow-hidden rounded-xl border border-[#ececec] bg-white p-1 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Upload preview" className="h-24 w-auto max-w-full rounded-lg object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
        aria-label="Remove image"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
        <ImageIcon className="h-3 w-3" />
        Image attached
      </div>
    </div>
  );
}
