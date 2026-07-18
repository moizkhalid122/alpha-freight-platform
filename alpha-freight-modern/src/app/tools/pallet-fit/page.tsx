import ToolsShell from "@/components/tools/ToolsShell";
import PalletFitForm from "@/components/tools/PalletFitForm";

export default function PalletFitPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Pallet & Vehicle Fit Calculator"
      description="Enter pallet count and weight to see whether curtain-side, refrigerated, flatbed, or general haulage is the best UK equipment match."
    >
      <PalletFitForm />
    </ToolsShell>
  );
}
