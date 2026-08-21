import { Suspense } from "react";

import AdminLoginPage from "./AdminLoginClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="admin-portal-bg flex min-h-[100dvh] items-center justify-center text-[13px] text-gray-500">
          Loading secure login...
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}
