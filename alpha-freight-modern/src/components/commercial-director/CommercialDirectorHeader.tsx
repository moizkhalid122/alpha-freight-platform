"use client";

import { Bell, Search } from "lucide-react";
import { COMMERCIAL_DIRECTOR_PROFILE } from "@/lib/commercial-director-permissions";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads & Sales",
  shippers: "Shippers",
  forwarders: "Freight Forwarders",
  loads: "Loads",
  quotes: "Quotes",
  bookings: "Bookings",
  employees: "Employees",
  tasks: "Tasks & Follow-ups",
  revenue: "Revenue & Commissions",
  targets: "Targets",
  analytics: "Analytics",
  reports: "Reports",
  messages: "Messages",
  notifications: "Notifications",
  settings: "Profile & Settings",
};

export function getCommercialPageTitle(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  if (segment === "comm-af-8k3m7") return PAGE_TITLES.dashboard;
  return PAGE_TITLES[segment] ?? "Commercial Director";
}

export default function CommercialDirectorHeader({ pathname }: { pathname: string }) {
  const pageTitle = getCommercialPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-gray-100 bg-[#FDFDFD]/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Commercial Director</p>
          <h2 className="truncate text-sm font-semibold leading-tight text-gray-900">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-gray-400 shadow-sm md:flex">
            <Search className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Search network</span>
          </div>
          <button
            type="button"
            className="rounded-xl border border-gray-100 bg-white p-2 text-gray-500 shadow-sm transition hover:text-gray-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-gray-100 bg-white px-2.5 py-1.5 shadow-sm sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
              {COMMERCIAL_DIRECTOR_PROFILE.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold leading-tight text-gray-900">
                {COMMERCIAL_DIRECTOR_PROFILE.name.split(" ")[0]}
              </p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-gray-400">Executive</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
