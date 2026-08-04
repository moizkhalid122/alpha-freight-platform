"use client";

import Navbar from "@/components/Navbar";
import { Footer, CinematicCTA } from "@/components/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { 
  Handshake, 
  Globe, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  ChevronRight,
  Cpu,
  Layers,
  Network
} from "lucide-react";

export default function PartnersPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div className="flex flex-col min-h-screen bg-white text-black" ref={containerRef}>
      <Navbar />

      <main>
        {/* Hero Section - Cinematic & Next Level */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
            <motion.div 
              style={{ scale: useTransform(scrollYProgress, [0, 0.2], [1, 1.2]) }}
              className="relative w-full h-full opacity-40 grayscale"
            >
              <Image 
                src="/alpha-freight-container-1.avif" 
                alt="Partnership Hero" 
                fill 
                className="object-cover"
                priority
              />
            </motion.div>
            
            {/* 3D Network Grid Overlay - Simulated with CSS */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.5em] backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[#BFFF07] animate-ping" />
              Strategic Ecosystem
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mix-blend-difference"
            >
              Powering <br /> <span className="text-[#BFFF07] italic">Growth.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6"
            >
              <p className="text-white/40 text-xs md:text-sm max-w-lg font-bold leading-relaxed uppercase tracking-[0.4em]">
                Join the UK's most technologically advanced logistics network. Harmonizing intelligence with execution.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center pt-8"
            >
              <Link href="#join" className="group relative px-10 py-5 bg-[#BFFF07] text-black font-black uppercase tracking-tighter text-sm overflow-hidden rounded-full transition-transform hover:scale-105">
                <span className="relative z-10 flex items-center gap-3">
                  Become a Partner <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-white"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </Link>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20"
          >
            <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
          </motion.div>
        </section>

        {/* Dynamic Partner Categories - Refined Columnar Layout */}
        <section className="py-32 relative overflow-hidden bg-white text-black border-t border-black/5">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="mb-24">
              <h3 className="text-4xl md:text-5xl font-medium tracking-tight text-black">
                How we work with partners
              </h3>
            </div>

            <div className="grid md:grid-cols-3 border-t border-black/5">
              {[
                {
                  title: "Strategic Carriers",
                  desc: "Elite transport providers integrated directly into our AI dispatch engine.",
                  image: "/alpha-freight-truck-2.avif",
                },
                {
                  title: "Tech Integrators",
                  desc: "SaaS and IoT providers building the next generation of logistics software.",
                  image: "/alpha-freight-hero.png",
                },
                {
                  title: "Global Brokers",
                  desc: "International freight forwarders leveraging our UK-wide infrastructure.",
                  image: "/alpha-freight-o.png",
                }
              ].map((item, i) => (
                <div key={item.title} className={`p-8 md:p-12 space-y-12 ${i !== 2 ? 'md:border-r border-black/5' : ''}`}>
                  <div className="space-y-6">
                    <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">
                      0{i + 1}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black uppercase tracking-tighter">{item.title}</h4>
                      <p className="text-black/50 font-medium text-sm leading-relaxed uppercase tracking-wider max-w-xs">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative aspect-square rounded-[2rem] overflow-hidden bg-zinc-100"
                  >
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Benefits - Refined Layout with Alpha Man */}
        <section className="py-48 bg-white relative">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.5em]">The Advantage</h2>
                  <h3 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
                    Why Partner <br /> <span className="text-black/10 italic">With Alpha?</span>
                  </h3>
                </div>

                <div className="space-y-12">
                  {[
                    {
                      title: "Predictive Intelligence",
                      desc: "Access proprietary demand forecasting to optimize your fleet utilization.",
                      icon: Zap
                    },
                    {
                      title: "Immutable Trust",
                      desc: "Blockchain-backed settlement and verified Digital PODs for zero disputes.",
                      icon: ShieldCheck
                    },
                    {
                      title: "Hyper-Growth",
                      desc: "Direct access to UK's fastest growing shipper network with guaranteed volume.",
                      icon: TrendingUp
                    }
                  ].map((benefit, i) => (
                    <motion.div 
                      key={benefit.title}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-8 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center text-[#BFFF07] group-hover:bg-[#BFFF07] group-hover:text-black transition-all duration-500">
                        <benefit.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase tracking-tight text-black group-hover:text-[#BFFF07] transition-colors">{benefit.title}</h4>
                        <p className="text-black/40 font-medium leading-relaxed uppercase text-[10px] tracking-widest max-w-sm">
                          {benefit.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Side - Alpha Man Image with Floating Notifications */}
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]"
                >
                  <Image 
                    src="/alpha-man.png" 
                    alt="Alpha Partnership" 
                    fill 
                    className="object-cover"
                  />
                </motion.div>

                {/* Floating Notifications - Matching the Screenshot Style */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[85%] space-y-3">
                  {[
                    { icon: Network, title: "Load Matched v3.4", time: "Just now", status: "Active" },
                    { icon: Zap, title: "Instant Payout Processed", time: "2m ago", status: "Complete" },
                    { icon: Globe, title: "LAX —> LHR Tracking", time: "Live Update", status: "In Transit" }
                  ].map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, x: -20 }}
                      whileInView={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.2), duration: 0.8 }}
                      className="bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 group hover:scale-105 transition-transform cursor-default"
                    >
                      <div className="w-10 h-10 rounded-xl bg-black text-[#BFFF07] flex items-center justify-center shadow-lg">
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-tighter text-black truncate">{notif.title}</div>
                        <div className="text-[9px] font-bold text-black/40 uppercase">{notif.time}</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF07]/10 text-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF07] animate-pulse" />
                        <span className="text-[8px] font-black uppercase">{notif.status}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Thin Divider Line - Centered */}
          <div className="max-w-[1400px] mx-auto px-6 py-24">
            <div className="w-full h-[1px] bg-black/5" />
          </div>
        </section>

        {/* Strategic Finance Section - Refined Layout with Alpha Table */}
        <section className="pb-48 bg-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              
              {/* Left Side - Alpha Table Image with Floating Chart */}
              <div className="relative order-2 lg:order-1">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]"
                >
                  <Image 
                    src="/alpha-table.png" 
                    alt="Strategic Finance" 
                    fill 
                    className="object-cover"
                  />
                </motion.div>

                {/* Floating Glassmorphism Chart - Matching Screenshot */}
                <motion.div
                  initial={{ opacity: 0, y: 40, x: 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] bg-white/40 backdrop-blur-2xl border border-white/40 p-8 rounded-3xl shadow-2xl"
                >
                  <div className="space-y-6">
                    <div>
                      <div className="text-black text-xl font-black tracking-tight uppercase">MRR</div>
                      <div className="text-black/40 text-xs font-bold uppercase tracking-widest">MoM Growth</div>
                    </div>
                    
                    {/* Simulated Bar Chart */}
                    <div className="flex items-end gap-2 h-32">
                      {[30, 45, 60, 50, 80, 100].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          transition={{ delay: 0.6 + (i * 0.1), duration: 0.8 }}
                          className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-black' : 'bg-black/10'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-black/20 uppercase tracking-tighter">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>June</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Side - Text Content */}
              <div className="space-y-12 order-1 lg:order-2">
                <div className="space-y-6">
                  <h2 className="text-[#BFFF07] text-xl font-bold tracking-tight">Strategic Finance</h2>
                  <h3 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[1.1]">
                    For the time <br /> <span className="text-black/10 italic">between rounds.</span>
                  </h3>
                  <p className="text-black/50 text-lg font-medium leading-relaxed max-w-xl">
                    Not every financial decision is about raising money. We help partners with budgeting, runway planning, pricing, and the kind of thinking that makes the next level of growth easier.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    "Cash flow planning and automated runway analysis",
                    "Pricing strategy and unit economics optimization",
                    "Real-time financial governance and reporting setup",
                    "Instant payout liquidity for carrier operations"
                  ].map((benefit, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#BFFF07]/10 flex items-center justify-center text-[#BFFF07] group-hover:bg-[#BFFF07] group-hover:text-black transition-all">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-black/60 group-hover:text-black transition-colors">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          {/* Thin Divider Line */}
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="w-full h-[1px] bg-black/5" />
          </div>
        </section>

        {/* Moving Solutions Section - Split Layout */}
        <section className="relative min-h-[80vh] flex flex-col lg:flex-row bg-black overflow-hidden">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative min-h-[500px] lg:min-h-full">
            <Image 
              src="/alpha-sof.png" 
              alt="Moving Solutions" 
              fill 
              className="object-cover"
            />
          </div>

          {/* Right Side - Content */}
          <div className="lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-24 space-y-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-1 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest"
              >
                What we offer
              </motion.div>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight">
                Moving solutions built around you
              </h3>
            </div>

            <div className="space-y-8">
              {[
                "Residential moving",
                "Long-Distance moving",
                "Commercial moving",
                "Packing & Unpacking"
              ].map((service, i) => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group cursor-pointer border-b border-white/10 pb-6"
                >
                  <span className="text-xl md:text-2xl font-medium text-white/60 group-hover:text-white transition-colors">
                    {service}
                  </span>
                  <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all group-hover:bg-[#BFFF07] group-hover:text-black group-hover:border-[#BFFF07]">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link 
                href="/services" 
                className="inline-block px-8 py-4 bg-[#BFFF07] text-black font-black uppercase tracking-tighter text-sm rounded-xl hover:scale-105 transition-transform"
              >
                View all services
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section - Refined Columnar Layout */}
        <section className="py-32 relative overflow-hidden bg-white text-black border-t border-black/5">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-24">
              <h3 className="text-4xl md:text-5xl font-medium tracking-tight text-black">
                Testimonials
              </h3>
            </div>

            <div className="grid md:grid-cols-2 border-t border-black/5">
              {[
                {
                  quote: "Alpha Freight told us we weren't ready to scale our logistics — and they were right. We came back six months later with a much stronger strategy and optimized our delivery network in four weeks.",
                  author: "Linnéa Moberg",
                  role: "CEO, Stackflow",
                  image: "https://i.pravatar.cc/150?u=linnea"
                },
                {
                  quote: "Most partners hand you a portal and call it support. Alpha actually sat in the room with us, re-engineered our load matching model, and prepped us for every operational challenge we faced.",
                  author: "Erik Sandell",
                  role: "Co-founder, Waypoint Logistics",
                  image: "https://i.pravatar.cc/150?u=erik"
                }
              ].map((item, i) => (
                <div key={item.author} className={`p-12 md:p-20 space-y-16 ${i === 0 ? 'md:border-r border-black/5' : ''}`}>
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed text-black/80 tracking-tight">
                    "{item.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden grayscale">
                      <Image 
                        src={item.image} 
                        alt={item.author} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tighter text-black">{item.author}</div>
                      <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CinematicCTA />
      </main>

      <Footer />
    </div>
  );
}
