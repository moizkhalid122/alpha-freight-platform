"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  ArrowRight,
  Download,
  CheckCircle2,
  Clock,
  Globe,
  Star,
  Play,
  FileText,
  ScanText,
  WalletCards,
  BadgeDollarSign,
  Heart,
  BriefcaseBusiness,
  LayoutGrid
} from "lucide-react";
import Image from "next/image";

function AnimatedMetricsIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex h-5 w-5 items-end justify-center gap-[3px] ${className}`} aria-hidden="true">
      <motion.span
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="block w-[3px] rounded-full bg-current"
        style={{ height: "12px" }}
      />
      <motion.span
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.08 }}
        className="block w-[3px] rounded-full bg-current"
        style={{ height: "16px" }}
      />
      <motion.span
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.16 }}
        className="block w-[3px] rounded-full bg-current"
        style={{ height: "10px" }}
      />
    </div>
  );
}

export default function MobileAppPage() {
  const [activeTab, setActiveTab] = useState("Scheduling");
  const [activeFeature, setActiveFeature] = useState("save-time");

  const tabs = [
    { id: "Onboarding", label: "Onboarding", desc: "Get verified and start hauling in minutes with our streamlined digital onboarding." },
    { id: "Insights", label: "Insights", desc: "Access deep analytics and performance metrics to grow your logistics business." },
    { id: "Scheduling", label: "Scheduling", desc: "Create loads, assign carriers, and manage availability with full flexibility." },
  ];

  const countryFlags = [
    { src: "/GB.svg", alt: "United Kingdom" },
    { src: "/FR.svg", alt: "France" },
    { src: "/DE.svg", alt: "Germany" },
    { src: "/NL.svg", alt: "Netherlands" },
    { src: "/BR.svg", alt: "Brazil" },
    { src: "/PK.svg", alt: "Pakistan" },
    { src: "/AT.svg", alt: "Austria" },
  ];

  const workflowIcons = [
    Globe,
    MessageSquare,
    Smartphone,
    AnimatedMetricsIcon,
    ShieldCheck,
    Clock,
    MapPin,
    Zap,
  ];

  const reportingCategories = [
    { label: "Bills", icon: FileText, tone: "bg-[#F6D7A8] text-[#8A5A12]" },
    { label: "Cash", icon: BadgeDollarSign, tone: "bg-[#D8F0C8] text-[#4C7A21]" },
    { label: "Eating Out", icon: WalletCards, tone: "bg-[#D7E6FF] text-[#315B9C]" },
    { label: "Entertainment", icon: LayoutGrid, tone: "bg-[#D8F0F0] text-[#2E7D7D]" },
    { label: "Expenses", icon: BriefcaseBusiness, tone: "bg-[#E8E2FF] text-[#6150A5]" },
    { label: "Family", icon: Heart, tone: "bg-[#FFD8E5] text-[#B54572]" },
  ];

  const featurePanels = [
    {
      id: "save-time",
      title: "Save Time",
      description: "Automate repetitive tasks and reduce admin work with one streamlined mobile workflow.",
    },
    {
      id: "integrations",
      title: "Stay Organized Integrations",
      description: "Keep bookings, schedules, updates, and team actions connected across one operational system.",
    },
    {
      id: "grow-faster",
      title: "Grow Faster",
      description: "Scale daily operations with clearer visibility, quicker actions, and fewer handoff delays.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#BFFF07] selection:text-black font-sans">
      <Navbar variant="dark" />

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden border-b border-black/5 bg-white text-slate-900">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-y-0 left-1/4 w-px bg-black/20" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
          <div className="absolute inset-y-0 left-3/4 w-px bg-black/20" />
        </div>

        <div className="absolute left-[-8%] top-24 h-64 w-64 rounded-full bg-[#BFFF07]/10 blur-3xl" />
        <div className="absolute right-[-10%] top-16 h-[24rem] w-[24rem] rounded-full bg-slate-200/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-[1720px] items-center px-6 py-24 lg:px-12 lg:py-28">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[0.96fr_1.04fr]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-[40rem]"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.22)]">
                <Star className="h-3 w-3 fill-current" />
                Alpha Freight Mobile App
              </div>

              <h1 className="mt-7 max-w-[10ch] text-[3rem] font-medium leading-[0.94] tracking-[-0.06em] text-black sm:text-[4rem] md:text-[4.65rem] lg:text-[5.2rem]">
                Freight control
                <br />
                made mobile-first.
              </h1>

              <p className="mt-6 max-w-[36rem] text-[15px] font-medium leading-7 text-slate-600 md:text-[17px]">
                Manage loads, track drivers, approve updates, and keep suppliers and carriers moving from one polished command app.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.alphafreight.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-[22px] border border-slate-200 bg-white px-3 py-2 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.22)] transition hover:border-slate-300 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.28)]"
                >
                  <Image
                    src="/google-play-store-badge.png"
                    alt="Get it on Google Play"
                    width={170}
                    height={50}
                    className="h-auto w-[138px] sm:w-[150px]"
                  />
                </a>

                <div className="inline-flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.22)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[#BFFF07]/55 text-slate-900">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Built For</p>
                    <p className="mt-1 text-sm font-black tracking-tight text-slate-900">Carriers & Suppliers</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                  Live Dispatch
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Real-Time Tracking
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Faster Updates
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
              className="relative mx-auto flex w-full max-w-[760px] items-center justify-center"
            >
              <div className="relative flex min-h-[460px] w-full items-center justify-center px-6 py-6 sm:min-h-[560px]">
                <div className="absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/8 sm:h-[28rem] sm:w-[28rem]" />
                  <div className="absolute left-1/2 top-1/2 h-[15rem] w-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/6 sm:h-[20rem] sm:w-[20rem]" />
                  <div className="absolute left-1/2 top-1/2 h-[10rem] w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#BFFF07]/16 blur-3xl sm:h-[14rem] sm:w-[14rem]" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.95, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-[320px] sm:w-[385px] md:w-[450px] lg:w-[510px]"
                >
                  <Image
                    src="/alpha-freight-app-hero-2.png"
                    alt="Alpha Freight app hero screen"
                    width={510}
                    height={1050}
                    priority
                    className="h-auto w-full drop-shadow-[0_42px_90px_rgba(15,23,42,0.28)]"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -16, y: 16 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.42 }}
                  className="absolute bottom-[16%] left-[4%] rounded-[24px] border border-white/80 bg-white/92 px-3.5 py-3.5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-black text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dispatch Speed</p>
                      <p className="mt-1 text-[13px] font-black tracking-tight text-slate-900">Instant load actions</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 16, y: 16 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="absolute right-[5%] top-[18%] rounded-[24px] border border-white/80 bg-white/92 px-3.5 py-3.5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[#BFFF07]/55 text-slate-900">
                      <AnimatedMetricsIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Operational View</p>
                      <p className="mt-1 text-[13px] font-black tracking-tight text-slate-900">Track every shipment</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip Section */}
      <section className="relative bg-white pb-20 pt-10 text-slate-900">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto flex max-w-6xl flex-col items-center text-center"
          >
            <div className="flex w-full flex-wrap items-center justify-center gap-10 text-center text-sm font-bold tracking-tight text-slate-600 sm:gap-16 md:text-base">
              <div className="inline-flex items-center justify-center gap-4">
                <Image
                  src="/trust-icon-left.png"
                  alt="Decorative trust icon"
                  width={56}
                  height={56}
                  className="h-12 w-auto opacity-80"
                />
                <span className="text-center">Award Winning Theme</span>
                <Image
                  src="/trust-icon-right.png"
                  alt="Decorative trust icon"
                  width={56}
                  height={56}
                  className="h-12 w-auto opacity-80"
                />
              </div>
              <div className="inline-flex items-center justify-center gap-4">
                <Image
                  src="/trust-icon-left.png"
                  alt="Decorative trust icon"
                  width={56}
                  height={56}
                  className="h-12 w-auto opacity-80"
                />
                <span className="max-w-[22rem] text-center">Recognized for Excellence in Innovation</span>
                <Image
                  src="/trust-icon-right.png"
                  alt="Decorative trust icon"
                  width={56}
                  height={56}
                  className="h-12 w-auto opacity-80"
                />
              </div>
            </div>

            <p className="mt-8 text-sm font-medium text-slate-400 md:text-[15px]">
              Trusted by over 2,000 of the world&apos;s leading companies
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              {[
                "4.7 on TrustApp",
                "4.8 on Reviews",
                "4.7 on Google Store",
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 shadow-[0_20px_40px_-38px_rgba(15,23,42,0.16)]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                    <Star className="h-3.5 w-3.5 fill-current text-slate-500" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global Operations Section */}
      <section className="bg-white py-10 text-slate-900">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-34px_rgba(15,23,42,0.2)]">
              <Globe className="h-6 w-6 text-slate-900" />
            </div>
            <h2 className="mt-6 text-4xl font-medium tracking-tight text-black md:text-5xl">
              Achieve More with
              <br />
              Effortless Organization
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
              Work faster and smarter with a logistics interface built for focus, speed, and cross-border visibility.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[1280px] gap-4 lg:grid-cols-[1.05fr_1.25fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-7 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <ShieldCheck className="h-5 w-5 text-slate-900" />
                </div>
                <div className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  Popular
                </div>
              </div>

              <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-900">Fully Secured</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
                Your freight data and workflow approvals stay protected with enterprise-grade controls.
              </p>
              <div className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]">
                Get Early Access
              </div>

              <div className="relative mt-8 h-[320px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_center,_rgba(188,156,255,0.38)_0%,_rgba(188,156,255,0.24)_22%,_rgba(246,245,244,0)_58%)]">
                <Image
                  src="/alpha-freight-app-hero-2.png"
                  alt="Alpha Freight app preview"
                  fill
                  className="object-contain object-bottom scale-[0.92]"
                />
              </div>
            </motion.div>

            <div className="grid gap-4">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                whileHover={{ y: -6 }}
                className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-7 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
              >
                <div className="grid gap-6 md:grid-cols-[0.88fr_1.12fr] md:items-start">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                      <Globe className="h-5 w-5 text-slate-900" />
                    </div>
                    <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-900">International Reach</h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                      Coordinate dispatch, updates, and route intelligence across your markets from one polished control layer.
                    </p>
                    <div className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]">
                      View Markets
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {workflowIcons.map((Icon, index) => (
                      <div
                        key={index}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.18)] md:h-16 md:w-16"
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -6 }}
                  className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-6 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex max-w-[12rem] flex-wrap gap-2">
                      {countryFlags.map((flag) => (
                        <div
                          key={flag.src}
                          className="overflow-hidden rounded-[6px] border border-white/80 shadow-[0_10px_22px_-16px_rgba(15,23,42,0.35)]"
                        >
                          <Image
                            src={flag.src}
                            alt={flag.alt}
                            width={26}
                            height={18}
                            className="h-[18px] w-[26px] object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      New
                    </div>
                  </div>

                  <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-900">Easy Manager</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    Manage multi-country operations with a clearer overview of teams, shipments, and market coverage.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ y: -6 }}
                  className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-6 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                      <Zap className="h-5 w-5 text-slate-900" />
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      New
                    </div>
                  </div>

                  <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-900">Advanced Tools</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    Use operational tools built for faster actions, cleaner workflows, and better control on mobile.
                  </p>
                  <div className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]">
                    Get Early Access
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-4 grid max-w-[1280px] gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              whileHover={{ y: -6 }}
              className="grid gap-6 rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-7 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)] md:grid-cols-[0.9fr_1.1fr]"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <ScanText className="h-5 w-5 text-slate-900" />
                </div>
                <h3 className="mt-7 text-2xl font-black tracking-tight text-slate-900">Automated Reporting</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
                  Generate clear operational reports without lifting a finger, with mobile-ready oversight for every team.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]">
                  Get Early Access
                </div>
              </div>

              <div className="flex items-center">
                <div className="relative h-[210px] w-full overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.16)]">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/cta-bg.avif"
                    className="h-full w-full object-cover"
                  >
                    <source src="/uber.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/8 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                      <Play className="ml-1 h-6 w-6 fill-slate-900 text-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              whileHover={{ y: -6 }}
              className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-7 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
            >
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-bold text-slate-400">Pick a category</p>
                <div className="mt-5 space-y-3">
                  {reportingCategories.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${item.tone}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Productivity Split Section */}
      <section className="bg-white py-10 text-slate-900">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <div className="mx-auto grid max-w-[1280px] gap-4 lg:grid-cols-[1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[34px] border border-slate-200 bg-[#F6F5F4] p-6 md:p-8 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.28)]"
            >
              <div className="max-w-lg">
                <h3 className="text-[2rem] font-black leading-[1.02] tracking-tight text-slate-900 md:text-[2.45rem]">
                  Built to simplify daily operations effectively
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-500 md:text-base">
                  Discover how Alpha Mobile helps manage bookings, schedules, and logistics growth in one connected system.
                </p>
              </div>

              <div className="mt-10 space-y-3">
                {featurePanels.map((panel) => {
                  const isActive = activeFeature === panel.id;

                  return (
                    <motion.button
                      layout
                      key={panel.id}
                      type="button"
                      onClick={() =>
                        setActiveFeature((current) => (current === panel.id ? "" : panel.id))
                      }
                      transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
                      className={`w-full rounded-[22px] border px-5 py-5 text-left transition-all ${
                        isActive
                          ? "border-slate-200 bg-white shadow-[0_22px_44px_-36px_rgba(15,23,42,0.22)]"
                          : "border-slate-200/80 bg-white/65 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-black tracking-tight text-slate-900">{panel.title}</h4>
                          <AnimatePresence initial={false}>
                            {isActive ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <motion.p
                                  initial={{ y: -8 }}
                                  animate={{ y: 0 }}
                                  exit={{ y: -8 }}
                                  transition={{ duration: 0.24, ease: "easeOut" }}
                                  className="mt-3 max-w-md text-sm leading-6 text-slate-500"
                                >
                                  {panel.description}
                                </motion.p>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                        <motion.div
                          animate={{ rotate: isActive ? 180 : 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#F4F4F3] text-lg font-medium text-slate-500"
                        >
                          {isActive ? "-" : "+"}
                        </motion.div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.18)] md:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98)_0%,_rgba(255,255,255,0)_75%)]" />
              <div className="relative h-[420px] md:h-[520px]">
                <Image
                  src="/alpha-mobile-app-image.png"
                  alt="Alpha mobile app hand preview"
                  fill
                  className="object-contain object-bottom translate-y-6 md:translate-y-8"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-32 bg-white text-slate-900">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-20">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-slate-400 font-medium mb-4"
            >
              Key Benefits
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              Smarter <span className="font-black">Logistics Management</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI-Powered Prioritization - Card 1 (Text Top, Image Bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#F8F9FA] rounded-[48px] pt-12 px-10 overflow-hidden flex flex-col items-start text-left border border-slate-100 h-[450px]"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-3">AI-Powered Prioritization</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                  Automatically surfaces what matters most based on deadlines and patterns.
                </p>
              </div>
              <div className="relative w-full h-[350px] mt-auto translate-y-[20%]">
                <Image 
                  src="/alpha-freight-mobile-app-1.png" 
                  alt="AI Matching" 
                  fill
                  className="object-contain object-top"
                />
              </div>
            </motion.div>

            {/* Unified Calendar - Card 2 (Image Top, Text Bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#F8F9FA] rounded-[48px] pb-12 px-10 overflow-hidden flex flex-col items-start text-left border border-slate-100 h-[450px]"
            >
              <div className="relative w-full h-[350px] mb-auto -translate-y-[20%]">
                <Image 
                  src="/alpha-freight-mobile-app-3.png" 
                  alt="Unified Control" 
                  fill
                  className="object-contain object-bottom"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-3">Unified Control</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                  Tasks and events live together in one clean timeline.
                </p>
              </div>
            </motion.div>

            {/* Smart Reminders - Card 3 (Text Top, Image Bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[#F8F9FA] rounded-[48px] pt-12 px-10 overflow-hidden flex flex-col items-start text-left border border-slate-100 h-[450px]"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-3">Smart Reminders</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                  Reminders adjust intelligently to your schedule and behavior.
                </p>
              </div>
              <div className="relative w-full h-[350px] mt-auto translate-y-[20%]">
                <Image 
                  src="/alpha-freight-mobile-app.png" 
                  alt="Smart Notifications" 
                  fill
                  className="object-contain object-top"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Deep-Dive Section */}
      <section className="py-32 bg-[#F8F9FA] text-slate-900 border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            {/* Pill Switcher */}
            <div className="inline-flex p-1.5 bg-slate-200/50 rounded-full mb-12">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? "bg-black text-white shadow-lg" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dynamic Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mb-16"
              >
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
                  {tabs.find(t => t.id === activeTab)?.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Large Mockup Showcase */}
            <div className="relative w-full max-w-2xl mx-auto h-[500px] md:h-[700px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex justify-center"
                >
                  <div className="relative w-full max-w-[380px] drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)]">
                    <Image 
                      src={
                        activeTab === "Onboarding" ? "/alpha-freight-mobile-app-1.png" :
                        activeTab === "Insights" ? "/alpha-freight-mobile-app.png" :
                        "/alpha-freight-mobile-app-3.png"
                      }
                      alt={activeTab}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-white/5 rounded-[40px] border border-white/5">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="text-xl font-bold mb-4">Global Reach</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                Connect with partners across the UK and Europe with automated customs and document handling.
              </p>
            </div>

            <div className="p-10 bg-white/5 rounded-[40px] border border-white/5">
              <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="text-xl font-bold mb-4">Secured Platform</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                End-to-end encryption and verified partner network ensure your business data is always safe.
              </p>
            </div>

            <div className="p-10 bg-white/5 rounded-[40px] border border-white/5">
              <div className="w-12 h-12 bg-[#BFFF07]/20 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-[#BFFF07]" />
              </div>
              <h4 className="text-xl font-bold mb-4">Direct Chat</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                Integrated messaging system to resolve issues and coordinate logistics in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#BFFF07] to-white rounded-[60px] p-20 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-black text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              READY TO SHIP?
            </h2>
            <p className="text-black/60 text-lg font-medium mb-12 max-w-2xl mx-auto">
              Download the Alpha Freight Mobile App today and experience the future of logistics.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button className="px-12 py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                Get for iOS
              </button>
              <button className="px-12 py-6 bg-white text-black border border-black/10 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                Get for Android
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
