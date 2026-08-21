"use client";

import AdminProviders from "@/components/admin/AdminProviders";
import { CommercialDirectorRootLayout } from "@/components/commercial-director/CommercialDirectorLayoutShell";
import { airDisplayFont, airScriptFont, airSerifFont } from "@/lib/air-fonts";
import "../air/air-portal.css";
import "./commercial-director-portal.css";

export default function CommercialDirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${airDisplayFont.variable} ${airSerifFont.variable} ${airScriptFont.variable} min-h-[100dvh]`}
    >
      <AdminProviders>
        <CommercialDirectorRootLayout>{children}</CommercialDirectorRootLayout>
      </AdminProviders>
    </div>
  );
}
