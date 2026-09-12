"use client";

import { useEffect, useRef, useState } from "react";

type HeroBackgroundVideoProps = {
  paused?: boolean;
};

export default function HeroBackgroundVideo({ paused = false }: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const startLoad = () => setShouldLoad(true);
    const idleCallback = window.requestIdleCallback;
    if (typeof idleCallback === "function") {
      const id = idleCallback(startLoad, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(startLoad, 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const onReady = () => setReady(true);
    video.addEventListener("canplay", onReady, { once: true });
    video.load();

    return () => video.removeEventListener("canplay", onReady);
  }, [shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad || !ready) return;

    if (paused) {
      video.pause();
      return;
    }

    void video.play().catch(() => {});
  }, [paused, ready, shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const section = video.closest("section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!ready) return;
        if (entry.isIntersecting && !paused) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [paused, ready, shouldLoad]);

  return (
    <>
      <img
        src="/hero2.png"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
          ready && !paused ? "opacity-0" : "opacity-100"
        }`}
      />
      {shouldLoad ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster="/hero2.png"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/videos/hero-0903.webm" type="video/webm" />
          <source src="/videos/hero-0903.mp4" type="video/mp4" />
        </video>
      ) : null}
    </>
  );
}
