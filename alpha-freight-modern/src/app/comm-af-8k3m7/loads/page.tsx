import CommercialDirectorLoadsPage from "@/components/commercial-director/CommercialDirectorLoadsPage";
import { getCommercialDirectorLoads } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialLoads = await getCommercialDirectorLoads().catch(() => []);

  return <CommercialDirectorLoadsPage initialLoads={initialLoads} />;
}
