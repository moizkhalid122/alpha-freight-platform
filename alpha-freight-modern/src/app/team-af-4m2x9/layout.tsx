"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import EmployeeAuthLayout from "@/components/employee/EmployeeAuthLayout";
import EmployeeLayoutShell from "@/components/employee/EmployeeShell";
import { isEmployeeOnboardingPath, isEmployeePublicAuthPath } from "@/lib/employee-path";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isEmployeePublicAuthPath(pathname)) {
    return <EmployeeAuthLayout>{children}</EmployeeAuthLayout>;
  }

  if (isEmployeeOnboardingPath(pathname)) {
    return <>{children}</>;
  }

  return <EmployeeLayoutShell>{children}</EmployeeLayoutShell>;
}
