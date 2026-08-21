import CommercialDirectorDirectoryPage from "@/components/commercial-director/CommercialDirectorDirectoryPage";
import { getCommercialDirectorProfiles } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialProfiles = await getCommercialDirectorProfiles("carrier").catch(() => []);

  return (
    <CommercialDirectorDirectoryPage
      title="Freight Forwarders"
      description="View carrier and forwarder accounts on the Alpha Freight network. Verification and payout actions remain admin-only."
      apiRole="carrier"
      iconKey="forwarders"
      initialProfiles={initialProfiles}
    />
  );
}
