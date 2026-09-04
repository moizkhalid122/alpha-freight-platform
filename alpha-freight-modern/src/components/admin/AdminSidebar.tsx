"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Settings,
  ShieldCheck,
  Truck,
  UserPlus,
  UserRoundCheck,
  Gift,
  Inbox,
  MessageSquare,
  Users,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { ADMIN_PANEL_PATH, adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";
import {
  prefetchAdminEmployees,
  prefetchAdminLoads,
  prefetchAdminOverview,
  prefetchAdminProfiles,
} from "@/lib/use-admin-prefetch";

type AdminNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  prefetch?: "suppliers" | "carriers" | "loads" | "employees" | "all-profiles";
};

const adminSections: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Overview", path: adminRoute(), icon: LayoutDashboard },
      { name: "Quick Stats", path: adminRoute("/quick-stats"), icon: Gauge },
      { name: "Referrals", path: adminRoute("/referrals"), icon: Gift },
      { name: "Support Inbox", path: adminRoute("/inquiries"), icon: Inbox },
      { name: "User Feedback", path: adminRoute("/feedback"), icon: MessageSquare },
    ],
  },
  {
    label: "CARRIERS",
    items: [
      { name: "All Carriers", path: adminRoute("/carriers"), icon: Truck, prefetch: "carriers" },
      { name: "Pending Verification", path: adminRoute("/carriers/pending-verifications"), icon: ShieldCheck, prefetch: "carriers" },
      { name: "Verified Carriers", path: adminRoute("/carriers/verified"), icon: UserRoundCheck, prefetch: "carriers" },
      { name: "Add Carrier", path: adminRoute("/carriers/add"), icon: UserPlus },
      { name: "POD Verification", path: adminRoute("/carriers/pod-verification"), icon: FileText, prefetch: "carriers" },
      { name: "Carrier Payments", path: adminRoute("/carriers/payments"), icon: CreditCard, prefetch: "carriers" },
    ],
  },
  {
    label: "SUPPLIERS",
    items: [
      { name: "All Suppliers", path: adminRoute("/suppliers"), icon: Building2, prefetch: "suppliers" },
    ],
  },
  {
    label: "LOADS",
    items: [
      { name: "All Loads", path: adminRoute("/loads"), icon: ClipboardList, prefetch: "loads" },
      { name: "Post Load", path: adminRoute("/post-load"), icon: PackagePlus },
      { name: "Refunds", path: adminRoute("/refunds"), icon: CreditCard, prefetch: "loads" },
    ],
  },
  {
    label: "HR & EMPLOYEES",
    items: [
      { name: "Employees", path: adminRoute("/employees"), icon: Users, prefetch: "employees" },
      { name: "Employee KPIs", path: adminRoute("/employees/kpis"), icon: BarChart3, prefetch: "employees" },
    ],
  },
  {
    label: "SETTINGS",
    items: [{ name: "Settings", path: adminRoute("/settings"), icon: Settings }],
  },
];

function isItemActive(pathname: string, itemPath: string) {
  if (itemPath === ADMIN_PANEL_PATH) {
    return pathname === ADMIN_PANEL_PATH;
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function AdminSidebar({
  onClose,
  collapsed = false,
}: {
  onClose?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const prefetchRoute = (prefetch?: AdminNavItem["prefetch"]) => {
    if (prefetch === "suppliers") void prefetchAdminProfiles(queryClient, "supplier");
    if (prefetch === "carriers") void prefetchAdminProfiles(queryClient, "carrier");
    if (prefetch === "loads") void prefetchAdminLoads(queryClient);
    if (prefetch === "employees") void prefetchAdminEmployees(queryClient);
    if (prefetch === "all-profiles") void prefetchAdminProfiles(queryClient);
    void prefetchAdminOverview(queryClient);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(adminRoute("/login"));
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "admin-sidebar flex h-full flex-col overflow-y-auto transition-all duration-300 ease-out",
        collapsed ? "w-[84px]" : "w-[280px]"
      )}
    >
      <div className={cn("mb-2 flex flex-col gap-4 py-5", collapsed ? "px-3" : "px-5")}>
        <BrandMark
          href={adminRoute()}
          textClassName={cn(
            "font-bold tracking-tight text-gray-900",
            collapsed ? "sr-only" : "text-base"
          )}
        />
        {!collapsed ? (
          <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Operations</p>
            <p className="text-sm font-semibold text-slate-900">Premium Admin</p>
          </div>
        ) : null}
        {!collapsed ? <div className="h-px w-full bg-slate-100" /> : null}
      </div>

      <nav className={cn("flex-1 space-y-5 pb-4", collapsed ? "px-2" : "px-3")}>
        {adminSections.map((section) => (
          <div key={section.label}>
            {!collapsed ? (
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400">{section.label}</p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    onMouseEnter={() => prefetchRoute(item.prefetch)}
                    onFocus={() => prefetchRoute(item.prefetch)}
                    title={item.name}
                  >
                    <div
                      className={cn(
                        "group flex items-center rounded-xl transition-all duration-200 ease-out",
                        collapsed ? "justify-center px-2.5 py-2.5" : "gap-3 px-3 py-2.5",
                        active
                          ? "admin-nav-active"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors duration-200",
                          active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      {!collapsed ? (
                        <span className="truncate text-[13px] font-medium">{item.name}</span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-slate-100", collapsed ? "px-2 py-4" : "px-3 py-4")}>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-xl text-[13px] font-medium text-red-500 transition-all duration-200 hover:bg-red-50 active:scale-[0.98]",
            collapsed ? "justify-center px-2.5 py-2.5" : "gap-2.5 px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
