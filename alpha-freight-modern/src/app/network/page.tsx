"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Globe,
  MapPin,
  Network,
  ShieldCheck,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import NetworkCanvas3D from "@/components/NetworkCanvas3D";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: "Verified carriers", value: "5,000+" },
  { label: "UK lane coverage", value: "100%" },
  { label: "Active suppliers", value: "1,200+" },
  { label: "Loads matched monthly", value: "18k+" },
];

const pillars = [
  {
    icon: Truck,
    title: "Carrier capacity",
    desc: "Verified fleets across curtain-side, refrigerated, flatbed, and specialist equipment — ranked by fit, not postcode alone.",
  },
  {
    icon: Users,
    title: "Supplier demand",
    desc: "Shippers and manufacturers post live freight into one marketplace with transparent assignment and smart matching.",
  },
  {
    icon: ShieldCheck,
    title: "Trust layer",
    desc: "Compliance checks, insurance validation, POD quality, and performance scoring keep every handoff accountable.",
  },
  {
    icon: Zap,
    title: "Live intelligence",
    desc: "Lane scoring, ETA signals, and capacity visibility connect the right load to the right operator in seconds.",
  },
];

const partnerLogos = [
  { name: "Beck & Pollitzer", src: "/Beck & Pollitzer.png" },
  { name: "British Steel", src: "/British Steel.png" },
  { name: "Barrett Steel", src: "/Barrett Steel.png" },
  { name: "WS Transportation", src: "/WS Transportation.png" },
  { name: "JMD Haulage", src: "/JMD Haulage Contractors.png" },
  { name: "WT Transport", src: "/WT TRANSPORT.png" },
];

export default function NetworkPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".network-reveal", {
        scrollTrigger: { trigger: ".network-stats", start: "top 85%" },
        y: 36,
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
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-20 sm:pb-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.14),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[920px] px-6 text-center lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              Alpha Freight Network
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              The infrastructure behind modern freight
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              A connected UK marketplace where verified carriers, suppliers, and brokers move freight
              with live visibility, smart matching, and operational trust built in.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/directory"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Browse directory
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Partner with us
              </Link>
            </div>
          </div>
        </section>

        <section className="network-stats border-b border-slate-200/70 bg-white py-16">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-6 sm:grid-cols-4 lg:px-10">
            {stats.map((item) => (
              <div
                key={item.label}
                className="network-reveal rounded-[1.35rem] border border-slate-200/80 bg-slate-50 px-5 py-6 text-center sm:px-6"
              >
                <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{item.value}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 sm:text-[11px]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden bg-black py-24 text-white sm:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(191,255,7,0.08),transparent_45%)]" />
          <div className="mx-auto grid max-w-[1400px] gap-14 px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
            <div className="network-reveal space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFFF07]/25 bg-[#BFFF07]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                <Network className="h-3.5 w-3.5" />
                Live network map
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Connected across every mile
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-white/55">
                From national hauliers to specialist operators, Alpha Freight links capacity, demand,
                and compliance in one intelligent layer — so freight moves with fewer empty miles and
                faster handoffs.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Globe, label: "UK-wide lanes" },
                  { icon: MapPin, label: "Real-time matching" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BFFF07]/15 text-[#BFFF07]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="network-reveal relative mx-auto aspect-square w-full max-w-[480px]">
              <div className="absolute inset-0">
                <NetworkCanvas3D />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-full border border-[#BFFF07]/20" />
              <div className="pointer-events-none absolute inset-8 rounded-full border border-[#BFFF07]/10" />
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                How the network works
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Four layers. One marketplace.
              </h2>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="network-reveal rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-slate-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold tracking-tight">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{pillar.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Trusted operators
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Built with industry leaders
                </h2>
              </div>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
              >
                View full directory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {partnerLogos.map((logo) => (
                <div
                  key={logo.name}
                  className="network-reveal flex h-24 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 shadow-sm"
                >
                  <div className="relative h-12 w-full">
                    <Image
                      src={logo.src}
                      alt={logo.name}
                      fill
                      className="object-contain"
                      sizes="120px"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto grid max-w-[1400px] gap-6 px-6 lg:grid-cols-3 lg:px-10">
            {[
              {
                title: "Find verified carriers",
                desc: "Search the public directory by lane, equipment, and verification status.",
                href: "/directory",
                cta: "Open directory",
              },
              {
                title: "Browse live loads",
                desc: "See freight available across the Alpha marketplace right now.",
                href: "/available-loads",
                cta: "View loads",
              },
              {
                title: "Join the network",
                desc: "Onboard as a carrier or supplier and start matching in minutes.",
                href: "/auth/signup",
                cta: "Create account",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="network-reveal rounded-[1.5rem] border border-slate-200 bg-slate-50 p-7"
              >
                <h3 className="text-xl font-bold tracking-tight">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.desc}</p>
                <Link
                  href={card.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900"
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <CinematicCTA
          title="Grow with the Alpha network"
          subtitle="Connect verified capacity, live demand, and intelligent matching in one platform built for UK freight."
          buttonText="Get started free"
          buttonHref="/auth/signup"
        />
      </main>

      <Footer />
    </div>
  );
}
