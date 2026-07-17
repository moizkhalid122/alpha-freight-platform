"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ToolsShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function ToolsShell({ eyebrow, title, description, children }: ToolsShellProps) {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a9900]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">{description}</p>
          </section>

          <div className="mt-10">{children}</div>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/tools" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:border-slate-300">
              All free tools
            </Link>
            <Link href="/tools/lane-rates" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:border-slate-300">
              Lane rates
            </Link>
            <Link href="/tools/freight-quote" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:border-slate-300">
              Freight quote
            </Link>
            <Link href="/track" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:border-slate-300">
              Track shipment
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
