"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Play,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";
import HomeDashboardShowcase from "@/components/marketing/HomeDashboardShowcase";
import HomePlatformShowcase from "@/components/marketing/HomePlatformShowcase";
import HomeNewsroomShowcase from "@/components/marketing/HomeNewsroomShowcase";
import HomeBookOfWeek from "@/components/marketing/HomeBookOfWeek";
import HomeInfrastructureShowcase from "@/components/marketing/HomeInfrastructureShowcase";
import HeroRotatingWords from "@/components/marketing/HeroRotatingWords";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import {
  CARRIER_COMMISSION_RATE,
  SUPPLIER_COMMISSION_RATE,
} from "@/lib/load-commission";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const serif = () => "font-[family-name:var(--font-home-serif)]";

export default function PremiumHomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  useMarketingSmoothScroll(true);

  useEffect(() => {
    if (!pageRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".home-in",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.05,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.08,
          clearProps: "transform",
        },
      );

      if (heroMediaRef.current) {
        gsap.fromTo(heroMediaRef.current, { scale: 1.08 }, { scale: 1, duration: 2, ease: "power2.out" });
        gsap.to(heroMediaRef.current, {
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (heroCopyRef.current) {
        gsap.to(heroCopyRef.current, {
          y: -72,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "60% top",
            scrub: true,
          },
        });
      }

      if (scrollContentRef.current && heroRef.current) {
        gsap.fromTo(
          scrollContentRef.current,
          { y: 0 },
          {
            y: -24,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>(".home-fade").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const supplierPct = Math.round(SUPPLIER_COMMISSION_RATE * 100);
  const carrierPct = Math.round(CARRIER_COMMISSION_RATE * 100);

  return (
    <div
      ref={pageRef}
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen overflow-x-hidden bg-white font-[family-name:var(--font-home-sans)] text-neutral-900 selection:bg-neutral-900 selection:text-white`}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Alpha Freight",
          url: "https://www.alphafreightuk.com",
          description: "UK freight marketplace — post loads, find carriers, track freight, 7-day payouts.",
        }}
      />

      <Navbar />

      <main>
        <div className="relative">
          {/* Sticky hero — content below scrolls up over it */}
          <section ref={heroRef} className="sticky top-0 z-0 h-[100svh] overflow-hidden bg-black">
            <div ref={heroMediaRef} className="absolute inset-0 will-change-transform">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/hero2.png"
                className="absolute inset-0 h-full w-full object-cover object-center"
              >
                <source src="/videos/hero-0903.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/50 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

            <div
              ref={heroCopyRef}
              className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-6 pb-[8vh] pt-[14vh] sm:pb-[10vh] sm:pt-[16vh] lg:px-10 lg:pb-[11vh] lg:pt-[18vh]"
            >
              <p className="home-in text-[11px] font-semibold uppercase tracking-[0.38em] text-white/55">
                Alpha Freight
              </p>
              <h1
                className={`home-in mt-5 max-w-[520px] text-[clamp(2.25rem,5.2vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] ${serif()}`}
              >
                Be the next
                <br />
                <span className="relative mt-1 inline-block min-h-[1.12em] font-normal italic tracking-[-0.015em] text-white/92">
                  <HeroRotatingWords />
                </span>
              </h1>
              <p className="home-in mt-6 max-w-[420px] text-[16px] font-light leading-[1.65] tracking-[-0.01em] text-white/75 sm:text-[17px]">
                Dream big and move fast on Alpha Freight. The UK&apos;s marketplace for verified carriers, live
                tracking, and 7-day payouts.
              </p>
              <div className="home-in mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex h-[52px] items-center justify-center rounded-full bg-white px-9 text-[14px] font-semibold tracking-[-0.01em] text-neutral-900 transition hover:bg-neutral-100"
                >
                  Start for free
                </Link>
                <Link
                  href="/about"
                  className="inline-flex h-[52px] items-center gap-3 rounded-full border border-white/30 bg-white/[0.06] px-2 pr-7 text-[14px] font-medium tracking-[-0.01em] text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/10">
                    <Play className="h-3.5 w-3.5 fill-white text-white" />
                  </span>
                  Why we build Alpha Freight
                </Link>
              </div>
            </div>
          </section>

          {/* Scroll layer — slides up over hero */}
          <div
            ref={scrollContentRef}
            className="relative z-10 -mt-[8vh] overflow-hidden rounded-t-[1.75rem] bg-black shadow-[0_-32px_100px_rgba(0,0,0,0.45)] sm:-mt-[10vh] sm:rounded-t-[2rem] lg:rounded-t-[2.25rem]"
          >
            <HomeDashboardShowcase />

        <HomePlatformShowcase />
        <HomeInfrastructureShowcase />

        {/* Value proposition */}
        <section className="border-b border-neutral-200 bg-white py-20 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20 lg:px-10">
            <div className="home-fade">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Why Alpha Freight</p>
              <h2 className={`mt-4 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.02em] text-neutral-900 ${serif()}`}>
                One platform for suppliers and carriers — without broker noise.
              </h2>
            </div>
            <div className="home-fade space-y-6 text-[15px] leading-[1.75] text-neutral-600">
              <p>
                Alpha Freight replaces fragmented calls, spreadsheets, and opaque margins with a single UK marketplace.
                Suppliers publish freight, carriers bid with confidence, and both sides get live tracking through delivery.
              </p>
              <p>
                Join free. Pay {supplierPct}% supplier / {carrierPct}% carrier commission only when freight moves — no
                monthly retainers, no hidden fees.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-900 underline-offset-4 hover:underline"
              >
                View pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <HomeNewsroomShowcase />

        <HomeBookOfWeek />

        <CinematicCTA />
        <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
