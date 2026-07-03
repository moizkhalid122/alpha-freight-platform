"use client";

import Navbar from "@/components/Navbar";
import Counter from "@/components/Counter";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

import { Footer, CinematicCTA } from "@/components/Footer";

const steps = [
  {
    id: "01",
    role: "SUPPLIER",
    title: "Post Your Load",
    desc: "Suppliers can easily post their freight requirements, specifying cargo details, pickup location, and delivery deadlines.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    image: "/service-detail-1.jpg"
  },
  {
    id: "02",
    role: "CARRIER",
    title: "Bid on Opportunities",
    desc: "Verified carriers browse the marketplace and submit competitive bids for loads that match their route and capacity.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    image: "/service-detail-2.avif"
  },
  {
    id: "03",
    role: "SUPPLIER",
    title: "Award & Connect",
    desc: "Suppliers review carrier profiles, ratings, and bids to award the load to the best-fit partner for the job.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    image: "/service-detail-3.avif"
  },
  {
    id: "04",
    role: "SYSTEM",
    title: "Real-Time Tracking",
    desc: "Once awarded, our system provides real-time GPS tracking and live status updates from pickup to final delivery.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    image: "/service-detail-4.avif"
  }
];

export default function SolutionPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />
      
      <main ref={containerRef}>
        {/* Hero Section */}
        <section className="relative h-screen w-full flex flex-col justify-end overflow-hidden border-b border-white/5">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            >
              <source src="/alpha-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>

          <motion.div 
            style={{ opacity: heroOpacity }}
            className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full pb-20"
          >
            <div className="flex flex-col md:flex-row items-end justify-between gap-12">
              {/* Left Side: Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl text-left"
              >
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] mb-8">
                  <span>+ THE MARKETPLACE</span>
                </div>
                
                <h1 className="text-6xl md:text-[7rem] font-medium text-white leading-[0.9] tracking-tighter mb-8 uppercase">
                  BRIDGE THE <br />
                  <span className="text-white/20">LOGISTICS GAP.</span>
                </h1>
                
                <p className="text-white/40 text-lg md:text-xl max-w-xl font-light leading-relaxed">
                  Connecting Suppliers with the UK's most reliable Carriers through an intelligent, transparent, and high-performance marketplace.
                </p>
              </motion.div>

              {/* Right Side: Actions */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col gap-4 min-w-[280px]"
              >
                <div className="flex items-center space-x-3 mb-4 text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF07] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">System Online</span>
                </div>
                
                <Link
                  href="/auth/supplier-signup"
                  className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-widest rounded-xl overflow-hidden transition-all hover:bg-[#BFFF07] hover:text-black text-center"
                >
                  Post a Load
                </Link>
                <Link
                  href="/auth/carrier-signup"
                  className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#BFFF07] transition-all text-center"
                >
                  Become a Carrier
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom Decorative Line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </section>

        {/* Core Marketplace Statistics */}
        <section className="py-32 bg-white relative z-10">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center space-y-4">
                <h3 className="text-black text-7xl font-medium tracking-tighter">
                  <Counter value={1200} suffix="+" />
                </h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Active Suppliers</p>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-[#BFFF07] text-7xl font-medium tracking-tighter bg-black inline-block px-8 py-2 rounded-2xl">
                  <Counter value={5000} suffix="+" />
                </h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verified Carriers</p>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-black text-7xl font-medium tracking-tighter">
                  <Counter value={25} suffix="k+" />
                </h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Loads Delivered</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - The Solution Flow */}
        <section className="py-40 bg-white border-t border-gray-100">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-32">
              <div className="max-w-2xl">
                <h2 className="text-5xl md:text-8xl font-medium text-black tracking-tight leading-[0.9] uppercase">
                  How We <br /> <span className="text-gray-200">Connect You.</span>
                </h2>
              </div>
              <p className="text-gray-400 font-medium max-w-sm text-right hidden md:block">
                Our platform automates the complex logistics lifecycle, ensuring transparency at every stage.
              </p>
            </div>

            <div className="space-y-40">
              {steps.map((step, i) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-20 items-center`}
                >
                  <div className="w-full md:w-1/2 space-y-12">
                    <div className="flex items-center space-x-6">
                      <span className="text-6xl font-black text-gray-100">{step.id}</span>
                      <div className="px-4 py-1 rounded-full bg-black text-[#BFFF07] text-[9px] font-bold uppercase tracking-widest">
                        {step.role}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <h3 className="text-4xl md:text-6xl font-medium text-black tracking-tight uppercase">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 text-xl leading-relaxed max-w-md">
                        {step.desc}
                      </p>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-black border border-gray-100">
                      {step.icon}
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] shadow-2xl group">
                      <Image 
                        src={step.image} 
                        alt={step.title} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Comparison */}
        <section className="py-40 bg-black relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/10 rounded-[3rem] overflow-hidden border border-white/10">
              {/* For Suppliers */}
              <div className="bg-black p-16 md:p-24 space-y-12">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-[#BFFF07]" />
                  <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.3em]">For Suppliers</h4>
                </div>
                <h3 className="text-4xl md:text-6xl font-medium text-white tracking-tight leading-tight">
                  Smarter Shipping, <br /> Lower Costs.
                </h3>
                <ul className="space-y-6">
                  {[
                    "Instant access to thousands of carriers",
                    "Transparent competitive bidding",
                    "Automated documentation & invoices",
                    "Real-time GPS tracking for every load"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center space-x-4 text-white/40">
                      <svg className="w-5 h-5 text-[#BFFF07]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-lg">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/supplier-signup" className="inline-block pt-8 text-[#BFFF07] font-bold uppercase tracking-widest border-b border-[#BFFF07]/30 pb-2 hover:border-[#BFFF07] transition-all">
                  Post your first load
                </Link>
              </div>

              {/* For Carriers */}
              <div className="bg-[#BFFF07] p-16 md:p-24 space-y-12">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <h4 className="text-black text-[10px] font-bold uppercase tracking-[0.3em]">For Carriers</h4>
                </div>
                <h3 className="text-4xl md:text-6xl font-medium text-black tracking-tight leading-tight">
                  Maximize Capacity, <br /> Get Paid Faster.
                </h3>
                <ul className="space-y-6">
                  {[
                    "High-volume of available loads daily",
                    "Fast & secure payments via Stripe",
                    "Route optimization & fleet management",
                    "Direct communication with suppliers"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center space-x-4 text-black/60">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-lg font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/carrier-signup" className="inline-block pt-8 text-black font-bold uppercase tracking-widest border-b border-black/30 pb-2 hover:border-black transition-all">
                  Browse available loads
                </Link>
              </div>
            </div>
          </div>

          {/* Background Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none whitespace-nowrap">
            <h2 className="text-[30vw] font-black text-white tracking-tighter">MARKETPLACE</h2>
          </div>
        </section>

        <CinematicCTA />
      </main>

      <Footer />
    </div>
  );
}
