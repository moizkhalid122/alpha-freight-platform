import { Suspense } from "react";

import ToolsShell from "@/components/tools/ToolsShell";
import RateCheckForm from "@/components/tools/RateCheckForm";

function RateCheckFallback() {
  return (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500">
      Loading rate checker…
    </div>
  );
}

export default function RateCheckToolPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Rate vs Market Check"
      description="Compare your haulage rate against Alpha Freight corridor benchmarks before you post a load or submit a bid."
    >
      <Suspense fallback={<RateCheckFallback />}>
        <RateCheckForm />
      </Suspense>
    </ToolsShell>
  );
}
