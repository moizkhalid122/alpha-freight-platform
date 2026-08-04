import ToolsShell from "@/components/tools/ToolsShell";
import DeliveryEtaForm from "@/components/tools/DeliveryEtaForm";

export default function DeliveryEtaPage() {
  return (
    <ToolsShell
      eyebrow="Free tool"
      title="Delivery ETA Estimator"
      description="Estimate a UK delivery window from pickup time and distance — simplified HGV driving hours and break planning."
    >
      <DeliveryEtaForm />
    </ToolsShell>
  );
}
