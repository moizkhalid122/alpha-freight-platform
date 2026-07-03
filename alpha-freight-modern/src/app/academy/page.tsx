"use client";

import Navbar from "@/components/Navbar";
import Counter from "@/components/Counter";
import FeatureIcon3D from "@/components/FeatureIcon3D";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";

import { Footer, CinematicCTA } from "@/components/Footer";

const courses = [
  {
    id: "01",
    badge: "Most Popular",
    title: "CPC Training Course",
    price: "£149",
    duration: "35 Hours",
    desc: "Essential certification for professional HGV and bus drivers in the UK.",
    features: ["DVSA Approved", "Online & In-person", "Valid for 5 Years", "Expert Instructors"],
    color: "#BFFF07",
    type: "data"
  },
  {
    id: "02",
    badge: "Safety First",
    title: "Safety & Compliance",
    price: "£99",
    duration: "1 Day",
    desc: "Master the latest safety regulations and compliance standards for the UK roads.",
    features: ["Risk Management", "Health & Safety", "Legal Compliance", "Certificate Included"],
    color: "#ffffff",
    type: "infrastructure",
    dark: true
  },
  {
    id: "03",
    badge: "Professional",
    title: "Load Securing Cert",
    price: "£129",
    duration: "2 Days",
    desc: "Specialized training on securing various types of cargo for safe transport.",
    features: ["Practical Training", "Best Practices", "Equipment Handling", "Insurance Approved"],
    color: "#BFFF07",
    type: "transparency"
  }
];

const benefits = [
  {
    title: "Industry Recognized",
    desc: "Certifications respected by major UK logistics firms.",
    image: "/how-1.jpg",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: "Flexible Learning",
    desc: "Interactive online or hands-on classroom training.",
    image: "/how-2.jpg",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Expert Instructors",
    desc: "Learn from veterans with decades of experience.",
    image: "/how-3.jpg",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  {
    title: "Career Support",
    desc: "Direct connections with 5,000+ carriers.",
    image: "/how-4.jpg",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }
];

export default function AcademyPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black">
      <Navbar />
      
      <main ref={containerRef} className="relative">
        {/* Hero Section */}
        <section className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden border-b border-white/5">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
               autoPlay
               loop
               muted
               playsInline
               className="absolute inset-0 w-full h-full object-cover opacity-40"
             >
              <source src="/alpha-accdemy.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.3
                }
              }
            }}
            className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full text-center"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="inline-block px-4 py-1 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-12"
            >
              Master the Road
            </motion.div>
            
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 50, rotateX: 45 },
                visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-6xl md:text-[10rem] font-medium text-white leading-[0.85] tracking-tighter mb-16 uppercase"
            >
              ALPHA FREIGHT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF07] to-white/20">ACADEMY.</span>
            </motion.h1>
            
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="text-white/40 text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed mb-16"
            >
              Professional driver training and certification designed to elevate your career and ensure the highest standards of safety and excellence.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut" } }
              }}
            >
              <Link
                href="#courses"
                className="inline-block px-12 py-5 bg-[#BFFF07] text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300 shadow-2xl"
              >
                Explore Courses
              </Link>
            </motion.div>
          </motion.div>

          {/* Background Elements */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </section>

        {/* Academy Statistics */}
        <section className="py-32 bg-white relative z-10">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {[
                { label: "Graduated Drivers", value: 1500, suffix: "+" },
                { label: "Courses Available", value: 12, suffix: "" },
                { label: "Success Rate", value: 99, suffix: "%" },
                { label: "Carrier Partners", value: 5000, suffix: "+" }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-4">
                  <h3 className="text-black text-6xl font-medium tracking-tighter">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Training that empowers section (Project Relevant) */}
        <section className="py-32 bg-[#FAF9F6] relative z-10 overflow-hidden">
          {/* Background Dotted Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-10">
            <div className="flex flex-col space-y-8 mb-20">
              <div className="inline-block px-4 py-1.5 rounded-full border border-black/10 bg-white text-black/60 text-[10px] font-bold uppercase tracking-widest w-fit">
                Why Alpha Academy
              </div>
              <h2 className="text-5xl md:text-7xl font-serif text-black tracking-tight uppercase">
                Training that <br /> <span className="text-black/30 text-4xl md:text-6xl italic font-light">empowers your future.</span>
              </h2>
              <p className="text-gray-500 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
                Master the skills needed to dominate the UK freight industry. Our DVSA-approved training programs are designed by veterans to ensure you're always ahead of the curve.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link href="/enroll" className="px-8 py-3.5 bg-[#BFFF07] text-black rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  Start Training
                </Link>
                <Link href="#courses" className="px-8 py-3.5 bg-white border border-black/10 text-black rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
                  View Course Details
                </Link>
              </div>
            </div>

            {/* Video Player - Autoplay enabled */}
            <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-black group border-8 border-white">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                poster="/pixf.avif"
              >
                <source src="/alpha-accdemy.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Overlay pulse for visual interest */}
               <div className="absolute top-8 right-8 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Session Demo</span>
               </div>
             </div>
           </div>
         </section>

         {/* Success Stories / Portfolio Section (Sticky Stack Scroll) */}
         <section className="py-40 bg-white relative z-10 overflow-visible">
           <div className="max-w-[1800px] mx-auto px-6 lg:px-12 text-center mb-32">
             <div className="inline-block px-4 py-1.5 rounded-full border border-black/5 bg-gray-50 text-black/40 text-[10px] font-bold uppercase tracking-widest mb-10">
               Our Impact
             </div>
             <h2 className="text-5xl md:text-8xl font-serif text-black tracking-tight leading-[0.9] uppercase">
               A glimpse into our <br /> <span className="text-gray-300 italic font-light">graduates' journey.</span>
             </h2>
           </div>

           <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative flex flex-col gap-0 pb-20">
             {[
               {
                 title: "Alpha Command Center",
                 year: "2026",
                 badge: "Certified Professional",
                 quote: "The technology training at Alpha Academy gave me the edge I needed to manage high-capacity fleets efficiently.",
                 image: "/alpha-freight-o.png",
                 color: "#BFFF07"
               },
               {
                 title: "Strategic Operations",
                 year: "2025",
                 badge: "Master Graduate",
                 quote: "Learning the complex regulations of UK freight logistics at Alpha was a game-changer for my career growth.",
                 image: "/service-detail-2.avif",
                 color: "#3b82f6"
               },
               {
                 title: "Elite Fleet Logistics",
                 year: "2026",
                 badge: "Advanced Safety",
                 quote: "The safety standards and practical load securing techniques I learned here are truly world-class.",
                 image: "/service-detail-4.avif",
                 color: "#7c3aed"
               }
             ].map((story, i) => (
               <motion.div 
                 key={i}
                 className="bg-[#0A0A0A] rounded-[3rem] p-6 md:p-12 overflow-hidden relative group sticky"
                 style={{ 
                   top: `${120 + (i * 20)}px`,
                   zIndex: i + 1,
                   boxShadow: "0 -20px 40px -20px rgba(0,0,0,0.5)",
                   marginBottom: i === 2 ? "0px" : "40px"
                 }}
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 transition={{ duration: 0.8 }}
                 viewport={{ once: true, margin: "-100px" }}
               >
                 <div className="flex flex-col items-start mb-8 gap-4 text-left relative z-10">
                   <div className="flex gap-3">
                     <span className="px-4 py-1 rounded-full border border-white/20 bg-white/5 text-white text-[8px] font-bold uppercase tracking-widest">
                       {story.badge}
                     </span>
                     <span className="px-4 py-1 rounded-full border border-white/20 bg-white/5 text-white/40 text-[8px] font-bold uppercase tracking-widest">
                       {story.year}
                     </span>
                   </div>
                   <h3 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
                     {story.title}
                   </h3>
                 </div>

                 {/* Showcase Image Container */}
                 <div className="relative w-full aspect-[21/8] rounded-[2rem] overflow-hidden bg-gradient-to-b from-white/5 to-transparent p-1 md:p-3">
                   <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden">
                      <Image 
                        src={story.image} 
                        alt={story.title} 
                        fill 
                        className="object-contain opacity-80 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105"
                      />
                      {/* UI Overlay Mockup style */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
                      <div className="absolute bottom-12 left-12 max-w-md space-y-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                        <p className="text-white text-xl font-medium leading-relaxed">
                          "{story.quote}"
                        </p>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-px`} style={{ backgroundColor: story.color }} />
                          <span className="font-black uppercase tracking-widest text-xs" style={{ color: story.color }}>Graduate Success Story</span>
                        </div>
                      </div>
                   </div>
                 </div>
                 
                 {/* Decorative background glow */}
                 <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-[0.05]" style={{ backgroundColor: story.color }} />
               </motion.div>
             ))}
           </div>
         </section>

        {/* Course Grid Section */}
        <section id="courses" className="py-32 bg-white relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-gray-100 pb-10">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-6xl font-medium text-black tracking-tight leading-[0.9] uppercase">
                  Available <br /> <span className="text-gray-200">Certifications.</span>
                </h2>
              </div>
              <p className="text-gray-400 font-medium text-xs uppercase tracking-widest max-w-[200px] text-right hidden md:block leading-relaxed">
                Industry-standard training designed for the elite.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className={`${course.dark ? "bg-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]" : "bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.05)]"} p-10 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between group relative overflow-hidden min-h-[600px] hover:shadow-2xl transition-all duration-500`}
                >
                  <div className="relative z-10">
                    <div className={`inline-block px-3 py-1 rounded-full ${course.dark ? "bg-white/10 text-white" : "bg-black/5 text-black"} text-[8px] font-black uppercase tracking-[0.2em] mb-8`}>
                      {course.badge}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-none uppercase">
                      {course.title}
                    </h3>
                    <div className="flex items-baseline space-x-2 mb-6">
                      <span className="text-4xl font-black">{course.price}</span>
                      <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{course.duration}</span>
                    </div>
                    <p className={`text-sm leading-relaxed mb-10 font-medium ${course.dark ? "text-white/40" : "text-black/40"}`}>
                      {course.desc}
                    </p>
                    <ul className="space-y-3">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${course.dark ? "bg-white/20" : "bg-black/10"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fixed size container for 3D Icon to prevent layout shifts */}
                   <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10 group-hover:opacity-40 transition-all duration-700 pointer-events-none overflow-hidden">
                     <FeatureIcon3D type={course.type as any} color={course.color} />
                   </div>

                  <Link 
                    href="/enroll" 
                    className={`mt-10 w-full py-4 rounded-xl ${course.dark ? "bg-white text-black" : "bg-black text-white"} text-center text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 relative z-10`}
                  >
                    Enroll Now
                  </Link>

                  {/* Subtle Background Accent */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: course.color }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Immersive Dark Bundle Section - Next Level Premium */}
        <section className="py-32 bg-black relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-[#1A1A1A] to-black rounded-[3rem] p-10 md:p-20 border border-white/10 overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
            >
              {/* Background Animated Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#BFFF07]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#BFFF07]/20 transition-colors duration-1000" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
                <div className="max-w-xl space-y-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF07]/10 border border-[#BFFF07]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF07] animate-pulse" />
                    <span className="text-[#BFFF07] text-[8px] font-black uppercase tracking-[0.3em]">Exclusive Bundle</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tighter leading-none uppercase">
                      COMPLETE <br /> <span className="text-[#BFFF07]">DRIVER BUNDLE.</span>
                    </h2>
                    <p className="text-white/40 text-sm font-medium leading-relaxed max-w-sm">
                      Master the UK roads with our all-in-one certification package. CPC, Safety, and Load Securing—all in one elite bundle.
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-white/20 line-through text-lg font-bold">£377</span>
                      <span className="text-white text-5xl font-black tracking-tighter">£299</span>
                    </div>
                    <div className="bg-[#BFFF07] text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-[0_10px_20px_rgba(191,255,7,0.2)]">
                      Save £78
                    </div>
                  </div>
                </div>
                
                {/* Premium Action Card */}
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="relative w-full md:w-[350px] aspect-[4/5] bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 flex flex-col justify-between items-center text-center group/card overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#BFFF07]/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative w-20 h-20 bg-black rounded-2xl flex items-center justify-center text-[#BFFF07] border border-white/5 group-hover/card:scale-110 transition-transform duration-500 shadow-2xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white text-xl font-bold uppercase tracking-tight">Full Certification <br /> Package</h4>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Limited Time Availability</p>
                  </div>

                  <Link 
                    href="/enroll/bundle"
                    className="w-full py-4 bg-[#BFFF07] text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_15px_30px_rgba(191,255,7,0.2)]"
                  >
                    Grab the Bundle
                  </Link>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-[#BFFF07]/10 rounded-full blur-2xl" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Background Text - Subtle & Premium */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none whitespace-nowrap">
            <h2 className="text-[25vw] font-black text-white tracking-tighter uppercase">Elite</h2>
          </div>
        </section>

        {/* Benefits Section - Bento Grid Upgrade */}
        <section className="py-32 bg-white relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-6xl font-medium text-black tracking-tight leading-[0.9] uppercase">
                  Why Train <br /> <span className="text-gray-200">With Alpha.</span>
                </h2>
              </div>
              <p className="text-gray-400 font-medium text-[10px] uppercase tracking-[0.2em] hidden md:block border-l border-gray-100 pl-8">
                Excellence in every mile. <br /> Professionalism in every driver.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[600px]">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative rounded-[2.5rem] overflow-hidden border border-gray-100 flex flex-col justify-end p-8 md:p-10 ${
                    i === 0 || i === 3 ? "md:col-span-1" : "md:col-span-1"
                  } hover:shadow-2xl transition-all duration-700`}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src={benefit.image} 
                      alt={benefit.title} 
                      fill 
                      className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                    />
                    {/* Gradient Overlay - Adjusted for better visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-700" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black group-hover:bg-[#BFFF07] transition-all duration-500 shadow-xl group-hover:scale-110">
                      {benefit.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight transition-colors duration-500">
                        {benefit.title}
                      </h3>
                      <p className="text-white/70 text-xs font-medium leading-relaxed group-hover:text-white transition-colors duration-500">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-40 bg-gray-50 border-t border-gray-200">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row items-center gap-20">
              <div className="md:w-1/3 space-y-8 text-center md:text-left">
                <h2 className="text-5xl md:text-6xl font-medium text-black tracking-tight leading-none uppercase">
                  From Our <br /> <span className="text-gray-300">Graduates.</span>
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">
                  Thousands of drivers have transformed their careers through Alpha Freight Academy.
                </p>
                <div className="flex items-center space-x-2 justify-center md:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-black font-black ml-2">4.9/5</span>
                </div>
              </div>

              <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    name: "James Wilson",
                    role: "HGV Class 1 Driver",
                    quote: "The CPC training was actually engaging and practical. Alpha Academy really knows the industry inside out.",
                    image: "/news-1.jpg"
                  },
                  {
                    name: "Sarah Jenkins",
                    role: "Logistics Manager",
                    quote: "We send all our new drivers to Alpha for load securing certification. The standards are unmatched.",
                    image: "/service-detail-2.avif"
                  }
                ].map((test, i) => (
                  <div key={i} className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
                    <p className="text-xl italic text-gray-600 leading-relaxed font-medium">"{test.quote}"</p>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden">
                        <Image src={test.image} alt={test.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-black uppercase">{test.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{test.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative h-[600px] w-full overflow-hidden flex flex-col items-center justify-center text-center group">
          <div className="absolute inset-0 z-0">
            <Image
              src="/cta-bg.avif"
              alt="Join the Academy"
              fill
              className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
              <span>+</span>
              <span>READY TO ENROLL?</span>
            </div>
            
            <h2 className="text-5xl md:text-[6rem] font-medium text-white tracking-tight leading-none uppercase">
              Start Your <br /> Journey Today.
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
              <Link 
                href="/enroll"
                className="inline-block px-12 py-5 bg-[#BFFF07] text-black rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-2xl"
              >
                Enroll in a Course
              </Link>
              <Link 
                href="/contact"
                className="inline-block px-12 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
              >
                Inquire for Teams
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Same as other pages) */}
      <footer className="bg-black pt-32 pb-12 overflow-hidden relative">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          {/* Big Animated Logo Background */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-[0.02] select-none pointer-events-none">
            <h2 className="text-[35vw] font-black tracking-tighter text-white whitespace-nowrap uppercase">
              ALPHA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32 relative z-10">
            {/* Brand Info */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="Alpha Freight Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">
                  ALPHA FREIGHT
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                The next generation of logistics powered by AI and precision engineering. Connecting the UK freight industry like never before.
              </p>
              <div className="flex space-x-4">
                {['tw', 'in', 'fb', 'ig'].map((social) => (
                  <motion.a
                    key={social}
                    href="#"
                    whileHover={{ y: -5, color: "#BFFF07" }}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-[#BFFF07] transition-colors"
                  >
                    <span className="text-xs font-bold uppercase">{social}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-10">Navigation</h4>
              <ul className="space-y-4">
                {["Services", "Network", "Technology", "Academy", "Solution"].map((item) => (
                  <li key={item}>
                    <motion.a 
                      href={`/${item.toLowerCase()}`} 
                      whileHover={{ x: 10, color: "#fff" }}
                      className="text-white/40 text-sm font-medium transition-colors inline-block"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-10">Company</h4>
              <ul className="space-y-4">
                {["About Us", "Investor", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <motion.a 
                      href="#" 
                      whileHover={{ x: 10, color: "#fff" }}
                      className="text-white/40 text-sm font-medium transition-colors inline-block"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-10">
              <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em]">Stay Updated</h4>
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full bg-transparent border-b border-white/10 py-4 text-white text-sm focus:outline-none focus:border-[#BFFF07] transition-colors placeholder:text-white/20"
                />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-[#BFFF07] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              <p className="text-white/30 text-[10px] font-medium leading-relaxed">
                By subscribing, you agree to our privacy policy and terms of service.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center relative z-10">
            <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase mb-6 md:mb-0">
              &copy; 2026 ALPHA FREIGHT SOLUTIONS LIMITED. ALL RIGHTS RESERVED.
            </p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-3 md:justify-end">
              {[
                { name: "Privacy Policy", href: "/privacy-policy" },
                { name: "Terms of Service", href: "/terms-of-service" },
                { name: "Cookies", href: "/cookie-policy" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white/20 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
