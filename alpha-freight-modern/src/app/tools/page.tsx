import Link from "next/link";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TOOL_CATEGORY_LABELS, TOOL_HUB_ITEMS } from "@/lib/tools-hub-data";

const categories = ["marketplace", "calculator", "tracking"] as const;

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white px-6 py-10 text-center shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(191,255,7,0.18),transparent_70%)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a9900]">Free tools</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Alpha Freight Tools</h1>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
                {TOOL_HUB_ITEMS.length} practical UK freight utilities — marketplace data, planning calculators, and
                public shipment tracking. Built only on Alpha Freight.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/find-loads"
                  className="rounded-full bg-[#BFFF07] px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-[#d4ff4d]"
                >
                  Find loads
                </Link>
                <Link
                  href="/post-loads"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
                >
                  Post loads
                </Link>
                <Link
                  href="/auth/carrier-signup"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
                >
                  Join free
                </Link>
              </div>
            </div>
          </section>

          <div className="mt-14 space-y-14">
            {categories.map((category) => {
              const items = TOOL_HUB_ITEMS.filter((tool) => tool.category === category);
              return (
                <section key={category}>
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">
                        {TOOL_CATEGORY_LABELS[category]}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {category === "marketplace"
                          ? "Rates, loads & lane intelligence"
                          : category === "calculator"
                            ? "Estimate, plan & price smarter"
                            : "Track without logging in"}
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="group rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-8"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black transition group-hover:scale-105">
                            <Icon className="h-5 w-5" />
                          </span>
                          <h3 className="mt-5 text-lg font-bold text-slate-900">{tool.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
                          <span className="mt-5 inline-block text-sm font-semibold text-slate-800 group-hover:text-[#7da600]">
                            Open tool →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
