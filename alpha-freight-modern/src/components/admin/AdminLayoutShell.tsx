"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPrefetch from "@/components/admin/AdminPrefetch";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { adminRoute, isAdminLoginPath } from "@/lib/admin-path";
import { useAdminUiStore } from "@/store/admin-ui";

function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useAdminUiStore((state) => state.sidebarCollapsed);

  return (
    <div className="admin-portal-bg flex min-h-[100dvh] flex-col text-gray-900 lg:flex-row">
      <div className="sticky top-0 z-50 flex h-12 shrink-0 items-center justify-between border-b border-gray-100/90 bg-[#FDFDFD]/95 px-4 backdrop-blur-md sm:px-5 lg:hidden">
        <BrandMark href={adminRoute()} textClassName="text-sm font-bold tracking-tight text-gray-900" />
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-1.5 transition-all duration-200 hover:bg-gray-50 active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={null}>
          <AdminSidebar collapsed={sidebarCollapsed} onClose={() => setMobileOpen(false)} />
        </Suspense>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminPrefetch />
        <div className="hidden lg:block">
          <AdminHeader pathname={pathname} />
        </div>
        <main className="admin-page-main min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
          <div className="admin-page-content mx-auto max-w-[1480px]">
            <AdminPageTransition>{children}</AdminPageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAdminLoginPath(pathname)) {
    return <>{children}</>;
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

export default AdminLayoutShell;
