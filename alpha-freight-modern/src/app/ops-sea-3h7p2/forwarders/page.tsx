import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaForwardersPage() {
  return (
    <ModeAdminProfilesPage
      role="carrier"
      transportMode="ship"
      pendingOnly={false}
      entityLabel="Sea Forwarder"
      backHref={seaAdminRoute()}
    />
  );
}
