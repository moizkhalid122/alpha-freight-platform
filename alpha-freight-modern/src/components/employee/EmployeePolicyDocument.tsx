import type { EmployeePolicyDocument as PolicyDoc } from "@/lib/employee-policies";

export default function EmployeePolicyDocument({ policy }: { policy: PolicyDoc }) {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-slate-700">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Alpha Freight UK</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{policy.title}</h1>
        <p className="mt-2 text-slate-500">{policy.summary}</p>
        <p className="mt-3 text-xs font-semibold text-slate-400">Last updated: {policy.lastUpdated}</p>
      </header>

      {policy.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-base font-black text-slate-900">{section.heading}</h2>
          <div className="mt-3 space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc space-y-2 pl-5">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </article>
  );
}
