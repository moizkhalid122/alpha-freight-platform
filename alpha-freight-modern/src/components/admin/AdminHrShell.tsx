"use client";

import Link from "next/link";
import { Users, UserCheck, FileText, CircleDollarSign, Target, TrendingUp, BarChart3, ListTodo, ClipboardList } from "lucide-react";
import { adminRoute } from "@/lib/admin-path";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Employees", path: "/ops-af-7x9k2/employees", icon: Users },
  { name: "Onboarding", path: "/ops-af-7x9k2/employees/onboarding", icon: ClipboardList },
  { name: "Tasks", path: "/ops-af-7x9k2/employees/tasks", icon: ListTodo },
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
    <div className="mb-6">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">HR & Employees</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function AdminHrTabs({ activePath }: { activePath: string }) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activePath === tab.path || activePath.startsWith(`${tab.path}/`);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-slate-900 text-white shadow-lg"
                : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-[#BFFF07]" : "text-slate-400")} />
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
    <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Sample HR data — run <code className="font-mono text-xs">employee-platform.sql</code> and set{" "}
      <code className="font-mono text-xs">profiles.role = &apos;employee&apos;</code> for live records.
    </p>
  );
}

export function AdminPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function adminEmployeesRoute(sub = "") {
  return adminRoute(`/employees${sub.startsWith("/") ? sub : sub ? `/${sub}` : ""}`);
}
