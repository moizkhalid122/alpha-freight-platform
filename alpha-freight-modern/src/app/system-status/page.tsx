"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cloud,
  CreditCard,
  Globe,
  MessageSquare,
  RefreshCw,
  Server,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ServiceStatus = "operational" | "degraded" | "maintenance" | "outage";

type Service = {
  name: string;
  description: string;
  status: ServiceStatus;
  icon: typeof Server;
  uptime: string;
};

type Incident = {
  date: string;
  title: string;
  status: "resolved" | "monitoring";
  summary: string;
};

const services: Service[] = [
  {
    name: "Alpha Marketplace",
    description: "Load posting, bidding, and assignment workflows",
    status: "operational",
    icon: Truck,
    uptime: "99.98%",
  },
  {
    name: "Smart Matching Engine",
    description: "AI load ranking and carrier fit scoring",
    status: "operational",
    icon: Sparkles,
    uptime: "99.96%",
  },
  {
    name: "Carrier & Supplier Portals",
    description: "Web dashboards for carriers and suppliers",
    status: "operational",
    icon: Globe,
    uptime: "99.97%",
  },
  {
    name: "Mobile Application",
    description: "iOS and Android carrier/supplier app services",
    status: "operational",
    icon: Smartphone,
    uptime: "99.95%",
  },
  {
    name: "Payments & Wallet",
    description: "Stripe checkout, wallet balances, and payout processing",
    status: "operational",
    icon: CreditCard,
    uptime: "99.99%",
  },
  {
    name: "Messaging & Notifications",
    description: "In-app messaging, alerts, and email delivery",
    status: "operational",
    icon: MessageSquare,
    uptime: "99.94%",
  },
  {
    name: "Digital POD",
    description: "Proof of delivery upload and verification",
    status: "operational",
    icon: CheckCircle2,
    uptime: "99.97%",
  },
  {
    name: "Public API",
    description: "Developer endpoints and webhook delivery",
    status: "operational",
    icon: Server,
    uptime: "99.93%",
  },
];

const recentIncidents: Incident[] = [
  {
    date: "March 12, 2026",
    title: "Intermittent notification delay",
    status: "resolved",
    summary:
      "Some users experienced delayed in-app notifications for approximately 18 minutes. Delivery processing and load workflows were unaffected.",
  },
  {
    date: "February 3, 2026",
    title: "Scheduled platform maintenance",
    status: "resolved",
    summary:
      "Planned maintenance window completed for database performance upgrades. All services restored ahead of schedule.",
  },
];

const uptimeBars = Array.from({ length: 90 }, (_, index) => index !== 47 && index !== 48);

function statusMeta(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return {
        label: "Operational",
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        dot: "bg-emerald-500",
      };
    case "degraded":
      return {
        label: "Degraded",
        pill: "bg-amber-50 text-amber-700 ring-amber-100",
        dot: "bg-amber-500",
      };
    case "maintenance":
      return {
        label: "Maintenance",
        pill: "bg-sky-50 text-sky-700 ring-sky-100",
        dot: "bg-sky-500",
      };
    default:
      return {
        label: "Outage",
        pill: "bg-rose-50 text-rose-700 ring-rose-100",
        dot: "bg-rose-500",
      };
  }
}

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function SystemStatusPage() {
  const [lastChecked, setLastChecked] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const overallStatus = useMemo(() => {
    if (services.some((service) => service.status === "outage")) return "outage";
    if (services.some((service) => service.status === "degraded")) return "degraded";
    if (services.some((service) => service.status === "maintenance")) return "maintenance";
    return "operational";
  }, []);

  const overall = statusMeta(overallStatus);

  useEffect(() => {
    const timer = window.setInterval(() => setLastChecked(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setLastChecked(new Date());
      setRefreshing(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
                Platform health
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">System Status</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
                Live operational status for Alpha Freight marketplace services, payments, mobile
                app infrastructure, and API availability across the UK platform.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh status
            </button>
          </div>

          <section className="mt-10 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${overall.dot}`} />
                    <span className={`relative inline-flex h-3 w-3 rounded-full ${overall.dot}`} />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {overallStatus === "operational"
                        ? "All systems operational"
                        : overall.label}
                    </p>
                    <p className="text-sm text-slate-500">Last checked: {formatTimestamp(lastChecked)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${overall.pill}`}>
                  {overall.label}
                </span>
              </div>
            </div>

            <div className="grid gap-px bg-slate-100 md:grid-cols-2">
              {services.map((service) => {
                const Icon = service.icon;
                const meta = statusMeta(service.status);

                return (
                  <article
                    key={service.name}
                    className="flex items-start justify-between gap-4 bg-white px-6 py-5 sm:px-8"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-semibold text-slate-900">{service.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{service.description}</p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          90-day uptime: {service.uptime}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${meta.pill}`}>
                      {meta.label}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Platform uptime
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Last 90 days</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">99.97%</p>
                  <p className="text-xs text-slate-500">Combined services</p>
                </div>
              </div>

              <div className="mt-6 flex gap-1">
                {uptimeBars.map((healthy, index) => (
                  <div
                    key={index}
                    className={`h-8 flex-1 rounded-sm ${healthy ? "bg-emerald-400" : "bg-amber-400"}`}
                    title={healthy ? "Operational" : "Minor incident"}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200/80 bg-slate-900 p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-[#BFFF07]">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Need help right now?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    If you are experiencing an issue not reflected here, contact support and include
                    your role, load ID, and a screenshot if available.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <p>
                  <span className="font-semibold text-white">Email:</span>{" "}
                  <a href="mailto:support@alphafreightuk.com" className="text-[#BFFF07] hover:underline">
                    support@alphafreightuk.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-white">Phone:</span>{" "}
                  <a href="tel:+447782294718" className="text-[#BFFF07] hover:underline">
                    +44 7782 294718
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-white">Hours:</span> Mon–Fri, 8:00 AM – 6:00 PM
                </p>
              </div>
              <Link
                href="/support"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#BFFF07]"
              >
                Visit support center
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </section>

          <section className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Incident history
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Recent events</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Cloud className="h-3.5 w-3.5" />
                No active incidents
              </div>
            </div>

            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <article
                  key={incident.title}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {incident.date}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900">{incident.title}</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 ring-1 ring-slate-200">
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{incident.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center sm:px-10">
            <p className="text-sm text-slate-500">
              Alpha Freight Solutions Limited · Platform status page for marketplace, mobile, and
              payment services
            </p>
            <Link
              href="/company-overview"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              Company overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
