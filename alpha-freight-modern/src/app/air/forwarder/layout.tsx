"use client";

import AirPortalLayout from "@/components/air/AirPortalLayout";

export default function AirForwarderLayout({ children }: { children: React.ReactNode }) {
  return <AirPortalLayout role="carrier">{children}</AirPortalLayout>;
}
