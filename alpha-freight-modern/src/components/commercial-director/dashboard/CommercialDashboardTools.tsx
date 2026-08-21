import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CommercialTool } from "@/lib/commercial-director-dashboard";

export default function CommercialDashboardTools({
  tools,
  title = "Commercial workspace",
}: {
  tools: CommercialTool[];
  title?: string;
}) {
  return (
    <section className="air-card rounded-[24px] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="air-font-display text-xl font-medium text-gray-900">{title}</h2>
        <p className="mt-1 text-[12px] text-gray-500">Quick access across the commercial panel.</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            href={tool.path}
            className="group flex h-full flex-col rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/40"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-gray-700 shadow-sm">
                {tool.name.charAt(0)}
              </div>
              {tool.badge ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[8px] font-bold uppercase text-amber-800">
                  {tool.badge}
                </span>
              ) : null}
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{tool.category}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-gray-900">{tool.name}</p>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-gray-500">{tool.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
              Open
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
