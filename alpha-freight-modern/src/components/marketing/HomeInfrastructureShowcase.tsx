"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Plug } from "lucide-react";

const serif = () => "font-[family-name:var(--font-home-serif)]";

const partnerPanels = [
  {
    layout: "cover" as const,
    src: "/images/home/showcase-partner-warehouse.png",
    alt: "Warehouse operator managing freight inventory with Alpha Freight",
    className: "lg:flex-[1.05]",
    imageClassName: "object-cover object-center",
  },
  {
    layout: "card" as const,
    src: "/images/home/showcase-fuel-card.png",
    alt: "Alpha Freight fuel card partner programme for UK carriers",
    className: "lg:flex-[0.72]",
  },
  {
    layout: "cover" as const,
    src: "/images/home/showcase-retail-warehouse.png",
    alt: "Retail and warehouse freight operations supported by Alpha Freight",
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
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video ref={videoRef} muted loop playsInline preload="metadata" className={className}>
      <source src="/videos/integrations-1by1.webm" type="video/webm" />
    </video>
  );
}

export default function HomeInfrastructureShowcase() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-900 bg-[#0a0f1a] py-24 text-white lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />

      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="home-fade max-w-[640px]">
          <h2
            className={`text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.015em] text-white ${serif()}`}
          >
            Reliable infrastructure for every freight stack
          </h2>
          <p className="mt-5 text-[15px] font-light leading-[1.75] text-white/55">
            Adapt Alpha Freight to your operation with marketplace, tracking, AI, and payouts — flexible tools that
            scale from first load to full network.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/technology"
              className="inline-flex h-11 items-center gap-1 rounded-full bg-indigo-500 px-6 text-[13px] font-medium text-white transition hover:bg-indigo-400"
            >
              View platform overview
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-6 text-[13px] font-medium text-white/90 transition hover:border-white/35 hover:bg-white/5"
            >
              <Plug className="h-4 w-4 opacity-80" />
              Enterprise integrations
            </Link>
          </div>
        </div>

        <div className="home-fade mt-28 lg:mt-36">
          <div className="max-w-[620px]">
            <h3 className={`max-w-[520px] text-[clamp(1.5rem,2.8vw,2rem)] font-medium leading-[1.12] text-white ${serif()}`}>
              Connect to existing systems
            </h3>
            <p className="mt-3 max-w-[620px] text-[15px] font-light leading-[1.75] text-white/55">
              Orchestrate loads across carriers, sync with your TMS, and connect accounting, tracking, and payouts using
              Alpha APIs, partner tools, and prebuilt UK freight workflows.
            </p>
          </div>

          <div className="mx-auto -mt-20 max-w-[480px] overflow-visible sm:-mt-28 sm:max-w-[560px] lg:-mt-36 lg:max-w-[640px]">
            <ScrollPlayVideo className="mx-auto h-auto w-full max-w-full scale-[1.12] object-contain object-center" />
          </div>

          <div className="home-fade -mt-8 max-w-[640px] sm:-mt-10 lg:-mt-14">
            <h3 className={`text-[clamp(1.5rem,2.8vw,2rem)] font-medium leading-[1.12] text-white ${serif()}`}>
              Scale with confidence
            </h3>
            <p className="mt-3 text-[15px] font-light leading-[1.75] text-white/55">
              Handle hundreds of loads daily with consistent matching speed, verified carriers, and 7-day payouts — even
              during peak season volume.
            </p>
          </div>

          <div className="home-fade mt-12 flex flex-col gap-3 sm:mt-14 sm:gap-4 lg:flex-row lg:items-stretch">
            {partnerPanels.map((panel) =>
              panel.layout === "card" ? (
                <div
                  key={panel.src}
                  className={`flex min-h-[280px] items-center justify-center sm:min-h-[360px] lg:min-h-[480px] ${panel.className}`}
                >
                  <div className="w-fit overflow-hidden rounded-xl bg-[#0d1424]">
                    <Image
                      src={panel.src}
                      alt={panel.alt}
                      width={400}
                      height={640}
                      className="block h-auto w-[168px] rounded-[10px] sm:w-[188px] lg:w-[208px]"
                    />
                  </div>
                </div>
              ) : (
                <div
                  key={panel.src}
                  className={`relative min-h-[280px] overflow-hidden rounded-xl sm:min-h-[360px] lg:min-h-[480px] ${panel.className}`}
                >
                  <Image
                    src={panel.src}
                    alt={panel.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className={panel.imageClassName}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
