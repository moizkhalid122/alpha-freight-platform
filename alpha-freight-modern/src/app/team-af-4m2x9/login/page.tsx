"use client";

import { Suspense } from "react";
import EmployeeLoginClient from "./EmployeeLoginClient";

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EmployeeLoginClient />
    </Suspense>
  );
}
