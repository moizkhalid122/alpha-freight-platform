import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { airAdminRoute } from "@/lib/mode-admin-paths";

export default function AirShippersPage() {
  return (
    <ModeAdminProfilesPage
      role="supplier"
      transportMode="air"
      pendingOnly={false}
      entityLabel="Shipper"
      backHref={airAdminRoute()}
    />
  );
}
