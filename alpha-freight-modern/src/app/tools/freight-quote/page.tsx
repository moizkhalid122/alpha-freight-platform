import ToolsShell from "@/components/tools/ToolsShell";
import FreightQuoteForm from "@/components/tools/FreightQuoteForm";

export default function FreightQuotePage() {
  return (
    <ToolsShell
      eyebrow="Pricing tool"
      title="Instant Freight Quote"
      description="Get a UK haulage estimate by lane, equipment, and weight. Uses live marketplace data when a matching corridor exists."
    >
      <FreightQuoteForm />
    </ToolsShell>
  );
}
