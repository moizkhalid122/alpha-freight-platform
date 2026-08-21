import CommercialDirectorDashboard from "@/components/commercial-director/CommercialDirectorDashboard";
import { getCommercialDirectorMetrics } from "@/lib/commercial-director-server-data";

export default async function CommercialDirectorHomePage() {
  const initialMetrics = await getCommercialDirectorMetrics().catch(() => undefined);

  return <CommercialDirectorDashboard initialMetrics={initialMetrics} />;
}
