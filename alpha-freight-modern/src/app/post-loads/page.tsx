"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, ShieldCheck, Truck, Wallet } from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";

const steps = [
  "Create a free supplier account",
  "Post your load with route, cargo, equipment, and budget",
  "Review bids from verified UK carriers",
  "Track delivery live and close with digital POD",
];

const faqs = [
  {
    question: "How do I post loads online in the UK?",
    answer:
      "Create a supplier account on Alpha Freight, open Post a Load, enter pickup and delivery details, set your budget, and publish to the marketplace for carrier bids.",
  },
  {
    question: "Is it free to post loads on Alpha Freight?",
    answer:
      "Suppliers can create an account and post freight loads on the platform. Payment is handled when you assign carriers and settle shipments.",
  },
  {
    question: "How quickly will carriers bid on my load?",
    answer:
      "Active UK lanes often receive carrier bids within hours depending on route, timing, and budget fit.",
  },
];

export default function PostLoadsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#BFFF07] selection:text-black">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-white/10 pb-20 md:pb-28">
          <div className="absolute inset-0">
            <Image src="/alpha-box.jpg" alt="" fill className="object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/70" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]">For suppliers</p>
              <h1 className="mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                Post Loads
                <br />
                <span className="text-[#BFFF07]">Online UK</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                Post freight and haulage loads in minutes. Alpha Freight connects you with verified carriers,
                live tracking, digital POD, and secure supplier payments.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/auth/supplier-signup"
                  className="inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-black"
                >
                  Post loads free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/products/supplier-portal"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:border-white"
                >
                  See supplier portal
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Boxes, title: "Post in minutes", text: "Publish route, cargo, timing, and budget from one flow." },
                { icon: ClipboardList, title: "Compare bids", text: "Review verified carriers and award the best fit." },
                { icon: Truck, title: "Live tracking", text: "Monitor pickup, transit, and delivery milestones." },
                { icon: Wallet, title: "Pay your way", text: "Pay instant or pay later with full audit visibility." },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-[#BFFF07]" />
                  <h2 className="mt-4 font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
          <h2 className="text-3xl font-bold tracking-tight">How to post freight loads with Alpha Freight</h2>
          <ol className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#BFFF07] text-sm font-bold text-black">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/70 sm:text-base">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-[1.75rem] border border-white/10 bg-white/5 p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[#BFFF07]" />
              <div>
                <h2 className="text-xl font-semibold">Verified carrier network</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Every carrier goes through vetting before accessing premium loads — so when you post haulage
                  freight online, you award jobs with more confidence.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Post your next load today"
        subtitle="Free supplier signup on Alpha Freight"
        buttonText="Post Loads"
        buttonHref="/auth/supplier-signup"
      />
      <Footer />
    </div>
  );
}
