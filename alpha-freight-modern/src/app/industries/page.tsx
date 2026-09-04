import { marketingSeo } from "@/lib/marketing-seo";
import IndustriesHubPage from "@/components/marketing/IndustriesHubPage";

export const metadata = marketingSeo.industriesHub;

export default function IndustriesPage() {
  return <IndustriesHubPage />;
}
