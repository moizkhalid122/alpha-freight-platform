"use client";

import type { ReactNode } from "react";
import AdminProviders from "@/components/admin/AdminProviders";
import { AdminRootLayout } from "@/components/admin/AdminLayoutShell";
import { airDisplayFont, airScriptFont, airSerifFont } from "@/lib/air-fonts";
import "../air/air-portal.css";
import "./admin-portal.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${airDisplayFont.variable} ${airSerifFont.variable} ${airScriptFont.variable} min-h-[100dvh]`}
    >
      <AdminProviders>
        <AdminRootLayout>{children}</AdminRootLayout>
      </AdminProviders>
    </div>
  );
}
