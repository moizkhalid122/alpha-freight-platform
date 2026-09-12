import { Suspense } from "react";
import ModeAdminLoginClient from "@/components/mode-admin/ModeAdminLoginClient";
import { HQ_ADMIN_PATH } from "@/lib/mode-admin-paths";

export default function HqAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <ModeAdminLoginClient
        homePath={HQ_ADMIN_PATH}
        title="Alpha HQ Master Console"
        description="Unified command centre for road, air, and sea — all users, verifications, and platform records."
      />
    </Suspense>
  );
}
