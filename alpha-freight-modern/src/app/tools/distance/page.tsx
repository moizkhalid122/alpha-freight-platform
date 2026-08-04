import { Suspense } from "react";

import ToolsShell from "@/components/tools/ToolsShell";
import DistanceCalculatorForm from "@/components/tools/DistanceCalculatorForm";

export default function DistanceToolPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="UK Distance Calculator"
      description="Calculate haulage miles and typical drive time between UK cities — plan quotes, bids, and empty-mile decisions."
    >
      <DistanceCalculatorForm />
    </ToolsShell>
  );
}
