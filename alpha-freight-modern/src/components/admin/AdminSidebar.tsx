"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MessageSquare,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";

type AdminNavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const adminSections: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Overview",
        path: "/ops-af-7x9k2",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        name: "Quick Stats",
        path: "/ops-af-7x9k2/quick-stats",
        icon: <Gauge className="h-4 w-4" />,
      },
      {
        name: "Referrals",
        path: "/ops-af-7x9k2/referrals",
        icon: <Gift className="h-4 w-4" />,
      },
      {
        name: "User Feedback",
        path: "/ops-af-7x9k2/feedback",
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "CARRIERS",
    items: [
      {
        name: "All Carriers",
        path: "/ops-af-7x9k2/carriers",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        name: "Pending Verification",
        path: "/ops-af-7x9k2/carriers/pending-verifications",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        name: "Verified Carriers",
        path: "/ops-af-7x9k2/carriers/verified",
        icon: <UserRoundCheck className="h-4 w-4" />,
      },
      {
        name: "Add Carrier",
        path: "/ops-af-7x9k2/carriers/add",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        name: "POD Verification",
        path: "/ops-af-7x9k2/carriers/pod-verification",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        name: "Carrier Payments",
        path: "/ops-af-7x9k2/carriers/payments",
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "SUPPLIERS",
    items: [
      {
        name: "All Suppliers",
        path: "/ops-af-7x9k2/suppliers",
        icon: <Building2 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "LOADS",
    items: [
      {
        name: "All Loads",
        path: "/ops-af-7x9k2/loads",
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        name: "Post Load",
        path: "/ops-af-7x9k2/post-load",
        icon: <PackagePlus className="h-4 w-4" />,
      },
      {
        name: "Refunds",
        path: "/ops-af-7x9k2/refunds",
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "HR & EMPLOYEES",
    items: [
      {
        name: "Employees",
        path: "/ops-af-7x9k2/employees",
        icon: <Users className="h-4 w-4" />,
      },
      {
        name: "Employee KPIs",
        path: "/ops-af-7x9k2/employees/kpis",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      {
        name: "Settings",
        path: "/ops-af-7x9k2/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

function isItemActive(pathname: string, itemPath: string) {
  if (itemPath === "/ops-af-7x9k2") {
    return pathname === "/ops-af-7x9k2";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(adminRoute("/login"));
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/60 bg-[#f8fbff]/90 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[92px]" : "w-[294px]"
      )}
    >
      <div className={cn("border-b border-slate-200/70", collapsed ? "px-4 py-5" : "px-5 py-5")}>
        <Link href="/ops-af-7x9k2" onClick={onClose} className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <Image
              src="/logo.png"
              alt="Alpha Freight"
              fill
              sizes="40px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-black tracking-tight text-slate-900">
                Alpha Freight
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">
                Premium Admin
              </p>
            </div>
          ) : null}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-6 overflow-y-auto", collapsed ? "px-3 py-4" : "px-4 py-5")}>
        {adminSections.map((section) => (
          <div key={section.label}>
            {!collapsed ? (
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                {section.label}
              </p>
            ) : null}
            <div className="mt-3 space-y-1">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center rounded-2xl text-sm font-semibold transition-all duration-200",
                      collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3",
                      active
                        ? "bg-[#151B24] text-white shadow-[0_16px_34px_rgba(15,23,42,0.16)]"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        active ? "text-[#BFFF07]" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    >
                      {item.icon}
                    </span>
                    {!collapsed ? <span className="truncate">{item.name}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-slate-200/70", collapsed ? "px-3 py-4" : "px-4 py-5")}>
        {!collapsed ? (
          <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-black text-slate-900">Platform Control</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Monitor users, loads, approvals, and finance from one clean control layer.
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "mt-3 flex w-full rounded-2xl text-sm font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center px-2 py-3" : "items-center gap-3 px-4 py-3"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
