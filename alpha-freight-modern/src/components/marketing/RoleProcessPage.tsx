"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import type { RoleProcessContent } from "@/lib/role-process-content";

gsap.registerPlugin(ScrollTrigger);

export default function RoleProcessPage({ content }: { content: RoleProcessContent }) {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".role-process-reveal", {
        y: 32,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
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
          name: content.heroTitle,
          description: content.heroSubtitle,
          url: `https://www.alphafreightuk.com${content.path}`,
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

      <Navbar variant="dark" />

      <main>
        <section className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top,rgba(191,255,7,0.12),transparent_55%)] px-6 pb-16 pt-28 lg:px-10">
          <div className="mx-auto max-w-[900px] text-center">
            <p className="role-process-reveal text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7da600]">
              {content.eyebrow}
            </p>
            <h1 className="role-process-reveal mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {content.heroTitle}
            </h1>
            <p className="role-process-reveal mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {content.heroSubtitle}
            </p>
            <div className="role-process-reveal mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={content.signupHref}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {content.signupLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={content.secondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                {content.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section id="information" className="border-b border-slate-200/70 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Information
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {content.informationTitle}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                {content.informationIntro}
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.informationPoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-base font-bold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{point.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.35rem] border border-[#BFFF07]/40 bg-[#BFFF07]/10 p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7da600]">
                {content.feeLabel}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{content.feeValue}</p>
              <p className="mt-2 text-sm text-slate-600">{content.feeNote}</p>
              <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:underline">
                View full pricing
              </Link>
            </div>
          </div>
        </section>

        <section id="process" className="border-b border-slate-200/70 bg-slate-50/60 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Step by step
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content.processTitle}</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                {content.processIntro}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {content.processSteps.map((step) => (
                <div
                  key={step.step}
                  className="flex gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm sm:gap-6 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
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

        <section className="border-b border-slate-200/70 px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[900px]">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{content.requirementsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {content.requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7da600]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[900px]">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-[1.25rem] border border-slate-200 bg-white">
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
                      <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 sm:px-6">
                        {faq.a}
                      </div>
                    ) : null}
                  </div>
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
