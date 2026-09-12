import { Suspense } from "react";
import ModeAdminLoginClient from "@/components/mode-admin/ModeAdminLoginClient";
import { SEA_ADMIN_PATH } from "@/lib/mode-admin-paths";

export default function SeaAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <ModeAdminLoginClient
        homePath={SEA_ADMIN_PATH}
        title="Sea Freight Admin"
        description="Ocean forwarders, shippers, container bookings, and sea verification — separate from road and air."
      />
    </Suspense>
  );
}
