import CommercialDirectorDirectoryPage from "@/components/commercial-director/CommercialDirectorDirectoryPage";
import { getCommercialDirectorProfiles } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialProfiles = await getCommercialDirectorProfiles("supplier").catch(() => []);

  return (
    <CommercialDirectorDirectoryPage
      title="Shippers"
      description="View registered shipper accounts, company profiles, and commercial activity. No payment or banking controls."
      apiRole="supplier"
      iconKey="shippers"
      initialProfiles={initialProfiles}
    />
  );
}
