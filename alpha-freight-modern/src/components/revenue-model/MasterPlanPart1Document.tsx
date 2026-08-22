"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Download, FileText, Lock, ArrowRight } from "lucide-react";

import BrandMark from "@/components/BrandMark";
import {
  MASTER_PLAN_PART1_META,
  MASTER_PLAN_SCOPE_CARDS,
  MASTER_PLAN_SECTIONS,
} from "@/lib/master-plan-part1-content";

export default function MasterPlanPart1Document() {
  const downloadPdf = useCallback(() => window.print(), []);
  const year = new Date().getFullYear();
  const docRef = `${MASTER_PLAN_PART1_META.docRef}-${year}-001`;

  return (
    <div className="revenue-plan-root revenue-plan-document min-h-screen bg-white text-neutral-900">
      <header className="revenue-plan-no-print sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3 sm:px-10">
          <div className="flex items-center gap-4">
            <BrandMark href="/" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 sm:inline">
              Part 1 · Private
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={MASTER_PLAN_PART1_META.part2Path}
              className="revenue-plan-no-print hidden items-center gap-1.5 border border-neutral-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-900 sm:inline-flex"
            >
              Part 2
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 border-2 border-neutral-900 bg-neutral-900 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px]">
        {/* Cover */}
        <section className="revenue-plan-cover relative min-h-[88vh] border-b-2 border-neutral-900 px-6 py-16 sm:px-14 sm:py-22">
          <div className="absolute inset-x-0 top-0 h-1 bg-neutral-900" />

          <div className="flex flex-wrap items-start justify-between gap-6">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">
              <Lock className="h-3 w-3" />
              {MASTER_PLAN_PART1_META.confidential}
            </p>
            <div className="border-2 border-neutral-900 px-5 py-3 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Document</p>
              <p className="mt-1 font-mono text-sm font-bold">{docRef}</p>
            </div>
          </div>

          <p className="mt-16 text-[11px] font-bold uppercase tracking-[0.35em] text-neutral-400">Alpha Freight</p>
          <h1 className="revenue-plan-display mt-4 max-w-4xl text-[clamp(2rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-tight">
            Master Growth &amp; Financial Plan
            <span className="mt-2 block text-[0.55em] font-normal italic text-neutral-500">— Part 1</span>
          </h1>

          <p className="mt-8 max-w-3xl text-sm font-bold uppercase tracking-[0.15em] text-neutral-600 sm:text-base">
            {MASTER_PLAN_PART1_META.subtitle}
          </p>

          <div className="mt-10 h-px w-40 bg-neutral-900" />

          <p className="revenue-plan-serif mt-10 max-w-3xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            {MASTER_PLAN_PART1_META.intro}
          </p>

          <div className="mt-14 grid gap-px border-2 border-neutral-900 bg-neutral-900 sm:grid-cols-3">
            {MASTER_PLAN_SCOPE_CARDS.map((card) => (
              <div key={card.label} className="bg-white px-6 py-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">{card.label}</p>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-neutral-800">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 inline-flex border-2 border-neutral-900 bg-neutral-50 px-6 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Scope</p>
              <p className="mt-1 text-sm font-bold text-neutral-900">{MASTER_PLAN_PART1_META.scope.included}</p>
            </div>
          </div>

          <p className="mt-16 flex items-center gap-2 text-xs text-neutral-400">
            <FileText className="h-4 w-4" />
            {MASTER_PLAN_PART1_META.company} — Master Plan Part 1 · Page 1
          </p>
        </section>

        {/* Contents */}
        <section className="revenue-plan-section border-b-2 border-neutral-900 px-6 py-14 sm:px-14">
          <SectionHeader number="—" title="Contents" />
          <div className="mt-8 border border-neutral-200">
            {MASTER_PLAN_SECTIONS.map((s, i) => (
              <div
                key={s.number}
                className={`flex items-center gap-6 border-b border-neutral-200 px-6 py-3 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}
              >
                <span className="w-8 font-mono text-sm font-bold text-neutral-300">{s.number}</span>
                <span className="text-sm font-semibold">{s.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sections */}
        {MASTER_PLAN_SECTIONS.map((section, idx) => (
          <section
            key={section.number}
            className={`revenue-plan-section px-6 py-14 sm:px-14 sm:py-18 ${idx > 0 && idx % 3 === 0 ? "revenue-plan-section--break bg-neutral-50" : idx > 0 ? "revenue-plan-section--break" : ""}`}
          >
            <SectionHeader number={section.number} title={section.title} page={idx + 2} />

            {"body" in section && section.body
              ? section.body.map((p) => (
                  <p key={p.slice(0, 40)} className="revenue-plan-serif mt-8 text-lg leading-[1.75] text-neutral-700">
                    {p}
                  </p>
                ))
              : null}

            {"subsections" in section && section.subsections
              ? section.subsections.map((sub) => (
                  <div key={sub.heading} className="mt-8 border-l-4 border-neutral-900 pl-6">
                    <h3 className="revenue-plan-display text-xl font-semibold">{sub.heading}</h3>
                    <BulletList items={sub.bullets} />
                  </div>
                ))
              : null}

            {"bullets" in section && section.bullets && !("subsections" in section) ? (
              <BulletList items={section.bullets} />
            ) : null}

            {"table" in section && section.table ? (
              <div className="revenue-plan-table mt-8 overflow-x-auto border-2 border-neutral-900">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b-2 border-neutral-900 bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-white">
                    <tr>
                      {section.table.headers.map((h) => (
                        <th key={h} className="px-4 py-3 sm:px-5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri} className={`border-b border-neutral-200 ${ri % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 align-top text-neutral-800 sm:px-5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {"callout" in section && section.callout ? (
              <div className="mt-8 border-2 border-neutral-900 bg-neutral-900 p-6 text-white sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">Important</p>
                <p className="revenue-plan-serif mt-3 text-lg leading-relaxed">{section.callout}</p>
              </div>
            ) : null}

            {section.number === "14" ? (
              <div className="mt-10 border-2 border-neutral-900 p-8 sm:p-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">The Alpha Freight Rule</p>
                <p className="revenue-plan-display mt-4 text-2xl font-medium leading-snug sm:text-3xl">
                  {MASTER_PLAN_PART1_META.alphaRule}
                </p>
              </div>
            ) : null}
          </section>
        ))}

        {/* Part 2 link + disclaimer */}
        <section className="revenue-plan-section revenue-plan-section--break border-t-2 border-neutral-900 bg-neutral-900 px-6 py-14 text-white sm:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Continues in</p>
          <h2 className="revenue-plan-display mt-3 text-3xl font-semibold">{MASTER_PLAN_PART1_META.part2Label}</h2>
          <p className="mt-4 max-w-2xl text-neutral-400">
            Complete 44-revenue-stream plan with priorities, pricing logic, implementation order and revenue contribution
            mapping.
          </p>
          <Link
            href={MASTER_PLAN_PART1_META.part2Path}
            className="revenue-plan-no-print mt-8 inline-flex items-center gap-2 border-2 border-white bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900"
          >
            Open Part 2
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <footer className="revenue-plan-section px-6 py-12 sm:px-14">
          <p className="text-center text-xs leading-relaxed text-neutral-500">{MASTER_PLAN_PART1_META.closingNote}</p>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row">
            <BrandMark href="/" />
            <p className="font-mono text-xs text-neutral-400">
              {docRef} · {MASTER_PLAN_PART1_META.confidential} · {year}
            </p>
          </div>
          <p className="revenue-plan-no-print mt-6 text-center text-xs text-neutral-400">
            Download PDF → Print → Save as PDF
          </p>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ number, title, page }: { number: string; title: string; page?: number }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b-2 border-neutral-900 pb-6">
      <div className="flex items-end gap-5">
        <span className="revenue-plan-display text-5xl font-light leading-none text-neutral-200 sm:text-6xl">{number}</span>
        <h2 className="revenue-plan-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {page ? (
        <p className="hidden shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sm:block">
          Page {page}
        </p>
      ) : null}
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-3 border-t border-neutral-200 pt-6">
      {items.map((item) => (
        <li key={item} className="flex gap-4 text-[15px] leading-relaxed text-neutral-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-neutral-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
