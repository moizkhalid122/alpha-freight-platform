"use client";

import { useState } from "react";
import { Download, Plus, Target, Upload } from "lucide-react";
import {
  AdminHrHeader,
  AdminHrTabs,
  AdminPanel,
} from "@/components/admin/AdminHrShell";
import { useAdminEmployees, useAdminTable, useEmployeeNameLookup } from "@/hooks/useAdminEmployeeData";
import { LEAD_TYPES } from "@/lib/employee-leads";
import { downloadCsv, leadsToCsv, parseLeadsCsv, UK_REGIONS } from "@/lib/employee-leads-utils";
import type { EmployeeLead } from "@/lib/employee-types";
import Link from "next/link";
import { adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";

type LeadRow = EmployeeLead;

export default function AdminEmployeeLeadsPage() {
  const { employees } = useAdminEmployees();
  const { rows, loading } = useAdminTable<LeadRow>("employee_leads");
  const nameFor = useEmployeeNameLookup(employees);

  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    lead_type: "carrier" as EmployeeLead["lead_type"],
    value_gbp: "",
    region: "",
    lead_source: "admin_assigned" as EmployeeLead["lead_source"],
    next_follow_up: "",
    notes: "",
  });
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const won = rows.filter((l) => l.status === "won").length;
  const pipeline = rows
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + Number(l.value_gbp ?? 0), 0);

  const assignLead = async () => {
    if (!employeeId || !form.company_name.trim()) return;
    const lead: EmployeeLead = {
      id: `al_${Date.now()}`,
      employee_id: employeeId,
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      lead_type: form.lead_type,
      status: "new",
      value_gbp: form.value_gbp ? Number(form.value_gbp) : null,
      notes: form.notes.trim() || null,
      next_follow_up: form.next_follow_up || null,
      region: form.region || null,
      lead_source: "admin_assigned",
      assigned_by_name: "Admin",
      created_at: new Date().toISOString(),
    };

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("employee_leads").insert({
      employee_id: employeeId,
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      lead_type: lead.lead_type,
      status: "new",
      value_gbp: lead.value_gbp,
      notes: lead.notes,
      next_follow_up: lead.next_follow_up,
      region: lead.region,
      lead_source: "admin_assigned",
      assigned_by: userData.user?.id ?? null,
    });
    setMessage(error ? `Error: ${error.message}` : "Lead assigned to employee.");

    setForm({
      company_name: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      lead_type: "carrier",
      value_gbp: "",
      region: "",
      lead_source: "admin_assigned",
      next_follow_up: "",
      notes: "",
    });
  };

  const bulkImport = async () => {
    if (!employeeId || !importText.trim()) return;
    const imported = parseLeadsCsv(importText, employeeId).map((l) => ({
      ...l,
      lead_source: "admin_assigned" as const,
      assigned_by_name: "Admin",
    }));

    const { error } = await supabase.from("employee_leads").insert(
      imported.map(({ id: _id, assigned_by_name: _n, ...rest }) => rest)
    );
    setMessage(error ? `Error: ${error.message}` : `${imported.length} leads imported.`);
    setImportText("");
  };

  return (
    <div>
      <AdminHrHeader title="Leads" description="Team pipeline, assign leads to employees, bulk import." />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/leads" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pipeline value</p>
          <p className="mt-1 text-3xl font-black text-slate-900">£{pipeline.toLocaleString()}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deals won</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{won}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <AdminPanel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Value</th>
                  <th className="px-5 py-4">Region</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No leads yet</td></tr>
                ) : (
                  rows.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <Link
                          href={adminRoute(`/employees/${lead.employee_id}`)}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {nameFor(lead.employee_id)}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{lead.company_name}</td>
                      <td className="px-5 py-4 text-slate-600">{lead.contact_name ?? "—"}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{lead.lead_type ?? "—"}</td>
                      <td className="px-5 py-4 font-semibold">{lead.value_gbp ? `£${Number(lead.value_gbp).toLocaleString()}` : "—"}</td>
                      <td className="px-5 py-4 text-slate-600">{lead.region ?? "—"}</td>
                      <td className="px-5 py-4 capitalize text-slate-700">{lead.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-4">
            <button type="button" onClick={() => downloadCsv("team-leads.csv", leadsToCsv(rows))} className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
              <Download className="h-4 w-4" /> Export team leads CSV
            </button>
          </div>
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Assign Lead to Employee</h2>
            </div>
            <div className="space-y-3">
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name ?? e.email}</option>
                ))}
              </select>
              <input placeholder="Company name *" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <input placeholder="Contact name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <input placeholder="Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.lead_type ?? "carrier"} onChange={(e) => setForm({ ...form, lead_type: e.target.value as EmployeeLead["lead_type"] })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  {LEAD_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <option value="">Region</option>
                  {UK_REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              <input type="number" placeholder="Deal value £" value={form.value_gbp} onChange={(e) => setForm({ ...form, value_gbp: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <input type="date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <textarea placeholder="Notes for employee" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <button type="button" onClick={assignLead} disabled={!employeeId || !form.company_name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Assign Lead
              </button>
              {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
            </div>
          </AdminPanel>

          <AdminPanel>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
              <Upload className="h-4 w-4" /> Bulk Import CSV
            </h3>
            <textarea rows={5} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="company_name,contact_name,contact_phone,lead_type,region" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs" />
            <button type="button" onClick={bulkImport} disabled={!employeeId || !importText.trim()} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Import to selected employee
            </button>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
