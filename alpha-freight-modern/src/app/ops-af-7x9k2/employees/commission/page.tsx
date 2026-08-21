"use client";

import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminTable } from "@/hooks/useAdminEmployeeData";

type CommissionRow = {
  id: string;
  employee_id: string;
  amount_gbp: number;
  status: string;
  period_month: string | null;
  notes: string | null;
};

export default function AdminEmployeeCommissionPage() {
  const { rows, loading } = useAdminTable<CommissionRow>("employee_commissions");

  const total = rows.reduce((s, r) => s + Number(r.amount_gbp), 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount_gbp), 0);

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader title="Commission" description="Review and approve employee commission payouts." />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/commission" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total logged</p>
          <p className="mt-1 text-3xl font-black text-slate-900">
            {loading ? "—" : `£${total.toLocaleString()}`}
          </p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending approval</p>
          <p className="mt-1 text-3xl font-black text-amber-600">
            {loading ? "—" : `£${pending.toLocaleString()}`}
          </p>
        </AdminPanel>
      </div>

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Period</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Notes</th>
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
                    No commissions yet
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.employee_id.slice(0, 8)}…</td>
                    <td className="px-5 py-4 text-slate-600">{row.period_month ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold">£{Number(row.amount_gbp).toLocaleString()}</td>
                    <td className="px-5 py-4 capitalize text-slate-700">{row.status}</td>
                    <td className="max-w-xs px-5 py-4 text-xs text-slate-500">{row.notes ?? "—"}</td>
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
