"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const companyFacts = [
  { label: "Company name", value: "ALPHA FREIGHT SOLUTIONS LIMITED", icon: Building2 },
  { label: "Company number", value: "16860760", icon: ShieldCheck },
  { label: "Incorporation date", value: "November 17th, 2026", icon: Calendar },
];

const contactDetails = [
  {
    label: "Head office",
    value: "Alpha Freight Solutions Limited\n124 City Road\nLondon EC1V 2NX\nUnited Kingdom",
    icon: MapPin,
    href: "https://maps.google.com/?q=124+City+Road+London+EC1V+2NX",
  },
  {
    label: "Phone",
    value: "+44 7782 294718",
    icon: Phone,
    href: "tel:+447782294718",
  },
  {
    label: "Email",
    value: "support@alphafreightuk.com",
    icon: Mail,
    href: "mailto:support@alphafreightuk.com",
  },
  {
    label: "Website",
    value: "www.alphafreightuk.com",
    icon: Globe,
    href: "https://www.alphafreightuk.com",
  },
  {
    label: "Business hours",
    value: "Mon–Fri: 8:00 AM – 6:00 PM",
    icon: Clock,
  },
];

const capabilities = [
  {
    icon: Truck,
    title: "Freight marketplace",
    desc: "A digital brokerage layer connecting suppliers who need capacity with verified carriers ready to move freight across the UK.",
  },
  {
    icon: Users,
    title: "Supplier & carrier platform",
    desc: "Suppliers post loads, review bids, and manage shipments. Carriers discover freight, accept jobs, share updates, and upload POD.",
  },
  {
    icon: ShieldCheck,
    title: "Verified operations",
    desc: "Compliance checks, insurance validation, proof of delivery, and performance scoring keep every handoff accountable.",
  },
  {
    icon: Globe,
    title: "Mobile & web access",
    desc: "Operations run through the supplier portal, carrier workspace, admin tools, and the Alpha Freight mobile app.",
  },
];

export default function CompanyOverviewPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".company-hero-item", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".company-reveal", {
        scrollTrigger: { trigger: ".company-reveal-grid", start: "top 82%" },
        y: 40,
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.12),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[920px] px-6 text-center lg:px-10">
            <p className="company-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              Company Overview
            </p>
            <h1 className="company-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.08]">
              Alpha Freight Solutions Limited
            </h1>
            <p className="company-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              A UK-registered freight technology company building the marketplace, software, and
              operational tools that connect suppliers with verified carriers.
            </p>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  What we do
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Modern freight brokerage, built for the UK
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                  <p>
                    Alpha Freight Solutions Limited operates a freight brokerage platform that helps
                    suppliers and manufacturers find verified road freight capacity without the
                    friction of traditional load boards and manual broker calls.
                  </p>
                  <p>
                    Through our marketplace, suppliers can post loads, compare carrier bids, assign
                    jobs, track progress, review proof of delivery, and manage payments. Carriers can
                    browse available freight, accept suitable lanes, share live updates, upload POD,
                    and manage earnings through one connected ecosystem.
                  </p>
                  <p>
                    Our platform combines supplier and carrier portals, smart matching, digital POD,
                    wallet and payment flows, messaging, and mobile access — giving logistics teams
                    clearer visibility from first post to final delivery.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6 sm:p-8">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Registered details</h3>
                <dl className="mt-6 space-y-5">
                  {companyFacts.map((fact) => {
                    const Icon = fact.icon;
                    return (
                      <div key={fact.label} className="flex gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-100">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {fact.label}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                            {fact.value}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="company-reveal-grid bg-[#F8FAFC] py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Platform scope
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                What Alpha Freight provides
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="company-reveal rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-slate-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mb-12 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
                Contact & office
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Get in touch with our team
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                For platform support, partnership enquiries, or general company information, contact
                Alpha Freight Solutions Limited using the details below.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contactDetails.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="company-reveal flex h-full gap-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="transition hover:opacity-90"
                    >
                      {content}
                    </a>
                  );
                }

                return <div key={item.label}>{content}</div>;
              })}
            </div>

            <div className="company-reveal mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                About Alpha Freight
              </Link>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Work with Alpha Freight"
          subtitle="Connect suppliers, carriers, and freight operations through one trusted UK platform."
          buttonText="Get in touch"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
