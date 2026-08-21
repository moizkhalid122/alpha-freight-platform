"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  FileText,
  CircleDollarSign,
  Target,
  TrendingUp,
  BarChart3,
  ListTodo,
  ClipboardList,
  Phone,
  Activity,
  CalendarOff,
} from "lucide-react";
import { adminRoute } from "@/lib/admin-path";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD,
  ADMIN_ICON_BOX,
  ADMIN_ICON_BOX_MD,
  ADMIN_SECTION_LABEL,
  ADMIN_SECTION_TITLE,
} from "@/lib/admin-ui";

const tabs = [
  { name: "Employees", path: "/ops-af-7x9k2/employees", icon: Users },
  { name: "Onboarding", path: "/ops-af-7x9k2/employees/onboarding", icon: ClipboardList },
  { name: "Tasks", path: "/ops-af-7x9k2/employees/tasks", icon: ListTodo },
  { name: "Calls", path: "/ops-af-7x9k2/employees/calls", icon: Phone },
  { name: "Activity", path: "/ops-af-7x9k2/employees/activity", icon: Activity },
  { name: "Leave", path: "/ops-af-7x9k2/employees/leave", icon: CalendarOff },
  { name: "Status", path: "/ops-af-7x9k2/employees/status", icon: UserCheck },
  { name: "Documents", path: "/ops-af-7x9k2/employees/documents", icon: FileText },
  { name: "Commission", path: "/ops-af-7x9k2/employees/commission", icon: CircleDollarSign },
  { name: "Leads", path: "/ops-af-7x9k2/employees/leads", icon: Target },
  { name: "Performance", path: "/ops-af-7x9k2/employees/performance", icon: TrendingUp },
  { name: "KPIs", path: "/ops-af-7x9k2/employees/kpis", icon: BarChart3 },
];

export function AdminHrHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className={cn(ADMIN_CARD, "relative overflow-hidden p-5 sm:p-6")}>
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-blue-400/80 to-transparent" />
      <div className="flex items-start gap-3">
        <div className={cn(ADMIN_ICON_BOX, ADMIN_ICON_BOX_MD)}>
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className={ADMIN_SECTION_LABEL}>HR &amp; Employees</p>
          <h1 className={ADMIN_SECTION_TITLE}>{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function AdminHrTabs({ activePath }: { activePath: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activePath === tab.path || activePath.startsWith(`${tab.path}/`);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ease-out active:scale-[0.98]",
              active ? "admin-hr-tab-active" : "admin-hr-tab"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminDemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-[12px] text-amber-800">
      Sample HR data — run <code className="font-mono text-[11px]">employee-platform.sql</code> and set{" "}
      <code className="font-mono text-[11px]">profiles.role = &apos;employee&apos;</code> for live records.
    </p>
  );
}

export function AdminPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(ADMIN_CARD, "overflow-hidden p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function adminEmployeesRoute(sub = "") {
  return adminRoute(`/employees${sub.startsWith("/") ? sub : sub ? `/${sub}` : ""}`);
}
