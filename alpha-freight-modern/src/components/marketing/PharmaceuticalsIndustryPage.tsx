"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Snowflake,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import type { IndustryContent } from "@/lib/industry-content";
import { getOtherIndustries } from "@/lib/industry-content";
import { getIndustryIcon } from "@/components/marketing/industry-icons";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pharma-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pharma-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const CYAN = "#06B6D4";
const CYAN_LIGHT = "#67E8F9";
const DEEP = "#061018";
const NAVY = "#0C2340";
const ICE = "#F0FDFF";
const SURFACE = "#F4FAFC";
const PLATINUM = "#94A3B8";

const MILESTONE_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  map: MapPin,
  check: BadgeCheck,
} as const;

const COMPLIANCE_BADGES = ["GDP-aware", "2–8°C chilled", "Live GPS tracking"];

function splitHeadline(title: string, accent?: string) {
  if (!accent || !title.toLowerCase().includes(accent.toLowerCase())) {
    return { before: title, accent: "", after: "" };
  }
  const idx = title.toLowerCase().indexOf(accent.toLowerCase());
  return {
    before: title.slice(0, idx),
    accent: title.slice(idx, idx + accent.length),
    after: title.slice(idx + accent.length),
  };
}

export default function PharmaceuticalsIndustryPage({ content }: { content: IndustryContent }) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const processLineRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const related = getOtherIndustries(content.slug).slice(0, 3);
  const headline = splitHeadline(content.heroTitle, content.heroHeadlineAccent);
  const HeroIcon = getIndustryIcon(content.iconKey);
  const overviewTitle = content.overviewTitle ?? `Built for ${content.name.toLowerCase()} logistics`;
  const capabilitiesTitle = content.capabilitiesTitle ?? `What we move for ${content.name.toLowerCase()} freight`;
  const requirementsTitle = content.requirementsTitle ?? `Load requirements for ${content.name.toLowerCase()} freight`;

  useEffect(() => {
    if (!pageRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ph-hero-reveal",
        { y: 48, opacity: 0, filter: "blur(12px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.11,
          ease: "power4.out",
          delay: 0.1,
          clearProps: "filter,transform",
        },
      );

      if (heroImageRef.current) {
        gsap.fromTo(heroImageRef.current, { scale: 1.08 }, { scale: 1, duration: 2.5, ease: "power2.out" });
        gsap.to(heroImageRef.current, {
          y: 64,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.4 },
        });
      }

      gsap.fromTo(
        ".ph-badge",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, stagger: 0.09, ease: "power3.out", delay: 0.5 },
      );

      const stats = pageRef.current?.querySelector(".ph-stats");
      if (stats) {
        gsap.fromTo(
          ".ph-stat-pill",
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: stats, start: "top 85%" },
          },
        );
      }

      const showcase = pageRef.current?.querySelector(".ph-showcase");
      if (showcase) {
        gsap.fromTo(
          ".ph-showcase-head > *",
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: showcase, start: "top 80%" },
          },
        );
        gsap.fromTo(
          ".ph-showcase-card",
          { clipPath: "inset(100% 0 0 0)", opacity: 0.6 },
          {
            clipPath: "inset(0% 0 0 0)",
            opacity: 1,
            duration: 1.15,
            stagger: 0.14,
            ease: "power4.out",
            scrollTrigger: { trigger: showcase.querySelector(".ph-showcase-grid"), start: "top 82%" },
          },
        );
      }

      pageRef.current?.querySelectorAll(".ph-timeline-step").forEach((step, i) => {
        gsap.fromTo(
          step,
          { x: i % 2 === 0 ? -24 : 24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 88%" },
          },
        );
      });

      if (processLineRef.current) {
        gsap.fromTo(
          processLineRef.current,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: { trigger: processLineRef.current.closest(".ph-process"), start: "top 75%" },
          },
        );
      }

      pageRef.current?.querySelectorAll(".ph-section").forEach((section) => {
        const items = section.querySelectorAll(".ph-reveal");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 42, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 84%" },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen overflow-x-hidden bg-[#FAFEFF] font-[family-name:var(--font-pharma-sans)] text-[#061018] selection:bg-[#CFFAFE] selection:text-[#0C2340]`}
      style={{ "--ph-cyan": CYAN } as CSSProperties}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: content.seo.title,
          description: content.seo.description,
          url: `https://www.alphafreightuk.com${content.path}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${content.name} — Alpha Freight UK`,
          description: content.heroSubtitle,
          provider: { "@type": "Organization", name: "Alpha Freight", url: "https://www.alphafreightuk.com" },
          areaServed: { "@type": "Country", name: "United Kingdom" },
          serviceType: "Pharmaceutical and healthcare freight",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />

      <Navbar variant="light" />

      <main>
        {/* Hero — full-bleed video background */}
        <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden">
          <div ref={heroImageRef} className="absolute inset-0 will-change-transform">
            {content.heroVideo ? (
              <video
                src={content.heroVideo}
                autoPlay
                muted
                loop
                playsInline
                poster={content.heroImage}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <Image
                src={content.heroImage}
                alt={`${content.name} logistics — Alpha Freight UK`}
                fill
                priority
                quality={100}
                unoptimized
                className="object-cover object-center"
                sizes="100vw"
              />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-[#061018]/88 via-[#0C2340]/72 to-[#061018]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/92 via-transparent to-[#061018]/35" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1180px] flex-col justify-center px-6 pb-16 pt-28 lg:px-12 lg:pt-32">
            <div className="max-w-[640px]">
              <div className="ph-hero-reveal inline-flex items-center gap-2 rounded-full border border-[#67E8F9]/25 bg-[#06B6D4]/10 px-4 py-2 backdrop-blur-md">
                <HeroIcon className="h-3.5 w-3.5 text-[#67E8F9]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/90">
                  {content.eyebrow}
                </span>
              </div>

              <h1
                className="ph-hero-reveal mt-7 text-[clamp(2.375rem,5vw,4.125rem)] font-medium leading-[1.04] tracking-[-0.025em] text-white"
                style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
              >
                {headline.before}
                {headline.accent ? (
                  <span className="bg-gradient-to-r from-[#67E8F9] to-[#06B6D4] bg-clip-text text-transparent">
                    {headline.accent}
                  </span>
                ) : null}
                {headline.after}
              </h1>

              <p className="ph-hero-reveal mt-5 max-w-[540px] text-[15px] leading-[1.8] text-white/65 sm:text-[16px]">
                {content.heroSubtitle}
              </p>

              <div className="ph-hero-reveal mt-6 flex flex-wrap gap-2">
                {COMPLIANCE_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="ph-badge inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-sm"
                  >
                    <Snowflake className="h-3 w-3 text-[#67E8F9]" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="ph-hero-reveal mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={content.signupHref}
                  className="group inline-flex items-center rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_8px_32px_-8px_rgba(6,182,212,0.6)] transition hover:brightness-110"
                >
                  {content.signupLabel}
                  <ArrowUpRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href={content.secondaryHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  {content.secondaryLabel}
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats — dark clinical strip */}
        {content.milestones ? (
          <section className="ph-stats relative overflow-hidden px-6 py-14 lg:px-12" style={{ backgroundColor: DEEP }}>
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background: `radial-gradient(ellipse 70% 80% at 50% 0%, rgba(6,182,212,0.22), transparent 65%)`,
              }}
            />
            <div className="relative mx-auto max-w-[1180px]">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: CYAN_LIGHT }}>
                  {content.milestones.eyebrow}
                </p>
                <h2
                  className="mx-auto mt-4 max-w-[560px] text-[clamp(1.75rem,3.2vw,2.625rem)] font-medium leading-[1.1] text-white"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
                >
                  {content.milestones.title}
                </h2>
                <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-[1.75] text-white/50">
                  {content.milestones.subtitle}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {content.milestones.items.map((item) => {
                  const Icon = MILESTONE_ICONS[item.iconKey];
                  return (
                    <div
                      key={item.label}
                      className="ph-stat-pill rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-7 backdrop-blur-sm sm:px-6 sm:py-8"
                    >
                      <Icon className="h-5 w-5" style={{ color: CYAN_LIGHT }} strokeWidth={1.5} />
                      <p
                        className="mt-6 text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-none text-white"
                        style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
                      >
                        {item.value}
                      </p>
                      <p className="mt-2.5 text-[12px] leading-snug text-white/55">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Showcase — editorial grid */}
        {content.showcase ? (
          <section className="ph-showcase px-6 py-20 sm:py-24 lg:px-12 lg:py-28" style={{ backgroundColor: "white" }}>
            <div className="mx-auto max-w-[1180px]">
              <div className="ph-showcase-head mx-auto max-w-[580px] text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: CYAN }}>
                  {content.showcase.eyebrow}
                </p>
                <h2
                  className="mt-4 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                >
                  {content.showcase.title}
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-slate-500">{content.showcase.subtitle}</p>
              </div>

              <div className="ph-showcase-grid mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-4">
                {content.showcase.items.map((item, index) => (
                  <article
                    key={item.title}
                    className={`ph-showcase-card group relative overflow-hidden rounded-2xl ${
                      item.size === "large"
                        ? "col-span-1 sm:col-span-2 lg:col-span-3"
                        : "col-span-1 lg:col-span-2"
                    } ${index === 0 ? "lg:row-span-1" : ""}`}
                  >
                    <div
                      className={`relative w-full overflow-hidden ${
                        item.size === "large" ? "aspect-[16/10]" : "aspect-[4/5] sm:aspect-[16/11]"
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
                        style={{ objectPosition: item.objectPosition ?? "center center" }}
                        sizes={item.size === "large" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 33vw"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/90 via-[#061018]/20 to-transparent opacity-80 transition group-hover:opacity-90" />
                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: CYAN_LIGHT }}
                        >
                          {item.meta}
                        </span>
                        <h3
                          className="mt-1.5 text-[18px] font-medium leading-snug text-white sm:text-[20px]"
                          style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
                        >
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Requirements — navy panel */}
        {content.blackFeature ? (
          <section className="ph-section relative overflow-hidden px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: NAVY }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 60% 50% at 80% 20%, rgba(103,232,249,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(6,182,212,0.18), transparent 50%)`,
              }}
            />
            <div className="relative mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div className="ph-reveal">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                  <Snowflake className="h-3.5 w-3.5" style={{ color: CYAN_LIGHT }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Requirements</span>
                </div>
                <h2
                  className="mt-5 text-[clamp(1.875rem,3vw,2.5rem)] font-medium leading-[1.1] text-white"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
                >
                  {requirementsTitle}
                </h2>
                <ul className="mt-8 space-y-4">
                  {content.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] leading-relaxed text-white/65">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CYAN_LIGHT }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ph-reveal rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm lg:self-center">
                <ShieldCheck className="h-5 w-5" style={{ color: CYAN_LIGHT }} />
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PLATINUM }}>
                  Marketplace pricing
                </p>
                <p
                  className="mt-3 text-[clamp(1.625rem,2.5vw,2.125rem)] font-medium leading-tight text-white"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif" }}
                >
                  Free to post · <span style={{ color: CYAN_LIGHT }}>4% fee</span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                  No monthly subscription. Compare verified carrier bids for healthcare lanes and pay securely when your load goes live.
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                  style={{ color: CYAN_LIGHT }}
                >
                  View full pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Overview — two-column editorial */}
        <section className="ph-section px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div className="ph-reveal">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CYAN }}>
                  Industry overview
                </p>
                <h2
                  className="mt-4 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                >
                  {overviewTitle}
                </h2>
                <p className="mt-6 text-[15px] leading-[1.8] text-slate-600">{content.informationIntro}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {content.informationPoints.map((point, i) => (
                  <div
                    key={point.title}
                    className="ph-reveal rounded-2xl border border-[#CFFAFE]/80 bg-white p-6 transition-shadow duration-500 hover:shadow-md"
                    style={{ borderLeftWidth: i === 0 ? 3 : 1, borderLeftColor: i === 0 ? CYAN : undefined }}
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em]" style={{ color: CYAN }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3
                      className="mt-3 text-[15px] font-semibold leading-snug"
                      style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                    >
                      {point.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">{point.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="ph-section px-6 py-20 lg:px-12" style={{ backgroundColor: ICE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="ph-reveal max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CYAN }}>
                Capabilities
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-[1.08]"
                style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
              >
                {capabilitiesTitle}
              </h2>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              {content.capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="ph-reveal group rounded-2xl bg-white p-7 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-8"
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${CYAN}18` }}
                  >
                    <Activity className="h-[18px] w-[18px]" style={{ color: CYAN }} strokeWidth={1.5} />
                  </div>
                  <h3
                    className="mt-5 text-[17px] font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                  >
                    {cap.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-slate-600">{cap.desc}</p>
                </div>
              ))}
            </div>

            <div className="ph-reveal mt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: CYAN }}>
                Typical equipment
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#A5F3FC] bg-white px-4 py-2 text-[12px] font-medium text-[#0C2340]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process — vertical timeline */}
        <section className="ph-section ph-process px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[760px]">
            <div className="ph-reveal text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CYAN }}>
                Step by step
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,3.2vw,2.5rem)] font-medium leading-[1.08]"
                style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
              >
                {content.processTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.75] text-slate-600">{content.processIntro}</p>
            </div>

            <div className="relative mt-14">
              <div
                ref={processLineRef}
                className="absolute bottom-0 left-[19px] top-0 w-px origin-top bg-[#A5F3FC] sm:left-[23px]"
              />
              <div className="space-y-6">
                {content.processSteps.map((step) => (
                  <div key={step.step} className="ph-timeline-step relative flex gap-5 pl-0 sm:gap-6">
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[13px] font-semibold sm:h-12 sm:w-12"
                      style={{ borderColor: CYAN, color: CYAN }}
                    >
                      {step.step}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-[#CFFAFE]/60 bg-white px-5 py-5 sm:px-6 sm:py-6">
                      <h3
                        className="text-[16px] font-semibold leading-snug"
                        style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.7] text-slate-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="ph-section px-6 py-20 lg:px-12" style={{ backgroundColor: ICE }}>
          <div className="mx-auto max-w-[720px]">
            <div className="ph-reveal text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CYAN }}>
                FAQ
              </p>
              <h2
                className="mt-3 text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium"
                style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
              >
                Frequently asked questions
              </h2>
            </div>
            <div className="ph-reveal mt-8 space-y-3">
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className="overflow-hidden rounded-2xl border border-[#CFFAFE]/80 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span
                        className="text-[14px] font-medium leading-snug"
                        style={{
                          fontFamily: open ? "var(--font-pharma-serif), Georgia, serif" : undefined,
                          color: NAVY,
                        }}
                      >
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        style={{ color: open ? CYAN : "#94a3b8" }}
                      />
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-[13px] leading-[1.75] text-slate-600 sm:px-6 sm:pb-6">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="ph-section px-6 py-20 lg:px-12" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="ph-reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CYAN }}>
                  More industries
                </p>
                <h2
                  className="mt-2 text-2xl font-medium"
                  style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                >
                  Explore other sectors
                </h2>
              </div>
              <Link
                href="/industries"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                style={{ color: CYAN }}
              >
                View all industries
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {related.map((item) => {
                const RelatedIcon = getIndustryIcon(item.iconKey);
                return (
                  <Link
                    key={item.slug}
                    href={item.path}
                    className="ph-reveal group rounded-2xl border border-[#CFFAFE]/80 bg-white p-6 transition duration-500 hover:-translate-y-1 hover:shadow-md"
                  >
                    <RelatedIcon className="h-[18px] w-[18px]" style={{ color: CYAN }} strokeWidth={1.5} />
                    <h3
                      className="mt-4 text-[15px] font-semibold"
                      style={{ fontFamily: "var(--font-pharma-serif), Georgia, serif", color: NAVY }}
                    >
                      {item.name}
                    </h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{item.tagline}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <CinematicCTA
          title={content.ctaTitle}
          subtitle={content.ctaSubtitle}
          buttonText={content.signupLabel}
          buttonHref={content.signupHref}
        />
      </main>

      <Footer />
    </div>
  );
}
