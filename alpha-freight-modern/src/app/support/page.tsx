"use client";

import { useState, useRef, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import SupportLiveChat, { SUPPORT_EMAIL } from "@/components/SupportLiveChat";
import NetworkCanvas3D from "@/components/NetworkCanvas3D";
import Counter from "@/components/Counter";
import FeatureIcon3D from "@/components/FeatureIcon3D";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageSquare, 
  Mail, 
  Phone, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight,
  Plus,
  Minus,
  LifeBuoy
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Footer, CinematicCTA } from "@/components/Footer";
import { getSupportArticleHref } from "@/lib/support-links";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_mvxwoue";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_21isokf";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "f5bWSTVw5Z8mVVwTu";

type QuickForm = {
  name: string;
  email: string;
  message: string;
};

const initialQuickForm: QuickForm = {
  name: "",
  email: "",
  message: "",
};

async function sendQuickSupportEmail(form: QuickForm) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        customer_name: form.name,
        customer_email: form.email,
        pickup_location: "Support Page Quick Assistance",
        delivery_location: "Not provided",
        additional_requirements: form.message,
        from_name: form.name,
        from_email: form.email,
        reply_to: form.email,
        to_name: "Alpha Freight Support",
        to_email: SUPPORT_EMAIL,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send support request.");
  }
}

const supportCategories = [
  {
    id: "01",
    title: "Carrier Portal",
    image: "/how-1.jpg",
    desc: "Solutions for load booking, document uploads, and driver management.",
    links: ["Booking Loads", "Document Uploads", "Route Optimization", "Driver Setup"]
  },
  {
    id: "02",
    title: "Supplier Hub",
    image: "/how-2.jpg",
    desc: "Everything you need to post loads, track freight, and manage carriers.",
    links: ["Posting Loads", "Real-time Tracking", "Carrier Vetting", "Analytics Guide"]
  },
  {
    id: "03",
    title: "Financial Center",
    image: "/how-3.jpg",
    desc: "Manage your 7-day payouts, invoices, and digital wallet settings.",
    links: ["Payout Schedule", "Invoicing Help", "Wallet Setup", "Tax Documents"]
  },
  {
    id: "04",
    title: "System Status",
    image: "/how-4.jpg",
    desc: "Platform updates, security protocols, and account management.",
    links: ["Security Setup", "Platform Updates", "Account Recovery", "API Status"]
  }
];

const faqs = [
  {
    question: "How fast is the support response time?",
    answer: "Our average response time for Live Chat is under 2 minutes. Email inquiries are typically handled within 2 hours by our dedicated support team."
  },
  {
    question: "How do I verify my carrier insurance?",
    answer: "You can upload your insurance documents directly through the Carrier Dashboard. Our compliance team reviews all submissions within 24 business hours."
  },
  {
    question: "What is the 7-day payout process?",
    answer: "Once a Digital POD is verified, funds are released to your wallet. You can withdraw them instantly, and they typically arrive in your bank account within 7 days."
  },
  {
    question: "Is there an API for enterprise integration?",
    answer: "Yes, Alpha Freight offers a robust REST API for deep integration with your existing TMS. Contact our sales team for enterprise documentation."
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickForm, setQuickForm] = useState<QuickForm>(initialQuickForm);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickStatus, setQuickStatus] = useState<string | null>(null);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const handleQuickSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuickSubmitting(true);
    setQuickStatus(null);

    const hasEmailJs =
      Boolean(EMAILJS_SERVICE_ID) &&
      Boolean(EMAILJS_TEMPLATE_ID) &&
      Boolean(EMAILJS_PUBLIC_KEY) &&
      !EMAILJS_PUBLIC_KEY.startsWith("YOUR_");

    try {
      if (hasEmailJs) {
        await sendQuickSupportEmail(quickForm);
        setQuickForm(initialQuickForm);
        setQuickStatus("Request sent. Our team will reply within 2 hours.");
      } else {
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Support Request")}&body=${encodeURIComponent(`Name: ${quickForm.name}\nEmail: ${quickForm.email}\n\n${quickForm.message}`)}`;
        setQuickForm(initialQuickForm);
        setQuickStatus("Opening your email app...");
      }
    } catch {
      setQuickStatus("Could not send request. Please email support@alphafreightuk.com directly.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />
      
      <main ref={containerRef}>
        {/* Hero Section - Dark & Techy */}
        <section className="relative h-screen w-full flex flex-col justify-center border-b border-white/5 overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
              <source src="/alpha-center.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-bold uppercase tracking-[0.3em] mb-12"
            >
              24/7 Global Guidance
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-[9rem] font-medium text-white leading-[0.85] tracking-tighter mb-16 uppercase"
            >
              SUPPORT <br />
              <span className="text-white/20">WITHOUT </span>
              <span className="text-[#BFFF07]">LIMITS.</span>
            </motion.h1>

            {/* Integrated Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative max-w-2xl"
            >
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
              <input 
                type="text"
                placeholder="SEARCH KNOWLEDGE BASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-8 pl-20 pr-8 text-lg focus:outline-none focus:border-[#BFFF07]/50 focus:bg-white/10 transition-all placeholder:text-white/10 uppercase tracking-widest text-sm font-bold"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="mt-8"
            >
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-[#BFFF07]"
              >
                <MessageSquare className="h-4 w-4" />
                Send product feedback
              </Link>
            </motion.div>
          </motion.div>

          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="h-full w-px bg-white/10 absolute left-1/4" />
            <div className="h-full w-px bg-white/10 absolute left-1/2" />
            <div className="h-full w-px bg-white/10 absolute left-3/4" />
          </div>
        </section>

        {/* Statistics Section - White Transition */}
        <section className="py-32 bg-white relative z-10">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {[
                { label: "SATISFIED USERS", value: 5000, suffix: "+" },
                { label: "AVG RESPONSE TIME", value: 2, suffix: " MIN" },
                { label: "DOCUMENTS VERIFIED", value: 25, suffix: "K+" },
                { label: "SUCCESS RATE", value: 99, suffix: "%" }
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

        {/* Support Philosophy Section */}
        <section className="py-32 bg-[#FAF9F6] relative z-10 overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-24 max-w-4xl"
            >
              <div className="inline-block px-4 py-1.5 rounded-full border border-black/10 bg-white text-black/60 text-[10px] font-bold uppercase tracking-widest mb-8">
                Our Support Philosophy
              </div>
              <h2 className="text-5xl md:text-7xl font-medium text-black leading-tight tracking-tight uppercase">
                Human-centric support <br /> <span className="text-black/30 italic font-light">powered by intelligence.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {supportCategories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer space-y-8"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Support {cat.id}
                      </span>
                      <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-medium text-black tracking-tight group-hover:translate-x-2 transition-transform duration-500 uppercase">
                      {cat.title}
                    </h3>
                    <ul className="space-y-2">
                      {cat.links.map(link => (
                        <li key={link}>
                          <Link href={getSupportArticleHref(link)} className="text-gray-400 hover:text-black transition-colors text-sm font-medium flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#BFFF07]" />
                            {link}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Grid Contact Options */}
        <section className="py-32 bg-white relative z-10">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Live Chat */}
              <motion.button
                type="button"
                onClick={() => setChatOpen(true)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#BFFF07] p-12 rounded-3xl min-h-[450px] flex flex-col justify-between group cursor-pointer text-left w-full"
              >
                <div className="space-y-8">
                  <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-4xl font-bold text-black uppercase leading-none tracking-tighter">
                    Live <br /> Chat
                  </h3>
                  <p className="text-black/70 text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Average response time: 2 Minutes. <br />
                    Available 24/7 for all users.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-black font-black uppercase tracking-widest text-xs border-t border-black/10 pt-8">
                  Start Chat <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.button>

              <motion.a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Alpha Freight Support Request")}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-[#111] p-12 rounded-3xl min-h-[450px] flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#BFFF07]" />
                  </div>
                  <h3 className="text-4xl font-bold text-white uppercase leading-none tracking-tighter">
                    Email <br /> Support
                  </h3>
                  <p className="text-white/40 text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Detailed technical assistance. <br />
                    Response within 2 hours. <br />
                    {SUPPORT_EMAIL}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[#BFFF07] font-black uppercase tracking-widest text-xs border-t border-white/10 pt-8">
                  Send Email <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.a>

              {/* Card 3: Form/Interactive */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#F2F2F0] p-12 rounded-3xl min-h-[450px] flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-black uppercase tracking-tight">
                    Quick Assistance
                  </h3>
                  <form className="space-y-3" onSubmit={handleQuickSubmit}>
                    <input
                      type="text"
                      required
                      placeholder="NAME"
                      value={quickForm.name}
                      onChange={(event) => setQuickForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full bg-white border border-black/5 rounded-xl p-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#BFFF07]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="EMAIL"
                      value={quickForm.email}
                      onChange={(event) => setQuickForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full bg-white border border-black/5 rounded-xl p-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#BFFF07]"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="MESSAGE"
                      value={quickForm.message}
                      onChange={(event) => setQuickForm((current) => ({ ...current, message: event.target.value }))}
                      className="w-full bg-white border border-black/5 rounded-xl p-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#BFFF07] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={quickSubmitting}
                      className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#BFFF07] hover:text-black transition-all disabled:opacity-60"
                    >
                      {quickSubmitting ? "Sending..." : "Submit Request"}
                    </button>
                    {quickStatus ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {quickStatus}
                      </p>
                    ) : null}
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section - White Clean */}
        <section className="py-32 bg-[#FAF9F6] relative z-10">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-24 space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full border border-black/10 bg-white text-black/60 text-[10px] font-bold uppercase tracking-widest">
                Knowledge Base
              </div>
              <h2 className="text-5xl md:text-7xl font-medium text-black tracking-tight uppercase">
                Frequently Asked <br /> <span className="text-black/30 italic font-light">Questions.</span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i}
                  className="rounded-3xl border border-black/5 bg-white overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-xl uppercase tracking-tight">{faq.question}</span>
                    <div className={`w-8 h-8 rounded-full border border-black/5 flex items-center justify-center transition-transform duration-300 ${openFaq === i ? 'rotate-180 bg-black text-white' : ''}`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="p-8 pt-0 text-gray-500 text-lg leading-relaxed border-t border-black/5 mt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CinematicCTA />
      </main>

      <Footer />

      <SupportLiveChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
