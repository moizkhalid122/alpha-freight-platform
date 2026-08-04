"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Clock,
  Quote,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const categories = ["All", "Suppliers", "Carriers", "Industrial"] as const;
type Category = (typeof categories)[number];

type SuccessStory = {
  id: string;
  category: Exclude<Category, "All">;
  company: string;
  logo: string;
  headline: string;
  summary: string;
  quote: string;
  author: string;
  role: string;
  image: string;
  metrics: { label: string; value: string }[];
  featured?: boolean;
};

const stories: SuccessStory[] = [
  {
    id: "beck-pollitzer",
    category: "Industrial",
    company: "Beck & Pollitzer",
    logo: "/Beck & Pollitzer.png",
    headline: "Complex industrial moves with clearer carrier control",
    summary:
      "Beck & Pollitzer needed tighter visibility over specialist haulage and faster confirmation on high-value equipment moves. Alpha Freight reduced manual coordination and improved assignment confidence across active lanes.",
    quote:
      "We moved from chasing updates on calls to seeing ranked carriers, live status, and POD in one place. That alone changed how fast we commit to customers.",
    author: "Operations leadership",
    role: "Industrial logistics team",
    image: "/service-detail-1.jpg",
    metrics: [
      { label: "Faster assignment", value: "38%" },
      { label: "Admin time saved", value: "22 hrs/wk" },
      { label: "On-time delivery", value: "96%" },
    ],
    featured: true,
  },
  {
    id: "ws-transportation",
    category: "Carriers",
    company: "WS Transportation",
    logo: "/WS Transportation.png",
    headline: "More profitable lanes for a specialist fleet",
    summary:
      "WS Transportation used smart matching to focus on high & heavy freight that fit their fleet profile instead of scrolling generic load boards with poor lane fit.",
    quote:
      "The platform surfaces loads that actually match our equipment and operating regions. We spend less time bidding blind and more time moving.",
    author: "Fleet operations",
    role: "WS Transportation",
    image: "/service-detail-2.avif",
    metrics: [
      { label: "Deadhead reduction", value: "19%" },
      { label: "Bid win rate", value: "+24%" },
      { label: "Weekly accepted loads", value: "31" },
    ],
  },
  {
    id: "british-steel",
    category: "Suppliers",
    company: "British Steel",
    logo: "/British Steel.png",
    headline: "Supplier desk visibility from post to POD",
    summary:
      "British Steel's logistics team consolidated load posting, bid review, and delivery confirmation into one supplier workflow — cutting back-and-forth with carriers on every movement.",
    quote:
      "Alpha gave our team one command view for posted loads, accepted bids, and proof of delivery. It feels like a modern control tower, not a load board.",
    author: "Logistics coordinator",
    role: "British Steel",
    image: "/alpha-freight-container-2.avif",
    metrics: [
      { label: "Loads managed monthly", value: "180+" },
      { label: "Bid review time", value: "-41%" },
      { label: "Dispute reduction", value: "27%" },
    ],
  },
  {
    id: "jmd-haulage",
    category: "Carriers",
    company: "JMD Haulage Contractors",
    logo: "/JMD Haulage Contractors.png",
    headline: "Family-run haulier scales without extra overhead",
    summary:
      "JMD Haulage grew container movements across the UK by using Alpha's marketplace to find consistent lane fit while keeping a small operations team in control.",
    quote:
      "We kept our family-run feel but gained enterprise-level visibility. Drivers get clearer jobs and we get paid faster with digital POD.",
    author: "Operations manager",
    role: "JMD Haulage Contractors",
    image: "/alpha-freight-truck-2.avif",
    metrics: [
      { label: "Monthly load volume", value: "+46%" },
      { label: "POD turnaround", value: "Same day" },
      { label: "Carrier rating", value: "4.9/5" },
    ],
  },
  {
    id: "wt-transport",
    category: "Carriers",
    company: "WT TRANSPORT",
    logo: "/WT TRANSPORT.png",
    headline: "Pallet network operator wins better-fit freight",
    summary:
      "WT TRANSPORT combined warehousing and haulage operations with Alpha matching to reduce empty legs and improve utilisation across Northampton and UK-wide lanes.",
    quote:
      "Smart ranking helped us stop wasting dispatch time on loads that were never right for our fleet. The quality of opportunities is noticeably higher.",
    author: "Dispatch team",
    role: "WT TRANSPORT",
    image: "/service-detail-3.avif",
    metrics: [
      { label: "Fleet utilisation", value: "+17%" },
      { label: "Empty miles", value: "-14%" },
      { label: "Active lanes", value: "UK-wide" },
    ],
  },
  {
    id: "barrett-steel",
    category: "Suppliers",
    company: "Barrett Steel",
    logo: "/Barrett Steel.png",
    headline: "Steel distribution with faster carrier confirmation",
    summary:
      "Barrett Steel reduced time-to-assign on time-sensitive steel movements by routing freight to verified carriers with stronger lane and equipment fit scores.",
    quote:
      "When capacity gets tight, we need the right carrier quickly. Alpha's ranking and bid workflow gives us that without losing control on rates.",
    author: "Transport planning",
    role: "Barrett Steel",
    image: "/service-detail-4.avif",
    metrics: [
      { label: "Assignment speed", value: "3.2x" },
      { label: "Verified carriers used", value: "100%" },
      { label: "Live tracking adoption", value: "92%" },
    ],
  },
];

const impactStats = [
  { label: "Businesses on platform", value: "1,200+", icon: Truck },
  { label: "Average assignment uplift", value: "3.1x", icon: TrendingUp },
  { label: "Deadhead reduction", value: "18%", icon: TrendingDown },
  { label: "Support response", value: "<2 hrs", icon: Clock },
];

export default function SuccessStoriesPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const featuredStory = stories.find((story) => story.featured) ?? stories[0];

  const filteredStories = useMemo(() => {
    const list = stories.filter((story) => !story.featured);
    if (activeCategory === "All") return list;
    const map: Record<Exclude<Category, "All">, SuccessStory["category"]> = {
      Suppliers: "Suppliers",
      Carriers: "Carriers",
      Industrial: "Industrial",
    };
    return list.filter((story) => story.category === map[activeCategory]);
  }, [activeCategory]);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".story-hero-item", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power4.out",
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
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-16 sm:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.14),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="story-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-600">
              Success Stories
            </p>
            <h1 className="story-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.45rem] lg:leading-[1.06]">
              Real results from the Alpha Freight network
            </h1>
            <p className="story-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              See how suppliers, carriers, and industrial operators use Alpha Freight to move faster,
              reduce empty miles, and run freight with more confidence.
            </p>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-16">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-6 sm:grid-cols-4 lg:px-10">
            {impactStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50 px-5 py-6 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mb-8 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#7da600]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Featured story
              </p>
            </div>

            <article className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-50 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[320px] lg:min-h-full">
                  <Image
                    src={featuredStory.image}
                    alt={featuredStory.company}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 700px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/10" />
                </div>

                <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                  <div className="relative mb-6 h-12 w-40">
                    <Image
                      src={featuredStory.logo}
                      alt={featuredStory.company}
                      fill
                      className="object-contain object-left"
                      sizes="160px"
                    />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {featuredStory.category}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    {featuredStory.headline}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-600">{featuredStory.summary}</p>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {featuredStory.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl bg-white px-3 py-4 text-center ring-1 ring-slate-200/80">
                        <p className="text-xl font-bold text-slate-900">{metric.value}</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <blockquote className="mt-8 border-l-2 border-[#BFFF07] pl-4">
                    <Quote className="mb-2 h-4 w-4 text-slate-300" />
                    <p className="text-sm italic leading-relaxed text-slate-600">{featuredStory.quote}</p>
                    <footer className="mt-3 text-sm font-semibold text-slate-900">
                      {featuredStory.author}
                      <span className="font-normal text-slate-500"> · {featuredStory.role}</span>
                    </footer>
                  </blockquote>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="story-reveal-grid bg-[#F8FAFC] py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-600">
                  Customer stories
                </p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                  Outcomes across the marketplace
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <motion.div layout className="mt-12 grid gap-6 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredStories.map((story) => (
                  <motion.article
                    key={story.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
                  >
                    <div className="relative h-52">
                      <Image
                        src={story.image}
                        alt={story.company}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 680px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                        <div className="relative h-10 w-32 rounded-lg bg-white/95 px-2 py-1.5">
                          <Image
                            src={story.logo}
                            alt={story.company}
                            fill
                            className="object-contain p-1"
                            sizes="128px"
                          />
                        </div>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                          {story.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900">{story.headline}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{story.summary}</p>

                      <div className="mt-6 grid grid-cols-3 gap-2">
                        {story.metrics.map((metric) => (
                          <div
                            key={`${story.id}-${metric.label}`}
                            className="rounded-xl bg-slate-50 px-2 py-3 text-center"
                          >
                            <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
                              {metric.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-6 border-t border-slate-100 pt-5 text-sm italic leading-relaxed text-slate-600">
                        “{story.quote}”
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {story.author}
                        <span className="font-normal text-slate-500"> · {story.role}</span>
                      </p>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-24">
          <div className="mx-auto max-w-[1400px] px-6 text-center lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Trusted across UK freight
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Join operators already winning on Alpha
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Whether you post loads or run fleets, Alpha Freight helps teams move with clearer
              matching, stronger visibility, and less operational friction.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Browse directory
              </Link>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Write your success story with Alpha"
          subtitle="Start posting loads or accepting freight on the UK's smarter marketplace."
          buttonText="Get started"
          buttonHref="/auth/signup"
        />
      </main>

      <Footer />
    </div>
  );
}
