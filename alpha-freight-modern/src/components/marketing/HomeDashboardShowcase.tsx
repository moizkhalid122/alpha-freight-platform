"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const panels = [
  {
    src: "/images/home/showcase-mobile-app.png",
    alt: "Alpha Freight mobile app for posting loads and managing bids on the go",
    className: "lg:flex-[1.05]",
    imageClassName: "object-cover object-top",
  },
  {
    src: "/images/home/showcase-supplier.png",
    alt: "Supplier packing freight ready for Alpha Freight collection",
    className: "lg:flex-[0.72]",
    imageClassName: "object-cover object-center",
  },
  {
    src: "/images/home/showcase-fleet.png",
    alt: "Verified UK carrier fleet on Alpha Freight marketplace",
    className: "lg:flex-[1.23]",
    imageClassName: "object-cover object-center",
  },
];

function ScrollPlayVideo({ className }: { className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video ref={videoRef} muted loop playsInline preload="metadata" className={className}>
      <source src="/videos/showcase-0903-2.mp4" type="video/mp4" />
    </video>
  );
}

export default function HomeDashboardShowcase() {
  return (
    <section className="w-full overflow-hidden border-b border-neutral-900 bg-black py-16 text-white lg:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-10">
        <div className="max-w-[920px]">
          <h2 className="text-[clamp(1.875rem,3.4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
            Move freight everywhere it needs to go.
          </h2>
          <p className="mt-3 text-[clamp(1.875rem,3.4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-neutral-500">
            On mobile and in the yard. Across web and AI. Locally and nationwide.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:gap-4 lg:mt-12 lg:flex-row lg:items-stretch">
          {panels.map((panel) => (
            <div
              key={panel.src}
              className={`home-fade relative min-h-[280px] overflow-hidden rounded-xl sm:min-h-[360px] lg:min-h-[480px] ${panel.className}`}
            >
              <Image
                src={panel.src}
                alt={panel.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className={panel.imageClassName}
              />
            </div>
          ))}
        </div>

        <div className="home-fade mt-10 overflow-hidden rounded-[1.75rem] bg-black sm:mt-12 lg:mt-14 lg:rounded-[2rem]">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="bg-white/[0.1] p-8 sm:p-10 lg:max-w-[58%] lg:p-14">
              <h3 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
                Match lanes, backhaul, and freight answers in seconds.
              </h3>
              <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-neutral-400">
                Alpha Ai helps UK suppliers and carriers post smarter, bid faster, and find the right lane fit —
                without broker calls or spreadsheet chaos.
              </p>
              <Link
                href="/ai"
                className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
              >
                Try Alpha Ai
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-1 items-center justify-center bg-black p-8 sm:p-10 lg:p-14">
              <ScrollPlayVideo className="aspect-video w-[340px] max-w-full rounded-xl object-cover object-center sm:w-[420px] lg:w-[520px]" />
            </div>          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            Explore the platform
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="text-[13px] font-semibold text-neutral-400 hover:text-white">
            View pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}
