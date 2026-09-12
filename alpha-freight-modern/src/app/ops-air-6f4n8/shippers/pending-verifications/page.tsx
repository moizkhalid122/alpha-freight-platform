import ModeAdminProfilesPage from "@/components/mode-admin/ModeAdminProfilesPage";
import { airAdminRoute } from "@/lib/mode-admin-paths";

export default function AirShippersPendingPage() {
  return (
    <ModeAdminProfilesPage
      role="supplier"
      transportMode="air"
      pendingOnly
      entityLabel="Shipper"
      backHref={airAdminRoute("/shippers")}
    />
  );
}
