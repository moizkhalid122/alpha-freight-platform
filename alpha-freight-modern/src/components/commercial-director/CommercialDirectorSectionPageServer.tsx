import CommercialDirectorSectionPage from "@/components/commercial-director/CommercialDirectorSectionPage";
import { getCommercialDirectorMetrics } from "@/lib/commercial-director-server-data";

export default async function CommercialDirectorSectionPageServer({
  slug,
}: {
  slug: string;
}) {
  const initialMetrics = await getCommercialDirectorMetrics().catch(() => undefined);

  return <CommercialDirectorSectionPage slug={slug} initialMetrics={initialMetrics} />;
}
