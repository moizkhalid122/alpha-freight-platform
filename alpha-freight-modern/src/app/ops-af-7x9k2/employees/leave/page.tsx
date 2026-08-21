"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, Check, X } from "lucide-react";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import {
  useAdminEmployees,
  useAdminTable,
  useEmployeeNameLookup,
} from "@/hooks/useAdminEmployeeData";
import type { EmployeeLeaveRequest } from "@/lib/employee-types";
import { adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";

export default function AdminEmployeeLeavePage() {
  const { employees } = useAdminEmployees();
  const { rows, loading, refetch } = useAdminTable<EmployeeLeaveRequest>("employee_leave_requests");
  const nameFor = useEmployeeNameLookup(employees);
  const [updating, setUpdating] = useState<string | null>(null);

  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    const { error } = await supabase.from("employee_leave_requests").update({ status }).eq("id", id);
    setUpdating(null);
    if (!error) void refetch();
  };

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader
        title="Leave Requests"
        description="Review and approve employee annual, sick, and unpaid leave."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/leave" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
          <p className="mt-1 text-3xl font-black text-amber-600">{loading ? "—" : pending}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{loading ? "—" : approved}</p>
        </AdminPanel>
      </div>

      <AdminPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Dates</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4">Actions</th>
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
                    <CalendarOff className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No leave requests yet
                  </td>
                </tr>
              ) : (
                rows.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <Link
                        href={adminRoute(`/employees/${req.employee_id}`)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {nameFor(req.employee_id)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-700">{req.leave_type}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-xs text-slate-500">{req.reason ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : req.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-4">
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={updating === req.id}
                            onClick={() => updateStatus(req.id, "approved")}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={updating === req.id}
                            onClick={() => updateStatus(req.id, "rejected")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
