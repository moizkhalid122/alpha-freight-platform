import ToolsShell from "@/components/tools/ToolsShell";
import LaneRatesPanel from "@/components/tools/LaneRatesPanel";

export default function LaneRatesPage() {
  return (
    <ToolsShell
      eyebrow="Market intelligence"
      title="Live Lane Rate Index"
      description="UK freight corridor benchmarks refreshed from Alpha Freight marketplace loads. Compare £/mile by equipment type."
    >
      <LaneRatesPanel />
    </ToolsShell>
  );
}
