"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Snowflake,
  Thermometer,
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
  variable: "--font-food-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-food-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#5A9E78";
const ACCENT_LIGHT = "#8BC4A0";
const DEEP = "#142820";
const FOREST = "#1A3D2E";
const MINT = "#EEF6F1";
const SURFACE = "#F4FAF7";
const GOLD = "#C9A96E";

const MILESTONE_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  map: MapPin,
  check: BadgeCheck,
} as const;

const TEMP_BADGES = ["Chilled 2°C", "Frozen −18°C", "Ambient"];

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

export default function FoodIndustryPage({ content }: { content: IndustryContent }) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const heroOrbRef = useRef<HTMLDivElement>(null);
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
        ".fd-hero-reveal",
        { y: 56, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.13,
          ease: "power4.out",
          delay: 0.15,
          clearProps: "filter,transform",
        },
      );

      gsap.fromTo(
        ".fd-temp-badge",
        { y: 20, opacity: 0, scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: "back.out(1.6)",
          delay: 0.55,
        },
      );

      if (heroImageRef.current) {
        gsap.fromTo(heroImageRef.current, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: "power2.out" });
        gsap.to(heroImageRef.current, {
          y: 90,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.6 },
        });
      }

      if (heroOrbRef.current) {
        gsap.to(heroOrbRef.current, {
          y: -40,
          x: 30,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 2 },
        });
      }

      const stats = pageRef.current?.querySelector(".fd-stats");
      if (stats) {
        gsap.fromTo(
          ".fd-stat-pill",
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

      const showcase = pageRef.current?.querySelector(".fd-showcase");
      if (showcase) {
        gsap.fromTo(
          ".fd-showcase-head > *",
          { y: 40, opacity: 0 },
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
          ".fd-showcase-card",
          { clipPath: "inset(100% 0 0 0)", opacity: 0.6 },
          {
            clipPath: "inset(0% 0 0 0)",
            opacity: 1,
            duration: 1.15,
            stagger: 0.14,
            ease: "power4.out",
            scrollTrigger: { trigger: showcase.querySelector(".fd-showcase-grid"), start: "top 82%" },
          },
        );
      }

      pageRef.current?.querySelectorAll(".fd-section").forEach((section) => {
        const items = section.querySelectorAll(".fd-reveal");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 82%" },
          },
        );
      });

      pageRef.current?.querySelectorAll(".fd-timeline-step").forEach((step, i) => {
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
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen overflow-x-hidden bg-[#FAFCFB] font-[family-name:var(--font-food-sans)] text-[#142820] selection:bg-[#D6E8DC] selection:text-[#142820]`}
      style={{ "--fd-accent": ACCENT, "--fd-mint": MINT } as CSSProperties}
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
          serviceType: "Food & beverage freight and haulage",
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
        {/* Hero — centred editorial, green tint */}
        <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden">
          <div ref={heroImageRef} className="absolute inset-0 will-change-transform">
            <Image
              src={content.heroImage}
              alt={`${content.name} haulage — Alpha Freight UK`}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>

          <div
            ref={heroOrbRef}
            className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${ACCENT_LIGHT} 0%, transparent 70%)` }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#142820]/60 via-[#142820]/45 to-[#142820]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A3D2E]/40 via-transparent to-[#142820]/30" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[920px] flex-col items-center justify-center px-6 pb-16 pt-32 text-center lg:px-10">
            <div className="fd-hero-reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
              <HeroIcon className="h-3.5 w-3.5" style={{ color: ACCENT_LIGHT }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/90">
                {content.eyebrow}
              </span>
            </div>

            <h1
              className="fd-hero-reveal mt-7 max-w-[720px] text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.02em] text-white"
              style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
            >
              {headline.before}
              {headline.accent ? (
                <span className="italic" style={{ color: ACCENT_LIGHT }}>
                  {headline.accent}
                </span>
              ) : null}
              {headline.after}
            </h1>

            <p className="fd-hero-reveal mx-auto mt-5 max-w-[560px] text-[14px] leading-[1.75] text-white/70 sm:text-[16px]">
              {content.heroSubtitle}
            </p>

            <div className="fd-hero-reveal mt-6 flex flex-wrap items-center justify-center gap-2">
              {TEMP_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="fd-temp-badge inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/85 backdrop-blur-sm"
                >
                  <Thermometer className="h-3 w-3" style={{ color: ACCENT_LIGHT }} />
                  {badge}
                </span>
              ))}
            </div>

            <div className="fd-hero-reveal mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={content.signupHref}
                className="group inline-flex items-center rounded-full px-6 py-3 text-[13px] font-semibold text-white shadow-xl transition hover:brightness-110"
                style={{ backgroundColor: ACCENT }}
              >
                {content.signupLabel}
                <ArrowUpRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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

        {/* Stats — dark forest strip (not cream cards) */}
        {content.milestones ? (
          <section className="fd-stats relative overflow-hidden px-6 py-14 lg:px-12" style={{ backgroundColor: DEEP }}>
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background: `radial-gradient(ellipse 70% 80% at 50% 0%, rgba(90,158,120,0.22), transparent 65%)`,
              }}
            />
            <div className="relative mx-auto max-w-[1180px]">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT_LIGHT }}>
                  {content.milestones.eyebrow}
                </p>
                <h2
                  className="mx-auto mt-4 max-w-[520px] text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium leading-[1.1] text-white"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
                >
                  {content.milestones.title}
                </h2>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {content.milestones.items.map((item) => {
                  const Icon = MILESTONE_ICONS[item.iconKey];
                  return (
                    <div
                      key={item.label}
                      className="fd-stat-pill rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-7 backdrop-blur-sm sm:px-6 sm:py-8"
                    >
                      <Icon className="h-5 w-5" style={{ color: ACCENT_LIGHT }} strokeWidth={1.5} />
                      <p
                        className="mt-6 text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-none text-white"
                        style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
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

        {/* Showcase — rounded overlay cards, not black label bars */}
        {content.showcase ? (
          <section className="fd-showcase px-6 py-20 sm:py-24 lg:px-12 lg:py-28">
            <div className="mx-auto max-w-[1180px]">
              <div className="fd-showcase-head mx-auto max-w-[580px] text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
                  {content.showcase.eyebrow}
                </p>
                <h2
                  className="mt-4 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
                >
                  {content.showcase.title}
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-slate-500">{content.showcase.subtitle}</p>
              </div>

              <div className="fd-showcase-grid mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-4">
                {content.showcase.items.map((item, index) => (
                  <article
                    key={item.title}
                    className={`fd-showcase-card group relative overflow-hidden rounded-2xl ${
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
                        className="object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
                        style={{ objectPosition: item.objectPosition ?? "center center" }}
                        sizes={item.size === "large" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 33vw"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#142820]/90 via-[#142820]/20 to-transparent opacity-80 transition group-hover:opacity-90" />
                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: ACCENT_LIGHT }}
                        >
                          {item.meta}
                        </span>
                        <h3
                          className="mt-1.5 text-[18px] font-medium leading-snug text-white sm:text-[20px]"
                          style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
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

        {/* Requirements — forest panel with gold accent */}
        {content.blackFeature ? (
          <section className="fd-section relative overflow-hidden px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: FOREST }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 60% 50% at 80% 20%, rgba(201,169,110,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(90,158,120,0.18), transparent 50%)`,
              }}
            />
            <div className="relative mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div className="fd-reveal">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                  <Snowflake className="h-3.5 w-3.5" style={{ color: ACCENT_LIGHT }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Requirements</span>
                </div>
                <h2
                  className="mt-5 text-[clamp(1.875rem,3vw,2.5rem)] font-medium leading-[1.1] text-white"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
                >
                  {requirementsTitle}
                </h2>
                <ul className="mt-8 space-y-4">
                  {content.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] leading-relaxed text-white/65">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT_LIGHT }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="fd-reveal rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm lg:self-center">
                <ShieldCheck className="h-5 w-5" style={{ color: GOLD }} />
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Marketplace pricing
                </p>
                <p
                  className="mt-3 text-[clamp(1.625rem,2.5vw,2.125rem)] font-medium leading-tight text-white"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif" }}
                >
                  Free to post · <span style={{ color: ACCENT_LIGHT }}>4% fee</span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                  No monthly subscription. Compare verified refrigerated carrier bids and pay securely when your load goes live.
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
        <section className="fd-section px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div className="fd-reveal">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  Industry overview
                </p>
                <h2
                  className="mt-4 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
                >
                  {overviewTitle}
                </h2>
                <p className="mt-6 text-[15px] leading-[1.8] text-slate-600">{content.informationIntro}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {content.informationPoints.map((point, i) => (
                  <div
                    key={point.title}
                    className="fd-reveal rounded-2xl border border-[#D6E8DC]/80 bg-white p-6 transition-shadow duration-500 hover:shadow-md"
                    style={{ borderLeftWidth: i === 0 ? 3 : 1, borderLeftColor: i === 0 ? ACCENT : undefined }}
                  >
                    <p className="text-[11px] font-semibold tracking-[0.16em]" style={{ color: ACCENT }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3
                      className="mt-3 text-[15px] font-semibold leading-snug"
                      style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
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
        <section className="fd-section px-6 py-20 lg:px-12" style={{ backgroundColor: MINT }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="fd-reveal max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Capabilities
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-[1.08]"
                style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
              >
                {capabilitiesTitle}
              </h2>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              {content.capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="fd-reveal group rounded-2xl bg-white p-7 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-8"
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${ACCENT}18` }}
                  >
                    <Truck className="h-[18px] w-[18px]" style={{ color: ACCENT }} strokeWidth={1.5} />
                  </div>
                  <h3
                    className="mt-5 text-[17px] font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
                  >
                    {cap.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-slate-600">{cap.desc}</p>
                </div>
              ))}
            </div>

            <div className="fd-reveal mt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                Typical equipment
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#D6E8DC] bg-white px-4 py-2 text-[12px] font-medium text-[#142820]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process — vertical timeline */}
        <section className="fd-section px-6 py-20 lg:px-12 lg:py-24" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[760px]">
            <div className="fd-reveal text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Step by step
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,3.2vw,2.5rem)] font-medium leading-[1.08]"
                style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
              >
                {content.processTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.75] text-slate-600">{content.processIntro}</p>
            </div>

            <div className="relative mt-14">
              <div className="absolute bottom-0 left-[19px] top-0 w-px bg-[#D6E8DC] sm:left-[23px]" />
              <div className="space-y-6">
                {content.processSteps.map((step) => (
                  <div key={step.step} className="fd-timeline-step relative flex gap-5 pl-0 sm:gap-6">
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[13px] font-semibold sm:h-12 sm:w-12"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                    >
                      {step.step}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-[#D6E8DC]/60 bg-white px-5 py-5 sm:px-6 sm:py-6">
                      <h3
                        className="text-[16px] font-semibold leading-snug"
                        style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
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
        <section className="fd-section px-6 py-20 lg:px-12" style={{ backgroundColor: MINT }}>
          <div className="mx-auto max-w-[720px]">
            <div className="fd-reveal text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                FAQ
              </p>
              <h2
                className="mt-3 text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium"
                style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
              >
                Frequently asked questions
              </h2>
            </div>
            <div className="fd-reveal mt-8 space-y-3">
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className="overflow-hidden rounded-2xl border border-[#D6E8DC]/80 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span
                        className="text-[14px] font-medium leading-snug"
                        style={{
                          fontFamily: open ? "var(--font-food-serif), Georgia, serif" : undefined,
                          color: DEEP,
                        }}
                      >
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
        <section className="fd-section px-6 py-20 lg:px-12" style={{ backgroundColor: SURFACE }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="fd-reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  More industries
                </p>
                <h2
                  className="mt-2 text-2xl font-medium"
                  style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
                >
                  Explore other sectors
                </h2>
              </div>
              <Link
                href="/industries"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                style={{ color: ACCENT }}
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
                    className="fd-reveal group rounded-2xl border border-[#D6E8DC]/80 bg-white p-6 transition duration-500 hover:-translate-y-1 hover:shadow-md"
                  >
                    <RelatedIcon className="h-[18px] w-[18px]" style={{ color: ACCENT }} strokeWidth={1.5} />
                    <h3
                      className="mt-4 text-[15px] font-semibold"
                      style={{ fontFamily: "var(--font-food-serif), Georgia, serif", color: DEEP }}
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
