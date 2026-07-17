"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  MessageSquare,
  Mail,
  Phone,
  Search,
  ChevronDown,
  Clock,
  ShieldCheck,
  ArrowRight,
  FileText,
  Truck,
  Wallet,
  Users,
} from "lucide-react";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

const SUPPORT_EMAIL = "support@alphafreight.co.uk";
const SUPPORT_PHONE = "+44 7700 900077";
const SUPPORT_HOURS = "Mon–Fri, 8am–6pm GMT";

const FAQS = [
  {
    q: "How do I bid on a load?",
    a: "Open Available Loads, select a paid live shipment, and submit your offer. Track responses on My Bids — suppliers can accept, reject, or counter.",
    tags: ["bid", "marketplace", "loads"],
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Go to Finance → Wallet and set up your payout method. Withdrawals typically arrive within 1–2 business days once your account is verified.",
    tags: ["wallet", "earnings", "payout"],
  },
  {
    q: "What are Smart Loads?",
    a: "Smart Loads are AI-recommended shipments based on your fleet capacity, equipment, and historical routes to help maximise margin.",
    tags: ["smart loads", "ai", "recommendations"],
  },
  {
    q: "How do I update load status?",
    a: "Open My Loads, select your assigned shipment, and progress through booked → in-transit → completed. Upload POD when delivery is confirmed.",
    tags: ["my loads", "status", "pod"],
  },
  {
    q: "How does the referral programme work?",
    a: "Share your unique link from Referrals. When a new carrier completes 5 loads, you earn £50 wallet credit — with higher tiers unlocking bigger rewards.",
    tags: ["referral", "rewards", "invite"],
  },
  {
    q: "Who do I contact for payment issues?",
    a: `Email ${SUPPORT_EMAIL} with your load reference (e.g. AF-XXXXXXXX) and company name. Never share card details by email.`,
    tags: ["billing", "payment", "wallet"],
  },
];

const QUICK_LINKS = [
  { href: "/carrier/available-loads", label: "Available loads", icon: Truck },
  { href: "/carrier/my-loads", label: "My loads", icon: FileText },
  { href: "/carrier/wallet", label: "Wallet", icon: Wallet },
  { href: "/carrier/referrals", label: "Referrals", icon: Users },
  { href: "/feedback?role=carrier", label: "Send feedback", icon: MessageSquare },
];

function CarrierSupportPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobileView(media.matches);

    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  const shipment = searchParams.get("shipment");
  const route = searchParams.get("route");
  const status = searchParams.get("status");

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return FAQS;
    return FAQS.filter(
      (faq) =>
        faq.q.toLowerCase().includes(term) ||
        faq.a.toLowerCase().includes(term) ||
        faq.tags.some((tag) => tag.includes(term))
    );
  }, [search]);

  return (
    <div className="relative mx-auto w-full max-w-[1280px] space-y-6 overflow-x-hidden p-4 sm:p-6">
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="rounded-md bg-blue-600 p-1.5">
              <LifeBuoy className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Help centre</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Support</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Answers, contact options, and quick links for your carrier account.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs — bids, wallet, POD, referrals…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {shipment ? (
        <div
          className={`${CARD} border-blue-100 bg-blue-50/80 p-5 sm:bg-gradient-to-r sm:from-blue-50/80 sm:via-white sm:to-slate-50 sm:p-6`}
          style={isMobileView ? { contain: "layout paint" } : undefined}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Shipment support</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{shipment}</h2>
              <p className="mt-1 text-[13px] text-slate-500">{route || "Route unavailable"}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{status || "Unavailable"}</p>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Support%20for%20${encodeURIComponent(shipment)}`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
              >
                Email about this load
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: MessageSquare,
            title: "Message us",
            desc: "Typical reply within 4 hours",
            action: "Email support",
            href: `mailto:${SUPPORT_EMAIL}?subject=Carrier%20support%20request`,
            tone: "bg-blue-50 text-blue-600",
          },
          {
            icon: Mail,
            title: "Email",
            desc: SUPPORT_EMAIL,
            action: "Send email",
            href: `mailto:${SUPPORT_EMAIL}`,
            tone: "bg-slate-100 text-slate-700",
          },
          {
            icon: Phone,
            title: "Phone",
            desc: SUPPORT_PHONE,
            action: "Call now",
            href: `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`,
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            className={`${CARD} block p-5 sm:p-6`}
            style={isMobileView ? { contain: "layout paint" } : undefined}
          >
            <div className={`mb-4 inline-flex rounded-lg p-2.5 ${channel.tone}`}>
              <channel.icon className="h-4 w-4" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900">{channel.title}</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">{channel.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600">
              {channel.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          className={`${CARD} min-w-0 p-5 sm:p-6`}
          style={isMobileView ? { contain: "layout paint" } : undefined}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Knowledge base</p>
          <h2 className="mt-0.5 text-[15px] font-bold text-slate-900">Frequently asked questions</h2>

          <div className="mt-4 space-y-2">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="overflow-hidden rounded-lg border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                    >
                      <span className="text-[13px] font-semibold text-slate-900">{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && !isMobileView ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-slate-100 px-4 py-3 text-[12px] leading-relaxed text-slate-500">
                            {faq.a}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    {isOpen && isMobileView ? (
                      <p className="border-t border-slate-100 px-4 py-3 text-[12px] leading-relaxed text-slate-500">
                        {faq.a}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                <Search className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-[13px] font-semibold text-slate-900">No results</p>
                <p className="mt-1 text-[12px] text-slate-500">Try a different search term or contact us directly.</p>
              </div>
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-4">
          <section
            className={`${CARD} p-5 sm:p-6`}
            style={isMobileView ? { contain: "layout paint" } : undefined}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Availability</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Support hours</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-3">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">{SUPPORT_HOURS}</p>
                  <p className="text-[11px] text-slate-500">In-transit issues prioritised same day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  All support conversations are handled securely. Never share payment card details by email.
                </p>
              </div>
            </div>
          </section>

          <section
            className={`${CARD} p-5 sm:p-6`}
            style={isMobileView ? { contain: "layout paint" } : undefined}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shortcuts</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Quick links</h3>
            <div className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-3 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-[13px] font-semibold text-slate-900">{link.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CarrierSupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CarrierSupportPageContent />
    </Suspense>
  );
}
