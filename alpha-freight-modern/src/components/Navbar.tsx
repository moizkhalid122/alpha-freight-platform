"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import Image from "next/image";

import {
  ArrowRight,
  Bookmark,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calculator,
  Car,
  ClipboardList,
  Code2,
  Factory,
  FileCheck,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Network,
  Package,
  Pill,
  Route,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  Banknote,
  type LucideIcon,
} from "lucide-react";

import NavbarAiLottie from "@/components/NavbarAiLottie";

const AI_NAV_LABEL = "Alpha AI";

const menuItemIcons: Record<string, LucideIcon> = {
  "/products/supplier-portal": LayoutDashboard,
  "/products/mobile-app": Smartphone,
  "/products/white-label": Store,
  "/products/api": Code2,
  "/products/tracking": MapPin,
  "/products/optimizer": Route,
  "/products/pod": FileCheck,
  "/products/analytics": BarChart3,
  "/products/rates": TrendingUp,
  "/products/ai": Sparkles,
  "/ai": Bot,
  "/solution": Package,
  "/directory": Truck,
  "/suppliers": Factory,
  "/available-loads": ClipboardList,
  "/products/smart-matching": Sparkles,
  "/industries": Globe2,
  "/industries/construction": Building2,
  "/industries/retail": ShoppingBag,
  "/industries/food": UtensilsCrossed,
  "/industries/pharmaceuticals": Pill,
  "/industries/automotive": Car,
  "/industries/general-freight": Package,
  "/tools": Calculator,
  "/academy": GraduationCap,
  "/learning-series": BookOpen,
  "/support": Wrench,
  "/docs": BookOpen,
  "/brand-kit": Store,
  "/network": Network,
  "/partners": Users,
};

function menuIcon(href: string): LucideIcon {
  return menuItemIcons[href] ?? ArrowRight;
}

function MegaMenuLink({ href, name }: { href: string; name: string }) {
  const Icon = menuIcon(href);
  return (
    <Link
      href={href}
      className="group/item relative z-10 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/5"
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0 text-neutral-500 transition-colors group-hover/item:text-white"
        strokeWidth={1.5}
      />
      <span className="text-[14px] font-medium text-white/90 group-hover/item:text-white">{name}</span>
    </Link>
  );
}

interface NavItem {
  name: string;
  href: string;
  dropdown?: { name: string; href: string; desc: string }[];
  megaMenu?: {
    category: string;
    items: { name: string; href: string; desc: string }[];
  }[];
  whyMenu?: {
    cards: { title: string; desc: string; href: string; image: string }[];
    sidebarTitle: string;
    features: {
      title: string;
      desc: string;
      href: string;
      icon: LucideIcon;
      useAiLottie?: boolean;
    }[];
  };
}

function hasFlyoutMenu(link: NavItem) {
  return Boolean(link.megaMenu || link.whyMenu);
}

const whyAlphaMenu = {
  cards: [
    {
      title: "Get started fast",
      desc: "You could be moving freight by tomorrow.",
      href: "/auth/signup?role=supplier",
      image: "/images/pricing-card-supplier.png",
    },
    {
      title: "Switch to Alpha Freight",
      desc: "More carriers. Better rates. No monthly fee.",
      href: "/solution",
      image: "/images/pricing-card-carrier.jpg",
    },
    {
      title: "Trusted by UK operators",
      desc: "From owner-drivers to enterprise fleets.",
      href: "/directory",
      image: "/images/pricing-card-enterprise.png",
    },
  ],
  sidebarTitle: "Built into every account",
  features: [
    {
      title: "Alpha AI",
      desc: "Your freight-obsessed AI assistant.",
      href: "/ai",
      icon: Bot,
      useAiLottie: true,
    },
    {
      title: "7-day payout",
      desc: "Guaranteed carrier payments.",
      href: "/about",
      icon: Banknote,
    },
  ],
};

const navLinks: NavItem[] = [
  { name: "Home", href: "/" },
  {
    name: "Why Alpha",
    href: "/about",
    whyMenu: whyAlphaMenu,
  },
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
          { name: "Free UK Freight AI", href: "/ai", desc: "Ask haulage questions — no login" },
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
        category: "Industries",
        items: [
          { name: "All Industries", href: "/industries", desc: "Sector freight solutions UK" },
          { name: "Construction", href: "/industries/construction", desc: "Aggregates, steel & site haulage" },
          { name: "Retail", href: "/industries/retail", desc: "Store & DC distribution" },
          { name: "Food & Beverage", href: "/industries/food", desc: "Chilled & ambient haulage" },
        ]
      },
      {
        category: "Resources",
        items: [
          { name: "All Free Tools", href: "/tools", desc: "UK freight calculators & marketplace utilities" },
          { name: "Academy", href: "/academy", desc: "Driver training & certification" },
          { name: "Learning Series", href: "/learning-series", desc: "Free YouTube freight lessons" },
          { name: "Support Center", href: "/support", desc: "24/7 help and guidance" },
          { name: "Documentation", href: "/docs", desc: "Platform guides & tutorials" },
          { name: "Brand Kit", href: "/brand-kit", desc: "Logos, colors, and usage rules" },
        ]
      },
      {
        category: "Ecosystem",
        items: [
          { name: "Network", href: "/network", desc: "Our global infrastructure" },
          { name: "Technology", href: "/ai", desc: "Free UK freight AI assistant" },
          { name: "Partners", href: "/partners", desc: "Join our strategic network" },
        ]
      }
    ]
  },
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: AI_NAV_LABEL, href: "/ai" },
  { name: "About us", href: "/about" },
  { name: "Leadership", href: "/leadership" },
  { name: "Investor", href: "/investor" },
  { name: "Blog", href: "/blog" },
  { name: "Career", href: "/career" },
];

export default function Navbar({
  variant = "light",
  solidWhite = false,
}: {
  variant?: "light" | "dark";
  /** Always show solid white header (e.g. industry landing pages). */
  solidWhite?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(72);
  const mobileMenuOpenRef = useRef(false);
  const megaMenuCloseTimer = useRef<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const activeFlyoutLink = navLinks.find(
    (link) => hasFlyoutMenu(link) && hoveredLink === link.name,
  );

  const openMegaMenu = useCallback((name: string) => {
    if (megaMenuCloseTimer.current) {
      window.clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
    setHoveredLink(name);
  }, []);

  const scheduleMegaMenuClose = useCallback(() => {
    if (megaMenuCloseTimer.current) {
      window.clearTimeout(megaMenuCloseTimer.current);
    }
    megaMenuCloseTimer.current = window.setTimeout(() => {
      setHoveredLink(null);
      megaMenuCloseTimer.current = null;
    }, 320);
  }, []);

  const cancelMegaMenuClose = useCallback(() => {
    if (megaMenuCloseTimer.current) {
      window.clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setHoveredLink(null);
  }, []);

  mobileMenuOpenRef.current = mobileMenuOpen;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => setHeaderHeight(header.offsetHeight);
    syncHeaderHeight();

    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [hoveredLink, isScrolled, solidWhite, variant]);

  useEffect(() => {
    const updateCount = () => {
      const carrierShortlist = JSON.parse(localStorage.getItem("alpha_shortlist") || "[]");
      const supplierShortlist = JSON.parse(localStorage.getItem("alpha_supplier_shortlist") || "[]");
      setShortlistCount(carrierShortlist.length + supplierShortlist.length);
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("alpha_shortlist_updated", updateCount);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (mobileMenuOpenRef.current) {
        closeMobileMenu();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("alpha_shortlist_updated", updateCount);
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

  const isDark = variant === "dark" || solidWhite;
  const showSolidNav = solidWhite || isScrolled;
  const megaMenuOpen = Boolean(activeFlyoutLink);

  return (
    <>
      <div
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 ${megaMenuOpen ? "bg-black" : ""}`}
        onMouseLeave={() => {
          if (activeFlyoutLink) scheduleMegaMenuClose();
        }}
      >
        <nav
          ref={navRef}
          className={`transition-all duration-300 ${
            megaMenuOpen
              ? "py-3 md:py-4"
              : showSolidNav
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
            <span className={`text-sm lg:text-base xl:text-xl font-bold tracking-tighter truncate ${
              megaMenuOpen ? "text-white" : isDark ? "text-slate-900" : "text-white"
            }`}>
              ALPHA FREIGHT
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center lg:space-x-3 xl:space-x-5 2xl:space-x-8 min-w-0 flex-1 justify-center mx-2 xl:mx-4">
            {navLinks.filter((link) => link.href !== "/ai").map((link) => (
                <div
                key={link.name}
                className={`relative shrink-0 ${link.name === "Investor" || link.name === "Career" ? "hidden xl:block" : ""}`}
                onMouseEnter={() => {
                  cancelMegaMenuClose();
                  if (hasFlyoutMenu(link)) {
                    openMegaMenu(link.name);
                  } else {
                    setHoveredLink(null);
                  }
                }}
                onMouseLeave={() => {
                  if (!hasFlyoutMenu(link)) setHoveredLink(null);
                }}
              >
                {hasFlyoutMenu(link) && hoveredLink === link.name ? (
                  <div className="pointer-events-none absolute inset-x-0 top-full z-20 h-5" aria-hidden />
                ) : null}
                {hasFlyoutMenu(link) ? (
                  <button
                    type="button"
                    className={`text-[12px] xl:text-[13px] font-medium transition-colors flex items-center gap-1 py-2 whitespace-nowrap ${
                      megaMenuOpen || !isDark
                        ? hoveredLink === link.name
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                        : hoveredLink === link.name
                          ? "text-slate-900"
                          : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-expanded={hoveredLink === link.name}
                    aria-haspopup="true"
                  >
                    {link.name}
                    <svg
                      className={`w-3 h-3 transition-transform duration-300 ${
                        hoveredLink === link.name ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={`text-[12px] xl:text-[13px] font-medium transition-colors flex items-center gap-1 py-2 whitespace-nowrap ${
                      megaMenuOpen || !isDark
                        ? "text-white/70 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                    {link.dropdown ? (
                      <svg
                        className={`w-3 h-3 transition-transform duration-300 ${hoveredLink === link.name ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : null}
                  </Link>
                )}

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
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="hidden lg:flex items-center shrink-0 lg:gap-2 xl:gap-3">
            <Link
              href="/directory/shortlist"
              className={`relative p-2 rounded-full transition-all shrink-0 ${
                megaMenuOpen
                  ? "hover:bg-white/10 text-white"
                  : isDark
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-white/10 text-white"
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
              href="/auth/modes"
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[11px] xl:px-5 xl:py-2 xl:text-[13px] font-medium transition-all ${
                megaMenuOpen
                  ? "border-white/20 text-white hover:bg-white hover:text-black"
                  : isDark
                    ? "border-slate-200 text-slate-900 hover:bg-slate-50"
                    : "border-white/20 text-white hover:bg-white hover:text-black"
              }`}
            >
              Sign up
            </Link>
            <Link
              href="/contact"
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[11px] xl:px-5 xl:py-2 xl:text-[13px] font-medium transition-all ${
                megaMenuOpen
                  ? "bg-white text-black hover:bg-neutral-100"
                  : isDark
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-black hover:bg-gray-100"
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

        {/* Flyout menus — Why Alpha + Products + Solution */}
        <AnimatePresence>
          {activeFlyoutLink?.whyMenu && (
            <motion.div
              key="why-alpha"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.22, ease: "easeOut" },
              }}
              className="hidden overflow-hidden bg-black lg:block"
              onMouseEnter={cancelMegaMenuClose}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -6 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-12 xl:px-16">
                  <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {activeFlyoutLink.whyMenu.cards.map((card, index) => (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.32,
                            delay: 0.06 + index * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <Link href={card.href} className="group/card block">
                            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                              <Image
                                src={card.image}
                                alt={card.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                                sizes="(max-width: 1280px) 33vw, 320px"
                              />
                            </div>
                            <h3 className="mt-4 text-[17px] font-semibold leading-snug text-white">
                              {card.title}
                            </h3>
                            <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">
                              {card.desc}
                            </p>
                          </Link>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="border-t border-white/10 pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-2"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                        {activeFlyoutLink.whyMenu.sidebarTitle}
                      </p>
                      <div className="mt-6 space-y-5">
                        {activeFlyoutLink.whyMenu.features.map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <Link
                              key={feature.title}
                              href={feature.href}
                              className="group/feature flex items-start gap-4"
                            >
                              <div
                                className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden ${
                                  feature.useAiLottie
                                    ? ""
                                    : "rounded-xl border border-violet-500/30 bg-violet-950/80"
                                }`}
                              >
                                {feature.useAiLottie ? (
                                  <NavbarAiLottie className="h-12 w-12" />
                                ) : (
                                  <Icon className="h-7 w-7 text-violet-300" strokeWidth={1.5} />
                                )}
                              </div>
                              <div className="min-w-0 pt-1">
                                <p className="text-[15px] font-semibold text-white group-hover/feature:text-white/90">
                                  {feature.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                                  {feature.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeFlyoutLink?.megaMenu && (
            <motion.div
              key={activeFlyoutLink.name}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.22, ease: "easeOut" },
              }}
              className="hidden overflow-hidden bg-black lg:block"
              onMouseEnter={cancelMegaMenuClose}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -6 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
              <div className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-12 xl:px-16">
                <div
                  className={`grid gap-x-8 gap-y-10 ${
                    activeFlyoutLink.name === "Solution"
                      ? "xl:grid-cols-[minmax(0,1fr)_minmax(220px,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_300px] lg:grid-cols-2"
                      : "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_300px] lg:grid-cols-3"
                  }`}
                >
                  {(activeFlyoutLink.name === "Solution"
                    ? activeFlyoutLink.megaMenu
                    : activeFlyoutLink.megaMenu.slice(0, 3)
                  ).map((column, columnIndex) => (
                    <motion.div
                      key={column.category}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: 0.06 + columnIndex * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative min-w-0"
                    >
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                        {column.category}
                      </h4>
                      {column.category === "Industries" ? (
                        <ul className="mt-5 space-y-0.5">
                          {column.items.map((item) => (
                            <li key={item.name}>
                              <MegaMenuLink href={item.href} name={item.name} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="mt-5 space-y-0.5">
                          {column.items.map((item) => (
                            <li key={item.name}>
                              <MegaMenuLink href={item.href} name={item.name} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}

                  {/* Right feature column */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 min-w-0 space-y-6 border-t border-white/10 pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"
                  >
                    {activeFlyoutLink.name === "Products" ? (
                      <>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                            Platform updates
                          </p>
                          <Link
                            href="/products/releases"
                            className="group/releases relative mt-4 block overflow-hidden rounded-2xl border border-white/10"
                          >
                            <Image
                              src="/header.jpg"
                              alt="Alpha Freight product releases"
                              width={320}
                              height={220}
                              className="h-[168px] w-full object-cover transition-transform duration-500 group-hover/releases:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <p className="text-[13px] font-semibold leading-snug text-white">
                                Product releases — new freight tools twice a year
                              </p>
                            </div>
                          </Link>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                            Latest updates
                          </p>
                          <ul className="mt-4 space-y-3">
                            {[
                              { name: "Smart Matching", href: "/products/smart-matching" },
                              { name: "Free UK Freight AI", href: "/ai" },
                              { name: "Real-time Tracking", href: "/products/tracking" },
                            ].map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-[14px] text-white/75 transition hover:text-white"
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                            Featured
                          </p>
                          <Link
                            href="/awards"
                            className="group/awards relative mt-4 block overflow-hidden rounded-2xl border border-white/10"
                          >
                            <Image
                              src="/header.jpg"
                              alt="Alpha Freight Awards 2027"
                              width={320}
                              height={220}
                              className="h-[168px] w-full object-cover transition-transform duration-500 group-hover/awards:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
                                2027 Ceremony
                              </p>
                              <p className="mt-1 text-[13px] font-semibold leading-snug text-white">
                                Alpha Freight Awards
                              </p>
                            </div>
                          </Link>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                            Popular industries
                          </p>
                          <ul className="mt-4 space-y-3">
                            {[
                              { name: "Pharmaceuticals", href: "/industries/pharmaceuticals" },
                              { name: "Automotive", href: "/industries/automotive" },
                              { name: "General freight", href: "/industries/general-freight" },
                            ].map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-[14px] text-white/75 transition hover:text-white"
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-white/10 bg-neutral-950/80">
                <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-12 xl:px-16">
                  <div className="flex flex-wrap items-center gap-6">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BFFF07]">
                      {activeFlyoutLink.name === "Products" ? "Extend Alpha Freight" : "Explore the platform"}
                    </span>
                    {activeFlyoutLink.name === "Products" ? (
                      <>
                        <Link href="/products/roadmap" className="text-[12px] text-white/60 transition hover:text-white">
                          Product roadmap
                        </Link>
                        <Link href="/products/releases" className="text-[12px] text-white/60 transition hover:text-white">
                          Recent releases
                        </Link>
                        <Link href="/products/api" className="text-[12px] text-white/60 transition hover:text-white">
                          API docs
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/industries" className="text-[12px] text-white/60 transition hover:text-white">
                          All industries
                        </Link>
                        <Link href="/tools" className="text-[12px] text-white/60 transition hover:text-white">
                          Free freight tools
                        </Link>
                        <Link href="/support" className="text-[12px] text-white/60 transition hover:text-white">
                          Support center
                        </Link>
                      </>
                    )}
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white transition hover:text-white/70"
                  >
                    Request a demo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page backdrop behind flyout menu */}
      <AnimatePresence>
        {activeFlyoutLink && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-[45] hidden bg-black/50 lg:block"
            style={{ top: headerHeight }}
            onClick={() => setHoveredLink(null)}
          />
        )}
      </AnimatePresence>

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
                        className={
                          link.href === "/ai"
                            ? `inline-flex w-fit items-center gap-1 rounded-full border px-5 py-3 text-sm font-medium transition-all ${
                                isDark
                                  ? "border-slate-200 text-slate-900 hover:bg-slate-50"
                                  : "border-white/20 text-white hover:bg-white hover:text-black"
                              }`
                            : `text-2xl sm:text-3xl font-bold tracking-tight uppercase ${
                                isDark ? "text-slate-900 hover:text-blue-600" : "text-white hover:text-[#BFFF07]"
                              }`
                        }
                        onClick={() => !(link.dropdown || hasFlyoutMenu(link)) && closeMobileMenu()}
                      >
                        {link.href === "/ai" ? (
                          <>
                            <NavbarAiLottie className="h-8 w-8 shrink-0 -mr-0.5" />
                            <span className="-ml-0.5">{AI_NAV_LABEL}</span>
                          </>
                        ) : (
                          link.name
                        )}
                      </Link>
                      {(link.dropdown || hasFlyoutMenu(link)) && (
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

                    {(link.dropdown || hasFlyoutMenu(link)) && hoveredLink === link.name && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className={`flex flex-col space-y-3 pl-4 border-l ${
                          isDark ? "border-slate-200" : "border-white/10"
                        }`}
                      >
                        {link.whyMenu?.cards.map((card) => (
                          <Link
                            key={card.title}
                            href={card.href}
                            className={`text-base font-medium transition-colors ${
                              isDark ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            {card.title}
                          </Link>
                        ))}
                        {link.whyMenu?.features.map((feature) => (
                          <Link
                            key={feature.title}
                            href={feature.href}
                            className={`text-base font-medium transition-colors ${
                              isDark ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            {feature.title}
                          </Link>
                        ))}
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
                              {column.category === "Ecosystem" ? (
                                <Link
                                  href="/awards"
                                  className="group/awards relative mt-5 block overflow-hidden rounded-xl border border-black/10"
                                  onClick={closeMobileMenu}
                                >
                                  <Image
                                    src="/header.jpg"
                                    alt="Alpha Freight Awards 2027"
                                    width={400}
                                    height={280}
                                    className="h-44 w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
                                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">
                                      Alpha Freight Awards
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white">
                                      UK logistics awards ceremony
                                    </p>
                                  </div>
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
                
                <div className="pt-6 flex flex-col gap-3">
                  <Link
                    href="/auth/modes"
                    className={`w-full py-4 rounded-2xl text-center font-bold uppercase tracking-widest border ${
                      isDark
                        ? "bg-slate-100 text-slate-900 border-slate-200"
                        : "bg-white/10 text-white border-white/10"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Sign up
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
