"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { VerifyEmployeeResult } from "@/lib/verify-employee";
import VerifiedOfficialContacts from "@/components/security/VerifiedOfficialContacts";

const tips = [
  "Every official employee has a unique ID starting with AF-EMP-",
  "Official emails always end with @alphafreightuk.com",
  "Never share payment details until verification passes",
  "Report anyone who cannot verify their identity",
];

export default function VerifyEmployeePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyEmployeeResult | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/api/public/verify-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });

      window.clearTimeout(timeout);
      setResult((await response.json()) as VerifyEmployeeResult);
    } catch {
      setResult({
        verified: false,
        message: "Verification timed out. Please try again.",
        reason: "not_found",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[920px] px-6 lg:px-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Verification
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Verify Alpha Freight Employee
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-7 text-slate-600">
              Check if someone is a real Alpha Freight employee before sharing business information,
              documents, or making any payment.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-10">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              <span aria-hidden="true">🟢</span>
              Employee Verification
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Employee ID or official email
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      if (result) setResult(null);
                    }}
                    placeholder="AF-EMP-9A504828 or name@alphafreightuk.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-[16px] text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    Verify Now
                  </>
                )}
              </button>
            </form>

            {result ? (
              <div
                className={`mt-8 rounded-2xl border p-6 ${
                  result.verified
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-red-200 bg-red-50/80"
                }`}
              >
                <div className="flex items-start gap-4">
                  {result.verified ? (
                    <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-2xl font-bold ${
                        result.verified ? "text-emerald-800" : "text-red-800"
                      }`}
                    >
                      {result.verified ? "✅ Verified Employee" : "❌ Employee Not Found"}
                    </p>

                    {result.verified ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <InfoRow label="Employee ID" value={result.employee.employee_code} mono />
                        {result.employee.name ? (
                          <InfoRow label="Name" value={result.employee.name} />
                        ) : null}
                        <InfoRow label="Role" value={result.employee.job_title} />
                        <InfoRow label="Department" value={result.employee.department} />
                        <InfoRow label="Status" value={result.employee.status} />
                        <InfoRow
                          label="Official email"
                          value={result.employee.official_email ? "Yes (@alphafreightuk.com)" : "Not confirmed"}
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-[15px] leading-7 text-red-700/90">
                        This person could not be verified as an active Alpha Freight employee. Do not
                        share confidential information or send payment until verification succeeds.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <VerifiedOfficialContacts />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {tips.map((tip) => (
              <div
                key={tip}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600"
              >
                {tip}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/security"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Security Centre
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
