import ToolsShell from "@/components/tools/ToolsShell";
import FuelSurchargeForm from "@/components/tools/FuelSurchargeForm";

export default function FuelSurchargePage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Fuel Surcharge Calculator"
      description="Apply a fuel surcharge percentage to your base haulage rate — for UK supplier contracts and carrier bids."
    >
      <FuelSurchargeForm />
    </ToolsShell>
  );
}
