import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaShippersPage() {
  return (
    <ModeAdminProfilesPage
      role="supplier"
      transportMode="ship"
      pendingOnly={false}
      entityLabel="Sea Shipper"
      backHref={seaAdminRoute()}
    />
  );
}
