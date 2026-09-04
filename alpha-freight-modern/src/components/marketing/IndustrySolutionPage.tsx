"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import type { IndustryContent } from "@/lib/industry-content";
import { getOtherIndustries } from "@/lib/industry-content";
import { getIndustryIcon } from "@/components/marketing/industry-icons";

gsap.registerPlugin(ScrollTrigger);

export default function IndustrySolutionPage({ content }: { content: IndustryContent }) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const Icon = getIndustryIcon(content.iconKey);
  const related = getOtherIndustries(content.slug).slice(0, 3);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".industry-reveal", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
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
          name: `${content.name} Freight — Alpha Freight UK`,
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.alphafreightuk.com" },
            { "@type": "ListItem", position: 2, name: "Industries", item: "https://www.alphafreightuk.com/industries" },
            { "@type": "ListItem", position: 3, name: content.name, item: `https://www.alphafreightuk.com${content.path}` },
          ],
        }}
      />

      <Navbar variant="dark" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[520px] overflow-hidden border-b border-slate-200/70">
          <Image
            src={content.heroImage}
            alt={`${content.name} freight UK`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/78 to-slate-950/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(191,255,7,0.14),transparent_45%)]" />

          <div className="relative mx-auto flex min-h-[520px] max-w-[1140px] flex-col justify-end px-6 pb-16 pt-32 lg:px-10">
            <div className="industry-reveal inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <Icon className="h-4 w-4 text-[#BFFF07]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
                {content.eyebrow}
              </span>
            </div>
            <h1 className="industry-reveal mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {content.heroTitle}
            </h1>
            <p className="industry-reveal mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              {content.heroSubtitle}
            </p>
            <div className="industry-reveal mt-9 flex flex-wrap gap-3">
              <Link
                href={content.signupHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-[#d4ff4d]"
              >
                {content.signupLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={content.secondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {content.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-slate-200/70 bg-slate-50/80 px-6 py-10 lg:px-10">
          <div className="mx-auto grid max-w-[1100px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Information */}
        <section className="border-b border-slate-200/70 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Industry overview
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {content.name} freight on Alpha Freight
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{content.informationIntro}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.informationPoints.map((point) => (
                <div
                  key={point.title}
                  className="group rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div
                    className="mb-4 h-1 w-10 rounded-full transition group-hover:w-14"
                    style={{ backgroundColor: content.accent }}
                  />
                  <h3 className="text-base font-bold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities + Equipment */}
        <section className="border-b border-slate-200/70 bg-slate-950 px-6 py-16 text-white lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                Capabilities
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                What we move in {content.name.toLowerCase()}
              </h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {content.capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-[1.35rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <h3 className="text-lg font-bold text-white">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{cap.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Typical equipment
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="border-b border-slate-200/70 bg-slate-50/60 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Step by step
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content.processTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{content.processIntro}</p>
            </div>

            <div className="mt-10 space-y-4">
              {content.processSteps.map((step) => (
                <div
                  key={step.step}
                  className="flex gap-5 rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm sm:gap-6"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: content.accent }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="border-b border-slate-200/70 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[900px]">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Load requirements for {content.name.toLowerCase()} freight
            </h2>
            <ul className="mt-6 space-y-3">
              {content.requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7da600]" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-[1.35rem] border border-[#BFFF07]/40 bg-[#BFFF07]/10 p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7da600]">
                Marketplace pricing
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">Free to post · 4% service fee</p>
              <p className="mt-2 text-sm text-slate-600">
                No monthly subscription. Compare carrier bids and pay securely when your load goes live.
              </p>
              <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline">
                View full pricing
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-slate-200/70 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[900px]">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-[1.35rem] border border-slate-200 bg-white">
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    >
                      <span className="font-semibold text-slate-900">{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open ? (
                      <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 sm:px-6">{faq.a}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Related industries */}
        <section className="px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  More industries
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Explore other sectors</h2>
              </div>
              <Link
                href="/industries"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
              >
                View all industries
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((item) => {
                const RelatedIcon = getIndustryIcon(item.iconKey);
                return (
                  <Link
                    key={item.slug}
                    href={item.path}
                    className="group rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <RelatedIcon className="h-5 w-5 text-slate-500 transition group-hover:text-slate-900" />
                    <h3 className="mt-3 font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.tagline}</p>
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
