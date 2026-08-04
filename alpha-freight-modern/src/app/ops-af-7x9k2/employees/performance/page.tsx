"use client";

import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployees, useAdminTeamStats } from "@/hooks/useAdminEmployeeData";

export default function AdminEmployeePerformancePage() {
  const { employees, loading: employeesLoading } = useAdminEmployees();
  const { stats, loading: statsLoading } = useAdminTeamStats();

  const loading = employeesLoading || statsLoading;

  const performance = employees.map((emp) => {
    const empLeads = stats.leads.filter((l) => l.employee_id === emp.id).length;
    const empCalls = stats.calls.filter((c) => c.employee_id === emp.id).length;
    const tasksDone = stats.tasks.filter(
      (t) => t.employee_id === emp.id && t.status === "completed"
    ).length;
    const score = Math.min(100, empLeads * 5 + empCalls * 2 + tasksDone * 3);

    return {
      id: emp.id,
      name: emp.full_name ?? "Employee",
      leads: empLeads,
      calls: empCalls,
      tasksDone,
      score,
    };
  });

  return (
    <div>
      <AdminHrHeader
        title="Performance"
        description="Individual performance scores based on leads, calls, and task completion."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/performance" />

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Leads</th>
                <th className="px-5 py-4">Calls</th>
                <th className="px-5 py-4">Tasks done</th>
                <th className="px-5 py-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : performance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No employees yet
                  </td>
                </tr>
              ) : (
                performance.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-5 py-4 text-slate-600">{row.leads}</td>
                    <td className="px-5 py-4 text-slate-600">{row.calls}</td>
                    <td className="px-5 py-4 text-slate-600">{row.tasksDone}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#BFFF07]"
                            style={{ width: `${row.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{row.score}</span>
                      </div>
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
