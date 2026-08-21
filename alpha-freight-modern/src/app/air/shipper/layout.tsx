"use client";

import AirPortalLayout from "@/components/air/AirPortalLayout";

export default function AirShipperLayout({ children }: { children: React.ReactNode }) {
  return <AirPortalLayout role="supplier">{children}</AirPortalLayout>;
}
