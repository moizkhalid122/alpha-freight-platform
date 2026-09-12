"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

type HeroStoryVideoModalProps = {
  open: boolean;
  onClose: () => void;
  videoSrc?: string;
  title?: string;
};

export default function HeroStoryVideoModal({
  open,
  onClose,
  videoSrc = "/videos/0907.mp4",
  title = "Why we build Alpha Freight",
}: HeroStoryVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);

  const handleClose = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    setLoading(true);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;

    const video = videoRef.current;
    if (!video) return;

    video.src = videoSrc;
    video.load();

    const onCanPlay = () => {
      setLoading(false);
      void video.play().catch(() => {});
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    video.addEventListener("canplay", onCanPlay, { once: true });
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, [open, videoSrc]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/78"
        aria-label="Close video"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-[min(1120px,96vw)] overflow-hidden rounded-2xl bg-neutral-950 shadow-[0_32px_120px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:rounded-3xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black text-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-white/90" />
            <p className="text-sm font-medium tracking-[-0.01em]">Loading video…</p>
          </div>
        ) : null}

        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          className={`aspect-video w-full bg-black object-contain ${loading ? "hidden" : "block"}`}
        />
      </div>
    </div>
  );
}
