"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";

import { Footer, CinematicCTA } from "@/components/Footer";

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Community",
    number: "1",
    description: "We connect people globally through logistics solutions that drive economic growth and empower businesses worldwide.",
    image: "/service-1.avif",
  },
  {
    title: "Innovation",
    number: "2",
    description: "Our cutting-edge technology and creative problem-solving transform supply chains, shaping the future of global commerce.",
    image: "/service-2.avif",
  },
  {
    title: "Sustainability",
    number: "3",
    description: "We're committed to reducing our environmental footprint, promoting eco-friendly practices that contribute to a more responsible logistics industry.",
    image: "/service-3.avif",
  },
];

const serviceItems = [
  { 
    id: "01", 
    title: "Freight & Trucking", 
    image: "/service-detail-1.jpg",
    desc: "Comprehensive freight solutions tailored for your business needs with real-time tracking."
  },
  { 
    id: "02", 
    title: "Container Transport", 
    image: "/service-detail-2.avif",
    desc: "Efficient container logistics for global and domestic shipping routes."
  },
  { 
    id: "03", 
    title: "Last-Mile Delivery", 
    image: "/service-detail-3.avif",
    desc: "Reliable and fast delivery to the final destination for ultimate customer satisfaction."
  },
  { 
    id: "04", 
    title: "Warehouse & Storage", 
    image: "/service-detail-4.avif",
    desc: "Secure, climate-controlled storage solutions with intelligent inventory management."
  },
  { 
    id: "05", 
    title: "Express Distribution", 
    image: "/service-detail-5.avif",
    desc: "Time-critical shipping solutions for your most urgent freight requirements."
  },
];

const newsArticles = [
  {
    id: 1,
    tag: "NEWS",
    date: "9.27.26",
    title: "Transparency Through Real-Time Tracking",
    image: "/news-new-1.jpg",
  },
  {
    id: 2,
    tag: "INSIGHTS",
    date: "9.17.26",
    title: "Optimize Your Global Supply Chain Today",
    image: "/news-new-2.jpg",
  },
  {
    id: 3,
    tag: "NEWS",
    date: "9.08.26",
    title: "Tech Transforms Shipping's Future",
    image: "/news-new-3.jpg",
  },
  {
    id: 4,
    tag: "INSIGHTS",
    date: "10.31.26",
    title: "Overcoming Global Logistics Challenges",
    image: "/news-new-4.jpg",
  },
  {
    id: 5,
    tag: "NEWS",
    date: "11.15.26",
    title: "The Rise of Autonomous Freight",
    image: "/news-item-5.jpg",
  },
  {
    id: 6,
    tag: "INSIGHTS",
    date: "11.28.26",
    title: "Sustainable Packaging in Logistics",
    image: "/news-item-6.jpg",
  },
];

const howItWorks = [
  {
    id: "01",
    title: "Smart Intake & Planning",
    description: "We analyze your cargo requirements and optimize routes using real-time data to ensure the most efficient path forward.",
    image: "/how-1.jpg",
  },
  {
    id: "02",
    title: "AI Load Matching",
    description: "Our proprietary AI connects your freight with the perfect verified carrier in under 60 seconds.",
    image: "/how-2.jpg",
  },
  {
    id: "03",
    title: "Real-time Visibility",
    description: "Full visibility of your freight with GPS tracking and instant status updates through our platform.",
    image: "/how-3.jpg",
  },
  {
    id: "04",
    title: "Secure Operations",
    description: "Every shipment is protected by our advanced security protocols and verified insurance coverage.",
    image: "/how-4.jpg",
  },
  {
    id: "05",
    title: "Fast 7-Day Payouts",
    description: "Guaranteed quick payments for carriers to maintain a healthy and motivated network.",
    image: "/how-5.jpg",
  },
];

function StepCircle({ id, index, scrollProgress }: { id: string, index: number, scrollProgress: any }) {
  const threshold = index * 0.25; // 0, 0.25, 0.5, 0.75, 1
  const isActive = useTransform(scrollProgress, (val: number) => val >= threshold);
  const [active, setActive] = useState(false);

  useEffect(() => {
    return isActive.on("change", (v) => setActive(v));
  }, [isActive]);

  return (
    <div className={`absolute left-[-15px] top-0 hidden md:flex w-8 h-8 rounded-full bg-[#111] border transition-all duration-500 items-center justify-center text-[10px] font-bold z-10 ${
      active ? "border-[#BFFF07] text-white shadow-[0_0_15px_rgba(191,255,7,0.4)]" : "border-white/20 text-white/40"
    }`}>
      {id}
    </div>
  );
}

const reviews = [
  {
    name: "John Anderson",
    role: "Logistics Manager",
    company: "Global Trade Co.",
    text: "Alpha Freight has completely transformed how we handle our shipments. The AI matching is scary fast and always finds us reliable carriers.",
    image: "/news-new-1.jpg"
  },
  {
    name: "Sarah Jenkins",
    role: "Owner Operator",
    company: "Jenkins Trucking",
    text: "The 7-day payout is a game changer for small carriers like us. No more chasing brokers for payments. Best platform in the UK.",
    image: "/news-new-2.jpg"
  },
  {
    name: "Michael Chen",
    role: "Supply Chain Director",
    company: "Nexus Logistics",
    text: "Real-time visibility and the level of data precision Alpha provides is unmatched. It's the most sophisticated tool in our stack.",
    image: "/news-new-3.jpg"
  },
  {
    name: "Emma Watson",
    role: "Freight Broker",
    company: "Watson & Co.",
    text: "Scaling our brokerage was easy with Alpha Freight. The network of verified carriers is massive and high quality.",
    image: "/news-new-4.jpg"
  }
];

const faqs = [
  {
    question: "How fast is the AI load matching?",
    answer: "Our AI analyzes thousands of data points to find the perfect carrier match in under 60 seconds, significantly reducing your planning time."
  },
  {
    question: "How do you verify your carriers?",
    answer: "Every carrier in our network undergoes a rigorous 5-step vetting process, including insurance verification, safety rating checks, and past performance reviews."
  },
  {
    question: "What is the 7-day payout guarantee?",
    answer: "We ensure carriers are paid within 7 days of delivery confirmation, helping maintain cash flow and a healthy partnership within our network."
  },
  {
    question: "Is real-time tracking included?",
    answer: "Yes, every shipment booked through Alpha Freight includes full GPS tracking and automated status updates for complete supply chain visibility."
  }
];

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const servicesRef = useRef<HTMLElement | null>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: howItWorksScroll } = useScroll({
    target: howItWorksRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(howItWorksScroll, [0, 1], ["0%", "100%"]);

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 432; // card width (400) + gap (32)
      const currentScroll = sliderRef.current.scrollLeft;
      const targetScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;

      // GSAP smooth animation for scrollLeft
      gsap.to(sliderRef.current, {
        scrollLeft: targetScroll,
        duration: 0.8,
        ease: "power3.inOut",
        overwrite: true // Prevents animation overlap if clicked rapidly
      });
    }
  };
  const [activeService, setActiveService] = useState(serviceItems[3]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Entrance
      gsap.from(".hero-content > *", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out",
      });

      // Services Animation
      const serviceCards = servicesRef.current?.querySelectorAll(".service-card") ?? [];
      if (serviceCards.length > 0) {
        gsap.from(serviceCards, {
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 70%",
          },
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.3,
          ease: "power3.out",
        });
      }

      // Subtle horizontal lines reveal
      const revealLines = servicesRef.current?.querySelectorAll(".reveal-line") ?? [];
      if (revealLines.length > 0) {
        gsap.from(revealLines, {
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 80%",
          },
          scaleX: 0,
          transformOrigin: "left",
          duration: 1.5,
          ease: "expo.out",
        });
      }
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black overflow-x-hidden"
    >
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[100dvh] h-[100dvh] max-h-[900px] md:max-h-none md:h-screen w-full overflow-hidden flex flex-col justify-start pt-24 sm:pt-32 md:pt-48">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/alphafreight1.png"
              alt="Alpha Freight Logistics"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
          </div>

          {/* Grid Lines Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-20 hidden md:block">
            <div className="h-full w-px bg-white/20 absolute left-1/4" />
            <div className="h-full w-px bg-white/20 absolute left-1/2" />
            <div className="h-full w-px bg-white/20 absolute left-3/4" />
            <div className="w-full h-px bg-white/20 absolute top-1/4" />
            <div className="w-full h-px bg-white/20 absolute top-1/2" />
          </div>

          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full">
            <div className="hero-content max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mb-8"
              >
                <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em] leading-relaxed opacity-60">
                  Smart Logistics <br /> Solutions
                </p>
              </motion.div>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tighter mb-6 sm:mb-8 md:mb-12">
                Logistics that <br />
                move with <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 italic font-serif font-light">precision.</span>
              </h1>
            </div>
          </div>

          {/* Request Consultation Button - Absolute Position Bottom */}
          <div className="absolute bottom-24 sm:bottom-32 md:bottom-44 left-0 right-0 z-20 px-4 sm:px-6 lg:px-12">
            <div className="max-w-[1800px] mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="flex items-center group"
              >
                <Link
                  href="/contact"
                  className="flex items-center space-x-3 bg-white hover:bg-gray-100 transition-all duration-300 px-5 py-2.5 rounded-full"
                >
                  <span className="text-black font-medium text-[13px]">Request a Consultation</span>
                  <div className="w-7 h-7 rounded-full bg-[#BFFF07] flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                    <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-20 px-4 sm:px-6 lg:px-12">
            <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end border-t border-white/10 pt-6 sm:pt-10">
              <div className="max-w-xl">
                <p className="text-white/80 text-[12px] sm:text-[13px] font-normal leading-relaxed">
                  We deliver a smarter, faster, and more reliable way to move goods. Combining modern trucking, optimized routing, and real-time visibility across every shipment.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex flex-col items-end space-y-2 opacity-40">
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white">
                    <span>2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section - Directly under Hero */}
        <section className="py-16 md:py-32 bg-white relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Top Border Line */}
            <div className="w-full h-px bg-gray-100 mb-10 md:mb-20" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10 md:gap-20">
              {/* Left Side - Small Label */}
              <div className="lg:w-1/4">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-black opacity-40">
                  <span>+</span>
                  <span>What we do</span>
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="lg:w-3/4">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-black leading-tight tracking-tight mb-10 md:mb-24 max-w-4xl">
                  We empower businesses to move goods smarter, faster, and more sustainably with innovative logistics solutions that drive growth and transform global shipping.
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-16 mb-12 md:mb-20">
                  {/* Service 1 */}
                  <div className="space-y-8">
                    <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-lg">
                      <svg className="w-5 h-5 text-black opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black mb-4">Freight Forwarding</h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Reliable transportation of goods by air, land, or sea. We handle logistics, customs clearance, and delivery.
                      </p>
                    </div>
                  </div>

                  {/* Service 2 */}
                  <div className="space-y-8">
                    <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-lg">
                      <svg className="w-5 h-5 text-black opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black mb-4">Warehousing and Storage</h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Secure, climate-controlled storage with flexible options and real-time inventory management.
                      </p>
                    </div>
                  </div>

                  {/* Service 3 */}
                  <div className="space-y-8">
                    <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-lg">
                      <svg className="w-5 h-5 text-black opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black mb-4">Supply Chain Management</h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Customized logistics solutions to optimize your supply chain, reduce costs, and improve efficiency.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/about"
                    className="inline-block px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services / Philosophy Section */}
        <section ref={servicesRef} className="bg-black relative min-h-screen flex items-stretch">
          <div className="flex flex-col lg:flex-row w-full">
            {services.map((service, i) => (
              <div key={i} className="service-card group relative flex-1 min-h-[420px] sm:min-h-[500px] lg:min-h-[600px] lg:h-auto overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 last:border-r-0">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-start p-8 sm:p-12 lg:p-16">
                  <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/40">
                      {service.number}
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white tracking-tight">
                      {service.title}
                    </h3>
                  </div>

                  <p className="text-white/50 text-[14px] leading-relaxed max-w-sm">
                    {service.description}
                  </p>
                </div>

                {/* Bottom Line Hover Effect */}
                <div className="absolute bottom-0 left-0 h-1 bg-[#BFFF07] w-0 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>
        </section>

        {/* New Interactive Services Section */}
        <section className="py-16 md:py-32 bg-white relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Header with Counter */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-gray-100 pb-8 md:pb-12 mb-10 md:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-8xl font-medium text-black tracking-tight">Services</h2>
              <span className="text-2xl sm:text-4xl md:text-7xl font-medium text-black tracking-tight opacity-80">(05)</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 md:gap-20">
              {/* Left Side - Interactive List */}
              <div className="lg:w-1/2 space-y-4">
                {serviceItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center group cursor-pointer py-2"
                    onMouseEnter={() => setActiveService(item)}
                  >
                    <span className={`text-base sm:text-xl font-medium mr-4 sm:mr-12 transition-colors duration-300 ${activeService.id === item.id ? "text-black" : "text-gray-300 group-hover:text-black/50"}`}>
                      {item.id}
                    </span>
                    <h3 className={`text-xl sm:text-3xl md:text-5xl font-medium transition-all duration-300 ${activeService.id === item.id ? "text-black translate-x-2 sm:translate-x-4" : "text-gray-300 group-hover:text-black/50 group-hover:translate-x-1 sm:group-hover:translate-x-2"}`}>
                      {item.title}
                    </h3>
                  </div>
                ))}
              </div>

              {/* Right Side - Detailed View */}
              <div className="lg:w-1/2">
                <div className="space-y-8 max-w-xl ml-auto">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl shadow-2xl bg-black">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeService.id}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: "circOut" }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={activeService.image}
                          alt={activeService.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover opacity-80"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="space-y-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeService.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                      >
                        <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-md mb-6">
                          {activeService.desc}
                        </p>
                        <Link 
                          href={`/services/${activeService.id}`}
                          className="inline-block px-6 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-primary transition-all"
                        >
                          Explore {activeService.title}
                        </Link>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsroom Section */}
        <section ref={newsRef} className="py-16 md:py-32 bg-white relative overflow-hidden border-b border-gray-100">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-10 md:mb-16">
              <div>
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-black opacity-40 mb-4">
                  <span>+</span>
                  <span>Recent Articles</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-8xl font-medium text-black tracking-tight">Newsroom</h2>
              </div>
              
              <div className="flex space-x-4 sm:mt-12">
                <button 
                  onClick={() => scroll("left")}
                  className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => scroll("right")}
                  className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 transition-transform group-active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Articles Slider Container */}
            <div 
              ref={sliderRef}
              className="relative -mr-6 lg:-mr-12 overflow-x-auto no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex space-x-8 min-w-max pb-12 px-2">
                {newsArticles.map((article) => (
                  <motion.div 
                    key={article.id}
                    whileHover={{ y: -10 }}
                    className="w-[300px] md:w-[400px] group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl mb-8 bg-gray-100">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 300px, 400px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] font-bold text-white tracking-widest uppercase">
                        {article.tag}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-gray-400 tracking-wider">{article.date}</p>
                      <div className="flex justify-between items-start group">
                        <h3 className="text-lg font-medium text-black leading-snug max-w-[85%] group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center space-x-2 mt-20">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-black" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* How We Work Section - Vertical Timeline */}
        <section ref={howItWorksRef} className="py-32 bg-[#111] relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row gap-20">
              
              {/* Left Side - Sticky Header */}
              <div className="lg:w-1/2 lg:sticky lg:top-32 h-fit">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] mb-8">
                  <div className="w-2 h-2 bg-[#BFFF07]" />
                  <span>How we work</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-medium text-white leading-tight tracking-tight max-w-md">
                  Performance designed for your supply chain.
                </h2>
              </div>

              {/* Right Side - Vertical Steps */}
              <div className="lg:w-1/2 relative">
                {/* Vertical Line Container */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 hidden md:block">
                  {/* Yellow Progress Line */}
                  <motion.div 
                    style={{ height: lineHeight }}
                    className="absolute top-0 left-0 w-full bg-[#BFFF07] origin-top"
                  />
                </div>

                <div className="space-y-40">
                  {howItWorks.map((step, i) => (
                    <div key={step.id} className="relative pl-0 md:pl-20 group">
                      {/* Step Number on Line */}
                      <StepCircle 
                        id={step.id} 
                        index={i} 
                        scrollProgress={howItWorksScroll} 
                      />

                      <div className="space-y-10">
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white/5">
                          <Image
                            src={step.image}
                            alt={step.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          />
                        </div>
                        
                        <div className="space-y-6">
                          <h3 className="text-3xl font-medium text-white tracking-tight">
                            {step.title}
                          </h3>
                          <p className="text-white/50 text-[15px] leading-relaxed max-w-md">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials / Reviews Section */}
        <section className="py-40 bg-white relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-24">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-8">
                  <div className="w-2 h-2 bg-primary" />
                  <span>Testimonials</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-medium text-black leading-tight tracking-tight uppercase">
                  WHAT OUR <br /> <span className="text-gray-300">PARTNERS</span> SAY
                </h2>
              </div>
              <div className="hidden lg:block pb-6">
                <p className="text-gray-400 font-medium max-w-xs text-right">
                  Join 5,000+ businesses who trust Alpha Freight for their logistics.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {reviews.map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -15 }}
                  className="group p-10 bg-gray-50 rounded-[40px] hover:bg-black transition-all duration-500 flex flex-col justify-between min-h-[450px]"
                >
                  <div className="space-y-8">
                    {/* Stars */}
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, star) => (
                        <svg key={star} className="w-4 h-4 text-[#BFFF07]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    
                    <p className="text-xl font-medium leading-relaxed text-gray-600 group-hover:text-white/80 transition-colors">
                      "{review.text}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 pt-12">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#BFFF07] transition-all">
                      <Image
                        src={review.image}
                        alt={review.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-black group-hover:text-white transition-colors">{review.name}</h4>
                      <p className="text-xs font-bold text-gray-400 group-hover:text-[#BFFF07] transition-colors tracking-wider uppercase">
                        {review.role} @ {review.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-40 bg-white relative overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row gap-20">
              <div className="lg:w-1/3">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-8">
                  <div className="w-2 h-2 bg-primary" />
                  <span>Support</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-medium text-black leading-tight tracking-tight uppercase mb-12">
                  FREQUENTLY <br /> ASKED <span className="text-gray-300">QUESTIONS</span>
                </h2>
                <p className="text-gray-500 font-medium max-w-sm leading-relaxed">
                  Have more questions? Our support team is available 24/7 to help you with your logistics needs.
                </p>
              </div>

              <div className="lg:w-2/3 space-y-6">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={`group border-b border-gray-100 pb-6 transition-all duration-500 ${openFaq === i ? "border-primary" : ""}`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-center text-left py-6"
                    >
                      <span className={`text-xl md:text-2xl font-medium transition-colors duration-300 ${openFaq === i ? "text-primary" : "text-black group-hover:text-primary"}`}>
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-500 ${openFaq === i ? "bg-primary border-primary rotate-45" : "group-hover:border-primary"}`}>
                        <svg className={`w-5 h-5 transition-colors ${openFaq === i ? "text-white" : "text-black group-hover:text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                    
                    <AnimatePresence mode="wait">
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl pt-4 pb-12 font-medium">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
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
