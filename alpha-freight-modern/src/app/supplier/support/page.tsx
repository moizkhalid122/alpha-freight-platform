"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  Package,
  CreditCard,
  Users,
} from "lucide-react";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

const SUPPORT_EMAIL = "support@alphafreight.co.uk";
const SUPPORT_PHONE = "+44 7700 900077";
const SUPPORT_HOURS = "Mon–Fri, 8am–6pm GMT";

const FAQS = [
  {
    q: "How do I post a load?",
    a: "Go to Post a Load from the sidebar, fill in pickup, delivery, equipment, and price, then choose Pay now or Pay later. Your load goes live in the marketplace once payment is complete.",
    tags: ["post", "load", "payment"],
  },
  {
    q: "When does my load appear to carriers?",
    a: "Loads with completed payment show as live. Pay-later loads stay in pending payment until you settle the invoice — they won't appear to carriers until then.",
    tags: ["live", "payment", "pending"],
  },
  {
    q: "How do I accept or reject carrier bids?",
    a: "Open My Bids or check Incoming bids on your dashboard. Review the offer amount and carrier, then accept to book the load or reject to keep it open.",
    tags: ["bids", "carrier", "accept"],
  },
  {
    q: "How does the referral programme work?",
    a: "Share your unique link from the Referrals page. When a new supplier signs up and qualifies, you earn rewards based on your tier — from £100 per referral at Member level.",
    tags: ["referral", "rewards", "invite"],
  },
  {
    q: "How can I track shipment progress?",
    a: "Use My Posts to filter by active, booked, or in-transit loads. Status updates appear on your dashboard activity feed as carriers move freight.",
    tags: ["track", "status", "my posts"],
  },
  {
    q: "Who do I contact for billing issues?",
    a: `Email ${SUPPORT_EMAIL} with your load reference (e.g. AF-XXXXXXXX). Include your company name and payment method so we can resolve it quickly.`,
    tags: ["billing", "invoice", "payment"],
  },
];

const QUICK_LINKS = [
  { href: "/supplier/post-load", label: "Post a load", icon: Package },
  { href: "/supplier/my-posts", label: "My posts", icon: FileText },
  { href: "/supplier/my-bids", label: "My bids", icon: CreditCard },
  { href: "/supplier/referrals", label: "Referrals", icon: Users },
  { href: "/feedback?role=supplier", label: "Send feedback", icon: MessageSquare },
];

export default function SupplierSupport() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="rounded-md bg-blue-600 p-1.5">
              <LifeBuoy className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Help centre</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Support</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Answers, contact options, and quick links for your supplier account.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs — payments, bids, referrals…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: MessageSquare,
            title: "Message us",
            desc: "Typical reply within 4 hours",
            action: "Email support",
            href: `mailto:${SUPPORT_EMAIL}?subject=Supplier%20support%20request`,
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
        ].map((channel, i) => (
          <motion.a
            key={channel.title}
            href={channel.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${CARD} block p-5 sm:p-6`}
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
          </motion.a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${CARD} p-5 sm:p-6`}
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
                      {isOpen ? (
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
        </motion.section>

        <div className="space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${CARD} p-5 sm:p-6`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Availability</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Support hours</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-3">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">{SUPPORT_HOURS}</p>
                  <p className="text-[11px] text-slate-500">Urgent shipment issues prioritised same day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  All support conversations are handled securely. Never share payment card details by email.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`${CARD} p-5 sm:p-6`}
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
          </motion.section>
        </div>
      </div>
    </div>
  );
}
