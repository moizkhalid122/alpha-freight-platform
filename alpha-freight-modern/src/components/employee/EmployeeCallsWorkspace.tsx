"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  Clock,
  Download,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import EmployeeModal from "@/components/employee/EmployeeModal";
import {
  EmployeePageHeader,
  EmployeePanel,
  EmployeeStatCard,
  EmployeeStatGrid,
  EmployeeTableShell,
} from "@/components/employee/EmployeeShell";
import { useEmployeeCalls, useEmployeeLeads } from "@/hooks/useEmployeeData";
import { appendLeadActivity } from "@/lib/employee-lead-activities";
import {
  CALL_DAILY_TARGET,
  CALL_OUTCOMES,
  callsToCsv,
  computeCallStats,
  downloadCallsCsv,
  filterCalls,
  formatCallDuration,
  outcomeTone,
  type CallFilters,
} from "@/lib/employee-calls-utils";
import { phoneTelHref } from "@/lib/employee-leads-utils";
import type { EmployeeCall } from "@/lib/employee-types";
import { employeeRoute } from "@/lib/employee-path";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const emptyForm = (): {
  lead_id: string;
  company_name: string;
  contact_phone: string;
  direction: "inbound" | "outbound";
  duration_minutes: string;
  outcome: string;
  notes: string;
  call_type: EmployeeCall["call_type"];
} => ({
  lead_id: "",
  company_name: "",
  contact_phone: "",
  direction: "outbound",
  duration_minutes: "",
  outcome: CALL_OUTCOMES[0].label,
  notes: "",
  call_type: "carrier",
});

export default function EmployeeCallsWorkspace() {
  const { rows, loading, userId, refetch } = useEmployeeCalls();
  const { rows: leads } = useEmployeeLeads();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallFilters>({
    search: "",
    direction: "all",
    outcome: "all",
    period: "all",
    callType: "all",
  });

  const leadMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of leads) m.set(l.id, l.company_name);
    return m;
  }, [leads]);

  const leadPhoneMap = useMemo(() => {
    const m = new Map<string, { phone: string | null; name: string | null; type: string | null }>();
    for (const l of leads) m.set(l.id, { phone: l.contact_phone, name: l.contact_name, type: l.lead_type ?? null });
    return m;
  }, [leads]);

  const stats = useMemo(() => computeCallStats(rows), [rows]);
  const filtered = useMemo(
    () => filterCalls(rows, filters, leadMap),
    [rows, filters, leadMap]
  );
  const selected = rows.find((c) => c.id === selectedId) ?? null;

  const companyForCall = (call: EmployeeCall) =>
    call.company_name ?? (call.lead_id ? leadMap.get(call.lead_id) : null) ?? "Unknown";

  const logCall = async () => {
    if (!userId) {
      setActionError("Sign in to log calls.");
      return;
    }
    setSaving(true);
    setActionError(null);
    const lead = form.lead_id ? leads.find((l) => l.id === form.lead_id) : null;

    const { data, error } = await supabase
      .from("employee_calls")
      .insert({
        employee_id: userId,
        lead_id: form.lead_id || null,
        direction: form.direction,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        outcome: form.outcome,
        notes: form.notes.trim() || null,
        company_name: form.company_name.trim() || lead?.company_name || null,
        contact_phone: form.contact_phone.trim() || lead?.contact_phone || null,
        call_type: form.call_type ?? (lead?.lead_type as EmployeeCall["call_type"]) ?? "general",
      })
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      setSaving(false);
      return;
    }

    const newCall = data as EmployeeCall;

    if (newCall.lead_id) {
      appendLeadActivity(userId, newCall.lead_id, {
        activity_type: "call",
        summary: `${newCall.outcome}${newCall.notes ? ` — ${newCall.notes.slice(0, 80)}` : ""}`,
      });
    }

    await refetch();
    setSaving(false);
    setShowLog(false);
    setForm(emptyForm());
    setSelectedId(newCall.id);
  };

  const onLeadPick = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setForm((f) => ({
      ...f,
      lead_id: leadId,
      company_name: lead.company_name,
      contact_phone: lead.contact_phone ?? "",
      call_type: (lead.lead_type as EmployeeCall["call_type"]) ?? "carrier",
    }));
  };

  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-[#FFD666] px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-[#f5c84d] disabled:opacity-50";
  const btnSecondary =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50";

  return (
    <div>
      <EmployeePageHeader
        title="My Calls"
        description="Log every call, track daily targets, and link conversations to your CRM leads."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                downloadCallsCsv(`calls-${new Date().toISOString().slice(0, 10)}.csv`, callsToCsv(rows, leadMap))
              }
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" className={btnPrimary} disabled={!userId} onClick={() => { setForm(emptyForm()); setShowLog(true); }}>
              <Plus className="h-4 w-4" /> Log Call
            </button>
          </div>
        }
      />

      {!userId ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to view and log calls.
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      <EmployeeStatGrid>
        <EmployeeStatCard
          label="Calls today"
          value={String(stats.today)}
          note={`Target ${CALL_DAILY_TARGET}/day`}
          icon={<Phone className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Connected today"
          value={String(stats.connectedToday)}
          note={`${stats.outboundToday} outbound · ${stats.inboundToday} inbound`}
          icon={<PhoneCall className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Talk time today"
          value={formatCallDuration(stats.talkMinutesToday)}
          note={`${formatCallDuration(stats.talkMinutesWeek)} this week`}
          icon={<Clock className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Daily progress"
          value={`${stats.dailyTargetPct}%`}
          note={`${stats.week} calls this week`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </EmployeeStatGrid>

      <EmployeePanel className="mt-6">
        <div className="mb-3 flex justify-between text-xs font-semibold text-slate-500">
          <span>Daily call target ({stats.today}/{CALL_DAILY_TARGET})</span>
          <span>{stats.dailyTargetPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#BFFF07] transition-all" style={{ width: `${stats.dailyTargetPct}%` }} />
        </div>
      </EmployeePanel>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={employeeRoute("/leads")} className={btnSecondary}>
          <Target className="h-4 w-4" /> Open CRM
        </Link>
      </div>

      <EmployeePanel className="mt-6">
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search company, outcome, notes…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              value={filters.period}
              onChange={(v) => setFilters({ ...filters, period: v as CallFilters["period"] })}
              options={[
                { value: "all", label: "All time" },
                { value: "today", label: "Today" },
                { value: "week", label: "This week" },
              ]}
            />
            <FilterSelect
              value={filters.direction}
              onChange={(v) => setFilters({ ...filters, direction: v as CallFilters["direction"] })}
              options={[
                { value: "all", label: "All directions" },
                { value: "outbound", label: "Outbound" },
                { value: "inbound", label: "Inbound" },
              ]}
            />
            <FilterSelect
              value={filters.callType}
              onChange={(v) => setFilters({ ...filters, callType: v })}
              options={[
                { value: "all", label: "All types" },
                { value: "carrier", label: "Carrier" },
                { value: "supplier", label: "Supplier" },
                { value: "general", label: "General" },
              ]}
            />
            <FilterSelect
              value={filters.outcome}
              onChange={(v) => setFilters({ ...filters, outcome: v })}
              options={[{ value: "all", label: "All outcomes" }, ...CALL_OUTCOMES.map((o) => ({ value: o.value, label: o.label }))]}
            />
          </div>
        </div>
      </EmployeePanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <EmployeeTableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">When</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Direction</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Outcome</th>
                <th className="px-5 py-4">Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Loading calls…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No calls match filters — log your first call.</td></tr>
              ) : (
                filtered.map((call) => {
                  const tel = phoneTelHref(call.contact_phone ?? (call.lead_id ? leadPhoneMap.get(call.lead_id)?.phone : null));
                  return (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedId(call.id)}
                      className={cn(
                        "cursor-pointer transition hover:bg-slate-50/80",
                        selectedId === call.id && "bg-blue-50/60 ring-1 ring-inset ring-blue-200"
                      )}
                    >
                      <td className="px-5 py-4 text-slate-600">
                        {format(new Date(call.called_at), "dd MMM · HH:mm")}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{companyForCall(call)}</p>
                        {call.lead_id ? (
                          <p className="text-xs text-blue-600">Linked to CRM</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                          call.direction === "outbound" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
                        )}>
                          {call.direction === "outbound" ? <PhoneOutgoing className="h-3 w-3" /> : <PhoneIncoming className="h-3 w-3" />}
                          {call.direction}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatCallDuration(call.duration_minutes)}</td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", outcomeTone(call.outcome))}>
                          {call.outcome ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {tel ? (
                          <a href={tel} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                            📞 Dial
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </EmployeeTableShell>

        {selected ? (
          <EmployeePanel className="sticky top-24 h-fit">
            <h3 className="text-lg font-bold text-slate-900">{companyForCall(selected)}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {format(new Date(selected.called_at), "EEEE dd MMM yyyy · HH:mm")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", selected.direction === "outbound" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700")}>
                {selected.direction}
              </span>
              {selected.call_type ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">{selected.call_type}</span>
              ) : null}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Duration</dt><dd className="font-medium">{formatCallDuration(selected.duration_minutes)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Outcome</dt><dd className="max-w-[180px] text-right font-medium">{selected.outcome ?? "—"}</dd></div>
              {selected.contact_phone ? (
                <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd className="font-medium">{selected.contact_phone}</dd></div>
              ) : null}
            </dl>
            {selected.notes ? (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                <p className="mt-1 text-sm text-slate-700">{selected.notes}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              {phoneTelHref(selected.contact_phone) ? (
                <a href={phoneTelHref(selected.contact_phone)!} className={`${btnPrimary} justify-center`}>Call again</a>
              ) : null}
              {selected.lead_id ? (
                <Link href={employeeRoute("/leads")} className={`${btnSecondary} justify-center`} onClick={() => {}}>
                  View in CRM
                </Link>
              ) : null}
            </div>
          </EmployeePanel>
        ) : (
          <EmployeePanel className="sticky top-24 flex h-fit flex-col items-center py-12 text-center">
            <Phone className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Select a call</p>
            <p className="mt-1 text-xs text-slate-500">View notes, outcome, and redial.</p>
          </EmployeePanel>
        )}
      </div>

      <EmployeeModal open={showLog} onClose={() => setShowLog(false)} title="Log Call" wide>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Link to CRM lead</label>
            <select
              value={form.lead_id}
              onChange={(e) => (e.target.value ? onLeadPick(e.target.value) : setForm({ ...form, lead_id: "" }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">No lead — manual entry</option>
              {leads.filter((l) => !["won", "lost"].includes(l.status)).map((l) => (
                <option key={l.id} value={l.id}>{l.company_name} — {l.contact_name ?? "No contact"}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
            <Field label="Phone" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Direction</label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "inbound" | "outbound" })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Duration (minutes)</label>
              <input type="number" min={0} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="e.g. 12" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Call type</label>
              <select value={form.call_type ?? "carrier"} onChange={(e) => setForm({ ...form, call_type: e.target.value as EmployeeCall["call_type"] })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="carrier">Carrier</option>
                <option value="supplier">Supplier</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Outcome</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                {CALL_OUTCOMES.map((o) => (<option key={o.value} value={o.label}>{o.label}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Notes</label>
            <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What was discussed? Next steps?" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId || saving || (!form.company_name.trim() && !form.lead_id)} onClick={logCall}>
            Save Call Log
          </button>
          <p className="text-center text-xs text-slate-400">Linked leads auto-sync to CRM activity timeline.</p>
        </div>
      </EmployeeModal>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
    </div>
  );
}
