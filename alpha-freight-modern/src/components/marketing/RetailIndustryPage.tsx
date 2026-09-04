"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import type { IndustryContent } from "@/lib/industry-content";
import { getOtherIndustries } from "@/lib/industry-content";
import { getIndustryIcon } from "@/components/marketing/industry-icons";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-retail-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-retail-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#6366F1";
const ACCENT_DEEP = "#4F46E5";
const ACCENT_LIGHT = "#A5B4FC";
const INK = "#0F0F14";
const INK_SOFT = "#1E1B4B";
const SURFACE = "#F8F9FC";
const LAVENDER = "#EEF2FF";
const BORDER = "#E2E8F0";

const MILESTONE_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  map: MapPin,
  check: BadgeCheck,
} as const;

const FLOW_BADGES = ["DC → Store", "Multi-drop", "E-commerce"];

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

export default function RetailIndustryPage({ content }: { content: IndustryContent }) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const heroOrbRef = useRef<HTMLDivElement>(null);
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
        ".rt-hero-reveal",
        { y: 52, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.15,
          stagger: 0.12,
          ease: "power4.out",
          delay: 0.12,
          clearProps: "filter,transform",
        },
      );

      if (heroImageRef.current) {
        gsap.fromTo(heroImageRef.current, { scale: 1.1 }, { scale: 1, duration: 2.2, ease: "power2.out" });
        gsap.to(heroImageRef.current, {
          y: 80,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.5 },
        });
      }

      if (heroOrbRef.current) {
        gsap.to(heroOrbRef.current, {
          y: -50,
          x: 40,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 2 },
        });
      }

      gsap.fromTo(
        ".rt-flow-badge",
        { y: 20, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.09,
          ease: "back.out(1.7)",
          delay: 0.55,
        },
      );

      const stats = pageRef.current?.querySelector(".rt-stats");
      if (stats) {
        gsap.fromTo(
          ".rt-stat-item",
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: stats, start: "top 88%" },
          },
        );
      }

      const showcase = pageRef.current?.querySelector(".rt-showcase");
      if (showcase) {
        gsap.fromTo(
          ".rt-showcase-head > *",
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: { trigger: showcase, start: "top 82%" },
          },
        );
        gsap.fromTo(
          ".rt-showcase-card",
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: showcase.querySelector(".rt-showcase-grid"), start: "top 84%" },
          },
        );
      }

      if (processLineRef.current) {
        gsap.fromTo(
          processLineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power2.inOut",
            scrollTrigger: { trigger: processLineRef.current, start: "top 85%" },
          },
        );
      }

      pageRef.current?.querySelectorAll(".rt-section").forEach((section) => {
        const items = section.querySelectorAll(".rt-reveal");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 84%" },
          },
        );
      });

      pageRef.current?.querySelectorAll(".rt-process-step").forEach((step, i) => {
        gsap.fromTo(
          step,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: i * 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 90%" },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${instrument.variable} ${jakarta.variable} min-h-screen overflow-x-hidden bg-white font-[family-name:var(--font-retail-sans)] text-[#0F0F14] selection:bg-[#E0E7FF] selection:text-[#1E1B4B]`}
      style={{ "--rt-accent": ACCENT } as CSSProperties}
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
          serviceType: "Retail freight and distribution",
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
        {/* Hero — full-bleed premium */}
        <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden">
          <div ref={heroImageRef} className="absolute inset-0 will-change-transform">
            <Image
              src={content.heroImage}
              alt={`${content.name} haulage — Alpha Freight UK`}
              fill
              priority
              quality={100}
              unoptimized
              fetchPriority="high"
              className="object-cover object-center [image-rendering:high-quality]"
              sizes="100vw"
            />
          </div>

          <div
            ref={heroOrbRef}
            className="pointer-events-none absolute -left-20 top-1/3 h-[480px] w-[480px] rounded-full opacity-15 blur-3xl"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full opacity-10 blur-3xl"
            style={{ background: `radial-gradient(circle, ${ACCENT_LIGHT} 0%, transparent 70%)` }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F14]/78 via-[#1E1B4B]/45 to-[#0F0F14]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F14]/82 via-transparent to-[#0F0F14]/25" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1180px] flex-col justify-end px-6 pb-14 pt-28 lg:px-12 lg:pb-20 lg:pt-32">
            <div className="rt-hero-reveal inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
              <HeroIcon className="h-3.5 w-3.5" style={{ color: ACCENT_LIGHT }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                {content.eyebrow}
              </span>
            </div>

            <h1
              className="rt-hero-reveal mt-6 max-w-[720px] text-[clamp(2.5rem,5.5vw,4rem)] font-normal leading-[1.04] tracking-[-0.025em] text-white"
              style={{ fontFamily: "var(--font-retail-serif), Georgia, serif" }}
            >
              {headline.before}
              {headline.accent ? <span style={{ color: ACCENT_LIGHT }}>{headline.accent}</span> : null}
              {headline.after}
            </h1>

            <p className="rt-hero-reveal mt-5 max-w-[580px] text-[15px] leading-[1.8] text-white/70 sm:text-[16px]">
              {content.heroSubtitle}
            </p>

            <div className="rt-hero-reveal mt-6 flex flex-wrap gap-2">
              {FLOW_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rt-flow-badge inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white/85 backdrop-blur-sm"
                >
                  <Package className="h-3 w-3" style={{ color: ACCENT_LIGHT }} />
                  {badge}
                </span>
              ))}
            </div>

            <div className="rt-hero-reveal mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={content.signupHref}
                className="group inline-flex items-center rounded-full bg-white pl-6 pr-1.5 py-1.5 text-[13px] font-semibold text-[#0F0F14] shadow-xl transition hover:bg-white/95"
              >
                {content.signupLabel}
                <span
                  className="ml-3 flex h-9 w-9 items-center justify-center rounded-full transition group-hover:scale-105"
                  style={{ backgroundColor: ACCENT }}
                >
                  <ArrowUpRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
              </Link>
              <Link
                href={content.secondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                {content.secondaryLabel}
                <ArrowRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats — minimal horizontal strip */}
        {content.milestones ? (
          <section className="rt-stats border-y border-[#E2E8F0] px-6 py-12 lg:px-12" style={{ backgroundColor: LAVENDER }}>
            <div className="mx-auto max-w-[1180px]">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT_DEEP }}>
                    {content.milestones.eyebrow}
                  </p>
                  <h2
                    className="mt-3 text-[clamp(1.75rem,3vw,2.375rem)] font-normal leading-[1.1] tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK_SOFT }}
                  >
                    {content.milestones.title}
                  </h2>
                  <p className="mt-4 max-w-md text-[14px] leading-[1.7] text-slate-600">{content.milestones.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#C7D2FE] bg-[#C7D2FE] sm:grid-cols-4">
                  {content.milestones.items.map((item) => {
                    const Icon = MILESTONE_ICONS[item.iconKey];
                    return (
                      <div key={item.label} className="rt-stat-item bg-white px-4 py-6 sm:px-5 sm:py-7">
                        <Icon className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={1.75} />
                        <p
                          className="mt-4 text-[clamp(1.25rem,2vw,1.625rem)] font-semibold leading-none tracking-tight"
                          style={{ color: INK }}
                        >
                          {item.value}
                        </p>
                        <p className="mt-2 text-[11px] leading-snug text-slate-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Showcase — caption below, clean retail grid */}
        {content.showcase ? (
          <section className="rt-showcase px-6 py-20 lg:px-12 lg:py-24">
            <div className="mx-auto max-w-[1180px]">
              <div className="rt-showcase-head max-w-[560px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  {content.showcase.eyebrow}
                </p>
                <h2
                  className="mt-3 text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.08] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                >
                  {content.showcase.title}
                </h2>
                <p className="mt-4 text-[15px] leading-[1.75] text-slate-600">{content.showcase.subtitle}</p>
              </div>

              <div className="rt-showcase-grid mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-6 lg:gap-5">
                {content.showcase.items.map((item) => (
                  <article
                    key={item.title}
                    className={`rt-showcase-card group ${
                      item.size === "large" ? "col-span-1 sm:col-span-2 lg:col-span-3" : "col-span-1 lg:col-span-2"
                    }`}
                  >
                    <div
                      className={`relative overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm transition duration-500 group-hover:-translate-y-1 group-hover:shadow-md ${
                        item.size === "large" ? "aspect-[16/10]" : "aspect-[16/11]"
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        style={{ objectPosition: item.objectPosition ?? "center center" }}
                        sizes={item.size === "large" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 33vw"}
                      />
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
                      <div>
                        <h3
                          className="text-[15px] font-semibold leading-snug"
                          style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-slate-500">{item.meta}</p>
                      </div>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#6366F1]" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Requirements — indigo ink panel */}
        {content.blackFeature ? (
          <section className="rt-section relative overflow-hidden px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: INK_SOFT }}>
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(ellipse 70% 60% at 20% 0%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%, rgba(165,180,252,0.08), transparent 55%)`,
              }}
            />
            <div className="relative mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="rt-reveal">
                <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
                  <Store className="h-3.5 w-3.5" style={{ color: ACCENT_LIGHT }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Requirements</span>
                </div>
                <h2
                  className="mt-5 text-[clamp(1.875rem,3vw,2.375rem)] font-normal leading-[1.1]"
                  style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: "white" }}
                >
                  {requirementsTitle}
                </h2>
                <ul className="mt-8 space-y-3.5">
                  {content.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] leading-relaxed text-white/65">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT_LIGHT }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rt-reveal rounded-xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm lg:self-center">
                <ShieldCheck className="h-5 w-5" style={{ color: ACCENT_LIGHT }} />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT_LIGHT }}>
                  Marketplace pricing
                </p>
                <p
                  className="mt-3 text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-tight text-white"
                  style={{ fontFamily: "var(--font-retail-serif), Georgia, serif" }}
                >
                  Free to post · <span style={{ color: ACCENT_LIGHT }}>4% fee</span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                  No monthly subscription. Compare verified carrier bids and pay securely when your load goes live.
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                  style={{ color: ACCENT_LIGHT }}
                >
                  View full pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Overview */}
        <section className="rt-section px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="rt-reveal max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Industry overview
              </p>
              <h2
                className="mt-3 text-[clamp(2rem,3.2vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
              >
                {overviewTitle}
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-slate-600">{content.informationIntro}</p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.informationPoints.map((point, i) => (
                <div
                  key={point.title}
                  className="rt-reveal rounded-lg border border-[#E2E8F0] bg-white p-6 transition duration-500 hover:border-[#C7D2FE] hover:shadow-sm"
                  style={{ borderTopWidth: 3, borderTopColor: i % 3 === 0 ? ACCENT : BORDER }}
                >
                  <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className="mt-3 text-[15px] font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                  >
                    {point.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="rt-section border-y border-[#E2E8F0] px-6 py-20 lg:px-12" style={{ backgroundColor: "white" }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="rt-reveal max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Capabilities
              </p>
              <h2
                className="mt-3 text-[clamp(2rem,3.2vw,2.75rem)] font-normal leading-[1.08]"
                style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
              >
                {capabilitiesTitle}
              </h2>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              {content.capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rt-reveal flex gap-5 rounded-lg border border-[#E2E8F0] p-6 transition duration-500 hover:border-[#C7D2FE] sm:p-7"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: LAVENDER }}
                  >
                    <ShoppingBag className="h-5 w-5" style={{ color: ACCENT }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3
                      className="text-[16px] font-semibold leading-snug"
                      style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                    >
                      {cap.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.7] text-slate-600">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rt-reveal mt-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                Typical equipment
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#E2E8F0] bg-[#F8F9FC] px-3.5 py-2 text-[12px] font-semibold text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process — horizontal 4-step */}
        <section className="rt-section px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="rt-reveal max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Step by step
              </p>
              <h2
                className="mt-3 text-[clamp(2rem,3.2vw,2.5rem)] font-normal leading-[1.08]"
                style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
              >
                {content.processTitle}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-slate-600">{content.processIntro}</p>
            </div>

            <div className="relative mt-14 hidden lg:block">
              <div
                ref={processLineRef}
                className="absolute left-[12.5%] right-[12.5%] top-[22px] h-px origin-left bg-[#C7D2FE]"
              />
              <div className="grid grid-cols-4 gap-6">
                {content.processSteps.map((step) => (
                  <div key={step.step} className="rt-process-step text-center">
                    <div
                      className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-[12px] font-bold"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                    >
                      {step.step}
                    </div>
                    <h3
                      className="mt-5 text-[15px] font-semibold leading-snug"
                      style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 space-y-4 lg:hidden">
              {content.processSteps.map((step) => (
                <div key={step.step} className="rt-process-step rounded-lg border border-[#E2E8F0] bg-white p-5">
                  <span className="text-[12px] font-bold" style={{ color: ACCENT }}>
                    {step.step}
                  </span>
                  <h3
                    className="mt-2 text-[15px] font-semibold"
                    style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rt-section px-6 py-20 lg:px-12" style={{ backgroundColor: "white" }}>
          <div className="mx-auto max-w-[720px]">
            <div className="rt-reveal text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                FAQ
              </p>
              <h2
                className="mt-3 text-[clamp(1.75rem,2.8vw,2.25rem)] font-normal"
                style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
              >
                Frequently asked questions
              </h2>
            </div>
            <div className="rt-reveal mt-8 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-[#F8F9FC]">
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className="bg-white first:rounded-t-xl last:rounded-b-xl">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span className="text-[14px] font-semibold leading-snug" style={{ color: INK }}>
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        style={{ color: open ? ACCENT : "#94a3b8" }}
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
        <section className="rt-section border-t border-[#E2E8F0] px-6 py-20 lg:px-12" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="rt-reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  More industries
                </p>
                <h2
                  className="mt-2 text-2xl font-normal"
                  style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
                >
                  Explore other sectors
                </h2>
              </div>
              <Link
                href="/industries"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                style={{ color: ACCENT_DEEP }}
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
                    className="rt-reveal group rounded-lg border border-[#E2E8F0] bg-white p-6 transition duration-500 hover:border-[#C7D2FE] hover:shadow-sm"
                  >
                    <RelatedIcon className="h-[18px] w-[18px]" style={{ color: ACCENT }} strokeWidth={1.75} />
                    <h3
                      className="mt-4 text-[15px] font-semibold"
                      style={{ fontFamily: "var(--font-retail-serif), Georgia, serif", color: INK }}
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
