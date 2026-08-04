"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import AcademyEnrollmentForm from "@/components/academy/AcademyEnrollmentForm";

const bundleIncludes = [
  "CPC Training Course",
  "Safety & Compliance",
  "Load Securing Certification",
  "Priority academy onboarding",
  "Certificate support and guidance",
];

export default function EnrollBundlePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative pb-20 md:pb-28 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <Image src="/how-3.jpg" alt="" fill className="object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/92 to-black" />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <Link
              href="/enroll"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Single course enrollment
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mt-8 max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-3 py-1 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#BFFF07]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#BFFF07]">
                  Exclusive Bundle
                </span>
              </div>

              <h1 className="text-5xl md:text-[5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                Complete driver
                <br />
                <span className="text-[#BFFF07]">bundle enrollment.</span>
              </h1>

              <p className="mt-6 text-white/45 text-lg leading-relaxed max-w-2xl">
                Secure all three academy certifications in one premium package and save £78 against individual course pricing.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-white/25 line-through text-lg font-bold">£377</p>
                  <p className="text-5xl font-black tracking-tighter">£299</p>
                </div>
                <span className="rounded-full bg-[#BFFF07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                  Save £78
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12 grid lg:grid-cols-[1fr_420px] gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-[2.5rem] border border-black/10 bg-[#f7f7f4] p-8 md:p-10"
            >
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight">What&apos;s included</h2>
              <p className="mt-4 text-sm leading-relaxed text-black/50 max-w-xl">
                The complete driver bundle is designed for operators who want certification, compliance confidence, and load securing capability in one streamlined path.
              </p>

              <ul className="mt-8 space-y-4">
                {bundleIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-black/60">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-black/30" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 rounded-[1.75rem] bg-black text-white p-6 md:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFFF07]">Best for</p>
                <p className="mt-3 text-lg leading-relaxed text-white/70">
                  New and returning drivers who want a complete certification package with one enrollment flow and one academy contact point.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-[2rem] border border-black/10 bg-[#f7f7f4] p-7 md:p-8 lg:sticky lg:top-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-[#BFFF07]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Bundle form</p>
                  <p className="text-lg font-medium">Reserve the full package</p>
                </div>
              </div>

              <AcademyEnrollmentForm
                enrollmentType="bundle"
                courseTitle="Complete Driver Bundle"
                submitLabel="Reserve bundle for £299"
              />
            </motion.div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Build a stronger, certified fleet"
        subtitle="Alpha Freight Academy"
        buttonText="Explore Academy"
        buttonHref="/academy"
      />
      <Footer />
    </div>
  );
}
