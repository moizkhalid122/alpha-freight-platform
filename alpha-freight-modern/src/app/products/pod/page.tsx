"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Shield, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Camera, 
  MapPin, 
  Cpu,
  ArrowRight,
  ShieldCheck,
  Lock,
  Smartphone,
  BarChart3,
  Globe,
  Database,
  Search,
  Check
} from "lucide-react";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function DigitalPODPage() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal-text", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".reveal-text",
          start: "top 80%",
        }
      });

      gsap.from(".premium-card", {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        stagger: 0.3,
        ease: "expo.out",
        scrollTrigger: {
          trigger: ".premium-card-grid",
          start: "top 70%",
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const workflowSteps = [
    {
      title: "High-Fidelity Capture",
      desc: "Using our proprietary edge-detection technology, drivers capture crystal-clear images of delivery notes, ensuring 100% legibility in any condition.",
      icon: Camera,
      image: "/alpha-freight-mobile-app-1.png",
      color: "#BFFF07"
    },
    {
      title: "AI Verification",
      desc: "Our Vision AI automatically extracts signatures, consignee names, and timestamps, cross-referencing them with the digital manifest instantly.",
      icon: Cpu,
      image: "/alpha-freight-mobile-app.png",
      color: "#3B82F6"
    },
    {
      title: "Geospatial Validation",
      desc: "Every submission is cryptographically locked with GPS coordinates and UTC timestamps, creating an immutable audit trail for insurance.",
      icon: MapPin,
      image: "/alpha-freight-mobile-app-3.png",
      color: "#F59E0B"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#BFFF07] selection:text-black font-sans overflow-x-hidden">
      <Navbar variant="light" />

      {/* Hero Section - Cinematic */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(191,255,7,0.05),transparent_70%)]" />
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-[#BFFF07]/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        </motion.div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.4em] mb-12"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF07] animate-ping" />
            Paperless Evolution
          </motion.div>

          <h1 className="text-7xl md:text-[9rem] lg:text-[11rem] font-bold leading-[0.85] tracking-tighter mb-12">
            <span className="block overflow-hidden h-[1.1em]">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                DIGITAL
              </motion.span>
            </span>
            <span className="block overflow-hidden h-[1.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF07] via-white/80 to-white/20 italic font-serif font-light">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                Proof of Delivery.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-lg md:text-2xl text-white/40 mb-16 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            The architectural cornerstone of the Alpha Freight ecosystem. 
            Eliminate paperwork, automate reconciliation, and trigger the industry's fastest 7-day payout protocols.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <button className="px-12 py-6 bg-[#BFFF07] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_40px_rgba(191,255,7,0.3)]">
              Transform Your Fleet
            </button>
            <button className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 backdrop-blur-md transition-all">
              API Documentation
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
        >
          <div className="w-px h-12 bg-gradient-to-b from-[#BFFF07] to-transparent" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
        </motion.div>
      </section>

      {/* About Section - Premium Redesign */}
      <section className="py-48 bg-[#FDFDFD] text-black relative z-20 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/2 left-0 w-1/2 h-px bg-black/5 -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-black/5 -translate-x-1/2" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
            {/* Left Column - Video Showcase */}
            <div className="lg:col-span-6 space-y-12">
              <div className="flex items-center gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em] flex items-center gap-4"
                >
                  <span className="w-8 h-px bg-black/10" />
                  Building a brand of your passion
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative group"
              >
                {/* Outer Frame */}
                <div className="absolute -inset-4 border border-black/[0.03] rounded-[3.5rem] pointer-events-none transition-all duration-700 group-hover:-inset-2" />
                
                {/* Main Video Container */}
                <div className="relative rounded-[3rem] overflow-hidden bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] aspect-[4/3] flex items-center justify-center p-8 transition-all duration-700 group-hover:shadow-[0_80px_120px_-20px_rgba(0,0,0,0.12)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.02),transparent_70%)]" />
                  
                  {/* Inner Glass Frame */}
                  <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-black/5 shadow-inner">
                    <video 
                      src="/saas-launch.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>

                  {/* Decorative Label */}
                  <div className="absolute bottom-12 right-12 z-20 px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-[8px] font-black uppercase tracking-widest">Interface v.2.4</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Narrative Content */}
            <div className="lg:col-span-6 space-y-16 lg:pl-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-12 h-12 flex items-center justify-center border border-black/5 rounded-full text-black/10 text-2xl font-light hover:text-black/40 transition-colors"
              >
                +
              </motion.div>

              <div className="space-y-12">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05] max-w-xl"
                >
                  Alpha Freight serves as a <span className="text-black/30 font-serif italic font-light">pioneering catalyst</span>, where engineering meets industrial innovation.
                </motion.h2>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-8 text-black/40 text-base md:text-lg font-medium leading-relaxed max-w-lg border-l-2 border-black/5 pl-10"
                >
                  <p>
                    Our mission is to architect a frictionless logistics experience, empowering carriers and shippers to optimize operational performance through sophisticated, high-fidelity digital execution layers.
                  </p>
                  <p>
                    From AI-driven document verification to real-time geospatial synchronization, we prioritize uncompromising security and operational speed.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Link 
                    href="/about"
                    className="inline-flex items-center gap-6 px-10 py-5 bg-black text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all group relative overflow-hidden shadow-2xl shadow-black/10"
                  >
                    <span className="relative z-10">More About Us</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-[#BFFF07] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="py-32 bg-white text-black rounded-t-[60px] relative z-10 -mt-20">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-24">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em]">Settlement Efficiency</div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
                  Frictionless <br /> <span className="text-black/20 italic font-serif font-light">Settlement Engine.</span>
                </h2>
                <p className="text-xl text-black/60 font-medium leading-relaxed max-w-xl">
                  By digitizing the terminal phase of the delivery lifecycle, we facilitate instantaneous data reconciliation, removing the #1 cause of payment delays.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { label: "Payout Cycle", value: "7 Days", icon: Clock },
                  { label: "Data Integrity", value: "SHA-256", icon: ShieldCheck },
                  { label: "Error Reduction", value: "98%", icon: Cpu },
                  { label: "Verification", value: "Instant", icon: Zap }
                ].map((stat) => (
                  <div key={stat.label} className="p-8 rounded-[2.5rem] bg-gray-50 border border-black/5 space-y-4">
                    <stat.icon className="w-6 h-6 text-black/20" />
                    <div>
                      <div className="text-3xl font-black">{stat.value}</div>
                      <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-black rounded-[4rem] p-12 overflow-hidden flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#BFFF07] flex items-center justify-center">
                    <Database className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">Real-time <br /> Ecosystem Sync</h3>
                  <p className="text-white/40 font-medium leading-relaxed">
                    Every validated POD is propagated across the Alpha network in milliseconds, updating shipper control towers and wallet balances.
                  </p>
                </div>
                
                <div className="flex items-end justify-between border-t border-white/10 pt-8">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-slate-800 overflow-hidden">
                        <Image src={`/news-new-${i}.jpg`} alt="User" width={40} height={40} className="object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-[#BFFF07] text-2xl font-black">500k+</div>
                    <div className="text-white/20 text-[8px] font-bold uppercase tracking-widest">Deliveries Verified</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#BFFF07] rounded-[3rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl"
              >
                <div className="text-4xl font-black text-black leading-none">0.1s</div>
                <div className="text-[8px] font-black text-black/40 uppercase tracking-widest mt-2">Latency Sync</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section className="py-40 bg-[#FAF9F6] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-32">
            <div className="px-4 py-1.5 rounded-full bg-black/5 text-black/40 text-[10px] font-black uppercase tracking-[0.4em] mb-8">Execution Layer</div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">The Mobile-First <span className="text-black/20">Workflow.</span></h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-24 items-start">
            <div className="flex-1 space-y-6 w-full">
              {workflowSteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  onMouseEnter={() => setActiveStep(i)}
                  className={`relative p-10 rounded-[3rem] border transition-all duration-500 cursor-pointer overflow-hidden group ${
                    activeStep === i 
                      ? "bg-white border-black/5 shadow-2xl shadow-black/5 scale-[1.02]" 
                      : "bg-transparent border-transparent hover:border-black/5"
                  }`}
                >
                  <div className="relative z-10 flex gap-8">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${
                      activeStep === i ? "bg-black text-white" : "bg-black/5 text-black/20"
                    }`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="space-y-4">
                      <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors duration-500 ${
                        activeStep === i ? "text-black" : "text-black/20"
                      }`}>
                        {step.title}
                      </h3>
                      <AnimatePresence>
                        {activeStep === i && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-black/60 text-lg font-medium leading-relaxed max-w-md"
                          >
                            {step.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {activeStep === i && (
                    <motion.div 
                      layoutId="step-indicator"
                      className="absolute left-0 top-0 bottom-0 w-2 bg-black"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex-1 sticky top-40 w-full">
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto">
                {/* Background Glow */}
                <div 
                  className="absolute inset-0 blur-[120px] rounded-full opacity-20 transition-colors duration-700"
                  style={{ backgroundColor: workflowSteps[activeStep].color }}
                />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, scale: 0.8, x: 50, rotate: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.2, x: -50, rotate: -10 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={workflowSteps[activeStep].image}
                      alt={workflowSteps[activeStep].title}
                      fill
                      className="object-contain drop-shadow-[0_80px_100px_rgba(0,0,0,0.15)]"
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* Floating Badge */}
                <motion.div 
                  key={`badge-${activeStep}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-black/5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#BFFF07]">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">System Status</div>
                    <div className="text-sm font-black uppercase tracking-tight">Verified In Real-time</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-40 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">The <span className="text-[#BFFF07]">New Standard</span> in Freight.</h2>
            <p className="text-white/40 text-xl font-medium max-w-2xl mx-auto uppercase tracking-widest">Why the UK's leading fleets are moving to Digital POD.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-[4rem] overflow-hidden border border-white/10">
            {/* Traditional */}
            <div className="p-16 bg-[#0A0A0A] space-y-12">
              <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-white/20">Traditional Paper POD</h3>
              <div className="space-y-8">
                {[
                  "30-60 Day payment cycles",
                  "Manual data entry errors",
                  "Missing/Lost paperwork disputes",
                  "Physical storage & scanning",
                  "No real-time delivery visibility"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4 text-white/40">
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black">X</div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alpha Freight */}
            <div className="p-16 bg-[#0A0A0A] space-y-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BFFF07]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-[#BFFF07]">Alpha Digital POD</h3>
              <div className="space-y-8">
                {[
                  "Guaranteed 7-Day payouts",
                  "AI-driven extraction (100% accuracy)",
                  "Immutable cryptographic audit trail",
                  "Cloud-native instant retrieval",
                  "Millisecond ecosystem synchronization"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4 text-[#BFFF07]">
                    <div className="w-5 h-5 rounded-full bg-[#BFFF07] flex items-center justify-center text-black">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Banner - Cinematic */}
      <section className="py-40 px-6">
        <div className="max-w-[1400px] mx-auto bg-gradient-to-br from-[#BFFF07] to-white rounded-[5rem] p-16 md:p-32 text-black relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/40 blur-[150px] -z-0 translate-x-1/2 -translate-y-1/2 group-hover:bg-white/60 transition-colors duration-1000" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-24">
            <div className="flex-1 space-y-12">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black/5 border border-black/10 backdrop-blur-md">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Military-Grade Compliance</span>
              </div>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                Immutable <br /> <span className="text-black/40 italic font-serif font-light">By Design.</span>
              </h2>
              <p className="text-xl text-black/60 font-medium leading-relaxed max-w-xl">
                Our Digital POD system is built on SHA-256 encryption and geospatial validation, satisfying the most stringent regulatory and insurance standards in the UK logistics sector.
              </p>
              <div className="flex flex-wrap gap-4">
                {["GDPR Compliant", "ISO 27001", "FCA Ready", "HMRC Verified"].map((tag) => (
                  <div key={tag} className="px-6 py-3 rounded-2xl bg-black/5 border border-black/10 text-black font-black text-[10px] uppercase tracking-widest">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-full lg:w-[450px] aspect-square relative">
              <div className="absolute inset-0 bg-black/5 blur-[100px] rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-black rounded-[4rem] p-16 flex flex-col items-center justify-center text-center rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl">
                <Lock className="w-20 h-20 text-[#BFFF07] mb-8" />
                <div className="text-6xl font-black text-white mb-4 tracking-tighter">100%</div>
                <div className="text-xs font-black uppercase tracking-[0.2em] leading-tight text-white/40">
                  Cryptographic <br /> Verification Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(191,255,7,0.1),transparent_70%)]" />
        <div className="max-w-[1400px] mx-auto px-6 text-center relative z-10 space-y-16">
          <h2 className="text-7xl md:text-[10rem] font-bold tracking-tighter leading-none">
            READY TO <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF07] to-white/40">EVOLVE?</span>
          </h2>
          <p className="text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
            Join the UK's fastest growing logistics network and experience the future of delivery execution today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <button className="w-full sm:w-auto px-16 py-8 bg-white text-black rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_30px_60px_rgba(255,255,255,0.1)]">
              Get Started Now
            </button>
            <button className="w-full sm:w-auto px-16 py-8 bg-transparent border border-white/10 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
              Talk to Logistics Experts
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
