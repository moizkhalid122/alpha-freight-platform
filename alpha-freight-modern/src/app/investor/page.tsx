"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Asterisk,
  Orbit,
  Sparkles,
  SunMedium,
  Waves,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Investor = {
  name: string;
  description: string;
  website: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
  logo?: string;
};

const investors: Investor[] = [
  {
    name: "Luminous",
    description:
      "Luminous is a key advisor on sustainable logistics practices. They guide our operational roadmap around cleaner fleets, visibility systems, and long-term resilience.",
    website: "#",
    tone: "from-white to-[#ecece6]",
    icon: Waves,
    logo: "/luminous.svg",
  },
  {
    name: "Acme Corp",
    description:
      "Acme Corp brings strategic market access and operating discipline. Their perspective helps accelerate commercial expansion into higher-value freight corridors.",
    website: "#",
    tone: "from-[#f4f4ef] to-white",
    icon: Sparkles,
    logo: "/acme-corp.svg",
  },
  {
    name: "Nietzsche",
    description:
      "Nietzsche specializes in global trade compliance systems. They ensure our automation layers stay aligned with evolving operational and documentation standards.",
    website: "#",
    tone: "from-white to-[#efefe8]",
    icon: SunMedium,
    logo: "/nietzsche.svg",
  },
  {
    name: "Epicurious",
    description:
      "Epicurious focuses on customer experience across the final mile. Their input sharpens product thinking around communication, timing, and delivery precision.",
    website: "#",
    tone: "from-[#f3f3ee] to-white",
    icon: Orbit,
    logo: "/epicurious.svg",
  },
  {
    name: "Northstar",
    description:
      "Northstar supports our growth strategy across network density, trusted capacity, and higher-frequency shipper operations in competitive regions.",
    website: "#",
    tone: "from-white to-[#ecece6]",
    icon: Asterisk,
  },
  {
    name: "Helix One",
    description:
      "Helix One advises on data infrastructure and platform intelligence, helping us turn operational signal into better forecasting and smarter execution.",
    website: "#",
    tone: "from-[#f4f4ef] to-white",
    icon: Sparkles,
  },
  {
    name: "Verve Capital",
    description:
      "Verve Capital backs disciplined scale. Their investment lens keeps Alpha Freight focused on durable economics, network trust, and long-term operating quality.",
    website: "#",
    tone: "from-white to-[#efefe8]",
    icon: Waves,
  },
  {
    name: "Orbis",
    description:
      "Orbis contributes global logistics intelligence across expanding trade lanes and complex freight movements, strengthening our strategic planning layer.",
    website: "#",
    tone: "from-[#f3f3ee] to-white",
    icon: Orbit,
  },
];

export default function InvestorPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-black overflow-x-hidden">
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="py-12 md:py-20">
          <div className="max-w-[1800px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="grid lg:grid-cols-[180px_1fr] gap-8 md:gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="pt-3"
              >
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black/55">
                  <span className="w-2 h-2 bg-[#BFFF07]" />
                  <span>Investors</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="max-w-[1080px] justify-self-center text-center lg:-translate-x-12"
              >
                <h1 className="text-[3.1rem] sm:text-[4.8rem] md:text-[5.7rem] lg:text-[6rem] font-medium leading-[0.92] tracking-tighter uppercase text-[#171717]">
                  Investor Relations
                </h1>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="max-w-[1800px] mx-auto px-5 md:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5"
            >
              {investors.map((investor, index) => (
                <motion.article
                  key={investor.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="border border-black/10 bg-white overflow-hidden"
                >
                  <div
                    className={`h-[235px] md:h-[260px] bg-gradient-to-b ${investor.tone} flex items-center justify-center px-8`}
                  >
                    {investor.logo ? (
                      <div className="relative w-[190px] h-[58px]">
                        <Image
                          src={investor.logo}
                          alt={investor.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-[#1f1f1f]">
                        <investor.icon className="w-8 h-8" />
                        <span className="text-[2rem] font-semibold tracking-tight">
                          {investor.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 md:p-6 min-h-[210px] flex flex-col">
                    <div className="space-y-3 flex-1">
                      <h2 className="text-[1.7rem] font-medium leading-none tracking-tight text-[#202020]">
                        {investor.name}
                      </h2>
                      <p className="text-[14px] leading-[1.7] text-black/48">
                        {investor.description}
                      </p>
                    </div>

                    <Link
                      href={investor.website}
                      className="mt-8 inline-flex items-center gap-2 text-[12px] font-medium text-[#202020] hover:text-black transition-colors"
                    >
                      <span>Website</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
