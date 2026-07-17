"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bug,
  Clock,
  Heart,
  LifeBuoy,
  Lightbulb,
  MessageSquare,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { Footer } from "@/components/Footer";
import { type FeedbackUserRole } from "@/lib/feedback-content";

const topics = [
  { icon: Bug, label: "Bugs & broken flows" },
  { icon: Lightbulb, label: "Feature ideas" },
  { icon: Star, label: "Platform experience" },
  { icon: Heart, label: "What you love" },
];

function isFeedbackRole(value: string | null): value is FeedbackUserRole {
  return value === "carrier" || value === "supplier" || value === "visitor" || value === "other";
}

function FeedbackPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole = isFeedbackRole(roleParam) ? roleParam : "visitor";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a9900]">
              Product feedback
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Send Feedback</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              Tell us what to fix, build, or improve on Alpha Freight. Product and operations review
              every submission — for urgent issues, use Support instead.
            </p>
          </section>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="space-y-6 lg:order-1">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Good feedback includes</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {topics.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#BFFF07]/20 text-slate-900">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-[#BFFF07]/20 text-slate-900">
                    <Clock className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Review within 2 business days</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Urgent billing, login, or payment problems should go to Support — not this form.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/support"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Help Center
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                  >
                    Need to contact us directly? →
                  </Link>
                </div>
              </div>
            </aside>

            <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8 lg:order-2">
              <div className="absolute inset-x-0 top-0 h-1 bg-[#BFFF07]" />

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Feedback form</h2>
                  <p className="text-sm text-slate-500">Rate your experience and tell us more below.</p>
                </div>
              </div>

              <FeedbackForm defaultRole={defaultRole} />
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <FeedbackPageContent />
    </Suspense>
  );
}
