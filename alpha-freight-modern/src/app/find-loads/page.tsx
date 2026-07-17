"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Search, ShieldCheck, Truck, Wallet } from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";

const steps = [
  "Create a free carrier account",
  "Complete verification and add your fleet",
  "Browse live UK freight loads and smart-matched lanes",
  "Bid, deliver, upload POD, and get paid within 7 days",
];

const faqs = [
  {
    question: "How do I find loads in the UK?",
    answer:
      "Sign up as a carrier on Alpha Freight, browse the live load board, filter by route and equipment, and submit bids on lanes that fit your fleet.",
  },
  {
    question: "Is Alpha Freight free for carriers to find loads?",
    answer:
      "Yes — browsing loads and creating a carrier account is free. You only earn when you complete assigned freight.",
  },
  {
    question: "What types of loads can I find?",
    answer:
      "General haulage, pallet freight, express lanes, and equipment-specific jobs posted by verified UK suppliers.",
  },
];

export default function FindLoadsPage() {
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
            <Image src="/alpha freight truck.jpg" alt="" fill className="object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/70" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]">For carriers</p>
              <h1 className="mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                Find Loads
                <br />
                <span className="text-[#BFFF07]">In The UK</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                Search live haulage and freight loads on Alpha Freight&apos;s UK load board. Verified shippers,
                transparent bids, GPS tracking, digital POD, and 7-day carrier payouts.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/available-loads"
                  className="inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-black"
                >
                  Browse live loads
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/carrier-signup"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:border-white"
                >
                  Join as carrier
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Search, title: "Live load board", text: "Find freight loads by route, equipment, and timing." },
                { icon: Truck, title: "Smart matching", text: "AI suggests lane-fit jobs for your fleet profile." },
                { icon: ShieldCheck, title: "Verified shippers", text: "Work with approved UK suppliers and clear workflows." },
                { icon: Wallet, title: "7-day payouts", text: "Get paid faster after POD verification." },
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
          <h2 className="text-3xl font-bold tracking-tight">How to find loads online with Alpha Freight</h2>
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
              <MapPin className="mt-1 h-5 w-5 text-[#BFFF07]" />
              <div>
                <h2 className="text-xl font-semibold">UK nationwide coverage</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  From London and Midlands distribution to Scotland, Wales, and Northern Ireland lanes — find
                  freight loads posted daily by suppliers using Alpha Freight.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Ready to find your next load?"
        subtitle="Join verified carriers on Alpha Freight"
        buttonText="Browse Loads"
        buttonHref="/available-loads"
      />
      <Footer />
    </div>
  );
}
