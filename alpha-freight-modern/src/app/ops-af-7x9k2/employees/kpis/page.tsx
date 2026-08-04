"use client";

import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployees, useAdminTeamStats } from "@/hooks/useAdminEmployeeData";

export default function AdminEmployeeKpisPage() {
  const { employees } = useAdminEmployees();
  const { stats, loading } = useAdminTeamStats();

  const { leads, calls, commissions } = stats;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const callsThisWeek = calls.filter((c) => new Date(c.called_at) >= weekAgo);

  const kpis = [
    {
      label: "Team size",
      value: String(employees.length),
      note: `${employees.filter((e) => e.status === "active").length} active today`,
    },
    {
      label: "Total leads",
      value: String(leads.length),
      note: `${leads.filter((l) => l.status === "new").length} new`,
    },
    {
      label: "Calls this week",
      value: String(callsThisWeek.length),
      note: `${callsThisWeek.reduce((s, c) => s + (c.duration_minutes ?? 0), 0)} mins logged`,
    },
    {
      label: "Commission (month)",
      value: `£${commissions.reduce((s, c) => s + Number(c.amount_gbp), 0).toLocaleString()}`,
      note: `${commissions.filter((c) => c.status === "pending").length} pending approval`,
    },
    {
      label: "Win rate",
      value: `${Math.round((leads.filter((l) => l.status === "won").length / Math.max(leads.length, 1)) * 100)}%`,
      note: "Leads marked won",
    },
    {
      label: "Avg deal size",
      value: `£${Math.round(leads.reduce((s, l) => s + Number(l.value_gbp ?? 0), 0) / Math.max(leads.length, 1)).toLocaleString()}`,
      note: "Across all open + closed leads",
    },
  ];

  const monthlyTargets = [
    {
      label: "New leads",
      current: leads.filter((l) => l.status === "new").length,
      target: 30,
    },
    {
      label: "Qualified leads",
      current: leads.filter((l) => l.status === "qualified").length,
      target: 15,
    },
    {
      label: "Calls logged",
      current: calls.length,
      target: 100,
    },
    {
      label: "Revenue influenced",
      current: leads.filter((l) => l.status === "won").reduce((s, l) => s + Number(l.value_gbp ?? 0), 0),
      target: 100000,
      currency: true,
    },
  ];

  return (
    <div>
      <AdminHrHeader title="KPIs" description="Key performance indicators for the sales and ops team." />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/kpis" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <AdminPanel key={kpi.label}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {loading ? "—" : kpi.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{kpi.note}</p>
          </AdminPanel>
        ))}
      </div>

      <AdminPanel className="mt-6">
        <h2 className="mb-4 text-lg font-black text-slate-900">Monthly targets</h2>
        <div className="space-y-4">
          {monthlyTargets.map((item) => {
            const pct = Math.min(100, Math.round((item.current / item.target) * 100));
            return (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="text-slate-500">
                    {loading
                      ? "—"
                      : (
                        <>
                          {item.currency ? `£${item.current.toLocaleString()}` : item.current} /{" "}
                          {item.currency ? `£${item.target.toLocaleString()}` : item.target}
                        </>
                      )}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: loading ? "0%" : `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AdminPanel>
    </div>
  );
}
