import CommercialDirectorDirectoryPage from "@/components/commercial-director/CommercialDirectorDirectoryPage";
import { getCommercialDirectorProfiles } from "@/lib/commercial-director-server-data";

export default async function Page() {
  const initialProfiles = await getCommercialDirectorProfiles("employee").catch(() => []);

  return (
    <CommercialDirectorDirectoryPage
      title="Employees"
      description="View the commercial and operations team roster. Commission rate configuration and user deletion are restricted."
      apiRole="employee"
      iconKey="employees"
      nameKey="full_name"
      initialProfiles={initialProfiles}
    />
  );
}
