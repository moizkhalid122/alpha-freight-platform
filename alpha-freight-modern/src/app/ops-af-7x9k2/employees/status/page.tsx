"use client";

import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployees } from "@/hooks/useAdminEmployeeData";

export default function AdminEmployeeStatusPage() {
  const { employees, loading } = useAdminEmployees();

  const active = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on_leave").length;
  const inactive = employees.filter((e) => e.status === "inactive").length;

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader title="Employee Status" description="Team availability and attendance overview." />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/status" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active", value: active, tone: "text-emerald-600" },
          { label: "On leave", value: onLeave, tone: "text-amber-600" },
          { label: "Inactive", value: inactive, tone: "text-slate-500" },
        ].map((stat) => (
          <AdminPanel key={stat.label}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-black ${stat.tone}`}>{loading ? "—" : stat.value}</p>
          </AdminPanel>
        ))}
      </div>

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Hire date</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-5 py-4 font-semibold text-slate-900">{emp.full_name}</td>
                  <td className="px-5 py-4 text-slate-600">{emp.department}</td>
                  <td className="px-5 py-4 text-slate-600">{emp.hire_date ?? "—"}</td>
                  <td className="px-5 py-4 capitalize text-slate-700">{emp.status.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
