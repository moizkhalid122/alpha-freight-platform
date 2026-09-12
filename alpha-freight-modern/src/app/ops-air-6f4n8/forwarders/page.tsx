import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { airAdminRoute } from "@/lib/mode-admin-paths";

export default function AirForwardersPage() {
  return (
    <ModeAdminProfilesPage
      role="carrier"
      transportMode="air"
      pendingOnly={false}
      entityLabel="Forwarder"
      backHref={airAdminRoute()}
    />
  );
}
