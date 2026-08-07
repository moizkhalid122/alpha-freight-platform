"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import type { VerifyEmployeeResult } from "@/lib/verify-employee";

export default function EmployeeVerificationCheck() {
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
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 sm:p-8">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
        <span aria-hidden="true">🟢</span>
        Employee Verification
      </div>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        Enter an Employee ID or official Alpha Freight email to check if someone is a verified employee.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="sr-only">Employee ID or email</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (result) setResult(null);
              }}
              placeholder="AF-EMP-XXXXXXXX or name@alphafreightuk.com"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Verify Employee"
            )}
          </button>
          <Link
            href="/verify-employee"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
          >
            Open full verification page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </form>

      {result ? (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            result.verified ? "border-emerald-200 bg-emerald-50/70" : "border-red-200 bg-red-50/70"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.verified ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
            )}
            <div className="min-w-0">
              <p className={`text-lg font-bold ${result.verified ? "text-emerald-800" : "text-red-800"}`}>
                {result.verified ? "✅ Verified Employee" : "❌ Employee Not Found"}
              </p>

              {result.verified ? (
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Employee ID:</span>{" "}
                    <span className="font-mono">{result.employee.employee_code}</span>
                  </p>
                  {result.employee.name ? (
                    <p>
                      <span className="font-semibold text-slate-900">Name:</span> {result.employee.name}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-slate-900">Role:</span> {result.employee.job_title}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Department:</span>{" "}
                    {result.employee.department}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  This person could not be verified. Try the{" "}
                  <Link href="/verify-employee" className="font-semibold underline">
                    full verification page
                  </Link>{" "}
                  or contact Support before continuing.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
