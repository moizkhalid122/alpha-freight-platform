"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import Counter from "@/components/Counter";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import { getAllIndustries, industriesHubContent } from "@/lib/industry-content";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ind-hub-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ind-hub-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const serif = () => "font-[family-name:var(--font-ind-hub-serif)]";
const hub = industriesHubContent;

export default function IndustriesHubPage() {
  useMarketingSmoothScroll(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const industries = getAllIndustries();

  useEffect(() => {
    if (!pageRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ind-hub-in",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.05,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.06,
          clearProps: "transform",
        },
      );

      gsap.utils.toArray<HTMLElement>(".ind-hub-fade").forEach((el) => {
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

  return (
    <div
      ref={pageRef}
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen overflow-x-hidden bg-white font-[family-name:var(--font-ind-hub-sans)] text-neutral-900 selection:bg-neutral-900 selection:text-white`}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Industry Freight Solutions UK",
          description: hub.subtitle,
          url: "https://www.alphafreightuk.com/industries",
        }}
      />

      <Navbar variant="dark" />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 pt-28 md:pt-32">
          <div className="mx-auto max-w-[1200px] px-6 pb-12 lg:px-10 lg:pb-16">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-end lg:gap-16">
              <div>
                <p className="ind-hub-in text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">
                  {hub.eyebrow}
                </p>
                <h1
                  className={`ind-hub-in mt-5 text-[clamp(2.75rem,5.5vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.02em] text-neutral-900 ${serif()}`}
                >
                  {hub.title}
                </h1>
                <p className="ind-hub-in mt-6 max-w-[520px] text-[16px] leading-[1.75] text-neutral-600">
                  {hub.subtitle}
                </p>
                <div className="ind-hub-in mt-9 flex flex-wrap gap-3">
                  <Link
                    href="/auth/signup?role=supplier"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Post industry freight
                  </Link>
                  <Link
                    href="/auth/signup?role=carrier"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-neutral-200 px-8 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    Find sector loads
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="ind-hub-in grid grid-cols-3 gap-2 sm:gap-3">
                {industries.map((industry) => (
                  <Link
                    key={industry.slug}
                    href={industry.path}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100"
                  >
                    <Image
                      src={industry.heroImage}
                      alt={industry.name}
                      fill
                      sizes="(max-width: 768px) 33vw, 200px"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-3 sm:p-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/60">{industry.eyebrow}</p>
                      <p className={`mt-0.5 text-sm font-medium text-white sm:text-base ${serif()}`}>{industry.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="border-b border-neutral-200 py-20 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20 lg:px-10">
            <div className="ind-hub-fade">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Alpha Freight</p>
              <h2
                className={`mt-4 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.02em] text-neutral-900 ${serif()}`}
              >
                {hub.introTitle}
              </h2>
            </div>
            <p className="ind-hub-fade text-[15px] leading-[1.78] text-neutral-600">{hub.introBody}</p>
          </div>
        </section>

        {/* Industry cards */}
        <section className="border-b border-neutral-200 bg-neutral-50 py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="ind-hub-fade flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Sectors</p>
                <h2
                  className={`mt-4 text-[clamp(1.875rem,3.5vw,2.75rem)] font-medium leading-[1.08] text-neutral-900 ${serif()}`}
                >
                  Explore by industry
                </h2>
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-neutral-500">
                Each sector page covers equipment, compliance, workflows, and FAQs for that freight vertical.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {industries.map((industry) => (
                <Link
                  key={industry.slug}
                  href={industry.path}
                  className="ind-hub-fade group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.07)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                    <Image
                      src={industry.heroImage}
                      alt={industry.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                    <span
                      className="absolute left-5 top-5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                      style={{ backgroundColor: `${industry.accent}dd` }}
                    >
                      {industry.eyebrow}
                    </span>
                  </div>
                  <div className="p-6 lg:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-[1.375rem] font-medium leading-snug text-neutral-900 ${serif()}`}>
                          {industry.name}
                        </h3>
                        <p className="mt-2 text-[14px] font-medium text-neutral-500">{industry.tagline}</p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition group-hover:border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{industry.heroSubtitle}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {industry.stats.slice(0, 2).map((stat) => (
                        <span
                          key={stat.label}
                          className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600"
                        >
                          {stat.label}: {stat.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-neutral-200 bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <p className="ind-hub-fade text-center text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">
              Platform scale
            </p>
            <h2
              className={`ind-hub-fade mx-auto mt-5 max-w-[720px] text-center text-[clamp(2rem,3.8vw,3rem)] font-medium leading-[1.06] tracking-[-0.015em] text-neutral-900 ${serif()}`}
            >
              Trusted across UK freight sectors
            </h2>

            <div className="ind-hub-fade mx-auto mt-14 max-w-[1080px] border-t border-neutral-200" />

            <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {hub.stats.map((stat, index) => (
                <div
                  key={stat.description}
                  className={`ind-hub-fade text-center lg:px-8 lg:text-left ${index > 0 ? "lg:border-l lg:border-neutral-200/80" : ""}`}
                >
                  <p
                    className={`text-[clamp(2.25rem,3.6vw,3.125rem)] font-medium leading-none tracking-[-0.02em] text-neutral-900 ${serif()}`}
                  >
                    <Counter value={stat.value} suffix={stat.suffix} duration={2} />
                  </p>
                  <p className="mx-auto mt-5 max-w-[220px] text-[13px] font-light leading-[1.75] text-neutral-500 lg:mx-0">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Black platform band */}
        <section className="bg-neutral-950 py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="ind-hub-fade grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-20">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">{hub.platformEyebrow}</p>
                <h2
                  className={`mt-4 text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.02em] text-white ${serif()}`}
                >
                  {hub.platformTitle}
                </h2>
              </div>
              <p className="ind-hub-fade text-[15px] leading-[1.78] text-neutral-400">{hub.platformBody}</p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {hub.processSteps.map((step) => (
                <article
                  key={step.step}
                  className="ind-hub-fade rounded-2xl border border-white/10 bg-white/[0.03] p-7"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{step.step}</p>
                  <h3 className={`mt-3 text-[1.125rem] font-medium leading-snug text-white ${serif()}`}>{step.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">{step.desc}</p>
                </article>
              ))}
            </div>

            <div className="ind-hub-fade mt-12 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                View pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/technology"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-6 text-[13px] font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                Platform technology
              </Link>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Post freight in your industry today"
          subtitle="Create a free supplier account, post your load, and receive bids from verified UK carriers in minutes."
          buttonText="Get started free"
          buttonHref="/auth/signup?role=supplier"
        />
      </main>

      <Footer />
    </div>
  );
}
