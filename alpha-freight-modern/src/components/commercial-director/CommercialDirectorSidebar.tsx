"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import {
  COMMERCIAL_DIRECTOR_NAV,
  COMMERCIAL_DIRECTOR_PROFILE,
} from "@/lib/commercial-director-permissions";
import {
  COMMERCIAL_DIRECTOR_PANEL_PATH,
  commercialDirectorRoute,
} from "@/lib/commercial-director-path";
import { supabase } from "@/lib/supabase";
import {
  prefetchCommercialLoads,
  prefetchCommercialMetrics,
  prefetchCommercialProfiles,
} from "@/lib/use-commercial-metrics";

const DIRECTORY_PREFETCH: Record<string, "supplier" | "carrier" | "employee"> = {
  [commercialDirectorRoute("/shippers")]: "supplier",
  [commercialDirectorRoute("/forwarders")]: "carrier",
  [commercialDirectorRoute("/employees")]: "employee",
};

function isItemActive(pathname: string, itemPath: string) {
  if (itemPath === COMMERCIAL_DIRECTOR_PANEL_PATH) {
    return pathname === COMMERCIAL_DIRECTOR_PANEL_PATH;
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function CommercialDirectorSidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const prefetchDirectory = (itemPath: string) => {
    const role = DIRECTORY_PREFETCH[itemPath];
    if (role) {
      void prefetchCommercialProfiles(queryClient, role);
      return;
    }
    if (itemPath === commercialDirectorRoute("/loads")) {
      void prefetchCommercialLoads(queryClient);
      return;
    }
    void prefetchCommercialMetrics(queryClient);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(commercialDirectorRoute("/login"));
    router.refresh();
  };

  return (
    <aside className="cd-sidebar flex h-full w-64 flex-col overflow-y-auto">
      <div className="mb-2 flex flex-col gap-4 px-7 py-6">
        <BrandMark href={commercialDirectorRoute()} textClassName="text-base font-bold tracking-tight text-gray-900" />
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">Executive panel</p>
          <p className="text-[13px] font-semibold text-gray-900">Commercial Director</p>
        </div>
        <div className="h-px w-full bg-gray-100/80" />
      </div>

      <nav className="flex-1 space-y-5 px-3.5 pb-4">
        {COMMERCIAL_DIRECTOR_NAV.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3.5 text-[10px] font-bold tracking-widest text-gray-400">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    onMouseEnter={() => prefetchDirectory(item.path)}
                    onFocus={() => prefetchDirectory(item.path)}
                    title={item.description}
                  >
                    <div
                      className={cn(
                        "group flex items-center gap-3.5 rounded-lg px-3.5 py-2 transition-all duration-200",
                        active
                          ? "cd-nav-active shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-900"
                        )}
                      />
                      <span className="truncate text-[13px] font-semibold">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-gray-50 bg-gray-50/30 px-3.5 py-5">
        <div className="flex items-center gap-3 rounded-lg px-3.5 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-600">
            {COMMERCIAL_DIRECTOR_PROFILE.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">{COMMERCIAL_DIRECTOR_PROFILE.name}</p>
            <p className="truncate text-[9px] font-bold uppercase tracking-tighter text-gray-500">
              {COMMERCIAL_DIRECTOR_PROFILE.title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
