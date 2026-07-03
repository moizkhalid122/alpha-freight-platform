"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Code2,
  Copy,
  Key,
  Lock,
  Sparkles,
  Terminal,
  Webhook,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

type ApiTab = "loads" | "tracking" | "payments" | "webhooks";

const apiTabs: Record<
  ApiTab,
  {
    label: string;
    method: string;
    path: string;
    description: string;
    response: string;
  }
> = {
  loads: {
    label: "Loads",
    method: "POST",
    path: "/v1/loads",
    description: "Create a load, publish to the marketplace, and receive carrier match candidates.",
    response: `{
  "id": "ld_8f2a91c",
  "status": "published",
  "matches": 12,
  "topCarrierScore": 0.94
}`,
  },
  tracking: {
    label: "Tracking",
    method: "GET",
    path: "/v1/shipments/{id}/events",
    description: "Stream milestone events, GPS pings, ETA revisions, and exception alerts.",
    response: `{
  "shipmentId": "AF-2041",
  "status": "in_transit",
  "eta": "2026-06-30T14:22:00Z",
  "events": 18
}`,
  },
  payments: {
    label: "Payments",
    method: "POST",
    path: "/v1/payments/intents",
    description: "Initiate instant or scheduled supplier payments tied to load completion.",
    response: `{
  "clientSecret": "pi_3N...",
  "amount": 124000,
  "currency": "gbp"
}`,
  },
  webhooks: {
    label: "Webhooks",
    method: "POST",
    path: "/v1/webhooks/subscribe",
    description: "Subscribe to load.booked, shipment.delivered, pod.verified, and payout.released.",
    response: `{
  "id": "wh_91k2m",
  "events": ["load.booked", "pod.verified"],
  "status": "active"
}`,
  },
};

const capabilities = [
  {
    icon: Code2,
    title: "REST API",
    desc: "Versioned endpoints for loads, carriers, tracking, documents, and wallet operations.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Signed event delivery with retries, replay protection, and sandbox testing tools.",
  },
  {
    icon: Braces,
    title: "SDKs",
    desc: "Node, Python, and PHP libraries with typed models and quick-start examples.",
  },
  {
    icon: Lock,
    title: "OAuth 2.0",
    desc: "Scoped API keys, rotating tokens, and separate sandbox vs production environments.",
  },
];

const outcomes = [
  { label: "Avg integration", value: "3 days", note: "to first live load" },
  { label: "API uptime", value: "99.9%", note: "platform SLA" },
  { label: "Webhook delivery", value: "<2s", note: "median latency" },
];

const endpointGroups = [
  {
    title: "Marketplace",
    items: ["POST /v1/loads", "GET /v1/loads/{id}", "GET /v1/loads/search", "POST /v1/bids"],
  },
  {
    title: "Operations",
    items: ["GET /v1/shipments/{id}", "GET /v1/shipments/{id}/events", "POST /v1/pod", "GET /v1/carriers"],
  },
  {
    title: "Finance",
    items: ["POST /v1/payments/intents", "GET /v1/payouts", "GET /v1/wallet/balance"],
  },
];

function ApiConsoleMock({ activeTab }: { activeTab: ApiTab }) {
  const data = apiTabs[activeTab];
  const [copied, setCopied] = useState(false);

  const curl = `curl -X ${data.method} https://api.alphafreight.uk${data.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full min-w-0 rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2"
    >
      <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-slate-950 shadow-[0_12px_40px_rgba(15,23,42,0.2)] sm:rounded-[1.35rem]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white shadow-sm">
              <Image src="/logo.png" alt="Alpha Freight" fill sizes="32px" className="object-contain p-1" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Alpha Freight API</p>
              <p className="text-[11px] text-white/45">Developer console</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            Sandbox live
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  data.method === "GET" ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300"
                }`}
              >
                {data.method}
              </span>
              <code className="text-sm font-medium text-white/90">{data.path}</code>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/55">{data.description}</p>

            <div className="mt-5 space-y-2">
              {["OAuth 2.0 bearer token", "JSON request + response", "Rate limit: 120 req/min"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#BFFF07]" />
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy cURL"}
            </button>
          </div>

          <div className="p-5 font-mono text-[12px] leading-6">
            <div className="mb-3 flex items-center gap-2 text-white/40">
              <Terminal className="h-3.5 w-3.5" />
              Request
            </div>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-white/75">{curl}</pre>
            <div className="mb-3 mt-5 flex items-center gap-2 text-white/40">
              <Braces className="h-3.5 w-3.5" />
              Response
            </div>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-emerald-200/90">
              {data.response}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ApiDocsProductPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ApiTab>("loads");
  const tabs = useMemo(() => Object.keys(apiTabs) as ApiTab[], []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTab((current) => {
        const index = tabs.indexOf(current);
        return tabs[(index + 1) % tabs.length] ?? "loads";
      });
    }, 6000);
    return () => window.clearInterval(interval);
  }, [tabs]);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".api-hero-item", {
        y: 42,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power4.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-12 sm:pb-16 lg:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(109,40,217,0.14),transparent_70%),radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.10),transparent_40%)]" />

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="api-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              API Docs
            </p>
            <h1 className="api-hero-item mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.45rem] lg:leading-[1.06]">
              Integrate logistics into your app
            </h1>
            <p className="api-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Post loads, match carriers, track shipments, and trigger payouts with Alpha Freight&apos;s REST API,
              webhooks, and SDKs — built for brokers, TMS platforms, and shipper portals.
            </p>
            <div className="api-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs?tab=api-auth"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Read full documentation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Request API access
              </Link>
            </div>
          </div>

          <div className="api-hero-item relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                    activeTab === tab
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {apiTabs[tab].label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <ApiConsoleMock activeTab={activeTab} />
            </AnimatePresence>
          </div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-[920px] grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-10">
            {outcomes.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Endpoint map</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Everything your product needs</h2>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {endpointGroups.map((group) => (
                <div key={group.title} className="rounded-[1.5rem] border border-slate-200 bg-[#fafafa] p-6">
                  <h3 className="text-lg font-bold text-slate-900">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((endpoint) => (
                      <li key={endpoint} className="flex items-center gap-2 font-mono text-sm text-slate-600">
                        <Key className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {endpoint}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Zap, label: "Sandbox", value: "Instant" },
                { icon: Sparkles, label: "Docs", value: "OpenAPI" },
                { icon: Lock, label: "Security", value: "Signed" },
                { icon: Webhook, label: "Events", value: "Real-time" },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
                    <Icon className="mx-auto h-6 w-6 text-[#BFFF07]" />
                    <p className="mt-4 text-2xl font-bold">{card.value}</p>
                    <p className="mt-2 text-sm text-white/50">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Build on Alpha Freight"
          subtitle="Get sandbox keys and ship your first integration."
          buttonText="Talk to integrations"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
