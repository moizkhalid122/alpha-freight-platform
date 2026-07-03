"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";

const coreCapabilities = [
  {
    title: "Natural Answers",
    description:
      "The assistant replies in a friendly, professional tone and adapts to the user's language style for a more natural support experience.",
    image: "/ai image 1.avif",
  },
  {
    title: "Business-Aware Knowledge",
    description:
      "It uses Alpha Freight company details, workflows, pricing guidance, tracking logic, support policies, and legal context to answer more accurately.",
    image: "/ai image 2.avif",
  },
  {
    title: "Role-Specific Guidance",
    description:
      "Suppliers and carriers get different answers based on their role, goals, and the type of help they actually need.",
    image: "/ai image 3.avif",
  },
];

const faqItems = [
  {
    question: "What kind of questions can the AI assistant answer?",
    answer:
      "It helps with supplier and carrier workflows, pricing guidance, shipment tracking, payouts, verification steps, support replies, and Alpha Freight company information.",
  },
  {
    question: "Is the assistant only for one type of user?",
    answer:
      "No. It is designed for both suppliers and carriers, and its replies adapt based on the role, workflow, and type of help the user needs.",
  },
  {
    question: "Does it respond in a natural and human-like way?",
    answer:
      "Yes. The assistant is built to give clear, natural replies instead of robotic answers, while still staying professional and useful for operational questions.",
  },
  {
    question: "Can it use Alpha Freight knowledge while replying?",
    answer:
      "Yes. It uses Alpha Freight context such as workflows, support logic, business information, and role-aware guidance to generate more relevant answers.",
  },
];

const stats = [
  { value: "24/7", label: "Always available guidance" },
  { value: "Supplier", label: "Role-aware shipper support" },
  { value: "Carrier", label: "Route, payout, and load help" },
  { value: "Llama 3.1", label: "Local AI model foundation" },
];

const assistantShowcase = [
  {
    title: "Generate instant freight replies",
    description:
      "Show fast, relevant answers for pricing, posting loads, tracking, and shipment support without robotic responses.",
    video: "/1.mp4",
  },
  {
    title: "Keep workflow context in chat",
    description:
      "Let the chatbot stay aware of supplier and carrier flows so users get clearer next steps in the same conversation.",
    video: "/2.mp4",
  },
  {
    title: "Translate and rewrite clearly",
    description:
      "Help users rewrite messages, simplify logistics terms, and respond naturally across different language styles.",
    video: "/3.mp4",
  },
  {
    title: "Guide better decisions faster",
    description:
      "Surface smarter help for payouts, documents, verification, and operational questions right when users need it.",
    video: "/4.mp4",
  },
];

const conversationFeatures = [
  {
    title: "Context-Aware AI",
    description:
      "Understands the user's message flow, freight intent, and previous conversation context to deliver clearer and more relevant replies.",
    image: "/1.avif",
  },
  {
    title: "Multi-Language Support",
    description:
      "Adapts to the user's language style and helps suppliers and carriers communicate in a more natural and friction-free way.",
    image: "/2.avif",
  },
  {
    title: "Privacy-First Design",
    description:
      "Keeps assistant interactions focused, secure, and aligned with a controlled Alpha Freight experience built around trust.",
    image: "/3.avif",
  },
  {
    title: "Team Collaboration",
    description:
      "Supports faster internal coordination by helping teams understand workflows, issues, documents, and operational next steps.",
    image: "/4.avif",
  },
];

export default function AIAssistantProductPage() {
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const scrollToFeature = (index: number) => {
    featureCardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="light" />

      <main>
        <section className="relative min-h-screen overflow-hidden border-b border-black/10">
          <div className="absolute inset-0">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src="/alpha image.png"
                alt="Alpha Freight AI Assistant"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black" />
          </div>

          <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col items-center justify-center px-6 pb-20 pt-44 text-center text-white lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mx-auto flex w-full max-w-4xl flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#BFFF07]" />
                Alpha Freight AI Assistant
              </div>

              <h1 className="mt-12 text-5xl font-medium leading-[0.92] tracking-tighter text-white md:text-[5.3rem] md:leading-[0.86] uppercase">
                An AI assistant
                <br />
                that{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF07] to-white/25">
                  explains,
                </span>
                <br />
                guides, and helps.
              </h1>

              <p className="mt-7 max-w-3xl text-white/40 text-lg md:text-xl font-light leading-relaxed">
                Alpha Freight AI Assistant helps suppliers and carriers understand
                platform workflows, pricing guidance, shipment tracking, payouts,
                support, and company information through clear human-like answers.
              </p>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/supplier/ai-assistant"
                  className="inline-flex items-center gap-3 rounded-full bg-[#BFFF07] px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-black transition-all duration-300 shadow-2xl hover:bg-white"
                >
                  Try Supplier AI
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/carrier/ai-assistant"
                  className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Try Carrier AI
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-[#f7f4fb] py-24">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                Alpha Freight Chatbot
              </p>
              <h2 className="mt-5 text-[1.9rem] font-medium leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-[3.2rem]">
                Smart chatbot help
                <br />
                for freight teams.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[12.5px] font-medium leading-6 text-slate-500 md:text-[14px]">
                Alpha Freight chatbot gives clearer replies for supplier and carrier
                questions, with more natural guidance across daily operations.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {assistantShowcase.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white p-1.5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.18)]"
                >
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white p-3">
                    <div className="relative overflow-hidden rounded-[1rem] border border-white/60 bg-[#efe8ff] shadow-inner">
                      <video
                        className="aspect-[16/9] w-full object-cover"
                        src={item.video}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    </div>
                    <div className="px-1 pb-1 pt-4">
                      <h3 className="max-w-[14ch] text-[1.15rem] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[1.45rem]">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 max-w-[28rem] text-[12px] font-medium leading-[1.65] text-slate-500 md:text-[13px]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-28">
          <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:h-fit">
                <div className="max-w-md">
                  <h2 className="text-3xl font-medium leading-tight tracking-tight text-black md:text-5xl">
                    Unleash the potential of
                    <br />
                    AI conversations
                  </h2>
                  <p className="mt-5 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                    Experience intelligent Alpha Freight chatbot interactions that
                    improve support, reduce confusion, and make platform guidance feel
                    smoother.
                  </p>
                </div>

                <div className="mt-10 space-y-2">
                  {conversationFeatures.map((feature, index) => {
                    const isActive = activeFeature === index;

                    return (
                      <button
                        key={feature.title}
                        type="button"
                        onClick={() => scrollToFeature(index)}
                        className={`group flex w-full items-center gap-3 px-1 py-2 text-left transition-all duration-300 ${
                          isActive ? "text-[#5a3fff]" : "text-gray-500 hover:text-black"
                        }`}
                      >
                        <span
                          className={`text-sm transition-transform duration-300 ${
                            isActive ? "translate-x-0 text-[#5a3fff]" : "translate-x-0 text-gray-300 group-hover:text-black"
                          }`}
                        >
                          {"->"}
                        </span>
                        <span className="text-[13px] font-medium leading-none">
                          {feature.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8">
                {conversationFeatures.map((feature, index) => {
                  const isActive = activeFeature === index;

                  return (
                    <motion.div
                      key={feature.title}
                      ref={(element) => {
                        featureCardRefs.current[index] = element;
                      }}
                      initial={{ opacity: 0, y: 48 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.5 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      onViewportEnter={() => setActiveFeature(index)}
                      className={`p-0 transition-all duration-500 ${
                        isActive
                          ? "bg-transparent"
                          : "bg-transparent"
                      }`}
                    >
                      <div className="mb-6 max-w-xl md:pl-10 lg:pl-14">
                        <h3 className="text-[1.65rem] font-medium leading-tight tracking-tight text-black md:text-[2rem]">
                          {feature.title}
                        </h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500 md:text-[15px]">
                          {feature.description}
                        </p>
                      </div>

                      <motion.div
                        animate={{
                          y: isActive ? 0 : 12,
                          scale: isActive ? 1 : 0.985,
                          opacity: isActive ? 1 : 0.88,
                        }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="relative"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem]">
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 52vw"
                            className="object-contain"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mx-auto max-w-[44rem] text-[1.85rem] font-medium leading-tight tracking-tight text-slate-950 md:text-[2.45rem]">
                <span className="block md:whitespace-nowrap">
                  Smarter Conversations. Faster Responses.
                </span>
                <span className="block">Stronger Results.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[12.5px] font-medium leading-6 text-slate-500 md:text-[13.5px] md:leading-7">
                Experience human-like responses with smart AI that understands
                workflows, predicts needs, and accelerates support and operations.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {coreCapabilities.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="bg-transparent p-0"
                >
                  <div className="relative h-[220px] w-full sm:h-[250px] md:h-[280px] lg:h-[320px]">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain"
                    />
                  </div>

                  <div className="pl-6 sm:pl-8 md:pl-10 lg:pl-12">
                    <h3 className="mt-6 text-[16px] font-medium tracking-tight text-slate-950 md:text-[17px]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[12px] font-medium leading-6 text-slate-500">
                      {card.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden py-28">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/WhatsApp Image 2026-06-24 at 6.10.00 PM.jpeg"
              alt="AI assistant section background"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          <div className="relative mx-auto max-w-[1320px] px-6 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mx-auto mb-12 max-w-3xl text-center"
            >
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-950/55">
                Connected Experience
              </p>
              <h2 className="text-[1.7rem] font-medium uppercase leading-[0.94] tracking-[-0.045em] text-slate-950 md:text-[2.7rem]">
                Works with the Alpha Freight tools
                <br />
                <span className="font-serif text-slate-950/28 italic font-light normal-case">
                  your team already uses
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-[42rem] text-[12px] font-medium leading-6 text-slate-700/90 md:text-[13.5px]">
                The AI assistant connects supplier help, carrier workflows, pricing,
                verification, tracking, and payout answers in one smooth experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-[760px]"
            >
              <video
                src="/White Minimalist Simple Loading Text Animation Video (1).mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-auto w-full object-contain"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-white py-28">
          <div className="mx-auto max-w-[1160px] px-6 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                FAQ
              </p>
              <h2 className="mt-5 text-[2rem] font-medium leading-[0.95] tracking-[-0.05em] text-slate-950 md:text-[3.6rem]">
                Common questions,
                <br />
                <span className="font-serif text-slate-950/30 italic font-light">
                  answered simply.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-[13px] font-medium leading-7 text-slate-500 md:text-[14px]">
                Quick answers about how the Alpha Freight AI assistant supports
                suppliers, carriers, workflows, and everyday operations.
              </p>
            </motion.div>

            <div className="mx-auto mt-14 max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white px-5 py-3 shadow-[0_30px_90px_-70px_rgba(15,23,42,0.22)] sm:px-7 sm:py-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <motion.div
                    key={item.question}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="border-b border-slate-200/80 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-5 py-5 text-left sm:py-6"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-2 text-[1rem] font-medium leading-[1.3] tracking-[-0.03em] text-slate-950 sm:text-[1.2rem]">
                          {item.question}
                        </h3>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="max-w-3xl pb-5 pr-14 text-[13px] font-medium leading-7 text-slate-500 sm:pb-6 sm:text-[14px]">
                            {item.answer}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Explore Alpha Freight AI Assistant"
          subtitle="SMART HELP FOR SUPPLIERS AND CARRIERS"
          buttonText="Open AI Assistant Page"
          buttonHref="/products/ai-assistant"
        />
      </main>

      <Footer />
    </div>
  );
}
