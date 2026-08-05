"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { User, X, ZoomIn } from "lucide-react";

type AdminProfilePhotoPreviewProps = {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-12 w-12 rounded-xl",
  md: "h-20 w-20 rounded-2xl",
  lg: "h-28 w-28 rounded-2xl",
};

export default function AdminProfilePhotoPreview({
  src,
  alt,
  size = "md",
}: AdminProfilePhotoPreviewProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!src) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center bg-slate-100 ring-1 ring-slate-200 ${sizeClasses[size]}`}
      >
        <User className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative shrink-0 overflow-hidden bg-slate-100 ring-1 ring-slate-200 transition hover:ring-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${sizeClasses[size]}`}
        aria-label={`View full photo for ${alt}`}
      >
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/35">
          <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close photo preview"
          />
          <div className="relative z-[201] w-full max-w-4xl">
            <div className="mb-3 flex items-center justify-between gap-4 px-1">
              <p className="truncate text-sm font-semibold text-white">{alt}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10">
              <div className="relative max-h-[78vh] w-full bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="mx-auto max-h-[78vh] w-full object-contain" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <p className="text-xs text-slate-300">Click outside or press Esc to close</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-300 hover:text-blue-200"
              >
                Open original in new tab
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
