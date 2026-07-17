"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  Coffee,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Laptop,
  MapPin,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Counter from "@/components/Counter";
import { CinematicCTA, Footer } from "@/components/Footer";
import { careerOpenings, careerTeams } from "@/lib/careers-content";

const teamFilters = careerTeams;

const culturePillars = [
  {
    title: "Build With Ownership",
    description: "Small teams, real responsibility, and the room to ship work that changes how freight moves.",
    image: "/alpha-table.png",
    stat: "High trust",
  },
  {
    title: "Design For Operators",
    description: "We build for suppliers, carriers, and admins in the field — not abstract dashboards in isolation.",
    image: "/alpha-man.png",
    stat: "User-first",
  },
  {
    title: "Move At Market Speed",
    description: "Logistics does not wait. We favor clarity, momentum, and products that hold up under pressure.",
    image: "/alpha-sof.png",
    stat: "Fast pace",
  },
];

const benefits = [
  { icon: Laptop, title: "Remote-friendly", detail: "Hybrid and remote roles across product and engineering." },
  { icon: GraduationCap, title: "Learning budget", detail: "Courses, conferences, and certifications supported." },
  { icon: HeartHandshake, title: "Health & wellbeing", detail: "Support designed around real work rhythms, not perks theatre." },
  { icon: Coffee, title: "Studio culture", detail: "Collaborative sessions, design critique, and operator feedback loops." },
  { icon: Globe2, title: "UK freight mission", detail: "Work on infrastructure that matters to real businesses." },
  { icon: Zap, title: "Modern stack", detail: "Next.js, Supabase, Stripe, Mapbox, and AI-assisted workflows." },
];

const hiringSteps = [
  { step: "01", title: "Intro conversation", detail: "A focused call to understand your experience, interests, and fit." },
  { step: "02", title: "Skills deep dive", detail: "Portfolio, case study, or technical conversation depending on role." },
  { step: "03", title: "Team meet", detail: "Meet the people you would build with and sense how we work." },
  { step: "04", title: "Offer & onboarding", detail: "Clear expectations, fast decisions, and a structured first 30 days." },
];

const teamStats = [
  { label: "Open roles", value: careerOpenings.length, suffix: "" },
  { label: "Teams hiring", value: 5, suffix: "" },
  { label: "UK + remote", value: 100, suffix: "%" },
  { label: "Response target", value: 5, suffix: " days" },
];

const lifeGallery = [
  { src: "/alpha-table.png", alt: "Team collaboration", className: "md:col-span-2 md:row-span-2" },
  { src: "/alpha-man.png", alt: "Team member", className: "" },
  { src: "/guide-image.jpg", alt: "Workspace", className: "" },
  { src: "/alpha-sof.png", alt: "Team lounge", className: "md:col-span-2" },
  { src: "/how-1.jpg", alt: "Operations", className: "" },
  { src: "/how-4.jpg", alt: "Culture", className: "" },
];

export default function CareerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTeam, setActiveTeam] = useState<(typeof teamFilters)[number]>("All");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);

  const filteredOpenings = useMemo(() => {
    if (activeTeam === "All") return careerOpenings;
    return careerOpenings.filter((role) => role.team === activeTeam);
  }, [activeTeam]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-x-hidden bg-black text-white selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen flex-col justify-end overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            >
              <source src="/alpha-center.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#BFFF0708_1px,transparent_1px),linear-gradient(to_bottom,#BFFF0708_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_55%,transparent_100%)]" />
          </div>

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-20 mx-auto w-full max-w-[1800px] px-6 pb-16 md:pb-24 lg:px-12"
          >
            <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Careers at Alpha Freight
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08 }}
                  className="max-w-5xl text-[3.4rem] font-medium leading-[0.88] tracking-tighter sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] uppercase"
                >
                  Build the
                  <br />
                  <span className="text-white/20">Future of Freight.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.16 }}
                  className="mt-8 max-w-2xl text-lg leading-relaxed text-white/45 md:text-xl"
                >
                  Join a product-led team building marketplace infrastructure, live tracking, payouts, and AI-assisted operations for the UK logistics industry.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl md:p-10"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">Now hiring across</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {teamFilters.slice(1).map((team) => (
                    <span
                      key={team}
                      className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70"
                    >
                      {team}
                    </span>
                  ))}
                </div>
                <Link
                  href="#open-roles"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
                >
                  View open roles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Explore careers</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.div>
        </section>

        {/* Stats */}
        <section className="border-b border-black/5 bg-white py-20 text-black md:py-24">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
              {teamStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  viewport={{ once: true }}
                >
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{stat.label}</p>
                  <p className="text-5xl font-medium tracking-tighter md:text-6xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Culture */}
        <section className="bg-[#f5f5f2] py-24 text-black md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">Culture</p>
                <h2 className="text-4xl font-medium uppercase leading-[0.92] tracking-tighter md:text-[4.5rem]">
                  A team built for
                  <br />
                  serious product work.
                </h2>
              </div>
              <p className="max-w-md leading-relaxed text-black/50">
                We are not hiring for a generic logistics website. We are building operating software for suppliers, carriers, and the teams running freight every day.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {culturePillars.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-black text-white"
                >
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />
                  <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-10">
                    <span className="inline-flex w-fit rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#BFFF07]">
                      {pillar.stat}
                    </span>
                    <div>
                      <h3 className="text-3xl font-medium uppercase tracking-tight">{pillar.title}</h3>
                      <p className="mt-4 leading-relaxed text-white/50">{pillar.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Life at Alpha */}
        <section className="border-y border-white/10 py-24 md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07]">Life at Alpha</p>
                <h2 className="text-4xl font-medium uppercase leading-[0.92] tracking-tighter md:text-[4rem]">
                  People, product,
                  <br />
                  <span className="text-white/25">and momentum.</span>
                </h2>
              </div>
              <p className="max-w-xl leading-relaxed text-white/45">
                We work across design, engineering, operations, and growth — with direct exposure to the freight market we are trying to modernize.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {lifeGallery.map((item, index) => (
                <motion.div
                  key={item.src}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.55 }}
                  viewport={{ once: true }}
                  className={`group relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 ${item.className}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-24 text-black md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-14 max-w-3xl">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">Benefits</p>
              <h2 className="text-4xl font-medium uppercase leading-[0.92] tracking-tighter md:text-[4rem]">
                Support that matches
                <br />
                the pace of the work.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="rounded-[2rem] border border-black/10 bg-[#f7f7f4] p-7 transition-transform duration-300 hover:-translate-y-1"
                >
                  <benefit.icon className="mb-5 h-6 w-6 text-black/70" />
                  <h3 className="text-xl font-medium tracking-tight">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-black/50">{benefit.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Roles */}
        <section id="open-roles" className="scroll-mt-28 bg-[#f5f5f2] py-24 text-black md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Open Roles
                </div>
                <h2 className="max-w-3xl text-4xl font-medium uppercase leading-[0.92] tracking-tighter md:text-[4.2rem]">
                  Find the role that fits
                  <br />
                  your next chapter.
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {teamFilters.map((team) => {
                  const isActive = activeTeam === team;

                  return (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setActiveTeam(team)}
                      className={`rounded-full px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
                        isActive
                          ? "bg-black text-white shadow-[0_15px_40px_rgba(0,0,0,0.15)]"
                          : "border border-black/10 bg-white text-black/50 hover:text-black"
                      }`}
                    >
                      {team}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOpenings.map((role, index) => (
                  <motion.div
                    key={role.slug}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#f2f2ec] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">
                            {role.team}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/30">
                            {role.type}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/30">
                            {role.salary}
                          </span>
                        </div>
                        <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{role.title}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/50">{role.summary}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/50">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {role.location}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            Hiring now
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/career/${role.slug}`}
                        className="inline-flex h-fit items-center gap-2 self-start rounded-full bg-black px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#BFFF07] hover:text-black"
                      >
                        View role & apply
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Hiring Process */}
        <section className="border-t border-white/10 py-24 md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-14 max-w-3xl">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07]">Hiring process</p>
              <h2 className="text-4xl font-medium uppercase leading-[0.92] tracking-tighter md:text-[4rem]">
                Clear steps.
                <br />
                <span className="text-white/25">No mystery loops.</span>
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {hiringSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  viewport={{ once: true }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-xl md:p-8"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#BFFF07] text-sm font-black text-black">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{step.detail}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/5 p-8 md:flex md:items-center md:justify-between md:p-10">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 text-[#BFFF07]">
                  <Users className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">General applications</span>
                </div>
                <p className="text-lg leading-relaxed text-white/55">
                  Don&apos;t see the perfect role yet? Send us your profile anyway — we&apos;re always meeting strong operators, designers, and builders for upcoming teams.
                </p>
              </div>
              <Link
                href="/career/general-application"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black md:mt-0"
              >
                Submit general application
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Your next career move starts here"
        subtitle="Join Alpha Freight"
        buttonText="Apply Now"
        buttonHref="/career#open-roles"
      />
      <Footer />
    </div>
  );
}
