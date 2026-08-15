"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployees, useAdminTable, useEmployeeNameLookup } from "@/hooks/useAdminEmployeeData";
import type { EmployeeCall } from "@/lib/employee-types";
import { adminRoute } from "@/lib/admin-path";

export default function AdminEmployeeCallsPage() {
  const { employees } = useAdminEmployees();
  const { rows, loading } = useAdminTable<EmployeeCall>("employee_calls", "called_at");
  const nameFor = useEmployeeNameLookup(employees);

  const totalMinutes = rows.reduce((s, c) => s + Number(c.duration_minutes ?? 0), 0);
  const outbound = rows.filter((c) => c.direction === "outbound").length;

  return (
    <div>
      <AdminHrHeader
        title="Calls"
        description="Every call logged by the team — outbound, inbound, notes, and outcomes."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/calls" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total calls</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{loading ? "—" : rows.length}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outbound</p>
          <p className="mt-1 text-3xl font-black text-blue-600">{loading ? "—" : outbound}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Talk time</p>
          <p className="mt-1 text-3xl font-black text-slate-900">
            {loading ? "—" : `${totalMinutes.toLocaleString()} min`}
          </p>
        </AdminPanel>
      </div>

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">When</th>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Direction</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Outcome</th>
                <th className="px-5 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <Phone className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No calls logged yet
                  </td>
                </tr>
              ) : (
                rows.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Date(call.called_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={adminRoute(`/employees/${call.employee_id}`)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {nameFor(call.employee_id)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {call.company_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">{call.direction}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{call.outcome ?? "—"}</td>
                    <td className="max-w-xs px-5 py-4 text-xs text-slate-500">{call.notes ?? "—"}</td>
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
