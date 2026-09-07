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
import { TOOL_FOOTER_LINKS } from "@/lib/tools-hub-data";
import { useSiteT } from "@/components/SiteLanguageProvider";

export function Footer() {
  const t = useSiteT();

  const solutionLinks = [
    { nameKey: "footer.findLoads", href: "/find-loads" },
    { nameKey: "footer.postLoads", href: "/post-loads" },
    { nameKey: "footer.supplierInfo", href: "/supplier-information" },
    { nameKey: "footer.carrierInfo", href: "/carrier-information" },
    { nameKey: "mega.carrierDirectory", href: "/directory" },
    { nameKey: "mega.supplierDirectory", href: "/suppliers" },
    { nameKey: "footer.freeUkAi", href: "/ai" },
    { nameKey: "footer.aiAssistant", href: "/products/ai-assistant" },
    { nameKey: "footer.freightMarketplace", href: "/docs?tab=finding-loads" },
    { nameKey: "footer.smartBidding", href: "/docs?tab=bidding" },
    { nameKey: "mega.pod", href: "/products/pod" },
    { nameKey: "mega.tracking", href: "/docs?tab=tracking" },
    { nameKey: "footer.carrierVetting", href: "/docs?tab=vetting" },
    { nameKey: "footer.sevenDayPayouts", href: "/7-day-payouts" },
    { nameKey: "nav.pricing", href: "/pricing" },
    { nameKey: "footer.awards", href: "/awards" },
  ];

  const developerLinks = [
    { nameKey: "footer.apiDocs", href: "/docs?tab=api-auth" },
    { nameKey: "footer.sdks", href: "/docs?tab=sdks" },
    { nameKey: "footer.webhooks", href: "/docs?tab=webhooks" },
    { nameKey: "footer.systemStatus", href: "/system-status" },
  ];

  const resourceLinks = [
    { nameKey: "footer.knowledgeBase", href: "/knowledge-base" },
    { nameKey: "footer.freeUkAi", href: "/ai" },
    { nameKey: "footer.findLoadsGuide", href: "/ai/find-loads" },
    { nameKey: "footer.rpmCalculator", href: "/ai/rpm-calculator" },
    { nameKey: "mega.learningSeries", href: "/learning-series" },
    { nameKey: "footer.helpCenter", href: "/support" },
    { nameKey: "footer.sendFeedback", href: "/feedback" },
    { nameKey: "footer.library", href: "/library" },
    { nameKey: "footer.companyBlog", href: "/blog" },
    { nameKey: "footer.successStories", href: "/success-stories" },
  ];

  const companyLinks = [
    { nameKey: "footer.aboutAlpha", href: "/about" },
    { nameKey: "footer.companyOverview", href: "/company-overview" },
    { nameKey: "footer.investors", href: "/investor" },
    { nameKey: "footer.careers", href: "/career" },
    { nameKey: "footer.contactSales", href: "/contact" },
    { nameKey: "footer.supportPortal", href: "/support" },
  ];

  const legalLinks = [
    { nameKey: "footer.privacy", href: "/privacy-policy" },
    { nameKey: "footer.security", href: "/security" },
    { nameKey: "footer.verifyEmployee", href: "/verify-employee" },
    { nameKey: "footer.accountDeletion", href: "/account-deletion" },
    { nameKey: "footer.terms", href: "/terms-of-service" },
    { nameKey: "footer.refund", href: "/refund-cancellation-policy" },
    { nameKey: "footer.cookies", href: "/cookie-policy" },
  ];

  return (
    <footer className="relative overflow-hidden bg-black pb-12 pt-32">
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
              {t("footer.tagline")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/ai"
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition-all hover:bg-[#BFFF07]"
              >
                {t("footer.freeUkAi")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto space-y-10 min-w-[350px]">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.4em]">{t("footer.stayUpdated")}</h4>
            <div className="relative group">
              <input 
                type="email" 
                placeholder={t("footer.emailPlaceholder")} 
                className="w-full bg-transparent border-b border-white/10 py-6 text-white text-sm focus:outline-none focus:border-[#BFFF07] transition-colors placeholder:text-white/10 font-bold tracking-widest uppercase"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-[#BFFF07] transition-colors group-hover:translate-x-2 duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <p className="text-white/20 text-[10px] font-medium leading-relaxed uppercase tracking-wider">
              {t("footer.subscribeNote")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-32 relative z-10">
          {/* Main Solutions */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{t("footer.solutions")}</h4>
            <ul className="space-y-3">
              {solutionLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{t(item.nameKey)}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Hub */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{t("footer.developers")}</h4>
            <ul className="space-y-3">
              {developerLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{t(item.nameKey)}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{t("footer.resources")}</h4>
            <ul className="space-y-3">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{t(item.nameKey)}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Free Tools */}
          <div className="col-span-1">
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{t("footer.freeTools")}</h4>
            <ul className="space-y-3">
              {TOOL_FOOTER_LINKS.map((item) => (
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
            <h4 className="text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{t("footer.company")}</h4>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <motion.span whileHover={{ x: 5, color: "#fff" }} className="text-white/40 text-[11px] font-medium transition-colors inline-block cursor-pointer uppercase tracking-wider">{t(item.nameKey)}</motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center relative z-10">
          <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase mb-6 md:mb-0">
            {t("footer.copyright")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-3 md:justify-end">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/20 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors"
              >
                {t(item.nameKey)}
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
    <section className="group relative block h-[600px] w-full overflow-hidden bg-black leading-none">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cta-bg.avif"
          alt={title}
          fill
          sizes="100vw"
          className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105 scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center space-y-8 px-6 text-center">
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
          className="btn-scale lime-pulse inline-block px-10 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-medium text-sm hover:bg-[#BFFF07] hover:text-black hover:border-[#BFFF07] transition-all duration-300 shadow-2xl uppercase tracking-widest"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
