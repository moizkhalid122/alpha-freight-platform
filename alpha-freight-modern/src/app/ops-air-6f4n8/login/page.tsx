import { Suspense } from "react";
import ModeAdminLoginClient from "@/components/mode-admin/ModeAdminLoginClient";
import { AIR_ADMIN_PATH } from "@/lib/mode-admin-paths";

export default function AirAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <ModeAdminLoginClient
        homePath={AIR_ADMIN_PATH}
        title="Air Freight Admin"
        description="Manage air forwarders, shippers, AWB verification, and air marketplace operations."
      />
    </Suspense>
  );
}
