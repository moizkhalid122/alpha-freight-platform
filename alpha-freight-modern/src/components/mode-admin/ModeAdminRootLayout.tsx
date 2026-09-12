"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import ModeAdminSidebar from "@/components/mode-admin/ModeAdminSidebar";
import type { ModeAdminPanelConfig } from "@/lib/mode-admin-nav";

export function ModeAdminRootLayout({
  config,
  children,
}: {
  config: ModeAdminPanelConfig;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === `${config.homePath}/login`) {
    return <>{children}</>;
  }

  return (
    <div className="admin-portal-bg flex min-h-[100dvh] flex-col text-gray-900 lg:flex-row">
      <div className="sticky top-0 z-50 flex h-12 shrink-0 items-center justify-between border-b border-gray-100/90 bg-[#FDFDFD]/95 px-4 backdrop-blur-md lg:hidden">
        <BrandMark href={config.homePath} textClassName="text-sm font-bold tracking-tight text-gray-900" />
        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-1.5 hover:bg-gray-50">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={null}>
          <ModeAdminSidebar config={config} onClose={() => setMobileOpen(false)} />
        </Suspense>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1480px]">{children}</div>
      </main>
    </div>
  );
}
