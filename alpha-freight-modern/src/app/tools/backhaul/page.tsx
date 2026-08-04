import ToolsShell from "@/components/tools/ToolsShell";
import BackhaulFinderForm from "@/components/tools/BackhaulFinderForm";

export default function BackhaulToolPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Backhaul Lane Finder"
      description="Find return loads and outbound corridors from your current UK location — reduce empty miles after delivery."
    >
      <BackhaulFinderForm />
    </ToolsShell>
  );
}
