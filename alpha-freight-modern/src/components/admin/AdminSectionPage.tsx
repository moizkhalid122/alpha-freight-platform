import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[26px] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Workflow Focus
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Key actions for this section
          </h3>

          <div className="mt-8 space-y-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#BFFF07]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Admin task
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Related Links
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Jump to connected pages
          </h3>

          <div className="mt-8 space-y-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
            {relatedLinks.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-500">
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
