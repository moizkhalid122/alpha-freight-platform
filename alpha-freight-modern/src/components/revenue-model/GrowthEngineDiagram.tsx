"use client";

/** Enterprise pipeline diagram — white/black, heavy connector lines */
export function GrowthEngineDiagram() {
  const leftSteps = [
    "New User",
    "Free Tools / AI / Directory",
    "SEO + Blog + Academy",
    "Signup Carrier or Supplier",
    "Onboarding + Verification",
    "First Load Posted or Bid",
    "Messaging + Tracking + POD",
  ];

  const rightSteps = [
    "Payment + 7-Day Payout",
    "Review + Referral",
    "Social Feed Network Effect",
    "Lane Alerts + Recurring Loads",
    "Power User / Subscription",
  ];

  return (
    <div className="revenue-plan-flowchart overflow-hidden border-2 border-neutral-900 bg-[#fafaf8]">
      {/* Pipeline header band */}
      <div className="grid grid-cols-5 border-b-2 border-neutral-900 bg-neutral-900 text-[9px] font-bold uppercase tracking-[0.22em] text-white sm:text-[10px]">
        {["Discover", "Educate", "Convert", "Execute", "Monetise"].map((label, i) => (
          <div
            key={label}
            className={`px-3 py-4 text-center ${i < 4 ? "border-r border-neutral-700" : ""}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="relative p-6 sm:p-10 lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #d4d4d4 1px, transparent 1px), linear-gradient(to bottom, #d4d4d4 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_100px_1fr]">
          {/* LEFT PIPELINE */}
          <div className="relative space-y-0">
            <PipelineLabel text="Acquisition funnel" />
            {leftSteps.map((label, i) => (
              <div key={label} className="relative">
                {i > 0 ? <PipelineConnector /> : null}
                <PipelineNode label={label} variant={i === 1 || i === 3 || i === 5 ? "primary" : "default"} />
              </div>
            ))}
          </div>

          {/* CENTER SPINE */}
          <div className="relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
            <div className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-neutral-900" />
            <div className="relative z-10 flex flex-col items-center gap-8 py-12">
              <SpineBadge label="Volume" />
              <SpineBadge label="Trust" />
              <SpineBadge label="Repeat" />
            </div>
            <p className="relative z-10 mt-4 text-center text-[9px] font-bold uppercase leading-relaxed tracking-[0.2em] text-neutral-500">
              Cross
              <br />
              pipeline
            </p>
          </div>

          {/* RIGHT PIPELINE */}
          <div className="relative space-y-0">
            <PipelineLabel text="Retention & expansion" />
            {rightSteps.map((label, i) => (
              <div key={label} className="relative">
                {i > 0 ? <PipelineConnector /> : null}
                <PipelineNode label={label} variant={i === 0 || i === 2 || i === 4 ? "primary" : "default"} />
                {label.includes("Social Feed") ? (
                  <p className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    ↩ loops back to Signup
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bridge line — ops to payment */}
        <div className="relative mt-10 hidden border-t-2 border-dashed border-neutral-400 pt-6 lg:block">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Operations complete</span>
            <div className="revenue-plan-pipeline-track h-px flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900">→ Payment release</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-neutral-900 bg-neutral-900 px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white">
        44 revenue touchpoints mapped across this pipeline
      </div>
    </div>
  );
}

function PipelineLabel({ text }: { text: string }) {
  return (
    <p className="mb-4 border-b border-neutral-300 pb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
      {text}
    </p>
  );
}

function PipelineConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="h-3 w-px bg-neutral-900" />
        <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-neutral-900" />
      </div>
    </div>
  );
}

function PipelineNode({ label, variant }: { label: string; variant: "default" | "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <div
      className={`relative border-2 px-5 py-4 text-center text-[13px] font-semibold leading-snug tracking-tight sm:text-[14px] ${
        isPrimary
          ? "border-neutral-900 bg-neutral-900 text-white shadow-[6px_6px_0_0_rgba(0,0,0,0.12)]"
          : "border-neutral-400 bg-white text-neutral-900"
      }`}
    >
      {isPrimary ? (
        <span className="absolute -left-px top-0 h-full w-1 bg-white/20" aria-hidden />
      ) : null}
      {label}
    </div>
  );
}

function SpineBadge({ label }: { label: string }) {
  return (
    <span className="border-2 border-neutral-900 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-900">
      {label}
    </span>
  );
}

export function RevenuePipelineOverview() {
  const stages = [
    { label: "Acquire", sub: "Tools · AI · SEO", pct: 18 },
    { label: "Convert", sub: "Signup · Verify", pct: 22 },
    { label: "Transact", sub: "Loads · Pay", pct: 35 },
    { label: "Retain", sub: "Refer · Pro", pct: 15 },
    { label: "Enterprise", sub: "B2B · API", pct: 10 },
  ];

  return (
    <div className="border-2 border-neutral-900 bg-white">
      <div className="border-b-2 border-neutral-900 bg-neutral-50 px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Master revenue pipeline</p>
        <p className="revenue-plan-display mt-1 text-2xl font-medium text-neutral-900">Where the 44 streams sit</p>
      </div>
      <div className="grid gap-px bg-neutral-300 lg:grid-cols-5">
        {stages.map((stage, i) => (
          <div key={stage.label} className="relative bg-white p-6">
            {i < stages.length - 1 ? (
              <span className="absolute -right-3 top-1/2 z-10 hidden h-0 w-0 -translate-y-1/2 border-y-[8px] border-l-[10px] border-y-transparent border-l-neutral-900 lg:block" />
            ) : null}
            <p className="font-mono text-[10px] font-bold text-neutral-400">STAGE {i + 1}</p>
            <p className="revenue-plan-display mt-2 text-xl font-semibold">{stage.label}</p>
            <p className="mt-1 text-xs text-neutral-500">{stage.sub}</p>
            <div className="mt-4 h-2 w-full bg-neutral-100">
              <div className="h-full bg-neutral-900" style={{ width: `${stage.pct}%` }} />
            </div>
            <p className="mt-2 font-mono text-xs font-bold text-neutral-700">~{stage.pct}% weight</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueWaterfall() {
  const rows = [
    { label: "Transaction commission", m12: 11200, width: 100 },
    { label: "Pro subscriptions", m12: 3500, width: 31 },
    { label: "Instant payout fees", m12: 2000, width: 18 },
    { label: "Featured + directory", m12: 1500, width: 13 },
    { label: "Affiliates + academy", m12: 2000, width: 18 },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[140px_1fr_80px] items-center gap-4 sm:grid-cols-[200px_1fr_100px]">
          <p className="text-sm font-medium text-neutral-700">{row.label}</p>
          <div className="h-8 border border-neutral-200 bg-neutral-50">
            <div
              className="revenue-plan-waterfall-bar flex h-full items-center bg-neutral-900 px-3"
              style={{ width: `${row.width}%` }}
            >
              <span className="hidden text-[10px] font-bold text-white sm:inline">£{row.m12.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-right font-mono text-sm font-bold">£{row.m12.toLocaleString()}</p>
        </div>
      ))}
      <div className="grid grid-cols-[140px_1fr_80px] items-center gap-4 border-t-2 border-neutral-900 pt-4 sm:grid-cols-[200px_1fr_100px]">
        <p className="text-sm font-bold">Total / month</p>
        <div className="h-10 bg-neutral-900" />
        <p className="text-right font-mono text-lg font-bold">£20,200</p>
      </div>
    </div>
  );
}

export function ExecutionPipeline() {
  return (
    <div className="relative overflow-x-auto border-2 border-neutral-900 bg-white p-8 sm:p-10">
      <div className="absolute left-8 right-8 top-[72px] hidden h-0.5 bg-neutral-900 sm:block" />
      <div className="grid min-w-[640px] grid-cols-3 gap-8 sm:gap-6">
        {PLAN_PHASES_INLINE.map((phase, i) => (
          <div key={phase.phase} className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-neutral-900 bg-white font-mono text-sm font-bold">
              {String(i + 1).padStart(2, "0")}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{phase.timeline}</p>
            <p className="revenue-plan-display mt-2 text-xl font-semibold">{phase.phase}</p>
            <p className="mt-1 text-sm font-semibold text-neutral-800">{phase.title}</p>
            <ul className="mt-4 space-y-2 text-left text-xs text-neutral-600">
              {phase.items.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-neutral-900">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLAN_PHASES_INLINE = [
  { phase: "Phase A", timeline: "Days 1–30", title: "Quick revenue", items: ["Minimum fee", "Instant payout", "Featured load"] },
  { phase: "Phase B", timeline: "Days 31–90", title: "Recurring", items: ["Pro plans", "Directory", "Academy"] },
  { phase: "Phase C", timeline: "Months 4–12", title: "Scale", items: ["White-label", "API", "Enterprise"] },
];
