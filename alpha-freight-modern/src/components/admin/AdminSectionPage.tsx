import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string;
};

type AdminSectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  highlights: string[];
  relatedLinks?: Array<{
    label: string;
    href: string;
  }>;
};

export default function AdminSectionPage({
  eyebrow,
  title,
  description,
  metrics,
  highlights,
  relatedLinks = [],
}: AdminSectionPageProps) {
  return (
    <div className="admin-page-stack space-y-4">
      <section className={cn(ADMIN_CARD, "relative overflow-hidden p-5 sm:p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
        <p className={ADMIN_SECTION_LABEL}>{eyebrow}</p>
        <h2 className={cn(ADMIN_SECTION_TITLE, "mt-1")}>{title}</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">{description}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.length > 0 ? (
            metrics.map((metric) => (
              <div key={metric.label} className={cn(ADMIN_CARD, "relative overflow-hidden p-4")}>
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-400 to-slate-200" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{metric.label}</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{metric.value}</p>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-slate-500">
                No placeholder metrics — connect this page to live data when the workflow is ready.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className={cn(ADMIN_CARD, "p-5 sm:p-6")}>
          <p className={ADMIN_SECTION_LABEL}>Workflow focus</p>
          <h3 className={cn(ADMIN_SECTION_TITLE, "mt-1")}>Key actions for this section</h3>

          <div className="mt-4 space-y-2.5">
            {highlights.map((item) => (
              <div key={item} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3.5 py-3 transition-colors hover:bg-white">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Admin task
                  </span>
                </div>
                <p className="text-[13px] leading-5 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(ADMIN_CARD, "p-5 sm:p-6")}>
          <p className={ADMIN_SECTION_LABEL}>Related links</p>
          <h3 className={cn(ADMIN_SECTION_TITLE, "mt-1")}>Jump to connected pages</h3>

          <div className="mt-4 space-y-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            ))}
            {relatedLinks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-slate-500">
                  More linked workflows can be added here next.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
