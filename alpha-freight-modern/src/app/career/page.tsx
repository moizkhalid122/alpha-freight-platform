"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";

const heroGallery = [
  { src: "/alpha-man.png", alt: "Alpha Freight team moment", rotation: -5, width: "w-[110px] md:w-[132px]", marginTop: "mt-10" },
  { src: "/alpha-table.png", alt: "Alpha Freight collaboration session", rotation: 7, width: "w-[170px] md:w-[188px]", marginTop: "mt-2" },
  { src: "/guide-image.jpg", alt: "Workspace detail", rotation: -6, width: "w-[150px] md:w-[176px]", marginTop: "mt-12" },
  { src: "/alpha-sof.png", alt: "Team lounge discussion", rotation: 8, width: "w-[180px] md:w-[210px]", marginTop: "mt-8" },
  { src: "/news-2.jpg", alt: "Hiring conversation", rotation: -7, width: "w-[150px] md:w-[168px]", marginTop: "mt-16" },
  { src: "/news-3.jpg", alt: "Alpha Freight people", rotation: 6, width: "w-[165px] md:w-[184px]", marginTop: "mt-10" },
  { src: "/news-4.jpg", alt: "Office environment", rotation: -5, width: "w-[140px] md:w-[160px]", marginTop: "mt-20" },
];

const openings = [
  {
    title: "Senior Product Designer",
    location: "London, United Kingdom",
    type: "Full-Time",
    team: "Design",
  },
  {
    title: "Operations Intelligence Analyst",
    location: "Birmingham, United Kingdom",
    type: "Full-Time",
    team: "Operations",
  },
  {
    title: "Frontend Engineer",
    location: "Remote, Europe",
    type: "Full-Time",
    team: "Engineering",
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F3F3F1] text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28">
        <section className="relative overflow-hidden border-b border-black/5">
          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute inset-y-0 left-1/4 w-px bg-black/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
            <div className="absolute inset-y-0 left-3/4 w-px bg-black/20" />
          </div>

          <div className="relative mx-auto max-w-[1800px] px-6 pb-24 pt-14 lg:px-12 lg:pb-28">
            <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-600 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Careers At Alpha Freight
                </div>

                <h1 className="mt-10 max-w-4xl text-[3.35rem] font-medium leading-[0.92] tracking-tighter text-black sm:text-[4.6rem] md:text-[5.5rem] lg:text-[6.2rem]">
                  Careers That Move
                  <br />
                  You Forward.
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="grid gap-8 pt-6 text-sm font-medium leading-7 text-slate-600 sm:grid-cols-2 lg:grid-cols-2 lg:pt-20"
              >
                <p>
                  At Alpha Freight, we are driven by innovation and fueled by the creativity of our global team, connecting businesses and possibilities worldwide.
                </p>
                <p>
                  You will find opportunities to grow professionally and contribute to meaningful logistics solutions that move industries forward.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="mt-14 flex items-end gap-4 overflow-x-auto pb-4 pt-4 md:gap-5"
            >
              {heroGallery.map((item, index) => (
                <div
                  key={item.src}
                  className={`relative shrink-0 ${item.width} ${item.marginTop}`}
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                  <div className="relative aspect-[0.8] overflow-hidden rounded-[6px] border border-black/8 bg-white p-2 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.35)]">
                    <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-slate-200">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 160px, 220px"
                      />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-[8px] ring-1 ring-black/5" />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.62fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Open Roles
                </div>
                <h2 className="mt-8 max-w-xl text-4xl font-medium leading-tight tracking-tighter text-black md:text-5xl">
                  Join the team building the next generation of logistics.
                </h2>
              </div>

              <div className="space-y-4">
                {openings.map((role, index) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                    className="rounded-[28px] border border-slate-200 bg-[#F8F8F7] p-6 transition-colors hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900">{role.title}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <span>{role.team}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{role.type}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {role.location}
                        </div>
                      </div>

                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-slate-400"
                      >
                        Apply Now
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
