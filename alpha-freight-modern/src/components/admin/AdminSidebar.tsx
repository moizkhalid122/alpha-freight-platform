"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        path: "/admin",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        name: "Quick Stats",
        path: "/admin/quick-stats",
        icon: <Gauge className="h-4 w-4" />,
      },
      {
        name: "Referrals",
        path: "/admin/referrals",
        icon: <Gift className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "CARRIERS",
    items: [
      {
        name: "All Carriers",
        path: "/admin/carriers",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        name: "Pending Verification",
        path: "/admin/carriers/pending-verifications",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        name: "Verified Carriers",
        path: "/admin/carriers/verified",
        icon: <UserRoundCheck className="h-4 w-4" />,
      },
      {
        name: "Add Carrier",
        path: "/admin/carriers/add",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        name: "POD Verification",
        path: "/admin/carriers/pod-verification",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        name: "Carrier Payments",
        path: "/admin/carriers/payments",
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "SUPPLIERS",
    items: [
      {
        name: "All Suppliers",
        path: "/admin/suppliers",
        icon: <Building2 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "LOADS",
    items: [
      {
        name: "All Loads",
        path: "/admin/loads",
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        name: "Post Load",
        path: "/admin/post-load",
        icon: <PackagePlus className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      {
        name: "Settings",
        path: "/admin/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

function isItemActive(pathname: string, itemPath: string) {
  if (itemPath === "/admin") {
    return pathname === "/admin";
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

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/60 bg-[#f8fbff]/90 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[92px]" : "w-[294px]"
      )}
    >
      <div className={cn("border-b border-slate-200/70", collapsed ? "px-4 py-5" : "px-5 py-5")}>
        <Link href="/admin" onClick={onClose} className="flex items-center gap-3">
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
        <Link
          href="/auth/login"
          onClick={onClose}
          className={cn(
            "mt-3 flex rounded-2xl text-sm font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center px-2 py-3" : "items-center gap-3 px-4 py-3"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? <span>Logout</span> : null}
        </Link>
      </div>
    </aside>
  );
}
