import ToolsShell from "@/components/tools/ToolsShell";
import LiveLoadsPanel from "@/components/tools/LiveLoadsPanel";

export default function LiveLoadsToolPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Live Loads Preview"
      description="Browse open UK freight loads on Alpha Freight — filter by route and equipment, then join free to bid."
    >
      <LiveLoadsPanel />
    </ToolsShell>
  );
}
