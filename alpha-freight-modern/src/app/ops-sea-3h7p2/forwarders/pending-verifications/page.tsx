import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaForwardersPendingPage() {
  return (
    <ModeAdminProfilesPage
      role="carrier"
      transportMode="ship"
      pendingOnly
      entityLabel="Sea Forwarder"
      backHref={seaAdminRoute("/forwarders")}
    />
  );
}
