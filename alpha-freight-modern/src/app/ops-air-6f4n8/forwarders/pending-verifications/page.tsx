import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { airAdminRoute } from "@/lib/mode-admin-paths";

export default function AirForwardersPendingPage() {
  return (
    <ModeAdminProfilesPage
      role="carrier"
      transportMode="air"
      pendingOnly
      entityLabel="Forwarder"
      backHref={airAdminRoute("/forwarders")}
    />
  );
}
