import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaShippersPendingPage() {
  return (
    <ModeAdminProfilesPage
      role="supplier"
      transportMode="ship"
      pendingOnly
      entityLabel="Sea Shipper"
      backHref={seaAdminRoute("/shippers")}
    />
  );
}
