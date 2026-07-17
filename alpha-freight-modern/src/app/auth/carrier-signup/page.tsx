"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgePoundSterling, MapPinned, Route, Truck } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";

const benefits = [
  {
    icon: Route,
    title: "Find loads that fit",
    description: "Browse opportunities, submit smart bids, and grow your lanes with a marketplace built for carriers.",
  },
  {
    icon: MapPinned,
    title: "Operate with visibility",
    description: "Share live tracking, complete digital POD, and keep suppliers informed from pickup to delivery.",
  },
  {
    icon: BadgePoundSterling,
    title: "Get paid with clarity",
    description: "Use the carrier wallet, payout setup, and earnings tools to understand what is available and when.",
  },
];

const steps = ["Create your carrier account", "Complete verification", "Bid on matching loads", "Deliver and get paid"];

export default function CarrierSignupPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative pb-24 md:pb-32 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <Image src="/alpha freight truck.jpg" alt="" fill className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50" />
          </div>

          <div className="relative max-w-[1800px] mx-auto px-6 lg:px-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07] mb-6">
                Carrier Onboarding
              </p>
              <h1 className="text-5xl md:text-[5.5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                Drive more.
                <br />
                <span className="text-white/25">Earn with clarity.</span>
              </h1>
              <p className="mt-8 text-white/45 text-lg max-w-xl leading-relaxed">
                Become a verified Alpha Freight carrier and access quality loads, transparent workflows, and tools designed for modern UK freight operators.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/auth/signup?role=carrier"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-[#BFFF07] transition-colors"
                >
                  Create carrier account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white hover:border-white/40 transition-colors"
                >
                  Already registered?
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Setup flow</p>
                  <p className="text-xl font-medium">Built for working fleets</p>
                </div>
              </div>

              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#BFFF07]">
                      0{index + 1}
                    </span>
                    <span className="text-sm text-white/70">{step}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-white text-black">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  viewport={{ once: true }}
                  className="rounded-[2rem] border border-black/10 p-8 bg-[#f7f7f4]"
                >
                  <benefit.icon className="h-6 w-6 mb-5" />
                  <h2 className="text-2xl font-medium tracking-tight mb-3">{benefit.title}</h2>
                  <p className="text-sm leading-relaxed text-black/50">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Ready to move your next load?"
        subtitle="Start as a carrier"
        buttonText="Create Account"
        buttonHref="/auth/signup?role=carrier"
      />
      <Footer />
    </div>
  );
}
