import CommercialDirectorTasksPage from "@/components/commercial-director/CommercialDirectorTasksPage";
import { getCommercialDirectorMetrics } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialMetrics = await getCommercialDirectorMetrics().catch(() => undefined);
  return <CommercialDirectorTasksPage initialMetrics={initialMetrics} />;
}
