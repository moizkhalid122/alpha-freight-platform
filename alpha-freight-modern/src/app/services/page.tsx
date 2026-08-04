"use client";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import FeatureIcon3D from "@/components/FeatureIcon3D";
import NetworkCanvas3D from "@/components/NetworkCanvas3D";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const serviceItems = [
  { 
    id: "01", 
    title: "Freight & Trucking", 
    image: "/service-detail-1.jpg",
    desc: "Comprehensive freight solutions tailored for your business needs with real-time tracking.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  },
  { 
    id: "02", 
    title: "Container Transport", 
    image: "/service-detail-2.avif",
    desc: "Efficient container logistics for global and domestic shipping routes.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    id: "03", 
    title: "Last-Mile Delivery", 
    image: "/service-detail-3.avif",
    desc: "Reliable and fast delivery to the final destination for ultimate customer satisfaction.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  },
  { 
    id: "04", 
    title: "Warehouse & Storage", 
    image: "/service-detail-4.avif",
    desc: "Secure, climate-controlled storage solutions with intelligent inventory management.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  { 
    id: "05", 
    title: "Express Distribution", 
    image: "/service-detail-5.avif",
    desc: "Time-critical shipping solutions for your most urgent freight requirements.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
];

const testimonials = [
  {
    id: "01",
    quote: "Alpha Freight brings together people, technology, and a performance driven fleet to help businesses simplify their supply chain and deliver with confidence.",
    author: "Marcus Sterling",
    role: "DIRECTOR OF SUPPLY CHAIN",
    company: "TECHLOGISTICS CORP",
    image: "/news-1.jpg"
  },
  {
    id: "02",
    quote: "The real-time tracking and transparency provided by Alpha Freight have revolutionized how we manage our domestic distribution network.",
    author: "Sarah Jenkins",
    role: "OPERATIONS MANAGER",
    company: "GLOBAL LOGISTICS",
    image: "/news-2.jpg"
  },
  {
    id: "03",
    quote: "Exceptional service and scalable infrastructure. They've been a key partner in our rapid growth across the UK market.",
    author: "David Chen",
    role: "CEO",
    company: "FASTTRACK DELIVERY",
    image: "/news-3.jpg"
  }
];

export default function ServicesPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full flex flex-col justify-center border-b border-white/5">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] mb-6">
                <span>Our Expertise</span>
              </div>
              <h1 className="text-6xl md:text-[8rem] font-medium text-white leading-[0.9] tracking-tighter mb-12 uppercase">
                LOGISTICS <br />
                <span className="text-white/20">REIMAGINED.</span>
              </h1>
              <p className="text-white/50 text-xl max-w-2xl font-light leading-relaxed">
                We provide a comprehensive suite of logistics services designed to optimize your supply chain and drive business growth through precision and innovation.
              </p>
            </motion.div>
          </div>
          
          {/* Animated Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="h-full w-px bg-white/10 absolute left-1/4" />
            <div className="h-full w-px bg-white/10 absolute left-1/2" />
            <div className="h-full w-px bg-white/10 absolute left-3/4" />
          </div>
        </section>

        {/* Services Grid Section */}
        <section className="py-32 bg-white">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
              {serviceItems.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => setHoveredId(service.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group cursor-pointer"
                >
                  <Link href={`/services/${service.id}`} className="block space-y-8">
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                      
                      {/* Floating Icon on Image */}
                      <div className="absolute bottom-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-black shadow-xl">
                        {service.icon}
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Service {service.id}
                        </span>
                        <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-3xl font-medium text-black tracking-tight group-hover:translate-x-2 transition-transform duration-500">
                        {service.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                        {service.desc}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Driving the Next Generation Section (from screenshot) */}
        <section className="py-32 bg-white">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-24 max-w-4xl"
            >
              <h2 className="text-4xl md:text-6xl font-medium text-black leading-tight tracking-tight">
                Driving the next generation of logistics through unparalleled intelligence and operational excellence.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Data Driven Intelligence */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-[#BFFF07] p-10 rounded-2xl min-h-[500px] flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-black leading-tight">
                    Data Driven Intelligence
                  </h3>
                  <p className="text-black/70 text-sm font-medium leading-relaxed">
                    We transform raw data into actionable insights, using AI to eliminate guesswork and optimize every route for maximum efficiency.
                  </p>
                </div>
                <div className="relative w-24 h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <FeatureIcon3D type="data" color="#000000" />
                </div>
              </motion.div>

              {/* Card 2: Global Network */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#F2F2F0] p-10 rounded-2xl min-h-[500px] flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-black leading-tight">
                    Global Network
                  </h3>
                  <p className="text-black/50 text-sm font-medium leading-relaxed">
                    Access a massive international infrastructure combined with deep local knowledge to navigate complex regulations.
                  </p>
                </div>
                <div className="relative w-24 h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <FeatureIcon3D type="globe" color="#000000" />
                </div>
              </motion.div>

              {/* Card 3: Absolute Transparency */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-[#1A1A1A] p-10 rounded-2xl min-h-[500px] flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white leading-tight">
                    Absolute Transparency
                  </h3>
                  <p className="text-white/50 text-sm font-medium leading-relaxed">
                    Stay in control with real-time tracking and instant reporting, ensuring you have full visibility of your cargo at every second.
                  </p>
                </div>
                <div className="relative w-24 h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <FeatureIcon3D type="transparency" color="#ffffff" />
                </div>
              </motion.div>

              {/* Card 4: Scalable Infrastructure */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-[#F2F2F0] p-10 rounded-2xl min-h-[500px] flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-black leading-tight">
                    Scalable Infrastructure
                  </h3>
                  <p className="text-black/50 text-sm font-medium leading-relaxed">
                    Whether you are a startup or an enterprise, our flexible solutions grow with your business, adapting to your changing market needs.
                  </p>
                </div>
                <div className="relative w-24 h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <FeatureIcon3D type="infrastructure" color="#000000" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trusted by Businesses Section */}
        <section className="py-32 bg-white border-t border-gray-100">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
                Trusted by Businesses <br /> Nationwide
              </h2>
            </div>

            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[2rem] flex flex-col md:flex-row">
              {/* Image side */}
              <div className="relative w-full md:w-3/5 h-[300px] md:h-auto overflow-hidden">
                <motion.div
                  key={testimonialIndex}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="relative w-full h-full"
                >
                  <Image 
                    src="/pixf.avif" 
                    alt="Industrial Infrastructure" 
                    fill 
                    className="object-cover"
                  />
                </motion.div>
              </div>

              {/* Content side */}
              <div className="w-full md:w-2/5 bg-[#BFFF07] p-8 md:p-16 flex flex-col justify-between relative">
                <motion.div 
                  key={testimonialIndex}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <p className="text-2xl md:text-3xl font-medium text-black leading-tight">
                    "{testimonials[testimonialIndex].quote}"
                  </p>
                  
                  <div className="flex items-center space-x-4 pt-8">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden grayscale">
                      <Image 
                        src={testimonials[testimonialIndex].image} 
                        alt={testimonials[testimonialIndex].author} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black uppercase">{testimonials[testimonialIndex].author}</h4>
                      <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">
                        {testimonials[testimonialIndex].role} <br /> {testimonials[testimonialIndex].company}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <div className="flex items-center justify-between pt-12 md:pt-0">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-black">{testimonials[testimonialIndex].id}</span>
                    <span className="text-sm font-bold text-black/30">/03</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={prevTestimonial}
                      className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={nextTestimonial}
                      className="w-12 h-12 rounded-full border border-black flex items-center justify-center bg-black text-white hover:bg-black/80 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Network Section */}
        <section className="py-40 bg-black relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-20">
              <div className="lg:w-1/2 space-y-12">
                <h2 className="text-5xl md:text-7xl font-medium text-white tracking-tighter leading-none uppercase">
                  A NETWORK <br />
                  WITHOUT <span className="text-[#BFFF07]">BOUNDARIES.</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed max-w-xl">
                  Our infrastructure is built for the modern era. We combine physical assets with digital intelligence to ensure your cargo moves seamlessly across every mile.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-8 border border-white/10 rounded-2xl">
                    <h4 className="text-[#BFFF07] text-3xl font-bold mb-2">5,000+</h4>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Verified Carriers</p>
                  </div>
                  <div className="p-8 border border-white/10 rounded-2xl">
                    <h4 className="text-[#BFFF07] text-3xl font-bold mb-2">100%</h4>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">UK Coverage</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative aspect-square">
                {/* 3D Network Animation */}
                <div className="absolute inset-0 z-0">
                  <NetworkCanvas3D />
                </div>
                
                {/* Overlay Pulse Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 rounded-full border border-[#BFFF07]/20 animate-[pulse_4s_infinite]" />
                  <div className="absolute inset-10 rounded-full border border-[#BFFF07]/10 animate-[pulse_6s_infinite]" />
                </div>

                <div className="h-full w-full flex items-center justify-center relative z-10 pointer-events-none">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="w-32 h-32 relative bg-black/50 backdrop-blur-xl rounded-full p-6 border border-white/10"
                  >
                    <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-6" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CinematicCTA />
      </main>

      <Footer />
    </div>
  );
}
