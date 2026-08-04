import ToolsShell from "@/components/tools/ToolsShell";
import CarrierMarginForm from "@/components/tools/CarrierMarginForm";

export default function CarrierMarginPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Carrier Earnings Calculator"
      description="Estimate haulage profit after fuel and empty miles — plan bids with Alpha Freight 7-day payout timing in mind."
    >
      <CarrierMarginForm />
    </ToolsShell>
  );
}
