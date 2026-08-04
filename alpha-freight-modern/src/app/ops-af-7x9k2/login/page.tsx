import { Suspense } from "react";

import AdminLoginPage from "./AdminLoginClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Loading secure login...
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}
