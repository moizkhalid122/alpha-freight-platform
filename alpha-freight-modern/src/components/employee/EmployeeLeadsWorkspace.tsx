"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Download,
  Plus,
  Search,
  Target,
  Trophy,
  Upload,
} from "lucide-react";
import EmployeeLeadsDetailPanel, { FollowUpQueue } from "@/components/employee/EmployeeLeadsDetailPanel";
import EmployeeModal from "@/components/employee/EmployeeModal";
import {
  EmployeePageHeader,
  EmployeePanel,
  EmployeeStatCard,
  EmployeeStatGrid,
  EmployeeTableShell,
} from "@/components/employee/EmployeeShell";
import { useEmployeeLeads } from "@/hooks/useEmployeeData";
import {
  appendLeadActivity,
  loadLeadActivities,
} from "@/lib/employee-lead-activities";
import {
  formatFollowUpLabel,
  LEAD_STATUSES,
  LEAD_TYPES,
  leadStatusTone,
} from "@/lib/employee-leads";
import {
  computeLeadStats,
  downloadCsv,
  estimateCommission,
  filterLeads,
  findDuplicateLead,
  followUpBadge,
  isFollowUpOverdue,
  isFollowUpToday,
  LEAD_EMAIL_TEMPLATES,
  LEAD_SOURCES,
  leadsToCsv,
  parseLeadsCsv,
  phoneTelHref,
  requestFollowUpReminder,
  UK_REGIONS,
  whatsAppHref,
  type LeadFilters,
} from "@/lib/employee-leads-utils";
import type { EmployeeLead } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ModalKind = "add" | "edit" | "call" | "email" | "followup" | "notes" | "won" | "import" | "duplicate" | null;

const emptyLead = (): Partial<EmployeeLead> => ({
  company_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  lead_type: "carrier",
  status: "new",
  next_follow_up: "",
  notes: "",
  value_gbp: null,
  region: "",
  lead_source: "cold_call",
  linkedin_url: "",
});

export default function EmployeeLeadsWorkspace() {
  const { rows, loading, userId, refetch } = useEmployeeLeads();
  const commissionRate = 8;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [form, setForm] = useState<Partial<EmployeeLead>>(emptyLead());
  const [filters, setFilters] = useState<LeadFilters>({
    search: "",
    type: "all",
    status: "all",
    followUp: "all",
    region: "all",
    source: "all",
  });
  const [callNote, setCallNote] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("intro");
  const [importText, setImportText] = useState("");
  const [duplicateLead, setDuplicateLead] = useState<EmployeeLead | null>(null);
  const [wonValue, setWonValue] = useState("");
  const [activityTick, setActivityTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [remindersOn, setRemindersOn] = useState(false);

  const stats = useMemo(() => computeLeadStats(rows), [rows]);
  const filtered = useMemo(() => filterLeads(rows, filters), [rows, filters]);
  const selected = rows.find((l) => l.id === selectedId) ?? null;
  const activities = selected && userId ? loadLeadActivities(userId, selected.id) : [];

  const dueToday = useMemo(
    () => rows.filter((l) => isFollowUpToday(l.next_follow_up) && !["won", "lost"].includes(l.status)),
    [rows]
  );
  const overdue = useMemo(
    () => rows.filter((l) => isFollowUpOverdue(l.next_follow_up) && !["won", "lost"].includes(l.status)),
    [rows]
  );
  const noFollowUp = useMemo(
    () => rows.filter((l) => !l.next_follow_up && !["won", "lost"].includes(l.status)),
    [rows]
  );

  useEffect(() => {
    if (remindersOn) requestFollowUpReminder(rows);
  }, [remindersOn, rows]);

  const updateLead = async (id: string, patch: Partial<EmployeeLead>, logStatus = true) => {
    if (!userId) {
      setActionError("Sign in to update leads.");
      return;
    }
    setActionError(null);
    const prev = rows.find((l) => l.id === id);

    const { error } = await supabase.from("employee_leads").update(patch).eq("id", id);
    if (error) {
      setActionError(error.message);
      return;
    }

    if (logStatus && patch.status && prev && patch.status !== prev.status) {
      appendLeadActivity(userId, id, {
        activity_type: patch.status === "won" ? "won" : "status",
        summary: `Status changed to ${String(patch.status).replace(/_/g, " ")}`,
      });
      setActivityTick((n) => n + 1);
    }

    await refetch();
  };

  const logActivity = async (
    leadId: string,
    type: Parameters<typeof appendLeadActivity>[2]["activity_type"],
    summary: string
  ) => {
    if (!userId) return;
    appendLeadActivity(userId, leadId, { activity_type: type, summary });
    setActivityTick((n) => n + 1);
    const now = new Date().toISOString();
    await updateLead(leadId, { last_activity_at: now }, false);
  };

  const handleStatusChange = (id: string, status: EmployeeLead["status"]) => {
    if (!userId) {
      setActionError("Sign in to update leads.");
      return;
    }
    if (status === "won") {
      const lead = rows.find((l) => l.id === id);
      setSelectedId(id);
      setWonValue(String(lead?.value_gbp ?? ""));
      setModal("won");
      return;
    }
    updateLead(id, { status });
  };

  const saveLead = async (isEdit: boolean) => {
    if (!userId) {
      setActionError("Sign in to save leads.");
      return;
    }
    if (!form.company_name?.trim()) return;
    const dup = findDuplicateLead(rows, form, isEdit ? selectedId ?? undefined : undefined);
    if (dup) {
      setDuplicateLead(dup);
      setModal("duplicate");
      return;
    }
    setSaving(true);
    setActionError(null);

    if (isEdit && selectedId) {
      const patch: Partial<EmployeeLead> = {
        company_name: form.company_name.trim(),
        contact_name: form.contact_name?.trim() || null,
        contact_email: form.contact_email?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        lead_type: form.lead_type as EmployeeLead["lead_type"],
        status: form.status as EmployeeLead["status"],
        value_gbp: form.value_gbp ? Number(form.value_gbp) : null,
        next_follow_up: form.next_follow_up || null,
        notes: form.notes?.trim() || null,
        region: form.region?.trim() || null,
        lead_source: form.lead_source as EmployeeLead["lead_source"],
        linkedin_url: form.linkedin_url?.trim() || null,
        last_activity_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("employee_leads").update(patch).eq("id", selectedId);
      if (error) {
        setActionError(error.message);
        setSaving(false);
        return;
      }
      appendLeadActivity(userId, selectedId, { activity_type: "note", summary: "Lead details updated" });
      setActivityTick((n) => n + 1);
      await refetch();
    } else {
      const payload = {
        employee_id: userId,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name?.trim() || null,
        contact_email: form.contact_email?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        lead_type: (form.lead_type as EmployeeLead["lead_type"]) ?? "carrier",
        status: (form.status as EmployeeLead["status"]) ?? "new",
        value_gbp: form.value_gbp ? Number(form.value_gbp) : null,
        notes: form.notes?.trim() || null,
        next_follow_up: form.next_follow_up || null,
        region: form.region?.trim() || null,
        lead_source: (form.lead_source as EmployeeLead["lead_source"]) ?? "cold_call",
        linkedin_url: form.linkedin_url?.trim() || null,
        last_activity_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("employee_leads").insert(payload).select().single();
      if (error) {
        setActionError(error.message);
        setSaving(false);
        return;
      }
      const newLead = data as EmployeeLead;
      appendLeadActivity(userId, newLead.id, { activity_type: "note", summary: "Lead created" });
      setSelectedId(newLead.id);
      await refetch();
    }

    setSaving(false);
    setModal(null);
    setForm(emptyLead());
  };

  const handleImport = async () => {
    if (!userId) {
      setActionError("Sign in to import leads.");
      return;
    }
    const imported = parseLeadsCsv(importText, userId);
    if (!imported.length) return;
    setActionError(null);

    const { error } = await supabase.from("employee_leads").insert(
      imported.map(({ id: _id, ...rest }) => rest)
    );
    if (error) {
      setActionError(error.message);
      return;
    }

    for (const l of imported) {
      appendLeadActivity(userId, l.id, { activity_type: "import", summary: "Imported via CSV" });
    }
    await refetch();
    setImportText("");
    setModal(null);
  };

  const confirmWonCommission = async () => {
    if (!selected || !userId) return;
    const value = Number(wonValue) || 0;
    const comm = estimateCommission(value, commissionRate);

    const { error: leadError } = await supabase
      .from("employee_leads")
      .update({ value_gbp: value, status: "won" })
      .eq("id", selected.id);
    if (leadError) {
      setActionError(leadError.message);
      return;
    }

    appendLeadActivity(userId, selected.id, {
      activity_type: "won",
      summary: `Deal won — £${value.toLocaleString()} (est. commission £${comm.toLocaleString()})`,
    });
    setActivityTick((n) => n + 1);

    const { error: commError } = await supabase.from("employee_commissions").insert({
      employee_id: userId,
      amount_gbp: comm,
      status: "pending",
      notes: `${selected.company_name} — deal won`,
      period_month: new Date().toISOString().slice(0, 10),
      lead_id: selected.id,
      deal_value_gbp: value,
      company_name: selected.company_name,
    });
    if (commError) {
      setActionError(commError.message);
      await refetch();
      return;
    }

    await refetch();
    setModal(null);
  };

  const openEdit = (lead: EmployeeLead) => {
    setForm({
      company_name: lead.company_name,
      contact_name: lead.contact_name ?? "",
      contact_email: lead.contact_email ?? "",
      contact_phone: lead.contact_phone ?? "",
      lead_type: lead.lead_type ?? "carrier",
      status: lead.status,
      value_gbp: lead.value_gbp,
      next_follow_up: lead.next_follow_up ?? "",
      notes: lead.notes ?? "",
      region: lead.region ?? "",
      lead_source: lead.lead_source ?? "cold_call",
      linkedin_url: lead.linkedin_url ?? "",
    });
    setModal("edit");
  };

  const applyEmailTemplate = (templateId: string, lead: EmployeeLead) => {
    const t = LEAD_EMAIL_TEMPLATES.find((x) => x.id === templateId);
    if (t) setEmailBody(t.body(lead));
    setEmailTemplate(templateId);
  };

  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-[#FFD666] px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-[#f5c84d] disabled:opacity-50";
  const btnSecondary =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

  void activityTick;

  return (
    <div>
      <EmployeePageHeader
        title="My Leads"
        description="Your daily CRM — follow-ups, pipeline, calls, and deals in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(rows))}>
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" className={btnSecondary} disabled={!userId} onClick={() => setModal("import")}>
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            <button type="button" className={btnPrimary} disabled={!userId} onClick={() => { setForm(emptyLead()); setModal("add"); }}>
              <Plus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        }
      />

      {!userId ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to view and manage your CRM leads.
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      <EmployeeStatGrid>
        <EmployeeStatCard label="Total leads" value={String(stats.total)} note={`£${stats.pipelineGbp.toLocaleString()} pipeline`} icon={<Target className="h-5 w-5" />} />
        <EmployeeStatCard label="Follow-ups today" value={String(stats.followUpsToday)} note={`${stats.overdue} overdue`} icon={<Bell className="h-5 w-5" />} />
        <EmployeeStatCard label="Hot leads" value={String(stats.hot)} note="Interested + negotiation" icon={<Trophy className="h-5 w-5" />} />
        <EmployeeStatCard label="Won this month" value={String(stats.wonThisMonth)} note="Closed deals" icon={<Trophy className="h-5 w-5" />} />
      </EmployeeStatGrid>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <FollowUpQueue title="Due Today" leads={dueToday} tone="amber" onSelect={setSelectedId} selectedId={selectedId} />
        <FollowUpQueue title="Overdue" leads={overdue} tone="red" onSelect={setSelectedId} selectedId={selectedId} />
        <FollowUpQueue title="No follow-up set" leads={noFollowUp} tone="slate" onSelect={setSelectedId} selectedId={selectedId} />
      </div>

      <EmployeePanel className="mt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search company, contact, region…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemindersOn(true)}
              className={btnSecondary}
            >
              <Bell className="h-3.5 w-3.5" /> Enable Reminders
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Type" value={filters.type} onChange={(v) => setFilters({ ...filters, type: v as LeadFilters["type"] })} options={[{ value: "all", label: "All types" }, ...LEAD_TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
            <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={[{ value: "all", label: "All status" }, ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))]} />
            <FilterSelect label="Follow-up" value={filters.followUp} onChange={(v) => setFilters({ ...filters, followUp: v as LeadFilters["followUp"] })} options={[{ value: "all", label: "All" }, { value: "today", label: "Today" }, { value: "overdue", label: "Overdue" }, { value: "week", label: "This week" }, { value: "none", label: "No date" }]} />
            <FilterSelect label="Region" value={filters.region} onChange={(v) => setFilters({ ...filters, region: v })} options={[{ value: "all", label: "All regions" }, ...UK_REGIONS.map((r) => ({ value: r, label: r }))]} />
            <FilterSelect label="Source" value={filters.source} onChange={(v) => setFilters({ ...filters, source: v })} options={[{ value: "all", label: "All sources" }, ...LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label }))]} />
          </div>
        </div>
      </EmployeePanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <EmployeeTableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Follow-up</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Loading CRM…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No leads match filters.</td></tr>
              ) : (
                filtered.map((lead) => {
                  const fb = followUpBadge(lead.next_follow_up);
                  const tel = phoneTelHref(lead.contact_phone);
                  const wa = whatsAppHref(lead.contact_phone);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className={cn(
                        "cursor-pointer transition hover:bg-slate-50/80",
                        selectedId === lead.id && "bg-blue-50/60 ring-1 ring-inset ring-blue-200",
                        isFollowUpOverdue(lead.next_follow_up) && lead.status !== "won" && lead.status !== "lost" && "bg-red-50/30"
                      )}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{lead.company_name}</p>
                        {lead.region ? <p className="text-xs text-slate-400">{lead.region}</p> : null}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-800">{lead.contact_name ?? "—"}</p>
                        <p className="text-xs text-slate-500">{lead.contact_phone ?? lead.contact_email ?? ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-700">
                          {LEAD_TYPES.find((t) => t.value === lead.lead_type)?.label ?? "Carrier"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {lead.value_gbp ? `£${Number(lead.value_gbp).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          disabled={!userId}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as EmployeeLead["status"])}
                          className={cn("rounded-full border-0 px-2.5 py-1 text-[11px] font-bold capitalize disabled:opacity-50", leadStatusTone(lead.status))}
                        >
                          {LEAD_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", fb.tone)}>{fb.label}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {tel ? <a href={tel} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100" title="Call">📞</a> : null}
                          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-50 p-1.5 hover:bg-green-100" title="WhatsApp">💬</a> : null}
                          {lead.linkedin_url ? <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-50 p-1.5 hover:bg-blue-100" title="LinkedIn">in</a> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </EmployeeTableShell>

        {selected ? (
          <EmployeeLeadsDetailPanel
            lead={selected}
            activities={activities}
            commissionRate={commissionRate}
            onEdit={() => openEdit(selected)}
            onLogCall={() => { setCallNote(""); setModal("call"); }}
            onSendEmail={() => { applyEmailTemplate("intro", selected); setModal("email"); }}
            onScheduleFollowUp={() => { setForm({ next_follow_up: selected.next_follow_up ?? "" }); setModal("followup"); }}
            onStatusChange={(status) => handleStatusChange(selected.id, status)}
          />
        ) : (
          <EmployeePanel className="sticky top-24 flex h-fit flex-col items-center justify-center py-16 text-center">
            <Target className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Select a lead</p>
            <p className="mt-1 text-xs text-slate-500">View timeline, call, email, and edit details.</p>
          </EmployeePanel>
        )}
      </div>

      <LeadFormModal open={modal === "add"} title="Add Lead" form={form} setForm={setForm} saving={saving} onSave={() => saveLead(false)} onClose={() => setModal(null)} btnPrimary={btnPrimary} />
      <LeadFormModal open={modal === "edit"} title="Edit Lead" form={form} setForm={setForm} saving={saving} onSave={() => saveLead(true)} onClose={() => setModal(null)} btnPrimary={btnPrimary} />

      <EmployeeModal open={modal === "duplicate"} onClose={() => setModal(null)} title="Possible duplicate">
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              <strong>{duplicateLead?.company_name}</strong> already exists
              {duplicateLead?.contact_phone ? ` (${duplicateLead.contact_phone})` : ""}.
            </p>
          </div>
          <button type="button" className={`${btnPrimary} w-full justify-center`} onClick={() => { setModal(null); if (duplicateLead) setSelectedId(duplicateLead.id); }}>
            View existing lead
          </button>
        </div>
      </EmployeeModal>

      <EmployeeModal open={modal === "call"} onClose={() => { setModal(null); setCallNote(""); }} title={`Log Call — ${selected?.company_name ?? ""}`}>
        <div className="space-y-4">
          <textarea rows={4} placeholder="Outcome, next steps…" value={callNote} onChange={(e) => setCallNote(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId || !callNote.trim() || !selected} onClick={async () => {
            if (!selected || !userId) return;
            await logActivity(selected.id, "call", callNote.trim());
            if (selected.status === "new") await updateLead(selected.id, { status: "contacted" }, false);
            setCallNote(""); setModal(null);
          }}>Save Call Log</button>
        </div>
      </EmployeeModal>

      <EmployeeModal open={modal === "email"} onClose={() => setModal(null)} title={`Send Email — ${selected?.company_name ?? ""}`} wide>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Template</label>
            <select value={emailTemplate} onChange={(e) => selected && applyEmailTemplate(e.target.value, selected)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              {LEAD_EMAIL_TEMPLATES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
            </select>
          </div>
          <p className="text-sm text-slate-600">To: <span className="font-semibold">{selected?.contact_email ?? "No email"}</span></p>
          <textarea rows={8} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <a href={selected?.contact_email ? `mailto:${selected.contact_email}?subject=${encodeURIComponent(`Alpha Freight — ${selected.company_name}`)}&body=${encodeURIComponent(emailBody)}` : undefined} className={`${btnPrimary} w-full justify-center ${!selected?.contact_email ? "pointer-events-none opacity-50" : ""}`} onClick={async () => { if (selected && userId) { await logActivity(selected.id, "email", `Email sent (${LEAD_EMAIL_TEMPLATES.find((t) => t.id === emailTemplate)?.label ?? "custom"})`); setModal(null); } }}>
            Open in Email App
          </a>
        </div>
      </EmployeeModal>

      <EmployeeModal open={modal === "followup"} onClose={() => setModal(null)} title={`Schedule Follow-up — ${selected?.company_name ?? ""}`}>
        <div className="space-y-4">
          <input type="date" value={form.next_follow_up ?? ""} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId || !form.next_follow_up || !selected} onClick={async () => {
            if (!selected || !form.next_follow_up || !userId) return;
            await updateLead(selected.id, { next_follow_up: form.next_follow_up }, false);
            await logActivity(selected.id, "followup", `Follow-up scheduled for ${formatFollowUpLabel(form.next_follow_up)}`);
            setModal(null);
          }}>Save Follow-up</button>
        </div>
      </EmployeeModal>

      <EmployeeModal open={modal === "won"} onClose={() => setModal(null)} title="Deal Won — Commission">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Confirm deal value for <strong>{selected?.company_name}</strong>. Commission record will be created.</p>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Deal value (£)</label>
            <input type="number" value={wonValue} onChange={(e) => setWonValue(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Est. commission ({commissionRate}%): £{estimateCommission(Number(wonValue) || 0, commissionRate).toLocaleString()}
          </p>
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId} onClick={confirmWonCommission}>Confirm Won & Create Commission</button>
        </div>
      </EmployeeModal>

      <EmployeeModal open={modal === "import"} onClose={() => setModal(null)} title="Import CSV" wide>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Columns: company_name, contact_name, contact_email, contact_phone, lead_type, status, value_gbp, region, lead_source</p>
          <textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"company_name,contact_name,contact_phone,lead_type,region\nNew Haul Ltd,Tom,+447700900111,carrier,Birmingham"} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs" />
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId || !importText.trim()} onClick={handleImport}>Import Leads</button>
        </div>
      </EmployeeModal>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700" aria-label={label}>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

function LeadFormModal({ open, title, form, setForm, saving, onSave, onClose, btnPrimary }: {
  open: boolean; title: string; form: Partial<EmployeeLead>; setForm: (f: Partial<EmployeeLead>) => void;
  saving: boolean; onSave: () => void; onClose: () => void; btnPrimary: string;
}) {
  return (
    <EmployeeModal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4">
        <Field label="Company *" value={form.company_name ?? ""} onChange={(v) => setForm({ ...form, company_name: v })} />
        <Field label="Contact name" value={form.contact_name ?? ""} onChange={(v) => setForm({ ...form, contact_name: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={form.contact_email ?? ""} onChange={(v) => setForm({ ...form, contact_email: v })} />
          <Field label="Phone" value={form.contact_phone ?? ""} onChange={(v) => setForm({ ...form, contact_phone: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deal value (£)" value={form.value_gbp != null ? String(form.value_gbp) : ""} onChange={(v) => setForm({ ...form, value_gbp: v ? Number(v) : null })} type="number" />
          <Field label="LinkedIn URL" value={form.linkedin_url ?? ""} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Type" value={form.lead_type ?? "carrier"} onChange={(v) => setForm({ ...form, lead_type: v as EmployeeLead["lead_type"] })} options={LEAD_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <SelectField label="Status" value={form.status ?? "new"} onChange={(v) => setForm({ ...form, status: v as EmployeeLead["status"] })} options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Region" value={form.region ?? ""} onChange={(v) => setForm({ ...form, region: v })} options={[{ value: "", label: "—" }, ...UK_REGIONS.map((r) => ({ value: r, label: r }))]} />
          <SelectField label="Source" value={form.lead_source ?? "cold_call"} onChange={(v) => setForm({ ...form, lead_source: v as EmployeeLead["lead_source"] })} options={LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Next follow-up</label>
          <input type="date" value={form.next_follow_up ?? ""} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Notes</label>
          <textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={saving || !form.company_name?.trim()} onClick={onSave}>Save Lead</button>
      </div>
    </EmployeeModal>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}
