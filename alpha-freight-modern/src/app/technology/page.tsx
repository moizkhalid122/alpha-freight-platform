"use client";

import Navbar from "@/components/Navbar";
import { Footer, CinematicCTA } from "@/components/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Database, 
  Network, 
  ArrowRight,
  Globe,
  Bot,
  Layers,
  BarChart3
} from "lucide-react";

export default function TechnologyPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div className="flex flex-col min-h-screen bg-white text-black" ref={containerRef}>
      <Navbar />

      <main>
        {/* Hero Section - The AI Core */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#050505] text-white">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10" />
            <motion.div 
              style={{ scale: useTransform(scrollYProgress, [0, 0.2], [1, 1.1]) }}
              className="relative w-full h-full opacity-30 grayscale"
            >
              <Image 
                src="/alpha-freight-hero.png" 
                alt="Technology Hero" 
                fill 
                className="object-cover"
                priority
              />
            </motion.div>
            
            {/* Animated Circuit Board Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#BFFF0705_1px,transparent_1px),linear-gradient(to_bottom,#BFFF0705_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.6em] backdrop-blur-xl"
            >
              <span className="w-2 h-2 rounded-full bg-[#BFFF07] animate-pulse" />
              Intelligence Protocol 4.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.85] mix-blend-difference"
            >
              Cognitive <br /> <span className="text-[#BFFF07] italic">Freight.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6"
            >
              <p className="text-white/40 text-xs md:text-sm max-w-lg font-bold leading-relaxed uppercase tracking-[0.4em]">
                Beyond automation. We've engineered a self-learning ecosystem that anticipates demand and optimizes global logistics in real-time.
              </p>
            </motion.div>
          </div>

          {/* Floating Tech Dots */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  y: [0, -100, 0],
                  x: [0, Math.random() * 50 - 25, 0]
                }}
                transition={{ 
                  duration: 5 + Math.random() * 5, 
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-1 h-1 bg-[#BFFF07] rounded-full"
                style={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%` 
                }}
              />
            ))}
          </div>
        </section>

        {/* Applied Efficiency Section - New Interactive Layout */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              
              {/* Left Side - Text & Mini Testimonial */}
              <div className="space-y-16">
                <div className="space-y-8">
                  <div className="text-black/40 text-[10px] font-black uppercase tracking-[0.4em]">
                    [ Applied Efficiency ]
                  </div>
                  <h3 className="text-5xl md:text-6xl font-medium tracking-tight text-black leading-[1.1]">
                    Optimize Operations with Real-time Data.
                  </h3>
                  <Link href="/products/analytics" className="inline-flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-[#BFFF07] flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60 group-hover:text-black transition-colors">More Information</span>
                  </Link>
                </div>

                <div className="pt-16 border-t border-black/5 space-y-8 max-w-md">
                  <div className="flex items-center gap-2 text-black font-black uppercase tracking-tighter text-xl italic">
                    <Zap className="w-6 h-6 fill-[#BFFF07] text-[#BFFF07]" /> Alpha Core
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-black/60 italic">
                    "This system understood the nuance of our industry and helped us map a way forward that was both ambitious and achievable. Their tech wasn't theoretical—it was grounded, actionable, and already making a real difference."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden grayscale">
                      <Image src="https://i.pravatar.cc/150?u=jaya" alt="Jaya" fill className="object-cover" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">Jaya Komalski</div>
                      <div className="text-[8px] font-bold text-black/30 uppercase tracking-widest">Head of Operations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Interactive Flow Diagram Visual */}
              <div className="relative aspect-square bg-[#0a0a0a] rounded-[3rem] overflow-hidden group shadow-2xl">
                {/* Blurred Background Image */}
                <Image 
                  src="/alpha-freight-back.png" 
                  alt="Operations" 
                  fill 
                  className="object-cover opacity-40 blur-sm group-hover:scale-110 transition-transform duration-[3s]" 
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                  {/* Top Nodes */}
                  <div className="flex gap-8 mb-12">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center space-y-4 w-40 shadow-2xl"
                    >
                      <div className="w-full aspect-video rounded-lg bg-zinc-800 overflow-hidden relative border border-white/5">
                        <Image src="/alpha-freight-o.png" alt="Nodes" fill className="object-cover opacity-50" />
                      </div>
                      <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Solar Potential</div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center space-y-4 w-40 shadow-2xl"
                    >
                      <div className="w-full aspect-video rounded-lg bg-zinc-800 overflow-hidden relative border border-white/5">
                        <Image src="/alpha-freight-container-1.avif" alt="Nodes" fill className="object-cover opacity-50" />
                      </div>
                      <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Logistic Frameworks</div>
                    </motion.div>
                  </div>

                  {/* Connecting Lines */}
                  <div className="relative w-full flex justify-center mb-12">
                    <div className="absolute top-0 w-48 h-[1px] bg-white/10" />
                    <div className="w-[1px] h-12 bg-white/10" />
                  </div>

                  {/* Main Target Node */}
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="p-8 rounded-2xl bg-[#BFFF07] text-black text-center space-y-4 w-48 shadow-[0_0_50px_rgba(191,255,7,0.3)]"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-black/10 mx-auto flex items-center justify-center">
                      <Cpu className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em]">Accelerated Fulfillment</div>
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* The Tech Stack - Columnar Design */}
        <section className="py-32 relative bg-white text-black border-t border-black/5">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="mb-24 space-y-4">
              <h2 className="text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.5em] bg-black inline-block px-4 py-1 rounded-sm">Core Architecture</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight text-black">
                How our stack powers your business
              </h3>
            </div>

            <div className="grid md:grid-cols-3 border-t border-black/5">
              {[
                {
                  title: "AI Matching Engine",
                  desc: "Proprietary algorithms that pair loads with carriers based on history, preference, and real-time positioning.",
                  image: "/alpha-freight-hero.png",
                  icon: Bot
                },
                {
                  title: "Blockchain Ledger",
                  desc: "Immutable records for every transaction, POD, and settlement, ensuring 100% trust across the network.",
                  image: "/alpha-freight-container-1.avif",
                  icon: ShieldCheck
                },
                {
                  title: "IoT Tracking",
                  desc: "High-fidelity sensor integration providing temperature, shock, and location data directly to your dashboard.",
                  image: "/alpha-freight-truck-2.avif",
                  icon: Network
                }
              ].map((item, i) => (
                <div key={item.title} className={`p-8 md:p-12 space-y-12 ${i !== 2 ? 'md:border-r border-black/5' : ''}`}>
                  <div className="space-y-6">
                    <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">
                      Module 0{i + 1}
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
                        <item.icon className="w-6 h-6" />
                      </div>
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
                    className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl"
                  >
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-700 hover:scale-110" 
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Intelligence Section - Alpha Man Style */}
        <section className="py-48 bg-zinc-50 relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-[#BFFF07] text-xl font-bold tracking-tight bg-black inline-block px-4 py-1 rounded-lg">Data Intelligence</h2>
                  <h3 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[1.1]">
                    Precision at <br /> <span className="text-black/10 italic">Global Scale.</span>
                  </h3>
                  <p className="text-black/50 text-lg font-medium leading-relaxed max-w-xl">
                    Our platform processes millions of data points every second. From predictive route optimization to automated risk mitigation, we turn raw data into strategic advantage.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {[
                    { label: "Data Points/Sec", value: "2.4M" },
                    { label: "AI Accuracy", value: "99.8%" },
                    { label: "Latency", value: "<10ms" },
                    { label: "Uptime", value: "99.99%" }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2 p-6 rounded-2xl bg-white border border-black/5 shadow-sm">
                      <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                      <div className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-black"
                >
                  <Image 
                    src="/alpha-man.png" 
                    alt="AI Intelligence" 
                    fill 
                    className="object-cover opacity-80"
                  />
                  
                  {/* Digital Aura Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#BFFF0710_0%,transparent_70%)]" />
                </motion.div>

                {/* Floating Tech Cards */}
                <div className="absolute top-12 -right-8 w-64 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-black text-[#BFFF07] flex items-center justify-center">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-black">Neural Match</div>
                      <div className="text-[8px] font-bold text-black/40 uppercase">Carrier: Optimized</div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#BFFF07] text-black flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-black">Smart Route</div>
                      <div className="text-[8px] font-bold text-black/40 uppercase">Fuel Efficiency: +22%</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Infrastructure Section */}
        <section className="py-48 bg-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 text-center space-y-24">
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.5em] bg-black inline-block px-4 py-1 rounded-sm">Global Infrastructure</h2>
              <h3 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                Enterprise <br /> <span className="text-black/10 italic">Foundation.</span>
              </h3>
              <p className="text-black/50 text-lg font-medium leading-relaxed uppercase tracking-widest pt-8">
                Built on military-grade security and distributed server networks across the UK and Europe.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "256-bit AES", sub: "Encryption", icon: ShieldCheck },
                { label: "Real-time", sub: "Syncing", icon: Zap },
                { label: "Global", sub: "Redundancy", icon: Globe },
                { label: "99.99%", sub: "Reliability", icon: BarChart3 }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-12 rounded-[3rem] border border-black/5 bg-zinc-50 hover:bg-black hover:text-white transition-all duration-500 group"
                >
                  <item.icon className="w-10 h-10 mx-auto mb-6 text-[#BFFF07]" />
                  <div className="text-2xl font-black tracking-tighter uppercase">{item.label}</div>
                  <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest group-hover:text-white/40">{item.sub}</div>
                </motion.div>
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
