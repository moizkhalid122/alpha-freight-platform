"use client";

import AdminProviders from "@/components/admin/AdminProviders";
import { ModeAdminRootLayout } from "@/components/mode-admin/ModeAdminRootLayout";
import { SEA_ADMIN_NAV } from "@/lib/mode-admin-nav";
import { airDisplayFont, airScriptFont, airSerifFont } from "@/lib/air-fonts";
import "../air/air-portal.css";
import "../ops-af-7x9k2/admin-portal.css";

export default function SeaAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${airDisplayFont.variable} ${airSerifFont.variable} ${airScriptFont.variable} min-h-[100dvh]`}
    >
      <AdminProviders>
        <ModeAdminRootLayout config={SEA_ADMIN_NAV}>{children}</ModeAdminRootLayout>
      </AdminProviders>
    </div>
  );
}
