"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import EmployeePortalLinkCard from "@/components/admin/EmployeePortalLinkCard";
import { useAdminEmployees } from "@/hooks/useAdminEmployeeData";
import { adminRoute } from "@/lib/admin-path";

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "on_leave"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminEmployeesPage() {
  const { employees, loading, error } = useAdminEmployees();

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader
        title="Employees"
        description="View and manage all Alpha Freight team members. Open any employee for their full A–Z record."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees" />
      <EmployeePortalLinkCard />

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <AdminPanel className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Commission %</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No employees yet. Team members appear here after employee signup and onboarding.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{emp.full_name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{emp.email ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{emp.employee_code ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{emp.department ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{emp.job_title ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{emp.commission_rate}%</td>
                    <td className="px-5 py-4">
                      <StatusPill status={emp.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={adminRoute(`/employees/${emp.id}`)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                      >
                        Full record
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
