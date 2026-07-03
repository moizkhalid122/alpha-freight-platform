"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  Search,
  Shield,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  "All",
  "Getting Started",
  "Carriers",
  "Suppliers",
  "Payments",
  "Compliance",
  "Platform",
] as const;

type Category = (typeof categories)[number];

type Article = {
  id: string;
  title: string;
  category: Exclude<Category, "All">;
  excerpt: string;
  readTime: string;
  popular?: boolean;
  content: string[];
  related: { label: string; href: string }[];
};

const articles: Article[] = [
  {
    id: "what-is-alpha-freight",
    title: "What is Alpha Freight?",
    category: "Getting Started",
    excerpt: "Overview of the Alpha Freight marketplace, mission, and how suppliers and carriers connect.",
    readTime: "4 min",
    popular: true,
    content: [
      "Alpha Freight is a modern logistics platform that connects UK suppliers with verified carriers through AI-powered load matching, real-time tracking, and digital proof of delivery.",
      "The platform is built for transparency: suppliers post freight, review carrier bids, and monitor shipments from one dashboard. Carriers find lane-fit loads, manage fleet activity, and receive faster settlement through the carrier wallet.",
      "Alpha Freight Solutions Limited (Company No. 16860760) operates from 124 City Road, London EC1V 2NX. Support is available Mon–Fri, 8:00 AM – 6:00 PM via support@alphafreightuk.com or +44 7782 294718.",
    ],
    related: [
      { label: "Platform overview docs", href: "/docs?tab=overview" },
      { label: "Company overview", href: "/company-overview" },
    ],
  },
  {
    id: "how-it-works",
    title: "How Alpha Freight works",
    category: "Getting Started",
    excerpt: "From load posting and AI matching to GPS tracking and 7-day carrier payouts.",
    readTime: "5 min",
    popular: true,
    content: [
      "1. Smart intake — Suppliers define route, cargo, timing, equipment, and budget. The platform analyses requirements against live carrier capacity.",
      "2. AI load matching — Verified carriers are ranked by route fit, equipment, reliability, and timing. Matching typically completes in under 60 seconds.",
      "3. Real-time visibility — GPS telemetry and status updates keep suppliers informed from pickup through delivery.",
      "4. Digital POD — Carriers upload proof of delivery via web or mobile app. Verification triggers settlement workflows automatically.",
      "5. Fast payouts — Carriers receive funds within the 7-day payout window after successful POD verification.",
    ],
    related: [
      { label: "Smart Matching product", href: "/products/smart-matching" },
      { label: "7-Day Payouts", href: "/7-day-payouts" },
    ],
  },
  {
    id: "carrier-vetting",
    title: "How carrier vetting works",
    category: "Carriers",
    excerpt: "The 5-step verification process that keeps the Alpha network trusted and compliant.",
    readTime: "6 min",
    popular: true,
    content: [
      "Every carrier on Alpha Freight passes a structured vetting flow before accessing premium loads:",
      "Step 1 — Identity and business registration review.",
      "Step 2 — Insurance verification including GIT and public liability where applicable.",
      "Step 3 — Safety and compliance checks against operating standards.",
      "Step 4 — Document and equipment review for fleet suitability.",
      "Step 5 — Performance and reliability assessment based on platform history and references.",
      "Suppliers can trust that matched carriers meet minimum insurance, compliance, and operational standards before assignment.",
    ],
    related: [
      { label: "Carrier vetting docs", href: "/docs?tab=vetting" },
      { label: "Carrier directory", href: "/directory" },
    ],
  },
  {
    id: "finding-loads",
    title: "Finding and booking loads",
    category: "Carriers",
    excerpt: "Use Available Loads, Smart Loads, and bidding workflows to fill your fleet profitably.",
    readTime: "5 min",
    content: [
      "Available Loads lists active marketplace opportunities filtered by route, timing, equipment, and earning potential.",
      "Smart Loads surfaces AI-recommended opportunities aligned with your fleet profile, operating regions, and historical performance — reducing deadhead and blind bidding.",
      "When you find a suitable load, submit a bid or accept at the posted rate depending on load type. Once assigned, the job appears in your carrier dashboard with pickup details, documents, and route guidance.",
      "Use the mobile app for in-transit updates, GPS sync, and instant POD upload at delivery.",
    ],
    related: [
      { label: "Finding loads guide", href: "/docs?tab=finding-loads" },
      { label: "Smart bidding", href: "/docs?tab=bidding" },
    ],
  },
  {
    id: "carrier-wallet",
    title: "Carrier wallet and earnings",
    category: "Carriers",
    excerpt: "Track balances, payout activity, and transaction history tied to completed loads.",
    readTime: "4 min",
    content: [
      "The Wallet section shows your available balance, pending settlements, and withdrawal history.",
      "The Earnings page summarises total revenue, active revenue, average revenue per load, completed shipment count, and trends over time.",
      "After POD verification, funds move into your wallet on the platform payout schedule. You can withdraw to your registered bank account with full audit visibility.",
      "Instant payout options may be available for eligible carriers where configured in your account settings.",
    ],
    related: [
      { label: "7-Day Payouts", href: "/7-day-payouts" },
      { label: "Digital POD", href: "/docs?tab=pod-upload" },
    ],
  },
  {
    id: "post-a-load",
    title: "How to post a load",
    category: "Suppliers",
    excerpt: "Create freight postings with route, cargo, budget, payment method, and special requirements.",
    readTime: "5 min",
    popular: true,
    content: [
      "From the Supplier Portal, open Post a Load and enter pickup and delivery locations, dates, cargo weight and volume, equipment type, and any special handling (refrigerated, ADR, tail lift, white glove).",
      "Set a minimum and maximum budget range. A realistic range improves match quality — too narrow may reduce carrier interest; too wide may attract poor-fit bids.",
      "Choose Pay Instant or Pay Later depending on your payment workflow. Pay Instant processes immediately; Pay Later queues eligible payments until you move them into checkout.",
      "Once published, carriers bid on your load. Review offers, accept the best fit, and the load moves to booked status with your chosen carrier automatically assigned.",
    ],
    related: [
      { label: "Posting freight docs", href: "/docs?tab=posting-loads" },
      { label: "Supplier portal", href: "/products/supplier-portal" },
    ],
  },
  {
    id: "supplier-bids",
    title: "Reviewing and accepting bids",
    category: "Suppliers",
    excerpt: "Compare carrier offers, accept the best match, and move loads into booked status.",
    readTime: "3 min",
    content: [
      "When carriers bid on your posted load, each offer includes rate, timing commitment, carrier profile, and vetting status.",
      "Compare bids side by side in My Bids. Consider price alongside carrier rating, equipment fit, and lane experience.",
      "Accepting a bid automatically assigns the carrier and updates load status to booked. Both parties receive notifications and can coordinate through the platform messaging tools.",
      "If no suitable bid arrives, you can adjust budget, timing, or requirements and republish the load.",
    ],
    related: [
      { label: "Real-time tracking", href: "/docs?tab=tracking" },
      { label: "Performance analytics", href: "/docs?tab=analytics" },
    ],
  },
  {
    id: "pay-instant-vs-later",
    title: "Pay Instant vs Pay Later",
    category: "Payments",
    excerpt: "Understand supplier payment options when posting and settling freight.",
    readTime: "3 min",
    content: [
      "Pay Instant is designed for immediate payment processing when you need a load confirmed and settled without delay.",
      "Pay Later keeps eligible shipment payments in a queue until you choose to move them into instant checkout — useful for accounts-payable workflows and batch approval.",
      "Both methods integrate with the supplier dashboard payment centre. Transaction history and invoice records are available for reconciliation.",
      "For carrier-side settlement after delivery, see the 7-day payout guide — supplier payment method does not delay verified carrier disbursement once POD is confirmed.",
    ],
    related: [
      { label: "7-Day Payouts", href: "/7-day-payouts" },
      { label: "Supplier pay instant", href: "/supplier/pay-instant" },
    ],
  },
  {
    id: "seven-day-payouts",
    title: "7-day payout guarantee explained",
    category: "Payments",
    excerpt: "When carriers get paid, how POD verification triggers settlement, and what affects timing.",
    readTime: "4 min",
    popular: true,
    content: [
      "Alpha Freight's 7-day payout guarantee means carriers receive funds within seven days of successful delivery confirmation and digital POD verification.",
      "Workflow: delivery completed → POD uploaded → platform verification → wallet credit → bank withdrawal.",
      "This replaces traditional 30–90 day broker cycles and reduces reliance on factoring for many carriers.",
      "Disputes or incomplete POD documentation may pause settlement until resolved. Contact support with your load reference if a payout appears delayed.",
    ],
    related: [
      { label: "7-Day Payouts page", href: "/7-day-payouts" },
      { label: "Payout docs", href: "/docs?tab=payouts" },
    ],
  },
  {
    id: "load-pricing",
    title: "How load pricing works",
    category: "Suppliers",
    excerpt: "Distance, timing, cargo, equipment, and special handling all influence the final rate.",
    readTime: "5 min",
    content: [
      "Pricing is primarily driven by route distance, pickup and delivery timing, cargo weight and volume, equipment type, and special handling requirements.",
      "Urgent loads, refrigerated equipment, ADR/hazardous cargo, tail lift access, and white glove handling each increase operational complexity and typically raise the rate.",
      "When setting budget ranges, your minimum should reflect the lowest realistic service level for the lane. Your maximum gives room for better carrier quality or time-critical movement.",
      "The platform helps suppliers review pricing inputs before publishing so expectations align with marketplace conditions.",
    ],
    related: [
      { label: "Smart Matching", href: "/products/smart-matching" },
      { label: "Contact sales", href: "/contact" },
    ],
  },
  {
    id: "support-response-times",
    title: "Support channels and response times",
    category: "Platform",
    excerpt: "Live chat, email, and phone support — plus when cases are escalated.",
    readTime: "3 min",
    content: [
      "Live chat is the fastest channel for active shipment questions — typical response under 2 minutes during business hours.",
      "Email support@alphafreightuk.com is best for non-urgent account, billing, or operational queries, usually handled within 2 hours.",
      "Phone +44 7782 294718 is available Mon–Fri, 8:00 AM – 6:00 PM for issues needing direct coordination.",
      "Escalation applies when a case affects live shipment execution, missed pickup/delivery risk, tracking failure, payment delay, or unresolved complaints requiring manager review.",
    ],
    related: [
      { label: "Help center", href: "/support" },
      { label: "System status", href: "/system-status" },
    ],
  },
  {
    id: "privacy-data",
    title: "Privacy and data protection",
    category: "Compliance",
    excerpt: "How Alpha Freight handles personal data, cookies, and platform security.",
    readTime: "4 min",
    content: [
      "Alpha Freight processes account, shipment, and communication data to operate the marketplace, verify carriers, and deliver support.",
      "Personal data is handled in line with UK GDPR requirements. You can review full details in our Privacy Policy including retention, lawful basis, and your rights.",
      "Cookie usage, analytics, and third-party integrations are documented in our cookie policy materials.",
      "For data subject requests or security concerns, contact support@alphafreightuk.com with your account email and a description of the request.",
    ],
    related: [
      { label: "Cookie policy", href: "/cookie-policy" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Company overview", href: "/company-overview" },
    ],
  },
  {
    id: "digital-pod",
    title: "Digital proof of delivery",
    category: "Platform",
    excerpt: "Upload, verify, and sync POD documents across web and mobile.",
    readTime: "3 min",
    content: [
      "Carriers upload proof of delivery through the carrier dashboard or mobile app immediately after successful delivery.",
      "Accepted formats typically include photo or PDF capture with timestamp and load reference metadata.",
      "Once verified, POD triggers status updates for the supplier and initiates the payout workflow for the carrier.",
      "Incomplete or disputed POD may delay settlement until the compliance team resolves the case — usually within 24 business hours.",
    ],
    related: [
      { label: "POD upload docs", href: "/docs?tab=pod-upload" },
      { label: "Mobile app", href: "/products/mobile-app" },
    ],
  },
  {
    id: "ai-matching-faq",
    title: "How fast is AI load matching?",
    category: "Getting Started",
    excerpt: "Matching speed, data points used, and what improves assignment quality.",
    readTime: "2 min",
    content: [
      "Alpha Freight's matching engine analyses route fit, equipment compatibility, carrier reliability, timing windows, and historical performance to rank carriers for each load.",
      "Typical match recommendations are generated in under 60 seconds after a load is published.",
      "Suppliers see ranked carrier options; carriers see Smart Loads tailored to their fleet profile.",
      "Better outcomes come from accurate load details, realistic budgets, and complete carrier profile data including operating regions and vehicle types.",
    ],
    related: [
      { label: "Smart Matching", href: "/products/smart-matching" },
      { label: "Network", href: "/network" },
    ],
  },
];

const categoryMeta: Record<
  Exclude<Category, "All">,
  { icon: typeof BookOpen; color: string; count: number }
> = {
  "Getting Started": { icon: Sparkles, color: "bg-violet-50 text-violet-700 ring-violet-100", count: 0 },
  Carriers: { icon: Truck, color: "bg-sky-50 text-sky-700 ring-sky-100", count: 0 },
  Suppliers: { icon: Users, color: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100", count: 0 },
  Payments: { icon: CreditCard, color: "bg-emerald-50 text-emerald-700 ring-emerald-100", count: 0 },
  Compliance: { icon: Shield, color: "bg-amber-50 text-amber-700 ring-amber-100", count: 0 },
  Platform: { icon: HelpCircle, color: "bg-slate-50 text-slate-700 ring-slate-100", count: 0 },
};

articles.forEach((article) => {
  categoryMeta[article.category].count += 1;
});

export default function KnowledgeBasePage() {
  useMarketingSmoothScroll();
  const revealRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".kb-reveal").forEach((el) => {
        gsap.from(el, {
          y: 32,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, revealRef);
    return () => ctx.revert();
  }, []);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const popularArticles = useMemo(() => articles.filter((a) => a.popular), []);

  return (
    <div ref={revealRef} className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="kb-reveal text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">Help & guidance</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Knowledge Base</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              Search guides, FAQs, and step-by-step articles for carriers, suppliers, payments, and platform setup.
            </p>

            <div className="relative mx-auto mt-10 max-w-2xl">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles — payouts, POD, vetting, posting loads..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm shadow-[0_12px_40px_rgba(15,23,42,0.06)] outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-[#BFFF07]/40"
              />
            </div>
          </section>

          <section className="kb-reveal mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(categoryMeta) as Exclude<Category, "All">[]).map((category) => {
              const meta = categoryMeta[category];
              const Icon = meta.icon;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:shadow-lg ${
                    activeCategory === category
                      ? "border-slate-900 bg-white shadow-md"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${meta.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{meta.count} articles</span>
                  </div>
                  <h2 className="mt-4 font-semibold text-slate-900">{category}</h2>
                </button>
              );
            })}
          </section>

          <section className="kb-reveal mt-12 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === category
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            ))}
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeCategory === "All" ? "All articles" : activeCategory}
                </h2>
                <span className="text-sm text-slate-400">{filteredArticles.length} results</span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 font-semibold text-slate-900">No articles found</p>
                  <p className="mt-2 text-sm text-slate-500">Try a different search term or browse another category.</p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <motion.button
                    key={article.id}
                    type="button"
                    layout
                    onClick={() => setSelectedArticle(article)}
                    className="kb-reveal group w-full rounded-[1.5rem] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {article.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readTime}
                      </span>
                      {article.popular && (
                        <span className="rounded-full bg-[#BFFF07]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-slate-700">{article.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Read article
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </motion.button>
                ))
              )}
            </section>

            <aside className="kb-reveal space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Popular articles</h3>
                <ul className="mt-4 space-y-3">
                  {popularArticles.map((article) => (
                    <li key={article.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedArticle(article)}
                        className="text-left text-sm font-medium text-slate-600 transition hover:text-slate-900"
                      >
                        {article.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] bg-slate-900 p-6 text-white">
                <h3 className="text-lg font-bold">Still need help?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Our support team and AI assistant can help with live shipment issues and account questions.
                </p>
                <div className="mt-5 space-y-2">
                  <Link href="/support" className="flex items-center gap-2 text-sm font-semibold text-[#BFFF07]">
                    Help center <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/products/ai-assistant" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
                    AI Assistant <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/docs?tab=overview" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
                    Full documentation <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedArticle && (
          <>
            <motion.button
              type="button"
              aria-label="Close article"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedArticle(null)}
            />
            <motion.article
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-h-[80vh] max-w-3xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:inset-x-auto"
            >
              <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {selectedArticle.category}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{selectedArticle.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{selectedArticle.readTime} read</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-6 sm:px-8">
                {selectedArticle.content.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Related links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedArticle.related.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSelectedArticle(null)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.article>
          </>
        )}
      </AnimatePresence>

      <CinematicCTA />
      <Footer />
    </div>
  );
}
