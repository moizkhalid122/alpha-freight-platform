import Link from "next/link";
import { BarChart3, Calculator, PackageSearch } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const tools = [
  {
    href: "/tools/lane-rates",
    icon: BarChart3,
    title: "Live Lane Rate Index",
    description: "UK corridor £/mile benchmarks powered by Alpha Freight marketplace activity.",
  },
  {
    href: "/tools/freight-quote",
    icon: Calculator,
    title: "Instant Freight Quote",
    description: "Estimate haulage pricing by origin, destination, equipment, and weight.",
  },
  {
    href: "/track",
    icon: PackageSearch,
    title: "Track Shipment",
    description: "Check load status publicly using your AF- reference number.",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a9900]">Free tools</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Alpha Freight Tools</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              Practical UK freight utilities built on Alpha Freight marketplace data — only available on our platform.
            </p>
          </section>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md sm:p-8"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-5 text-lg font-bold text-slate-900">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
                  <span className="mt-5 inline-block text-sm font-semibold text-slate-800">Open tool →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
