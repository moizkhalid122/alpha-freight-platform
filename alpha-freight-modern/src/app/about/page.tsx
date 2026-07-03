"use client";

import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Users, 
  Globe, 
  Shield, 
  Zap, 
  Target, 
  Award,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Cpu
} from "lucide-react";

import { Footer, CinematicCTA } from "@/components/Footer";

const testimonials = [
  {
    quote: "Our supply chain has never run smoother, they've been game-changers.",
    author: "Luna Interiors",
    image: "/alpha-freight-container-1.avif"
  },
  {
    quote: "The real-time tracking and AI matching have transformed our delivery efficiency.",
    author: "Global Logistics Ltd",
    image: "/alpha-freight-container-2.avif"
  },
  {
    quote: "Exceptional support and reliable carrier network. Alpha Freight is our go-to partner.",
    author: "North Star Trading",
    image: "/alpha-freight-container-3.avif"
  }
];

function TestimonialSlider() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[500px] md:h-[650px] rounded-[3rem] overflow-hidden group shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Image
            src={testimonials[current].image}
            alt="Testimonial background"
            fill
            className="object-cover brightness-50 scale-105"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-6"
          >
            <h3 className="text-xl md:text-3xl lg:text-4xl font-medium text-white tracking-tight leading-[1.3]">
              "{testimonials[current].quote}"
            </h3>
            <div className="space-y-1">
              <div className="text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.3em]">Client Partner</div>
              <div className="text-white/60 text-sm font-bold uppercase tracking-widest">{testimonials[current].author}</div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-12 left-12 md:left-24 flex gap-4">
          <button 
            onClick={prev}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={next}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-black pt-20">
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            <Image 
              src="/services-bg.jpg" 
              alt="About Alpha Freight" 
              fill 
              className="object-cover"
              priority
            />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/10 text-[#BFFF07] text-[10px] font-black uppercase tracking-[0.4em]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF07] animate-pulse" />
              Our Legacy & Future
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase leading-[0.9]"
            >
              Redefining <br /> <span className="text-[#BFFF07] italic">Logistics.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
            >
              Alpha Freight isn't just a brokerage—it's a high-fidelity technological ecosystem designed to harmonize the global supply chain through artificial intelligence and elite operational excellence.
            </motion.p>
          </div>

          {/* Floating Stats */}
          <div className="absolute bottom-12 left-0 right-0 z-10 hidden md:block">
            <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center border-t border-white/10 pt-8">
              {[
                { label: "Founded", val: "2020" },
                { label: "Active Carriers", val: "12K+" },
                { label: "Monthly Shipments", val: "50K+" },
                { label: "System Uptime", val: "99.9%" }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  className="text-left"
                >
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-2xl font-black text-white tracking-tighter">{stat.val}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Are Section - Refined Implementation */}
        <section className="py-24 bg-white">
          <div className="max-w-[1400px] mx-auto px-6">
            {/* Top Divider Line */}
            <div className="w-full h-[1px] bg-black/5 mb-16" />

            <div className="flex flex-col md:flex-row gap-12 md:gap-20">
              {/* Left Side - Small Label */}
              <div className="md:w-1/5 pt-2">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                  <span className="text-black/20">+</span> WHO WE ARE
                </div>
              </div>

              {/* Right Side - Main Content */}
              <div className="md:w-4/5 space-y-16">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-black tracking-tight leading-[1.2] max-w-3xl">
                  Our expert team is dedicated to providing tailored solutions that meet your unique needs, ensuring timely delivery, and exceeding your expectations.
                </h2>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
                  <div className="space-y-4">
                    <p className="text-[11px] text-black/50 font-medium leading-relaxed uppercase tracking-wide max-w-sm">
                      Our leadership team brings together decades of experience in innovation, technology, and industry expertise. They guide our mission to deliver cutting-edge solutions that transform businesses and drive growth.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] text-black/50 font-medium leading-relaxed uppercase tracking-wide max-w-sm">
                      With a passion for innovation and a commitment to excellence, our leaders inspire and empower our teams to push boundaries and achieve exceptional results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics Section - Refined with Animations */}
        <section className="py-32 bg-white">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
              
              {/* Left Side - Text & Image */}
              <div className="lg:w-1/2 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                    <span className="text-black/20">+</span> KEY METRICS
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-black tracking-tight leading-[1.1]">
                    Freight's innovation shines through Transforming Logistics Key Performance Metrics.
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-12 items-end">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-[4/5] w-full rounded-[3rem] overflow-hidden shadow-2xl"
                  >
                    <Image 
                      src="/how-1.jpg" 
                      alt="Innovation at Alpha Freight" 
                      fill 
                      className="object-cover grayscale"
                    />
                  </motion.div>
                  <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest leading-relaxed pb-8 max-w-[200px]">
                    Freight's innovation excels in Transforming Logistics Key Performance Metrics, echoing your creative vision for impactful brands.
                  </p>
                </div>
              </div>

              {/* Right Side - Metrics Grid with Floating Animation */}
              <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 10+ Years */}
                <motion.div 
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  whileHover={{ y: -10 }}
                  className="aspect-square bg-black p-12 rounded-[2.5rem] flex flex-col justify-between group transition-shadow hover:shadow-2xl shadow-black/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
                  <div className="text-7xl lg:text-8xl font-medium text-white tracking-tighter">10+</div>
                  <div className="space-y-4">
                    <div className="w-full h-[1px] bg-white/10" />
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Years Experience</div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20" />
                </motion.div>

                {/* 75 Employees */}
                <motion.div 
                  initial={{ y: 80, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  whileHover={{ y: -10 }}
                  className="aspect-square bg-[#E5E5E5] p-12 rounded-[2.5rem] flex flex-col justify-between group transition-shadow hover:shadow-2xl shadow-black/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-black/5" />
                  <div className="text-7xl lg:text-8xl font-medium text-black tracking-tighter">75</div>
                  <div className="space-y-4">
                    <div className="w-full h-[1px] bg-black/5" />
                    <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Employees</div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5" />
                </motion.div>

                {/* 300 Vehicles */}
                <motion.div 
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  whileHover={{ y: -10 }}
                  className="aspect-square bg-[#BFFF07] p-12 rounded-[2.5rem] flex flex-col justify-between group transition-shadow hover:shadow-2xl shadow-[#BFFF07]/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10" />
                  <div className="text-7xl lg:text-8xl font-medium text-black tracking-tighter">300</div>
                  <div className="space-y-4">
                    <div className="w-full h-[1px] bg-black/10" />
                    <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Vehicles in Fleet</div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10" />
                </motion.div>

                {/* 80k Tons */}
                <motion.div 
                  initial={{ y: 80, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ y: -10 }}
                  className="aspect-square bg-[#2D2D2D] p-12 rounded-[2.5rem] flex flex-col justify-between group transition-shadow hover:shadow-2xl shadow-black/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
                  <div className="text-7xl lg:text-8xl font-medium text-white tracking-tighter">80k</div>
                  <div className="space-y-4">
                    <div className="w-full h-[1px] bg-white/10" />
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tons Transported Annual</div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10" />
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonial Slider Section - NEW */}
        <section className="py-24 bg-white">
          <div className="max-w-[1400px] mx-auto px-6">
            <TestimonialSlider />
          </div>
        </section>

        {/* Vision & Mission Section */}
      <section className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">The Vision</h2>
                <h3 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase leading-none">
                  Engineering the <br /> <span className="text-black/20 italic">Autonomous</span> Supply Chain.
                </h3>
              </div>
              
              <p className="text-xl text-black/60 font-medium leading-relaxed">
                We believe that the future of logistics is invisible. By building a unified digital infrastructure, we eliminate the friction between shippers and carriers, allowing goods to move with the same ease as information across the internet.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-black text-[#BFFF07] flex items-center justify-center shadow-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">The Mission</h4>
                  <p className="text-sm text-black/40 font-bold uppercase tracking-wide leading-relaxed">
                    To provide 100% transparency and reliability through high-fidelity data and elite carrier vetting.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#BFFF07] text-black flex items-center justify-center shadow-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">The Growth</h4>
                  <p className="text-sm text-black/40 font-bold uppercase tracking-wide leading-relaxed">
                    Scaling UK's most robust freight network using predictive AI and automated settlement.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl group">
              <Image 
                src="/alpha freight truck.jpg" 
                alt="Alpha Freight Vision" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
              
              {/* Floating Card */}
              <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl bg-black/90 backdrop-blur-xl border border-white/10 text-white space-y-4">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-[#BFFF07]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#BFFF07]">Alpha Core Engine</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-white/70 italic">
                  "Logistics is no longer just moving cargo; it's about moving intelligence at scale."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership / Team Section */}
      <section className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Our Infrastructure</h2>
              <h3 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase leading-none">
                National <br /> <span className="text-black/20 italic">Presence.</span>
              </h3>
            </div>
            <p className="max-w-md text-black/40 font-bold uppercase tracking-wide leading-relaxed text-right">
              Headquartered in the UK, we operate a distributed network of logistics experts and engineers across Europe.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-100 group">
                <Image 
                  src={`/how-${i}.jpg`} 
                  alt={`Team Member ${i}`} 
                  fill 
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <div className="text-white font-black uppercase tracking-tighter text-xl">Department Head</div>
                  <div className="text-[#BFFF07] font-black uppercase tracking-widest text-[10px]">Logistics Engineering</div>
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
