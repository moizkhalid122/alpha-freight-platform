"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ArrowRight,
  Send,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black pt-32 pb-12 overflow-hidden relative">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        {/* Big Animated Logo Background */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-[0.02] select-none pointer-events-none">
          <h2 className="text-[35vw] font-black tracking-tighter text-white whitespace-nowrap">
            ALPHA
          </h2>
        </div>

        {/* Top Branding Section - NEXT LEVEL */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-20 mb-24 relative z-10 border-b border-white/5 pb-20">
          <div className="space-y-8 max-w-xl">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="Alpha Freight Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white uppercase">
                ALPHA FREIGHT
              </span>
            </div>
            <p className="text-white/50 text-lg font-medium leading-relaxed italic">
              "The next generation of logistics powered by AI and precision engineering. Connecting the UK freight industry like never before."
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products/ai-assistant"
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition-all hover:bg-[#BFFF07]"
              >
                Explore AI Assistant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto space-y-10 min-w-[350px]">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.4em]">Stay Updated</h4>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="YOUR EMAIL ADDRESS" 
                className="w-full bg-transparent border-b border-white/10 py-6 text-white text-sm focus:outline-none focus:border-[#BFFF07] transition-colors placeholder:text-white/10 font-bold tracking-widest uppercase"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-[#BFFF07] transition-colors group-hover:translate-x-2 duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <p className="text-white/20 text-[10px] font-medium leading-relaxed uppercase tracking-wider">
              By subscribing, you agree to our privacy policy and terms of service.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-32 relative z-10">
          {/* Main Solutions */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Solutions</h4>
            <ul className="space-y-3">
              {[
                { name: "Carrier Directory", href: "/directory" },
                { name: "Supplier Directory", href: "/suppliers" },
                { name: "AI Assistant", href: "/products/ai-assistant" },
                { name: "Freight Marketplace", href: "/docs?tab=finding-loads" },
                { name: "Smart Bidding", href: "/docs?tab=bidding" },
                { name: "Digital POD", href: "/products/pod" },
                { name: "Real-time Tracking", href: "/docs?tab=tracking" },
                { name: "Carrier Vetting", href: "/docs?tab=vetting" },
                { name: "7-Day Payouts", href: "/7-day-payouts" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{item.name}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Hub */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Developers</h4>
            <ul className="space-y-3">
              {[
                { name: "API Documentation", href: "/docs?tab=api-auth" },
                { name: "SDKs & Libraries", href: "/docs?tab=sdks" },
                { name: "Webhooks Guide", href: "/docs?tab=webhooks" },
                { name: "System Status", href: "/system-status" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{item.name}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Resources</h4>
            <ul className="space-y-3">
              {[
                { name: "Knowledge Base", href: "/knowledge-base" },
                { name: "Help Center", href: "/support" },
                { name: "Company Blog", href: "/blog" },
                { name: "Success Stories", href: "/success-stories" }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{item.name}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Connect */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Company</h4>
            <ul className="space-y-3">
              {[
                { name: "About Alpha Freight", href: "/about" },
                { name: "Company Overview", href: "/company-overview" },
                { name: "Investors", href: "/investor" },
                { name: "Careers", href: "/career" },
                { name: "Contact Sales", href: "/contact" },
                { name: "Support Portal", href: "/support" }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{item.name}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
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
  );
}

interface CinematicCTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function CinematicCTA({ 
  title = "Moving Your Business Forward", 
  subtitle = "LET'S GET TO WORK", 
  buttonText = "Contact Us",
  buttonHref = "/contact"
}: CinematicCTAProps) {
  return (
    <section className="relative h-[600px] w-full overflow-hidden flex flex-col items-center justify-center text-center group">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cta-bg.avif"
          alt={title}
          fill
          sizes="100vw"
          className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8 px-6">
        <div className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
          <span>+</span>
          <span>{subtitle === "LET'S GET TO WORK" ? subtitle : "GET STARTED"}</span>
        </div>
        
        <h2 className="text-5xl md:text-[5.5rem] font-medium text-white tracking-tight leading-none uppercase max-w-5xl">
          {title}
        </h2>

        {subtitle !== "LET'S GET TO WORK" && (
          <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto uppercase tracking-wider">
            {subtitle}
          </p>
        )}

        <Link 
          href={buttonHref}
          className="inline-block px-10 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-medium text-sm hover:bg-white hover:text-black transition-all duration-300 shadow-2xl uppercase tracking-widest"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
