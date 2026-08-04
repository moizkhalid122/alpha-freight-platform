"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Clock, Menu, Search, Sparkles, X } from "lucide-react";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";
import { employeeRoute } from "@/lib/employee-path";
import { cn } from "@/lib/utils";

export function EmployeePageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmployeeStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function EmployeeStatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

export function EmployeePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6", className)}>
      {children}
    </div>
  );
}

export function EmployeeTableShell({ children }: { children: ReactNode }) {
  return (
    <EmployeePanel className="overflow-hidden p-0">
      <div className="overflow-x-auto">{children}</div>
    </EmployeePanel>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/_/g, " ");
  const tone =
    ["completed", "approved", "paid", "won", "active", "qualified"].includes(status.toLowerCase())
      ? "bg-emerald-50 text-emerald-700"
      : ["pending", "new", "not_started", "contacted", "in_progress"].includes(status.toLowerCase())
        ? "bg-amber-50 text-amber-700"
        : ["rejected", "lost", "inactive"].includes(status.toLowerCase())
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", tone)}>
      {normalized}
    </span>
  );
}

export default function EmployeeLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans">
      <div className="hidden lg:block">
        <EmployeeSidebar />
      </div>

      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <EmployeeSidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-600 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative hidden max-w-md flex-1 lg:block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search tasks, leads, documents…"
                  className="w-80 rounded-2xl border border-gray-100 bg-gray-50/80 py-2.5 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={employeeRoute("/ai")}
                className="hidden items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 sm:flex"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Team AI
              </Link>
              <button type="button" className="relative rounded-xl border border-gray-100 bg-white p-2.5 text-gray-600">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="hidden items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-500 sm:flex">
                <Clock className="h-3.5 w-3.5" />
                Live
              </div>
              {sidebarOpen ? (
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 lg:hidden" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
