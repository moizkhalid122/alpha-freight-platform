"use client";

import { Bell, Search } from "lucide-react";
import { ADMIN_PANEL_PATH } from "@/lib/admin-path";

const PAGE_TITLES: Record<string, string> = {
  "ops-af-7x9k2": "Overview",
  "quick-stats": "Quick Stats",
  referrals: "Referrals",
  feedback: "User Feedback",
  carriers: "Carriers",
  suppliers: "Suppliers",
  loads: "Loads",
  "post-load": "Post Load",
  refunds: "Refunds",
  employees: "Employees",
  settings: "Settings",
  analytics: "Analytics",
  payments: "Payments",
  users: "Users",
  directory: "Directory",
  login: "Login",
};

export function getAdminPageTitle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "ops-af-7x9k2";
  if (last === ADMIN_PANEL_PATH.replace(/^\//, "")) return PAGE_TITLES["ops-af-7x9k2"];
  return PAGE_TITLES[last] ?? last.replace(/-/g, " ");
}

export default function AdminHeader({ pathname }: { pathname: string }) {
  const pageTitle = getAdminPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-100/90 bg-[#FDFDFD]/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Admin Console</p>
          <h2 className="truncate text-sm font-semibold leading-tight text-slate-900">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-slate-400 shadow-sm md:flex">
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs font-medium text-slate-400">Search carriers, suppliers, loads</span>
          </div>
          <button
            type="button"
            className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-slate-500 shadow-sm transition-all duration-200 hover:text-slate-900 active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#BFFF07]" />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-sm sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] font-bold text-white">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold leading-tight text-slate-900">Admin</p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">Operations</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
