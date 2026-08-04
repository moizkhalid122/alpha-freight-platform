"use client";

import { Suspense } from "react";
import EmployeeSignupClient from "./EmployeeSignupClient";

export default function EmployeeSignupPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EmployeeSignupClient />
    </Suspense>
  );
}
