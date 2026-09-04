import CommercialDirectorRevenuePlanPage from "@/components/commercial-director/CommercialDirectorRevenuePlanPage";
import { getCommercialDirectorMetrics } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialMetrics = await getCommercialDirectorMetrics().catch(() => undefined);
  return <CommercialDirectorRevenuePlanPage initialMetrics={initialMetrics} />;
}
