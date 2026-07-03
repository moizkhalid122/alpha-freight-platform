"use client";

import Navbar from "@/components/Navbar";
import { Footer, CinematicCTA } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Loader2,
  Navigation,
  Search,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

type PublicLoad = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  equipment: string;
  pickupDate: string | null;
  commodity: string;
  status: string | null;
  createdAt: string | null;
};

type PublicLoadsResponse = {
  loads: PublicLoad[];
  stats: {
    total: number;
    avgRatePerMile: number | null;
  };
};

const marketplaceFeatures = [
  {
    title: "Instant Bidding",
    desc: "Submit competitive bids in seconds. Transparent pricing keeps market rates fair for carriers and shippers.",
    icon: Zap,
    image: "/service-detail-1.jpg",
  },
  {
    title: "Smart Matching",
    desc: "Loads surface by equipment, lane history, and capacity so your fleet spends less time deadheading.",
    icon: Activity,
    image: "/service-detail-2.avif",
  },
  {
    title: "Verified Shippers",
    desc: "Work with vetted suppliers, clear payment routes, and POD workflows built for UK freight.",
    icon: ShieldCheck,
    image: "/service-detail-3.avif",
  },
];

function getCity(value: string) {
  return value.split(",")[0]?.trim() || value;
}

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatPickup(value: string | null) {
  if (!value) return "Pickup TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function estimateDistance(load: PublicLoad) {
  const miles = 80 + (load.id.charCodeAt(0) % 220);
  return `${miles} miles`;
}

async function fetchPublicLoads(): Promise<PublicLoadsResponse> {
  const response = await fetch("/api/public/loads", { credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load marketplace data.");
  }
  return payload as PublicLoadsResponse;
}

export default function AvailableLoadsLandingPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loads, setLoads] = useState<PublicLoad[]>([]);
  const [stats, setStats] = useState<{ total: number; avgRatePerMile: number | null }>({
    total: 0,
    avgRatePerMile: null,
  });
  const [loadsLoading, setLoadsLoading] = useState(true);
  const [loadsError, setLoadsError] = useState(false);

  const loadMarketplace = async () => {
    setLoadsLoading(true);
    setLoadsError(false);
    try {
      const response = await fetchPublicLoads();
      setLoads(response.loads);
      setStats(response.stats);
    } catch {
      setLoadsError(true);
    } finally {
      setLoadsLoading(false);
    }
  };

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  const filteredLoads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return loads;
    return loads.filter((load) => {
      const haystack = [
        load.code,
        load.origin,
        load.destination,
        load.equipment,
        load.commodity,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [loads, searchQuery]);

  useEffect(() => {
    void loadMarketplace();
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".loads-hero-item", {
        y: 48,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power4.out",
      });

      gsap.from(".loads-feature-card", {
        scrollTrigger: {
          trigger: ".loads-features-grid",
          start: "top 78%",
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from(".loads-market-card", {
        scrollTrigger: {
          trigger: ".loads-market-grid",
          start: "top 82%",
        },
        y: 40,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const scrollToMarketplace = () => {
    document.getElementById("marketplace-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen overflow-x-hidden bg-black font-sans selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar />

      <main>
        <section
          ref={heroRef}
          className="relative flex min-h-[100svh] items-center border-b border-white/5 pt-24"
        >
          <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
            <Image
              src="/alpha-box.jpg"
              alt="Alpha Freight warehouse operations"
              fill
              priority
              className="object-cover opacity-55 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </motion.div>

          <motion.div
            style={{ opacity: heroOpacity }}
            className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-16 pt-8 lg:px-10"
          >
            <div className="max-w-3xl space-y-8">
              <div className="loads-hero-item inline-flex items-center gap-3 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#BFFF07]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#BFFF07]">
                  Marketplace Live
                </span>
              </div>

              <h1 className="loads-hero-item text-5xl font-bold uppercase leading-[0.92] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Available <br />
                <span className="text-[#BFFF07]">Loads.</span>
              </h1>

              <p className="loads-hero-item max-w-2xl text-base font-medium leading-relaxed text-white/55 sm:text-xl">
                The UK freight marketplace for verified carriers. Browse live lanes, place bids, and
                get paid with Alpha Freight&apos;s carrier workflow.
              </p>

              <div className="loads-hero-item flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={scrollToMarketplace}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#BFFF07] px-8 text-sm font-bold uppercase tracking-wide text-black transition-transform hover:scale-[1.02]"
                >
                  Explore Loads
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="inline-flex h-14 items-center gap-6 rounded-full border border-white/10 bg-black/30 px-6 backdrop-blur-md">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Active Loads
                    </p>
                    <p className="text-xl font-bold tracking-tight text-white">
                      {loadsLoading ? "—" : `${stats.total}${stats.total > 0 ? "+" : ""}`}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Market Rate
                    </p>
                    <p className="text-xl font-bold tracking-tight text-[#BFFF07]">
                      {stats.avgRatePerMile ? `£${stats.avgRatePerMile.toFixed(2)}/mi` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="loads-features-grid mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {marketplaceFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="loads-feature-card group relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/8"
                >
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover opacity-35 grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
                  <div className="relative flex h-full flex-col justify-end gap-4 p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-3xl font-bold uppercase tracking-tight text-white">
                      {feature.title}
                    </h3>
                    <p className="max-w-sm text-sm leading-relaxed text-white/60">{feature.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="marketplace-section" className="rounded-t-[3rem] bg-[#F8FAFC] py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/10 px-4 py-2">
                  <Activity className="h-4 w-4 text-[#7da600]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5f7f00]">
                    Live Feed
                  </span>
                </div>
                <h2 className="text-4xl font-bold uppercase leading-[0.95] tracking-tight text-slate-900 sm:text-6xl">
                  Real-time <br />
                  <span className="text-[#7da600]">Opportunities.</span>
                </h2>
              </div>

              <div className="w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by origin, lane, or load ID…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-14 w-full rounded-full border border-slate-200 bg-white pl-14 pr-5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            {loadsLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-slate-200 bg-white py-20 text-sm font-medium text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#7da600]" />
                Loading live marketplace loads…
              </div>
            ) : null}

            {loadsError ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-red-700">Could not load marketplace data.</p>
                <button
                  type="button"
                  onClick={() => void loadMarketplace()}
                  className="mt-4 text-sm font-bold uppercase tracking-wide text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {!loadsLoading && !loadsError && filteredLoads.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center">
                <p className="text-lg font-bold text-slate-900">No loads match your search right now.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Register as a carrier to get notified when new lanes go live.
                </p>
                <Link
                  href="/auth/signup"
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold uppercase tracking-wide text-white"
                >
                  Register as carrier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}

            {!loadsLoading && !loadsError && filteredLoads.length > 0 ? (
              <div className="loads-market-grid grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredLoads.slice(0, 8).map((load) => (
                  <article
                    key={load.id}
                    className="loads-market-card rounded-[2rem] border border-slate-200 bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7da600]">
                          {load.code}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight text-slate-900">
                          {getCity(load.origin)}{" "}
                          <span className="mx-1 text-slate-300">→</span> {getCity(load.destination)}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{load.commodity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Rate
                        </p>
                        <p className="text-3xl font-bold tracking-tight text-slate-900">
                          {formatMoney(load.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Truck className="h-4 w-4 text-[#7da600]" />
                        {load.equipment}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Navigation className="h-4 w-4 text-[#7da600]" />
                        {estimateDistance(load)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {formatPickup(load.pickupDate)}
                      </span>
                    </div>

                    <Link
                      href="/auth/login?next=/carrier/available-loads"
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#7da600]"
                    >
                      Place Bid
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="mt-14 text-center">
              <Link
                href="/auth/login?next=/carrier/available-loads"
                className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-slate-900 transition hover:text-[#7da600]"
              >
                View full carrier marketplace
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-black px-6 py-24 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="space-y-10">
              <h2 className="text-4xl font-bold uppercase leading-[0.92] tracking-tight text-white sm:text-6xl">
                UK&apos;s growing <br />
                <span className="text-[#BFFF07]">carrier network.</span>
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">5,000+</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    Verified carriers
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {stats.total > 0 ? `${stats.total}+` : "Live"}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    Open loads today
                  </p>
                </div>
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex h-14 items-center rounded-full border border-white/15 px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
              >
                Join the network
              </Link>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-[2.5rem] border border-white/8 lg:min-h-[480px]">
              <Image
                src="/alpha-freight-truck-2.avif"
                alt="Alpha Freight carrier network"
                fill
                className="object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-[#BFFF07]/10" />
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Start operating today"
          subtitle="Create your carrier account, verify your profile, and bid on live UK freight lanes."
          buttonText="Register now"
        />
      </main>

      <Footer />
    </div>
  );
}
