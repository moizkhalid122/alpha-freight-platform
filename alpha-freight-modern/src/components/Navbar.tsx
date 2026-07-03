"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import Image from "next/image";

import { Bookmark } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  dropdown?: { name: string; href: string; desc: string }[];
  megaMenu?: {
    category: string;
    items: { name: string; href: string; desc: string }[];
  }[];
}

const navLinks: NavItem[] = [
  { name: "Home", href: "/" },
  { 
    name: "Products", 
    href: "#",
    megaMenu: [
      {
        category: "Software",
        items: [
          { name: "Supplier Portal", href: "/products/supplier-portal", desc: "Command center for shippers" },
          { name: "Alpha Mobile App", href: "/products/mobile-app", desc: "One app for Carriers & Suppliers" },
          { name: "White Label", href: "/products/white-label", desc: "Your brand, our tech" },
          { name: "API Docs", href: "/products/api", desc: "Integrate logistics into your app" },
        ]
      },
      {
        category: "Fleet Management",
        items: [
          { name: "Real-time Tracking", href: "/products/tracking", desc: "GPS & IoT cargo monitoring" },
          { name: "Route Optimizer", href: "/products/optimizer", desc: "AI-driven fuel & time saving" },
          { name: "Digital POD", href: "/products/pod", desc: "Paperless proof of delivery" },
        ]
      },
      {
        category: "Intelligence",
        items: [
          { name: "Analytics Dashboard", href: "/products/analytics", desc: "Data-driven shipping insights" },
          { name: "Market Rates", href: "/products/rates", desc: "Live freight market pricing" },
          { name: "Predictive AI", href: "/products/ai", desc: "Forecast demand & delays" },
        ]
      }
    ]
  },
  { 
    name: "Solution", 
    href: "/solution",
    megaMenu: [
      {
        category: "Marketplace",
        items: [
          { name: "Overview", href: "/solution", desc: "Complete marketplace overview" },
          { name: "Carrier Directory", href: "/directory", desc: "Browse trusted freight partners" },
          { name: "Supplier Directory", href: "/suppliers", desc: "Connect with industrial suppliers" },
          { name: "Available Loads", href: "/available-loads", desc: "Find freight opportunities" },
          { name: "Smart Matching", href: "/products/smart-matching", desc: "AI-driven load pairing" },
        ]
      },
      {
        category: "Resources",
        items: [
          { name: "Academy", href: "/academy", desc: "Driver training & certification" },
          { name: "Support Center", href: "/support", desc: "24/7 help and guidance" },
          { name: "Documentation", href: "/docs", desc: "Platform guides & tutorials" },
          { name: "Brand Kit", href: "/brand-kit", desc: "Logos, colors, and usage rules" },
        ]
      },
      {
        category: "Ecosystem",
        items: [
          { name: "Network", href: "/network", desc: "Our global infrastructure" },
          { name: "Technology", href: "/products/ai-assistant", desc: "AI-powered logistics" },
          { name: "Partners", href: "/partners", desc: "Join our strategic network" },
        ]
      }
    ]
  },
  { name: "Services", href: "/services" },
  { name: "About us", href: "/about" },
  { name: "Investor", href: "/investor" },
  { name: "Blog", href: "/blog" },
  { name: "Career", href: "/career" },
];

export default function Navbar({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [shortlistCount, setShortlistCount] = useState(0);
  const mobileMenuOpenRef = useRef(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setHoveredLink(null);
  }, []);

  mobileMenuOpenRef.current = mobileMenuOpen;

  useEffect(() => {
    const updateCount = () => {
      const carrierShortlist = JSON.parse(localStorage.getItem('alpha_shortlist') || '[]');
      const supplierShortlist = JSON.parse(localStorage.getItem('alpha_supplier_shortlist') || '[]');
      setShortlistCount(carrierShortlist.length + supplierShortlist.length);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('alpha_shortlist_updated', updateCount);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (mobileMenuOpenRef.current) {
        closeMobileMenu();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('alpha_shortlist_updated', updateCount);
    };
  }, [closeMobileMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isDark = variant === "dark";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? isDark
              ? "bg-white/95 backdrop-blur-md py-3 md:py-4 border-b border-slate-100 shadow-sm"
              : "bg-black/90 backdrop-blur-md py-3 md:py-4"
            : "bg-transparent py-4 md:py-8"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group min-w-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 shrink-0">
              <Image
                src="/logo.png"
                alt="Alpha Freight Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <span className={`text-base sm:text-xl font-bold tracking-tighter truncate ${isDark ? "text-slate-900" : "text-white"}`}>
              ALPHA FREIGHT
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div 
                key={link.name}
                className="relative"
                onMouseEnter={() => setHoveredLink(link.name)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <Link
                  href={link.href}
                  className={`text-[13px] font-medium transition-colors flex items-center gap-1 py-2 ${
                    isDark ? "text-slate-600 hover:text-slate-900" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.name}
                  {(link.dropdown || link.megaMenu) && (
                    <svg className={`w-3 h-3 transition-transform duration-300 ${hoveredLink === link.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>

                {/* Dropdown Menu (Standard) */}
                <AnimatePresence>
                  {link.dropdown && hoveredLink === link.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                    >
                      <div className={`w-[450px] backdrop-blur-xl border rounded-2xl overflow-hidden shadow-2xl p-6 grid grid-cols-1 gap-4 ${
                        isDark ? "bg-white/95 border-slate-100" : "bg-black/90 border-white/10"
                      }`}>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group/item flex items-start gap-4 p-4 rounded-xl transition-all ${
                              isDark ? "hover:bg-slate-50" : "hover:bg-white/5"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              isDark ? "bg-blue-600/10 text-blue-600" : "bg-[#BFFF07]/10 text-[#BFFF07] group-hover/item:bg-[#BFFF07] group-hover/item:text-black"
                            }`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                            <div>
                              <div className={`text-[14px] font-bold mb-1 uppercase tracking-wider ${isDark ? "text-slate-900" : "text-white"}`}>{item.name}</div>
                              <div className={`text-[12px] font-medium leading-tight ${isDark ? "text-slate-500" : "text-white/40"}`}>{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mega Menu (Stripe Style) */}
                <AnimatePresence>
                  {link.megaMenu && hoveredLink === link.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="fixed left-0 right-0 top-[80px] px-6 lg:px-12 flex justify-center pointer-events-none"
                    >
                      <div className="w-full max-w-[1200px] bg-white/95 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)] pointer-events-auto p-12">
                        <div className="grid grid-cols-3 gap-12">
                          {link.megaMenu.map((column) => (
                            <div key={column.category} className="space-y-8">
                              <h4 className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] border-b border-black/5 pb-4">
                                {column.category}
                              </h4>
                              <div className="grid gap-6">
                                {column.items.map((item) => (
                                  <Link 
                                    key={item.name} 
                                    href={item.href}
                                    className="group/item block space-y-1"
                                  >
                                    <div className="text-[15px] font-bold text-black flex items-center gap-2 group-hover/item:text-blue-600 transition-colors">
                                      {item.name}
                                      <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                    <p className="text-[13px] text-black/50 font-medium leading-snug">
                                      {item.desc}
                                    </p>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-between">
                          <div className="flex items-center gap-8">
                            <Link href="/products/roadmap" className="text-[11px] font-bold text-black/40 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Product Roadmap
                            </Link>
                            <Link href="/products/releases" className="text-[11px] font-bold text-black/40 uppercase tracking-widest hover:text-black transition-colors">
                              Recent Releases
                            </Link>
                          </div>
                          <Link href="/contact" className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-2">
                            Request a live demo
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/directory/shortlist"
              className={`relative p-2 rounded-full transition-all ${
                isDark ? "hover:bg-slate-100 text-slate-600" : "hover:bg-white/10 text-white"
              }`}
              title="View Shortlist"
            >
              <Bookmark className={`w-5 h-5 ${shortlistCount > 0 ? 'fill-current' : ''}`} />
              {shortlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {shortlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/auth/select"
              className={`px-6 py-2 rounded-full border text-[13px] font-medium transition-all ${
                isDark ? "border-slate-200 text-slate-900 hover:bg-slate-50" : "border-white/20 text-white hover:bg-white hover:text-black"
              }`}
            >
              Login
            </Link>
            <Link
              href="/contact"
              className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all ${
                isDark ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Contact us
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className={`lg:hidden p-2 shrink-0 ${isDark ? "text-slate-900" : "text-white"}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-full h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-full h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu — outside nav to avoid fixed-position bugs on iOS */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className={`fixed inset-0 z-[100] flex flex-col ${
              isDark ? "bg-white text-slate-900" : "bg-black text-white"
            }`}
          >
            <div className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b ${
              isDark ? "border-slate-200" : "border-white/10"
            }`}>
              <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-900" : "text-white"}`}>
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobileMenu}
                className={`text-3xl leading-none p-2 ${isDark ? "text-slate-900" : "text-white"}`}
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6">
              <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
                {navLinks.map((link) => (
                  <div key={link.name} className="flex flex-col space-y-3 border-b border-white/10 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={link.href === "#" ? "/products/supplier-portal" : link.href}
                        className={`text-2xl sm:text-3xl font-bold tracking-tight uppercase ${
                          isDark ? "text-slate-900 hover:text-blue-600" : "text-white hover:text-[#BFFF07]"
                        }`}
                        onClick={() => !(link.dropdown || link.megaMenu) && closeMobileMenu()}
                      >
                        {link.name}
                      </Link>
                      {(link.dropdown || link.megaMenu) && (
                        <button 
                          type="button"
                          aria-label={`Expand ${link.name}`}
                          onClick={() => setHoveredLink(hoveredLink === link.name ? null : link.name)}
                          className={`p-2 shrink-0 ${isDark ? "text-slate-500" : "text-white/50"}`}
                        >
                          <svg className={`w-5 h-5 transition-transform ${hoveredLink === link.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {(link.dropdown || link.megaMenu) && hoveredLink === link.name && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className={`flex flex-col space-y-3 pl-4 border-l ${
                          isDark ? "border-slate-200" : "border-white/10"
                        }`}
                      >
                        {link.dropdown?.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`text-base font-medium transition-colors ${
                              isDark ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            {item.name}
                          </Link>
                        ))}
                        {link.megaMenu?.map((column) => (
                          <div key={column.category} className="space-y-3">
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${
                              isDark ? "text-blue-600" : "text-[#BFFF07]"
                            }`}>{column.category}</div>
                            <div className="flex flex-col space-y-2">
                              {column.items.map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`text-base font-medium transition-colors ${
                                    isDark ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white"
                                  }`}
                                  onClick={closeMobileMenu}
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
                
                <div className="pt-6 flex flex-col gap-3">
                  <Link
                    href="/auth/select"
                    className={`w-full py-4 rounded-2xl text-center font-bold uppercase tracking-widest border ${
                      isDark
                        ? "bg-slate-100 text-slate-900 border-slate-200"
                        : "bg-white/10 text-white border-white/10"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full py-4 rounded-2xl bg-[#BFFF07] text-black text-center font-bold uppercase tracking-widest"
                    onClick={closeMobileMenu}
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
