"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployees, useAdminTable, useEmployeeNameLookup } from "@/hooks/useAdminEmployeeData";
import type { LeadActivity } from "@/lib/employee-types";
import { adminRoute } from "@/lib/admin-path";

type ActivityRow = LeadActivity & {
  employee_id: string;
};

const TYPE_COLORS: Record<string, string> = {
  call: "bg-blue-50 text-blue-700",
  email: "bg-violet-50 text-violet-700",
  note: "bg-slate-100 text-slate-700",
  followup: "bg-amber-50 text-amber-700",
  status: "bg-indigo-50 text-indigo-700",
  won: "bg-emerald-50 text-emerald-700",
  import: "bg-cyan-50 text-cyan-700",
};

export default function AdminEmployeeActivityPage() {
  const { employees } = useAdminEmployees();
  const { rows, loading } = useAdminTable<ActivityRow>("employee_lead_activities");
  const nameFor = useEmployeeNameLookup(employees);

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader
        title="CRM Activity"
        description="Full timeline — every note, call log, status change, and follow-up across the team."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/activity" />

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">When</th>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Summary</th>
                <th className="px-5 py-4">Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    <Activity className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No CRM activity yet — activities sync from employee lead workspace
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Date(item.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={adminRoute(`/employees/${item.employee_id}`)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {nameFor(item.employee_id)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                          TYPE_COLORS[item.activity_type] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.activity_type}
                      </span>
                    </td>
                    <td className="max-w-md px-5 py-4 text-slate-800">{item.summary}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {item.lead_id.slice(0, 8)}…
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
