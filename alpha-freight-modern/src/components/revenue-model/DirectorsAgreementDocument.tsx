"use client";

import { useCallback, useRef, useState } from "react";
import { Download, FileText, Loader2, Lock, Printer, Scale, Shield } from "lucide-react";

import BrandMark from "@/components/BrandMark";
import { downloadDirectorsAgreementPdf } from "@/lib/download-directors-agreement-pdf";
import {
  DIRECTORS_AGREEMENT_CLAUSES,
  DIRECTORS_AGREEMENT_META,
  DIRECTORS_AGREEMENT_SCHEDULES,
  DIRECTORS_AGREEMENT_SUMMARY,
} from "@/lib/directors-agreement-content";

export default function DirectorsAgreementDocument() {
  const documentRef = useRef<HTMLElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = useCallback(async () => {
    if (!documentRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadDirectorsAgreementPdf(documentRef.current);
    } catch (error) {
      console.error(error);
      window.alert("PDF download failed. Please use the Print button → Save as PDF.");
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  const printPdf = useCallback(() => window.print(), []);

  return (
    <div className="revenue-plan-root revenue-plan-document directors-agreement-print min-h-screen bg-[#fafafa] text-neutral-900">
      {/* Toolbar */}
      <header className="revenue-plan-no-print sticky top-0 z-50 border-b border-neutral-300 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between px-6 py-3 sm:px-10">
          <BrandMark href="/" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={printPdf}
              className="revenue-plan-no-print hidden items-center gap-2 border border-neutral-300 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-600 hover:border-neutral-900 sm:inline-flex"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 border-2 border-neutral-900 bg-neutral-900 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloading ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      </header>

      <main ref={documentRef} className="mx-auto max-w-[1140px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        {/* ═══ COVER ═══ */}
        <section className="revenue-plan-cover relative border-b-4 border-neutral-900 px-8 py-16 sm:px-16 sm:py-24">
          <div className="absolute inset-x-0 top-0 flex h-2">
            <div className="flex-1 bg-neutral-900" />
            <div className="w-24 bg-neutral-400" />
            <div className="flex-1 bg-neutral-900" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">
                <Lock className="h-3.5 w-3.5" />
                {DIRECTORS_AGREEMENT_META.confidential}
              </p>
              <p className="mt-4 font-mono text-xs text-neutral-400">{DIRECTORS_AGREEMENT_META.docRef}</p>
            </div>
            <div className="flex items-center gap-3 border-2 border-neutral-900 px-6 py-4">
              <Shield className="h-8 w-8 text-neutral-900" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Company No.</p>
                <p className="font-mono text-lg font-bold">{DIRECTORS_AGREEMENT_META.companyNumber}</p>
              </div>
            </div>
          </div>

          <p className="mt-16 text-[11px] font-bold uppercase tracking-[0.32em] text-neutral-400">
            {DIRECTORS_AGREEMENT_META.company}
          </p>

          <h1 className="revenue-plan-display mt-5 max-w-4xl text-[clamp(1.65rem,4.5vw,3.25rem)] font-medium leading-[1.08] tracking-tight">
            Final Directors, Executive Remuneration, Governance &amp; UK Operating Agreement
          </h1>

          <div className="mt-10 grid gap-px border-2 border-neutral-900 bg-neutral-900 lg:grid-cols-2">
            {DIRECTORS_AGREEMENT_META.parties.map((p) => (
              <div key={p.name} className="bg-white px-8 py-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-400">{p.role}</p>
                <p className="revenue-plan-display mt-2 text-2xl font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-neutral-500">{p.detail}</p>
              </div>
            ))}
          </div>

          {/* Key terms summary */}
          <div className="mt-12">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500">Final position — summary</p>
            <div className="border-2 border-neutral-900">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-neutral-900 bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-[40%] px-5 py-3">Item</th>
                    <th className="px-5 py-3">Final Position</th>
                  </tr>
                </thead>
                <tbody>
                  {DIRECTORS_AGREEMENT_SUMMARY.map((row, i) => (
                    <tr key={row.item} className={`border-b border-neutral-200 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                      <td className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-500">{row.item}</td>
                      <td className={`px-5 py-3.5 font-semibold ${row.item.includes("Salary") ? "revenue-plan-display text-xl text-neutral-900" : ""}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10 border-2 border-amber-700/20 bg-amber-50/80 p-7 sm:p-9">
            <div className="flex gap-4">
              <Scale className="mt-0.5 h-6 w-6 shrink-0 text-amber-900" />
              <p className="text-sm leading-[1.8] text-amber-950">{DIRECTORS_AGREEMENT_META.legalNotice}</p>
            </div>
          </div>

          <p className="mt-10 text-xs text-neutral-400">
            Registered office: {DIRECTORS_AGREEMENT_META.registeredOffice} · Effective: {DIRECTORS_AGREEMENT_META.effectiveDate}
          </p>
        </section>

        {/* ═══ CONTENTS ═══ */}
        <section className="revenue-plan-section revenue-plan-contents border-b border-neutral-200 px-8 py-14 sm:px-16">
          <DocHeading label="Contents" />
          <div className="mt-8 columns-1 gap-8 sm:columns-2">
            {DIRECTORS_AGREEMENT_CLAUSES.map((c) => (
              <div key={c.number} className="mb-2 flex break-inside-avoid gap-3 border-b border-neutral-100 py-2">
                <span className="w-8 shrink-0 font-mono text-xs font-bold text-neutral-300">{c.number}.</span>
                <span className="text-sm">{c.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-neutral-200 pt-6">
            {DIRECTORS_AGREEMENT_SCHEDULES.map((s) => (
              <p key={s.id} className="py-1 text-sm font-semibold text-neutral-700">
                {s.title}
              </p>
            ))}
          </div>
        </section>

        {/* ═══ CLAUSES 1–45 ═══ */}
        {DIRECTORS_AGREEMENT_CLAUSES.map((clause) => (
          <section
            key={clause.number}
            className="legal-clause revenue-plan-section px-8 py-10 sm:px-16 sm:py-12"
          >
            <div className="legal-clause-header">
              <ClauseHeader number={clause.number} title={clause.title} />
            </div>

            <div className="legal-clause-body">
            {clause.body?.map((p) => (
              <p key={p.slice(0, 50)} className="legal-body mt-5">
                {p}
              </p>
            ))}

            {clause.subsections?.map((sub) => (
              <div key={sub.heading} className="mt-7 border-l-[3px] border-neutral-900 pl-6">
                <h3 className="revenue-plan-display text-lg font-semibold">{sub.heading}</h3>
                <LegalList items={sub.bullets} />
              </div>
            ))}

            {clause.bullets ? <LegalList items={clause.bullets} /> : null}

            {clause.table ? (
              <div className="revenue-plan-table mt-7 border-2 border-neutral-900 overflow-x-auto sm:overflow-visible">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b-2 border-neutral-900 bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    <tr>
                      {clause.table.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clause.table.rows.map((row, ri) => (
                      <tr key={ri} className={`border-b border-neutral-200 ${ri % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 align-top text-neutral-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {clause.callout ? (
              <div className="legal-callout mt-7 p-6 sm:p-8">
                <p className="legal-callout__label">Important</p>
                <p className="legal-callout__text">{clause.callout}</p>
              </div>
            ) : null}
            </div>
          </section>
        ))}

        {/* ═══ SCHEDULES ═══ */}
        {DIRECTORS_AGREEMENT_SCHEDULES.map((schedule, scheduleIndex) => (
          <section
            key={schedule.id}
            className={`schedule-section revenue-plan-section border-t-4 border-neutral-900 bg-neutral-50 px-8 py-14 sm:px-16 ${scheduleIndex === 0 ? "schedule-section--start" : ""}`}
          >
            <div className="schedule-heading">
              <DocHeading label={schedule.title} large />
            </div>

            <div className="schedule-content">
            {"table" in schedule && schedule.table ? (
              <div className="revenue-plan-table mt-8 border-2 border-neutral-900 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-neutral-900 bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-white">
                    <tr>
                      {schedule.table.headers.map((h) => (
                        <th key={h} className="px-5 py-3 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.table.rows.map((row, i) => (
                      <tr key={i} className={`border-b border-neutral-200 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                        <td className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-500">{row[0]}</td>
                        <td className={`px-5 py-3.5 font-medium ${row[0].includes("salary") ? "revenue-plan-display text-lg font-semibold" : ""}`}>
                          {row[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {"bullets" in schedule && schedule.bullets ? <LegalList items={[...schedule.bullets]} /> : null}

            {"body" in schedule && schedule.body?.map((p) => (
              <p key={p} className="legal-body mt-6 italic text-neutral-600">
                {p}
              </p>
            ))}

            {"signatures" in schedule && schedule.signatures ? (
              <div className="mt-12 grid gap-10 lg:grid-cols-2">
                {schedule.signatures.map((sig) => (
                  <div key={sig.party} className="legal-signature-card border-2 border-neutral-900 bg-white p-8 sm:p-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{sig.heading}</p>
                    <p className="revenue-plan-display mt-3 text-lg font-semibold">{sig.party}</p>
                    <div className="mt-10 space-y-10">
                      <SigLine label="Signature" />
                      <SigLine label="Date" placeholder="______ / ______ / 2026" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {"confirmation" in schedule && schedule.confirmation ? (
              <div className="legal-confirmation mt-12 p-8 text-center sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Final confirmation</p>
                <p className="revenue-plan-display legal-confirmation__text mt-4 text-xl font-medium leading-snug sm:text-2xl">
                  {schedule.confirmation}
                </p>
                <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.35em] text-neutral-400">End of agreement</p>
              </div>
            ) : null}
            </div>
          </section>
        ))}

        {/* Footer */}
        <footer className="revenue-plan-section border-t-2 border-neutral-900 px-8 py-12 sm:px-16">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="revenue-plan-no-print">
              <BrandMark href="/" />
            </div>
            <div className="text-center sm:text-right">
              <p className="font-mono text-xs text-neutral-500">{DIRECTORS_AGREEMENT_META.docRef}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                {DIRECTORS_AGREEMENT_META.company} · {DIRECTORS_AGREEMENT_META.governingLaw}
              </p>
            </div>
          </div>
          <p className="revenue-plan-no-print mt-8 flex flex-col items-center justify-center gap-1 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Download PDF saves directly — no print dialog
            </span>
            <span className="text-[10px] text-neutral-400">Use Print only if you prefer browser Save as PDF (A4 · headers off)</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function DocHeading({ label, large }: { label: string; large?: boolean }) {
  return (
    <div className="border-b-2 border-neutral-900 pb-4">
      <h2 className={`revenue-plan-display font-semibold tracking-tight ${large ? "text-3xl" : "text-2xl"}`}>{label}</h2>
    </div>
  );
}

function ClauseHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-start gap-5 border-b border-neutral-200 pb-5">
      <span className="revenue-plan-display text-4xl font-light leading-none text-neutral-200 sm:text-5xl">
        {String(number).padStart(2, "0")}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">Clause {number}</p>
        <h2 className="revenue-plan-display mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      </div>
    </div>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="legal-body flex gap-4">
          <span className="mt-[0.55rem] h-1 w-1 shrink-0 bg-neutral-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SigLine({ label, placeholder = "__________________________________________" }: { label: string; placeholder?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="mt-3 border-b border-neutral-400 pb-10 font-mono text-sm text-neutral-500">{placeholder}</p>
    </div>
  );
}
