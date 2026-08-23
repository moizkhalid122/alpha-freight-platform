"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Download, FileText, Lock, Scale } from "lucide-react";

import BrandMark from "@/components/BrandMark";
import {
  EXECUTIVE_AGREEMENT_META,
  EXECUTIVE_AGREEMENT_SCHEDULES,
  EXECUTIVE_AGREEMENT_SECTIONS,
} from "@/lib/executive-agreement-content";

export default function ExecutiveAgreementDocument() {
  const downloadPdf = useCallback(() => window.print(), []);
  const docRef = `${EXECUTIVE_AGREEMENT_META.docRef}-2026-001`;

  return (
    <div className="revenue-plan-root revenue-plan-document min-h-screen bg-white text-neutral-900">
      <header className="revenue-plan-no-print sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3 sm:px-10">
          <BrandMark href="/" />
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 border-2 border-neutral-900 bg-neutral-900 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px]">
        {/* Cover */}
        <section className="revenue-plan-cover relative border-b-2 border-neutral-900 px-6 py-16 sm:px-14 sm:py-24">
          <div className="absolute inset-x-0 top-0 h-1 bg-neutral-900" />

          <div className="flex flex-wrap items-start justify-between gap-6">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-500">
              <Lock className="h-3 w-3" />
              {EXECUTIVE_AGREEMENT_META.confidential}
            </p>
            <div className="border-2 border-neutral-900 px-5 py-3 text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Reference</p>
              <p className="mt-1 font-mono text-sm font-bold">{docRef}</p>
            </div>
          </div>

          <p className="mt-14 text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            {EXECUTIVE_AGREEMENT_META.company}
          </p>

          <h1 className="revenue-plan-display mt-6 max-w-4xl text-[clamp(1.75rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-tight">
            {EXECUTIVE_AGREEMENT_META.title}
          </h1>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {EXECUTIVE_AGREEMENT_META.subtitle}
          </p>

          <div className="mt-10 grid gap-px border-2 border-neutral-900 bg-neutral-900 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Effective date", v: EXECUTIVE_AGREEMENT_META.effectiveDate },
              { k: "Status", v: EXECUTIVE_AGREEMENT_META.status },
              { k: "Company no.", v: EXECUTIVE_AGREEMENT_META.companyNumber },
              { k: "Registered office", v: "London EC1V 2NX" },
            ].map((item) => (
              <div key={item.k} className="bg-white px-5 py-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">{item.k}</p>
                <p className="mt-2 text-sm font-semibold leading-snug">{item.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-px border border-neutral-300 bg-neutral-300 sm:grid-cols-2">
            {EXECUTIVE_AGREEMENT_META.parties.map((p) => (
              <div key={p.role} className="bg-neutral-50 px-6 py-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{p.role}</p>
                <p className="revenue-plan-display mt-2 text-xl font-semibold">{p.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 border-2 border-amber-600/30 bg-amber-50 p-6 sm:p-8">
            <div className="flex gap-3">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
              <p className="text-sm leading-relaxed text-amber-950">{EXECUTIVE_AGREEMENT_META.legalNotice}</p>
            </div>
          </div>

          <p className="mt-10 text-xs text-neutral-400">
            Registered office: {EXECUTIVE_AGREEMENT_META.registeredOffice}
          </p>
        </section>

        {/* Contents */}
        <section className="revenue-plan-section border-b border-neutral-200 px-6 py-12 sm:px-14">
          <SectionHeader number="—" title="Table of contents" />
          <div className="mt-6 border border-neutral-200">
            {EXECUTIVE_AGREEMENT_SECTIONS.map((s, i) => (
              <div key={s.number} className={`flex gap-4 border-b border-neutral-200 px-5 py-3 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                <span className="font-mono text-xs font-bold text-neutral-300">{s.number}</span>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
            ))}
            {EXECUTIVE_AGREEMENT_SCHEDULES.map((s) => (
              <div key={s.id} className="flex gap-4 border-b border-neutral-200 bg-neutral-100 px-5 py-3 last:border-b-0">
                <span className="font-mono text-xs font-bold text-neutral-400">{s.id}</span>
                <span className="text-sm font-semibold">{s.title}</span>
              </div>
            ))}
          </div>

          <div className="revenue-plan-no-print mt-6 flex flex-wrap gap-3">
            {EXECUTIVE_AGREEMENT_META.relatedDocs.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="border border-neutral-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-900"
              >
                {doc.label} →
              </Link>
            ))}
          </div>
        </section>

        {/* Main clauses */}
        {EXECUTIVE_AGREEMENT_SECTIONS.map((section, idx) => (
          <section
            key={section.number}
            className={`revenue-plan-section px-6 py-14 sm:px-14 sm:py-16 ${idx > 0 && idx % 4 === 0 ? "revenue-plan-section--break bg-neutral-50" : idx > 0 ? "revenue-plan-section--break" : ""}`}
          >
            <SectionHeader number={section.number} title={section.title} />

            {section.body?.map((p) => (
              <p key={p.slice(0, 48)} className="revenue-plan-serif mt-6 text-[15px] leading-[1.8] text-neutral-700 sm:text-base">
                {p}
              </p>
            ))}

            {section.subsections?.map((sub) => (
              <div key={sub.heading} className="mt-8 border-l-4 border-neutral-900 pl-6">
                <h3 className="revenue-plan-display text-lg font-semibold">{sub.heading}</h3>
                <ClauseList items={sub.bullets} />
              </div>
            ))}

            {section.bullets ? <ClauseList items={section.bullets} /> : null}

            {section.callout ? (
              <div className="mt-8 border-2 border-neutral-900 bg-neutral-900 p-6 text-white sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">Note</p>
                <p className="revenue-plan-serif mt-3 text-base leading-relaxed">{section.callout}</p>
              </div>
            ) : null}
          </section>
        ))}

        {/* Schedules */}
        {EXECUTIVE_AGREEMENT_SCHEDULES.map((schedule) => (
          <section key={schedule.id} className="revenue-plan-section revenue-plan-section--break border-t-2 border-neutral-900 px-6 py-14 sm:px-14 sm:py-16">
            <SectionHeader number={schedule.id} title={schedule.title} />

            {"fields" in schedule && schedule.fields ? (
              <div className="mt-8 border-2 border-neutral-900">
                {schedule.fields.map((field, i) => (
                  <div key={field.label} className={`grid border-b border-neutral-200 last:border-b-0 sm:grid-cols-[240px_1fr] ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                    <div className="border-b border-neutral-200 bg-neutral-100 px-5 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600 sm:border-b-0 sm:border-r">
                      {field.label}
                    </div>
                    <div className="px-5 py-4 font-mono text-sm text-neutral-800">{field.value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {"bullets" in schedule && schedule.bullets ? <ClauseList items={[...schedule.bullets]} /> : null}

            {"body" in schedule && schedule.body?.map((p) => (
              <p key={p} className="revenue-plan-serif mt-6 text-base leading-relaxed text-neutral-700 italic">
                {p}
              </p>
            ))}

            {"signatures" in schedule && schedule.signatures ? (
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {schedule.signatures.map((sig) => (
                  <div key={sig.party} className="border-2 border-neutral-900 p-8">
                    <p className="text-sm font-bold">{sig.party}</p>
                    <div className="mt-8 space-y-6">
                      {sig.lines.map((line) => (
                        <p key={line} className="border-b border-neutral-400 pb-8 font-mono text-sm text-neutral-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}

        <footer className="revenue-plan-section border-t-2 border-neutral-900 px-6 py-12 sm:px-14">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <BrandMark href="/" />
            <div className="text-center sm:text-right">
              <p className="font-mono text-xs text-neutral-500">{docRef}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                {EXECUTIVE_AGREEMENT_META.confidential}
              </p>
            </div>
          </div>
          <p className="revenue-plan-no-print mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <FileText className="h-4 w-4" />
            Download PDF → Print → Save as PDF
          </p>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="border-b-2 border-neutral-900 pb-5">
      <div className="flex items-end gap-5">
        <span className="revenue-plan-display text-5xl font-light leading-none text-neutral-200">{number}</span>
        <h2 className="revenue-plan-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
    </div>
  );
}

function ClauseList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-4 text-[15px] leading-[1.75] text-neutral-700">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-neutral-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
