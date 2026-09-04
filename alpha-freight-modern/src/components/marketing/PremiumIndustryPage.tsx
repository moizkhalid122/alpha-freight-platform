"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
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
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import type { IndustryContent } from "@/lib/industry-content";
import { getOtherIndustries } from "@/lib/industry-content";
import { getIndustryIcon } from "@/components/marketing/industry-icons";
import type { PremiumIndustryTheme } from "@/lib/premium-industry-themes";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-industry-serif",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const MILESTONE_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  map: MapPin,
  check: BadgeCheck,
} as const;

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

export default function PremiumIndustryPage({
  content,
  theme,
}: {
  content: IndustryContent;
  theme: PremiumIndustryTheme;
}) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
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
        ".con-hero-reveal",
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.15,
          stagger: 0.11,
          ease: "power4.out",
          delay: 0.12,
          clearProps: "transform",
        },
      );

      if (heroImageRef.current) {
        gsap.fromTo(heroImageRef.current, { scale: 1.07 }, { scale: 1, duration: 2, ease: "power2.out" });

        gsap.to(heroImageRef.current, {
          y: 72,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }

      const animateBlock = (
        trigger: Element | null | undefined,
        targets: gsap.TweenTarget,
        options?: { stagger?: number; delay?: number; y?: number; start?: string },
      ) => {
        if (!trigger) return;
        gsap.fromTo(
          targets,
          { y: options?.y ?? 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: options?.stagger ?? 0.09,
            delay: options?.delay ?? 0,
            ease: "power3.out",
            scrollTrigger: {
              trigger,
              start: options?.start ?? "top 80%",
            },
          },
        );
      };

      const milestones = pageRef.current?.querySelector(".con-milestones");
      if (milestones) {
        animateBlock(milestones.querySelector(".con-milestone-reveal"), ".con-milestone-reveal > *", {
          stagger: 0.12,
          start: "top 78%",
        });
        animateBlock(
          milestones.querySelector(".con-milestone-grid"),
          ".con-milestone-card",
          { stagger: 0.1, delay: 0.12, y: 36, start: "top 82%" },
        );
      }

      const showcase = pageRef.current?.querySelector(".con-showcase");
      if (showcase) {
        animateBlock(showcase.querySelector(".con-showcase-reveal"), ".con-showcase-reveal > *", {
          stagger: 0.12,
          start: "top 78%",
        });
        gsap.fromTo(
          showcase.querySelectorAll(".con-showcase-card"),
          { y: 48, opacity: 0, scale: 0.975 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.05,
            stagger: 0.11,
            ease: "power3.out",
            scrollTrigger: {
              trigger: showcase.querySelector(".con-showcase-grid"),
              start: "top 80%",
            },
          },
        );
      }

      const blackFeature = pageRef.current?.querySelector(".con-black-feature");
      if (blackFeature) {
        animateBlock(blackFeature.querySelector(".con-black-requirements"), ".con-black-requirements > *", {
          stagger: 0.09,
          y: 32,
          start: "top 78%",
        });
        animateBlock(blackFeature, ".con-black-requirements li", {
          stagger: 0.06,
          delay: 0.2,
          y: 20,
          start: "top 78%",
        });
        gsap.fromTo(
          blackFeature.querySelector(".con-black-pricing"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            delay: 0.15,
            scrollTrigger: { trigger: blackFeature, start: "top 76%" },
          },
        );
      }

      pageRef.current?.querySelectorAll(".con-section").forEach((section) => {
        const items = section.querySelectorAll(".con-section-reveal");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 46, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
            },
          },
        );
      });

      pageRef.current?.querySelectorAll(".con-equipment-pill").forEach((pill, index) => {
        gsap.fromTo(
          pill,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            delay: index * 0.035,
            ease: "power2.out",
            scrollTrigger: {
              trigger: pill.closest(".con-section"),
              start: "top 76%",
            },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${playfair.variable} min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[var(--pi-selection)] selection:text-[#1a1612]`}
      style={
        {
          "--con-accent": theme.accent,
          "--con-accent-deep": theme.accentDeep,
          "--con-accent-soft": theme.accentSoft,
          "--pi-milestone-card": theme.milestoneCard,
          "--pi-milestone-card-hover": theme.milestoneCardHover,
          "--pi-selection": theme.selectionBg,
        } as CSSProperties
      }
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
          provider: {
            "@type": "Organization",
            name: "Alpha Freight",
            url: "https://www.alphafreightuk.com",
          },
          areaServed: { "@type": "Country", name: "United Kingdom" },
          serviceType: `${content.name} freight and haulage`,
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
        {/* Hero — full viewport below white header */}
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

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1080px] flex-col items-start justify-end px-6 pb-14 pt-28 lg:px-10 lg:pb-20">
            <div className="con-hero-reveal inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
              <HeroIcon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                {content.eyebrow}
              </span>
            </div>

            <h1
              className="con-hero-reveal mt-5 max-w-[640px] text-left text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.15] tracking-tight text-white"
              style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
            >
              {headline.before}
              {headline.accent ? <span style={{ color: theme.accent }}>{headline.accent}</span> : null}
              {headline.after}
            </h1>

            <p className="con-hero-reveal mt-4 max-w-[540px] text-[13px] leading-relaxed text-white/75 sm:text-[15px]">
              {content.heroSubtitle}
            </p>

            <div className="con-hero-reveal mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={content.signupHref}
                className="group inline-flex items-center rounded-full bg-white pl-5 pr-1.5 py-1.5 text-[13px] font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50"
              >
                {content.signupLabel}
                <span
                  className="ml-3 flex h-8 w-8 items-center justify-center rounded-full transition group-hover:scale-105"
                  style={{ backgroundColor: theme.accent }}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </span>
              </Link>
              <Link
                href={content.secondaryHref}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                {content.secondaryLabel}
                <ArrowRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
            </div>
          </div>
        </section>

        {/* Milestones — heading on top, stat cards below (reference layout) */}
        {content.milestones ? (
          <section
            className="con-milestones px-6 py-20 sm:py-24 lg:px-12 lg:py-28 xl:px-16"
            style={{ backgroundColor: theme.milestoneBg }}
          >
            <div className="mx-auto max-w-[1180px]">
              <div className="con-milestone-reveal max-w-[520px]">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.2em]"
                  style={{ color: theme.accentDeep }}
                >
                  {content.milestones.eyebrow}
                </p>
                <h2
                  className="mt-5 text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.08] tracking-[-0.02em] text-[#1a1612]"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  {content.milestones.title}
                </h2>
                <p className="mt-6 max-w-[460px] text-[15px] leading-[1.75] text-slate-500">
                  {content.milestones.subtitle}
                </p>
              </div>

              <div className="con-milestone-grid mt-14 grid grid-cols-2 gap-2 sm:mt-16 lg:grid-cols-4 lg:gap-2.5">
                {content.milestones.items.map((item) => {
                  const Icon = MILESTONE_ICONS[item.iconKey];
                  return (
                    <div
                      key={item.label}
                      className="con-milestone-card flex min-h-[180px] flex-col px-5 py-8 sm:min-h-[200px] sm:px-7 sm:py-9"
                      style={{ backgroundColor: theme.milestoneCard }}
                    >
                      <Icon className="h-5 w-5 shrink-0" style={{ color: theme.accent }} strokeWidth={1.5} />
                      <div className="mt-auto pt-12 sm:pt-14">
                        <p
                          className="text-[clamp(1.75rem,2.6vw,2.125rem)] font-normal leading-none tracking-[-0.01em] text-[#1a1612]"
                          style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                        >
                          {item.value}
                        </p>
                        <p className="mt-3.5 text-[13px] leading-[1.5] text-slate-500">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Showcase grid — reference layout, premium black labels */}
        {content.showcase ? (
          <section
            className="con-showcase px-6 py-20 sm:py-24 lg:px-12 lg:py-28 xl:px-16"
            style={{ backgroundColor: theme.milestoneBg }}
          >
            <div className="mx-auto max-w-[1180px]">
              <div className="con-showcase-reveal max-w-[560px]">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.2em]"
                  style={{ color: theme.accentDeep }}
                >
                  {content.showcase.eyebrow}
                </p>
                <h2
                  className="mt-5 text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.08] tracking-[-0.02em] text-[#1a1612]"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  {content.showcase.title}
                </h2>
                <p className="mt-6 max-w-[480px] text-[15px] leading-[1.75] text-slate-500">
                  {content.showcase.subtitle}
                </p>
              </div>

              <div className="con-showcase-grid mt-14 grid grid-cols-1 gap-2 sm:mt-16 sm:grid-cols-2 lg:grid-cols-6 lg:gap-2.5">
                {content.showcase.items.map((item) => (
                  <article
                    key={item.title}
                    className={`con-showcase-card group overflow-hidden ${
                      item.size === "large"
                        ? "col-span-1 sm:col-span-2 lg:col-span-3"
                        : "col-span-1 lg:col-span-2"
                    }`}
                  >
                    <div
                      className={`relative w-full overflow-hidden ${
                        item.size === "large" ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[16/11]"
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                        style={{ objectPosition: item.objectPosition ?? "center center" }}
                        sizes={
                          item.size === "large"
                            ? "(max-width: 1024px) 100vw, 50vw"
                            : "(max-width: 1024px) 50vw, 33vw"
                        }
                      />
                    </div>
                    <div
                      className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4"
                      style={{ backgroundColor: theme.showcaseBlack }}
                    >
                      <span className="text-[13px] font-medium tracking-[-0.01em] text-white">{item.title}</span>
                      <span className="shrink-0 text-[12px] text-white/50">{item.meta}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Premium black — requirements & pricing */}
        {content.blackFeature ? (
          <section
            className="con-black-feature relative overflow-hidden px-6 py-20 sm:py-24 lg:px-12 lg:py-28 xl:px-16"
            style={{ backgroundColor: theme.showcaseBlack }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ background: theme.blackGlow }}
            />
            <div className="relative mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="con-black-requirements">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: theme.accent }}
                >
                  Requirements
                </p>
                <h2
                  className="mt-4 text-[clamp(1.75rem,2.8vw,2.25rem)] font-normal leading-[1.12] tracking-[-0.02em] text-white"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  {requirementsTitle}
                </h2>
                <ul className="mt-8 space-y-3.5">
                  {content.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-white/65">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="con-black-pricing border border-white/10 bg-white/[0.03] p-7 sm:p-8 lg:self-center">
                <ShieldCheck className="h-5 w-5" style={{ color: theme.accent }} />
                <p
                  className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: theme.accent }}
                >
                  Marketplace pricing
                </p>
                <p
                  className="mt-3 text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-tight text-white"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  Free to post · <span style={{ color: theme.accent }}>4% fee</span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                  No monthly subscription. Compare verified carrier bids and pay securely when your load goes live.
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                  style={{ color: theme.accent }}
                >
                  View full pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Overview — back to warm cream */}
        <section
          className="con-section border-b px-6 py-20 lg:px-10"
          style={{ backgroundColor: theme.milestoneBg, borderColor: theme.accentMuted }}
        >
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div className="con-section-reveal">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accentDeep }}>
                  Industry overview
                </p>
                <h2
                  className="mt-3 text-3xl font-medium tracking-tight text-slate-900 sm:text-[2.125rem]"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  {overviewTitle}
                </h2>
              </div>
              <p className="con-section-reveal text-[15px] leading-relaxed text-slate-600">
                {content.informationIntro}
              </p>
            </div>

            <div className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {content.informationPoints.map((point, i) => (
                <div
                  key={point.title}
                  className="con-section-reveal bg-[var(--pi-milestone-card)] px-6 py-7 transition-colors duration-500 hover:bg-[var(--pi-milestone-card-hover)] sm:px-7 sm:py-8"
                >
                  <p
                    className="text-[11px] font-medium tracking-[0.16em]"
                    style={{ color: theme.accentDeep }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className="mt-4 text-[16px] font-medium leading-snug text-[#1a1612]"
                    style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                  >
                    {point.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.65] text-slate-600">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section
          className="con-section border-b px-6 py-20 lg:px-10"
          style={{ backgroundColor: theme.milestoneBg, borderColor: theme.accentMuted }}
        >
          <div className="mx-auto max-w-[1080px]">
            <div className="con-section-reveal max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accentDeep }}>
                Capabilities
              </p>
              <h2
                className="mt-3 text-3xl font-medium tracking-tight text-slate-900 sm:text-[2.125rem]"
                style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
              >
                {capabilitiesTitle}
              </h2>
            </div>

            <div className="mt-12 grid gap-2 lg:grid-cols-2">
              {content.capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="con-section-reveal bg-[var(--pi-milestone-card)] px-6 py-7 transition-colors duration-500 hover:bg-[var(--pi-milestone-card-hover)] sm:px-7 sm:py-8"
                >
                  <Truck className="h-[18px] w-[18px]" style={{ color: theme.accent }} strokeWidth={1.5} />
                  <h3
                    className="mt-5 text-[17px] font-medium leading-snug text-[#1a1612]"
                    style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                  >
                    {cap.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.65] text-slate-600">{cap.desc}</p>
                </div>
              ))}
            </div>

            <div className="con-section-reveal mt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accentDeep }}>
                Typical equipment
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.equipment.map((item) => (
                  <span
                    key={item}
                    className="con-equipment-pill bg-[var(--pi-milestone-card)] px-4 py-2 text-[12px] font-medium tracking-[-0.01em] text-[#1a1612]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section
          className="con-section border-b px-6 py-20 lg:px-10"
          style={{ backgroundColor: theme.milestoneBg, borderColor: theme.accentMuted }}
        >
          <div className="mx-auto max-w-[1080px]">
            <div className="con-section-reveal max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accentDeep }}>
                Step by step
              </p>
              <h2
                className="mt-3 text-3xl font-medium tracking-tight text-slate-900 sm:text-[2.125rem]"
                style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
              >
                {content.processTitle}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-slate-600">{content.processIntro}</p>
            </div>

            <div className="mt-12 grid gap-2 lg:grid-cols-2">
              {content.processSteps.map((step) => (
                <div
                  key={step.step}
                  className="con-section-reveal flex gap-5 bg-[var(--pi-milestone-card)] px-6 py-6 sm:px-7 sm:py-7"
                >
                  <p
                    className="w-10 shrink-0 text-[1.75rem] font-normal leading-none text-[#1a1612]/25"
                    style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                  >
                    {step.step}
                  </p>
                  <div className="min-w-0 pt-0.5">
                    <h3
                      className="text-[16px] font-medium leading-snug text-[#1a1612]"
                      style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-[1.65] text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="con-section border-b px-6 py-20 lg:px-10"
          style={{ backgroundColor: theme.milestoneBg, borderColor: theme.accentMuted }}
        >
          <div className="mx-auto max-w-[760px]">
            <p className="con-section-reveal text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accentDeep }}>
              FAQ
            </p>
            <h2
              className="con-section-reveal mt-3 text-2xl font-medium tracking-tight text-slate-900 sm:text-[1.875rem]"
              style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
            >
              Frequently asked questions
            </h2>
            <div className="con-section-reveal mt-8 space-y-2">
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className="bg-[var(--pi-milestone-card)]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-300 sm:px-6 sm:py-5 ${open ? "bg-[var(--pi-milestone-card-hover)]" : ""}`}
                    >
                      <span
                        className="text-[14px] font-medium leading-snug text-[#1a1612]"
                        style={{ fontFamily: open ? "var(--font-industry-serif), Georgia, serif" : undefined }}
                      >
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        style={{ color: open ? theme.accent : "#94a3b8" }}
                      />
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-[13px] leading-[1.7] text-slate-600 sm:px-6 sm:pb-6">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="con-section px-6 py-20 lg:px-10" style={{ backgroundColor: theme.milestoneBg }}>
          <div className="mx-auto max-w-[1080px]">
            <div className="con-section-reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accentDeep }}>
                  More industries
                </p>
                <h2
                  className="mt-2 text-2xl font-medium tracking-tight text-slate-900"
                  style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
                >
                  Explore other sectors
                </h2>
              </div>
              <Link
                href="/industries"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-80"
                style={{ color: theme.accentDeep }}
              >
                View all industries
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-2 sm:grid-cols-3">
              {related.map((item) => {
                const RelatedIcon = getIndustryIcon(item.iconKey);
                return (
                  <Link
                    key={item.slug}
                    href={item.path}
                    className="con-section-reveal group block bg-[var(--pi-milestone-card)] px-5 py-6 transition-colors duration-500 hover:bg-[var(--pi-milestone-card-hover)] sm:px-6 sm:py-7"
                  >
                    <RelatedIcon className="h-[18px] w-[18px]" style={{ color: theme.accent }} strokeWidth={1.5} />
                    <h3
                      className="mt-4 text-[15px] font-medium text-[#1a1612]"
                      style={{ fontFamily: "var(--font-industry-serif), Georgia, serif" }}
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
