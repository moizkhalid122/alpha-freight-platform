import Link from "next/link";
import {
  ArrowRight,
  Box,
  Clock,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Plane,
  Plus,
  Receipt,
  Search,
  UserCircle,
  Wallet,
} from "lucide-react";
import type { DashboardTool } from "@/lib/air-dashboard";
import type { AirNavIcon } from "@/lib/air-storage";

const ICONS = {
  layout: LayoutDashboard,
  plane: Plane,
  globe: Globe,
  wallet: Wallet,
  plus: Plus,
  search: Search,
  box: Box,
  file: FileText,
  user: UserCircle,
  help: HelpCircle,
  clock: Clock,
  receipt: Receipt,
} as const;

type AirDashboardToolsProps = {
  tools: DashboardTool[];
  title?: string;
};

export default function AirDashboardTools({
  tools,
  title = "All tools",
}: AirDashboardToolsProps) {
  return (
    <section className="air-card rounded-[28px] p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="air-font-display text-2xl font-medium text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Everything you need for air freight operations.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const Icon = ICONS[tool.icon as AirNavIcon];

          return (
            <Link
              key={tool.path}
              href={tool.path}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="h-4 w-4 text-sky-600" />
                </div>
                {tool.badge ? (
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-sky-700">
                    {tool.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{tool.category}</p>
              <p className="mt-1 font-semibold text-slate-900">{tool.name}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{tool.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
