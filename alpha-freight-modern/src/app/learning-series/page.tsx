"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Clock,
  Play,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const YOUTUBE_CHANNEL = "https://www.youtube.com/@alphafreightsolutionslimited";
const YOUTUBE_SUBSCRIBE = `${YOUTUBE_CHANNEL}?sub_confirmation=1`;

const topics = ["All", "Platform", "Carriers", "Suppliers", "Compliance", "Technology"] as const;
type Topic = (typeof topics)[number];

type Episode = {
  id: string;
  episode: number;
  title: string;
  subtitle: string;
  description: string;
  topic: Exclude<Topic, "All">;
  youtubeId: string;
  thumbnail: string;
  duration: string;
  featured?: boolean;
  new?: boolean;
};

const episodes: Episode[] = [
  {
    id: "what-is-alpha-freight",
    episode: 1,
    title: "What is Alpha Freight?",
    subtitle: "The Future of UK Logistics Explained",
    description:
      "Episode 1 breaks down what Alpha Freight is, how our UK logistics platform connects verified carriers with shippers, and why AI-powered load matching is changing freight operations.",
    topic: "Platform",
    youtubeId: "m3YctLUwdvM",
    thumbnail: "/thumbnail.png",
    duration: "3:17",
    featured: true,
    new: true,
  },
];

const learnPoints = [
  {
    icon: Truck,
    title: "Carrier workflows",
    desc: "Find loads, bid smarter, track deliveries, and get paid faster.",
  },
  {
    icon: Users,
    title: "Supplier workflows",
    desc: "Post freight, review carriers, monitor shipments, and confirm POD.",
  },
  {
    icon: BookOpen,
    title: "UK freight basics",
    desc: "Compliance, safety, and best practices explained in plain English.",
  },
  {
    icon: Sparkles,
    title: "Platform mastery",
    desc: "Step-by-step guides to get more from the Alpha Freight app.",
  },
];

export default function LearningSeriesPage() {
  useMarketingSmoothScroll();

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [activeTopic, setActiveTopic] = useState<Topic>("All");
  const [activeEpisode, setActiveEpisode] = useState<Episode>(episodes[0]);

  const filteredEpisodes = useMemo(() => {
    if (activeTopic === "All") return episodes;
    return episodes.filter((episode) => episode.topic === activeTopic);
  }, [activeTopic]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".ls-hero-line", {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from(".ls-stat", {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f4f1] text-[#111] selection:bg-[#FFD400] selection:text-black">
      <Navbar variant="dark" />

      <main ref={heroRef} className="pt-24 md:pt-28">
        {/* Hero — black + white split */}
        <section className="relative overflow-hidden bg-black text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,212,0,0.18),transparent_35%)]" />
          <div className="absolute -right-20 top-0 h-[520px] w-[520px] rounded-full bg-[#FFD400]/10 blur-[120px]" />

          <div className="relative mx-auto grid max-w-[1800px] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center px-5 py-16 md:px-6 md:py-24 lg:px-12 lg:py-28">
              <div className="ls-hero-line mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFD400]">
                <Star className="h-4 w-4 fill-[#FFD400]" />
                <span>Learning Series</span>
              </div>

              <h1 className="ls-hero-line text-[2.8rem] font-medium uppercase leading-[0.9] tracking-tighter sm:text-[4.2rem] md:text-[5rem] lg:text-[5.8rem]">
                What Is
                <br />
                <span className="text-[#FFD400]">Alpha Freight?</span>
              </h1>

              <p className="ls-hero-line mt-6 max-w-xl text-base font-medium leading-relaxed text-white/65 md:text-lg">
                Free video lessons on UK logistics, carriers, suppliers, and the Alpha Freight
                platform. Watch Episode 1 now — new episodes every week on YouTube.
              </p>

              <div className="ls-hero-line mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("featured-player")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-3 rounded-full bg-[#FFD400] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-black transition hover:bg-white"
                >
                  <Play className="h-4 w-4 fill-black" />
                  Watch Episode 1
                </button>
                <Link
                  href={YOUTUBE_SUBSCRIBE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  <Image
                    src="/youtube logo.png"
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] object-contain"
                  />
                  Subscribe
                </Link>
              </div>
            </div>

            <div className="ls-hero-line relative min-h-[360px] lg:min-h-[620px]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.85),rgba(0,0,0,0.2))] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.95),transparent)]" />
              <Image
                src="/thumbnail.png"
                alt="What is Alpha Freight — UK Logistics Explained"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />

              <div className="absolute bottom-6 left-5 right-5 md:bottom-10 md:left-10 md:right-10">
                <div className="rounded-[1.75rem] border border-white/15 bg-black/55 p-5 backdrop-blur-xl md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFD400]">
                    Episode 01 — Now Live
                  </p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight text-white md:text-2xl">
                    The Future of UK Logistics Explained
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      3:17
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Play className="h-3.5 w-3.5" />
                      Platform
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip — white */}
        <section ref={statsRef} className="border-b border-black/8 bg-white">
          <div className="mx-auto grid max-w-[1800px] grid-cols-2 gap-px bg-black/8 md:grid-cols-4">
            {[
              { label: "Episodes", value: "01" },
              { label: "Focus", value: "UK Freight" },
              { label: "Format", value: "YouTube" },
              { label: "New lessons", value: "Weekly" },
            ].map((stat) => (
              <div key={stat.label} className="ls-stat bg-white px-6 py-8 md:px-10 md:py-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-medium uppercase tracking-tight text-black md:text-4xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured player — white section */}
        <section id="featured-player" className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1800px] px-5 md:px-6 lg:px-12">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/45">
                  Featured Episode
                </p>
                <h2 className="mt-3 text-3xl font-medium uppercase tracking-tight text-black md:text-5xl">
                  Watch & Learn
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-black/55 md:text-base">
                Our Learning Series breaks down UK freight in clear, practical episodes — starting
                with what Alpha Freight is and how the platform works.
              </p>
            </div>

            <div className="grid gap-8 xl:grid-cols-[1.45fr_0.85fr]">
              <motion.div
                layout
                className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#f8f8f6] shadow-[0_30px_80px_rgba(15,23,42,0.08)]"
              >
                <div className="border-b border-black/8 px-5 py-5 md:px-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c99700]">
                        Episode {activeEpisode.episode}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-black md:text-2xl">
                        {activeEpisode.title}
                      </h3>
                      <p className="mt-1 text-sm text-black/50">{activeEpisode.subtitle}</p>
                    </div>
                    <span className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                      {activeEpisode.topic}
                    </span>
                  </div>
                </div>

                <div className="aspect-video bg-black">
                  <iframe
                    title={activeEpisode.title}
                    src={`https://www.youtube.com/embed/${activeEpisode.youtubeId}?rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>

                <div className="space-y-5 px-5 py-6 md:px-7 md:py-7">
                  <p className="text-sm leading-relaxed text-black/65 md:text-base">
                    {activeEpisode.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/55">
                      <Clock className="h-3.5 w-3.5" />
                      {activeEpisode.duration}
                    </span>
                    <Link
                      href={`https://youtu.be/${activeEpisode.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:text-[#c99700]"
                    >
                      Open on YouTube
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                  <div className="relative h-44">
                    <Image
                      src="/thumbnail.png"
                      alt=""
                      fill
                      sizes="400px"
                      className="object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FFD400]">
                        Official Channel
                      </p>
                      <p className="mt-1 text-lg font-semibold">@alphafreightsolutionslimited</p>
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <p className="text-sm leading-relaxed text-white/70">
                      Subscribe for new episodes on carriers, suppliers, compliance, and platform
                      walkthroughs.
                    </p>
                    <Link
                      href={YOUTUBE_SUBSCRIBE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#FFD400] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-white"
                    >
                      <Bell className="h-4 w-4" />
                      Subscribe on YouTube
                    </Link>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
                    What you will learn
                  </p>
                  <div className="mt-5 space-y-4">
                    {learnPoints.map((point) => (
                      <div key={point.title} className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111] text-[#FFD400]">
                          <point.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-black">{point.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-black/55">{point.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Episodes grid — light grey */}
        <section className="border-t border-black/8 bg-[#f4f4f1] py-16 md:py-24">
          <div className="mx-auto max-w-[1800px] px-5 md:px-6 lg:px-12">
            <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/45">
                  All Episodes
                </p>
                <h2 className="mt-3 text-3xl font-medium uppercase tracking-tight text-black md:text-5xl">
                  The Series
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setActiveTopic(topic)}
                    className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                      activeTopic === topic
                        ? "bg-black text-white"
                        : "border border-black/10 bg-white text-black/55 hover:border-black/20 hover:text-black"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeTopic}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
              >
                {filteredEpisodes.map((episode) => (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => {
                      setActiveEpisode(episode);
                      document.getElementById("featured-player")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`group overflow-hidden rounded-[1.75rem] border text-left transition duration-300 ${
                      activeEpisode.id === episode.id
                        ? "border-black bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
                        : "border-black/10 bg-white hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                    }`}
                  >
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <Image
                        src={episode.thumbnail}
                        alt={episode.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD400] text-black shadow-xl">
                          <Play className="h-6 w-6 fill-black" />
                        </span>
                      </div>
                      {episode.new ? (
                        <span className="absolute left-4 top-4 rounded-full bg-[#FFD400] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                          New
                        </span>
                      ) : null}
                      <span className="absolute bottom-4 right-4 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                        {episode.duration}
                      </span>
                    </div>

                    <div className="space-y-3 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c99700]">
                          Episode {String(episode.episode).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
                          {episode.topic}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold leading-snug text-black">
                        {episode.title}
                      </h3>
                      <p className="text-sm font-medium text-black/45">{episode.subtitle}</p>
                      <p className="line-clamp-2 text-sm leading-relaxed text-black/55">
                        {episode.description}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredEpisodes.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-black/15 bg-white px-6 py-16 text-center">
                <p className="text-xl font-semibold text-black">More episodes coming soon</p>
                <p className="mt-2 text-sm text-black/55">
                  Subscribe on YouTube to get notified when the next lesson drops.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Dark band */}
        <section className="bg-black py-16 text-white md:py-20">
          <div className="mx-auto flex max-w-[1800px] flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center md:px-6 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFD400]">
                Alpha Freight Learning Series
              </p>
              <h2 className="mt-4 text-3xl font-medium uppercase tracking-tight md:text-5xl">
                UK logistics, explained properly.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
                From platform walkthroughs to carrier and supplier tips — learn freight the modern
                way with Alpha Freight.
              </p>
            </div>
            <Link
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#FFD400]"
            >
              View YouTube Channel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <CinematicCTA
          title="Start Learning Today"
          subtitle="New episodes every week on YouTube"
          buttonText="Watch Episode 1"
          buttonHref={`https://youtu.be/${episodes[0].youtubeId}`}
        />
      </main>

      <Footer />
    </div>
  );
}
