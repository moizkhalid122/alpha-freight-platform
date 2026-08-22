"use client";

import Link from "next/link";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Lock, ArrowRight } from "lucide-react";

import BrandMark from "@/components/BrandMark";
import {
  ExecutionPipeline,
  GrowthEngineDiagram,
  RevenuePipelineOverview,
  RevenueWaterfall,
} from "@/components/revenue-model/GrowthEngineDiagram";
import {
  ALL_REVENUE_STREAMS,
  EXECUTIVE_SUMMARY,
  PLAN_PHASES,
  REVENUE_FUNNEL_STAGES,
  REVENUE_MODEL_SUMMARY,
  REVENUE_PILLARS,
  REVENUE_PROJECTIONS,
  REVENUE_TYPE_LABELS,
  type RevenueStreamType,
} from "@/lib/revenue-model-content";

const TYPE_STYLES: Record<RevenueStreamType, string> = {
  transaction: "bg-neutral-900 text-white",
  recurring: "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-900",
  "one-time": "bg-white text-neutral-800 ring-1 ring-neutral-400",
  affiliate: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300",
  b2b: "bg-neutral-800 text-white",
};

function TypeBadge({ type }: { type: RevenueStreamType }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] ${TYPE_STYLES[type]}`}>
      {REVENUE_TYPE_LABELS[type]}
    </span>
  );
}

export default function RevenuePlanDocument() {
  const typeCounts = ALL_REVENUE_STREAMS.reduce(
    (acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<RevenueStreamType, number>
  );

  const downloadPdf = useCallback(() => window.print(), []);
  const year = new Date().getFullYear();
  const docRef = `AF-STRAT-REV-${year}-001`;

  return (
    <div className="revenue-plan-root revenue-plan-document min-h-screen bg-white text-neutral-900">
      {/* Toolbar */}
      <header className="revenue-plan-no-print sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3 sm:px-10">
          <div className="flex items-center gap-4">
            <BrandMark href="/" />
            <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 sm:inline">
              Leadership · Private
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/master-plan"
              className="revenue-plan-no-print hidden items-center gap-1.5 border border-neutral-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-900 sm:inline-flex"
            >
              Part 1
              <ArrowRight className="h-3 w-3 rotate-180" />
            </Link>
            <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 border-2 border-neutral-900 bg-neutral-900 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px]">
        {/* ═══ COVER — full heavy enterprise ═══ */}
        <section className="revenue-plan-cover relative min-h-[90vh] border-x-0 border-b-2 border-neutral-900 px-6 py-16 sm:px-14 sm:py-24">
          <div className="absolute inset-x-0 top-0 h-1 bg-neutral-900" />
          <div className="absolute inset-x-0 top-1 h-24 bg-gradient-to-b from-neutral-100/80 to-transparent" />

          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">
                <Lock className="h-3 w-3" />
                {REVENUE_MODEL_SUMMARY.confidential}
              </p>
              <p className="mt-6 font-mono text-xs text-neutral-400">{docRef}</p>
            </div>
            <div className="border-2 border-neutral-900 px-6 py-4 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Classification</p>
              <p className="mt-1 text-sm font-bold">Internal Strategy</p>
              <p className="mt-2 font-mono text-xs text-neutral-500">{year}</p>
            </div>
          </div>

          <div className="mt-20 max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-neutral-400">Alpha Freight Solutions Limited</p>
            <h1 className="revenue-plan-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-neutral-900">
              Strategic Revenue
              <br />
              <span className="italic font-normal text-neutral-600">& Growth Plan</span>
            </h1>
            <div className="mt-8 h-px w-32 bg-neutral-900" />
            <p className="revenue-plan-serif mt-8 max-w-2xl text-xl leading-relaxed text-neutral-600 sm:text-2xl">
              {REVENUE_MODEL_SUMMARY.subheadline}
            </p>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-px border-2 border-neutral-900 bg-neutral-900 sm:grid-cols-4">
            {[
              { k: "Revenue streams", v: "44" },
              { k: "12-mo target", v: "£242k" },
              { k: "Monthly (Y1)", v: "£20.2k" },
              { k: "Prepared", v: String(year) },
            ].map((s) => (
              <div key={s.k} className="bg-white px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-400">{s.k}</p>
                <p className="revenue-plan-display mt-3 text-4xl font-medium sm:text-5xl">{s.v}</p>
              </div>
            ))}
          </div>

          <p className="mt-16 flex items-center gap-2 text-xs text-neutral-400">
            <FileText className="h-4 w-4" />
            Prepared exclusively for Alpha Freight leadership · Part 2 of 2 · Not for external distribution
          </p>
        </section>

        {/* ═══ CONTENTS ═══ */}
        <section className="revenue-plan-section border-b-2 border-neutral-900 px-6 py-14 sm:px-14">
          <SectionTitle number="—" title="Document structure" />
          <div className="mt-10 grid gap-0 border border-neutral-200">
            {[
              ["01", "Executive summary"],
              ["02", "Master revenue pipeline"],
              ["03", "Growth engine diagram"],
              ["04", "Revenue pillars & stream map"],
              ["05", "Complete index — 44 streams"],
              ["06", "Execution pipeline"],
              ["07", "Financial waterfall"],
            ].map(([num, label], i) => (
              <div
                key={num}
                className={`flex items-center justify-between border-b border-neutral-200 px-6 py-4 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}
              >
                <span className="font-mono text-sm font-bold text-neutral-300">{num}</span>
                <span className="flex-1 px-6 text-sm font-semibold tracking-wide">{label}</span>
                <span className="text-neutral-300">····</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 01 EXECUTIVE ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="01" title="Executive summary" subtitle="Strategic rationale" />
          <div className="mt-12 space-y-0 border-2 border-neutral-900">
            {EXECUTIVE_SUMMARY.map((point, i) => (
              <div key={i} className={`flex gap-8 p-8 sm:p-10 ${i < EXECUTIVE_SUMMARY.length - 1 ? "border-b-2 border-neutral-900" : ""}`}>
                <span className="revenue-plan-display text-5xl font-light leading-none text-neutral-200 sm:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="revenue-plan-serif flex-1 text-lg leading-[1.75] text-neutral-700 sm:text-xl">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 02 MASTER PIPELINE ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break bg-neutral-50 px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="02" title="Master revenue pipeline" subtitle="Five-stage monetisation architecture" />
          <div className="mt-12">
            <RevenuePipelineOverview />
          </div>
        </section>

        {/* ═══ 03 GROWTH DIAGRAM ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="03" title="Growth engine" subtitle="User journey · revenue funnel · 44 touchpoints" />
          <div className="mt-12">
            <GrowthEngineDiagram />
          </div>
        </section>

        {/* ═══ 04 PILLARS + FUNNEL ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="04" title="Revenue pillars & stream map" subtitle="Four directions · eleven journey steps" />

          <div className="mt-12 grid gap-px border-2 border-neutral-900 bg-neutral-900 sm:grid-cols-2">
            {REVENUE_PILLARS.map((p, i) => (
              <div key={p.title} className="bg-white p-8 sm:p-10">
                <p className="font-mono text-[10px] font-bold text-neutral-400">PILLAR {String(i + 1).padStart(2, "0")}</p>
                <h3 className="revenue-plan-display mt-3 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-neutral-500">{p.subtitle}</p>
                <p className="mt-4 font-mono text-3xl font-bold text-neutral-900">{p.count}</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">streams</p>
              </div>
            ))}
          </div>

          <div className="mt-16 space-y-0 border-2 border-neutral-900">
            {REVENUE_FUNNEL_STAGES.map((stage, idx) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50"}
              >
                <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8 lg:px-10">
                  <div className="flex items-center gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-neutral-900 font-mono text-lg font-bold">
                      {String(stage.step).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{stage.badge}</p>
                      <h4 className="revenue-plan-display mt-1 text-xl font-semibold">{stage.title}</h4>
                    </div>
                  </div>
                </div>
                <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
                  {stage.streams.map((s) => (
                    <div key={s.id} className="flex gap-4 bg-white p-5">
                      <span className="font-mono text-xs font-bold text-neutral-300">{String(s.id).padStart(2, "0")}</span>
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        {s.note ? <p className="mt-0.5 text-xs text-neutral-500">{s.note}</p> : null}
                        <div className="mt-2">
                          <TypeBadge type={s.type} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ 05 INDEX ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break bg-neutral-900 px-6 py-16 text-white sm:px-14 sm:py-20">
          <SectionTitle number="05" title="Complete index" subtitle="All 44 revenue streams" inverted />
          <div className="mt-8 flex flex-wrap gap-2">
            {(Object.keys(REVENUE_TYPE_LABELS) as RevenueStreamType[]).map((t) => (
              <span key={t} className="border border-neutral-600 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-300">
                {REVENUE_TYPE_LABELS[t]} · {typeCounts[t]}
              </span>
            ))}
          </div>
          <div className="revenue-plan-table mt-10 border border-neutral-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-700 text-[10px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="w-16 px-4 py-4">#</th>
                  <th className="px-4 py-4">Stream</th>
                  <th className="hidden px-4 py-4 sm:table-cell">Type</th>
                </tr>
              </thead>
              <tbody>
                {ALL_REVENUE_STREAMS.map((s, i) => (
                  <tr key={s.id} className={`border-b border-neutral-800 ${i % 2 === 0 ? "bg-neutral-900" : "bg-neutral-950"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{String(s.id).padStart(2, "0")}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <TypeBadge type={s.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ 06 EXECUTION PIPELINE ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="06" title="Execution pipeline" subtitle="Phased delivery · 30 / 90 / 365 days" />
          <div className="mt-12">
            <ExecutionPipeline />
          </div>
          <div className="mt-10 grid gap-px border-2 border-neutral-900 bg-neutral-900 lg:grid-cols-3">
            {PLAN_PHASES.map((phase) => (
              <div key={phase.phase} className="bg-white p-8">
                <p className="font-mono text-xs font-bold">{phase.phase}</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">{phase.timeline}</p>
                <h3 className="revenue-plan-display mt-4 text-xl font-semibold">{phase.title}</h3>
                <ul className="mt-4 space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-neutral-600">
                      <span className="font-bold text-neutral-900">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-2 border-neutral-900 bg-neutral-50 p-8 sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Priority queue — Phase 1</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {REVENUE_MODEL_SUMMARY.priorityTop5.map((item, i) => (
                <div key={item} className="border-2 border-neutral-900 bg-white p-4">
                  <p className="font-mono text-xs text-neutral-400">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-2 text-sm font-bold leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 07 WATERFALL ═══ */}
        <section className="revenue-plan-section revenue-plan-section--break border-t-2 border-neutral-900 px-6 py-16 sm:px-14 sm:py-20">
          <SectionTitle number="07" title="Financial waterfall" subtitle="Conservative month-12 projection · £20,200 / month" />
          <p className="mt-4 text-sm text-neutral-500">Illustrative model — assumes product launch + growing load volume.</p>
          <div className="mt-12 border-2 border-neutral-900 p-8 sm:p-12">
            <RevenueWaterfall />
          </div>
          <div className="mt-10 border-2 border-neutral-900">
            <table className="revenue-plan-table w-full text-sm">
              <thead className="bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                <tr>
                  <th className="px-6 py-4 text-left">Line item</th>
                  <th className="px-6 py-4 text-right">Month 6</th>
                  <th className="px-6 py-4 text-right">Month 12</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_PROJECTIONS.map((row, i) => (
                  <tr key={row.stream} className={`border-t border-neutral-200 ${row.highlight ? "bg-neutral-900 font-bold text-white" : i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                    <td className="px-6 py-4">{row.stream}</td>
                    <td className="px-6 py-4 text-right font-mono">{row.m6}</td>
                    <td className="px-6 py-4 text-right font-mono">{row.m12}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="revenue-plan-section border-t-2 border-neutral-900 px-6 py-12 sm:px-14">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <BrandMark href="/" />
            <div className="text-center sm:text-right">
              <p className="revenue-plan-display text-lg font-medium">{docRef}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                {REVENUE_MODEL_SUMMARY.confidential} · {year}
              </p>
            </div>
          </div>
          <p className="revenue-plan-no-print mt-8 text-center text-xs text-neutral-400">
            Download PDF → Save as PDF in print dialog
          </p>
        </footer>
      </main>
    </div>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
  inverted,
}: {
  number: string;
  title: string;
  subtitle?: string;
  inverted?: boolean;
}) {
  return (
    <div className={`border-b-2 pb-8 ${inverted ? "border-neutral-700" : "border-neutral-900"}`}>
      <div className="flex items-end gap-6">
        <span className={`revenue-plan-display text-6xl font-light leading-none sm:text-7xl ${inverted ? "text-neutral-700" : "text-neutral-200"}`}>
          {number}
        </span>
        <div>
          <h2 className={`revenue-plan-display text-3xl font-semibold tracking-tight sm:text-4xl ${inverted ? "text-white" : "text-neutral-900"}`}>
            {title}
          </h2>
          {subtitle ? (
            <p className={`mt-2 text-sm ${inverted ? "text-neutral-400" : "text-neutral-500"}`}>{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
