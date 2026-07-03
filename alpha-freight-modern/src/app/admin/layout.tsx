"use client";

import type { ReactNode } from "react";
import { Bell, Menu, PanelLeft, Search, X } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminProviders from "@/components/admin/AdminProviders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui";

function AdminLayoutShell({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useAdminUiStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useAdminUiStore((state) => state.mobileSidebarOpen);
  const toggleSidebarCollapsed = useAdminUiStore(
    (state) => state.toggleSidebarCollapsed
  );
  const setMobileSidebarOpen = useAdminUiStore(
    (state) => state.setMobileSidebarOpen
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f8fbff_0%,#f4f7fb_45%,#eef2f7_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />

      <div className="relative hidden h-screen lg:block lg:shrink-0">
        <div className="h-full">
          <AdminSidebar collapsed={sidebarCollapsed} />
        </div>
      </div>

      {mobileSidebarOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      ) : null}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={toggleSidebarCollapsed}
                className="hidden lg:inline-flex"
                aria-label="Toggle sidebar width"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Alpha Freight Admin
                </p>
                <h1 className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">
                  Premium Operations Console
                </h1>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="hidden w-full max-w-[560px] items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] lg:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">
                  Search carriers, suppliers, loads, or payouts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Notifications"
                className={cn("relative shadow-[0_10px_30px_rgba(15,23,42,0.05)]")}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#BFFF07]" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden"
                aria-label="Close admin navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 xl:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProviders>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminProviders>
  );
}
