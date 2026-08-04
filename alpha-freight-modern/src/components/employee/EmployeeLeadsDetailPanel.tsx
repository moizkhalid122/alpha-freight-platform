"use client";

import {
  Calendar,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  Phone,
  TrendingUp,
} from "lucide-react";
import type { EmployeeLead, LeadActivity } from "@/lib/employee-types";
import { LEAD_STATUSES, LEAD_TYPES, leadStatusTone } from "@/lib/employee-leads";
import { LEAD_SOURCES, estimateCommission, followUpBadge, phoneTelHref, whatsAppHref } from "@/lib/employee-leads-utils";
import { lastActivityLabel } from "@/lib/employee-lead-activities";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<LeadActivity["activity_type"], string> = {
  call: "📞",
  email: "✉️",
  note: "📝",
  followup: "📅",
  status: "🔄",
  won: "🏆",
  import: "📥",
};

export default function EmployeeLeadsDetailPanel({
  lead,
  activities,
  commissionRate,
  onEdit,
  onLogCall,
  onSendEmail,
  onScheduleFollowUp,
  onStatusChange,
}: {
  lead: EmployeeLead;
  activities: LeadActivity[];
  commissionRate: number;
  onEdit: () => void;
  onLogCall: () => void;
  onSendEmail: () => void;
  onScheduleFollowUp: () => void;
  onStatusChange: (status: EmployeeLead["status"]) => void;
}) {
  const tel = phoneTelHref(lead.contact_phone);
  const wa = whatsAppHref(lead.contact_phone);
  const fb = followUpBadge(lead.next_follow_up);

  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{lead.company_name}</h3>
            <p className="text-sm text-slate-500">{lead.contact_name ?? "No contact"}</p>
          </div>
          <button type="button" onClick={onEdit} className="text-xs font-bold text-blue-600 hover:underline">
            Edit
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", leadStatusTone(lead.status))}>
            {lead.status.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-700">
            {LEAD_TYPES.find((t) => t.value === lead.lead_type)?.label ?? "Carrier"}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", fb.tone)}>{fb.label}</span>
        </div>

        {lead.value_gbp ? (
          <p className="mt-3 text-2xl font-bold text-slate-900">£{Number(lead.value_gbp).toLocaleString()}</p>
        ) : null}

        {lead.status === "won" && lead.value_gbp ? (
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            Est. commission ({commissionRate}%): £{estimateCommission(lead.value_gbp, commissionRate).toLocaleString()}
          </p>
        ) : null}

        <dl className="mt-4 space-y-2 text-sm">
          {lead.contact_phone ? (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Phone</dt>
              <dd className="font-medium text-slate-800">{lead.contact_phone}</dd>
            </div>
          ) : null}
          {lead.contact_email ? (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Email</dt>
              <dd className="truncate font-medium text-slate-800">{lead.contact_email}</dd>
            </div>
          ) : null}
          {lead.region ? (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Region</dt>
              <dd className="font-medium text-slate-800">{lead.region}</dd>
            </div>
          ) : null}
          {lead.lead_source ? (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Source</dt>
              <dd className="font-medium text-slate-800">
                {LEAD_SOURCES.find((s) => s.value === lead.lead_source)?.label ?? lead.lead_source}
              </dd>
            </div>
          ) : null}
          {lead.assigned_by_name ? (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Assigned by</dt>
              <dd className="font-medium text-blue-600">{lead.assigned_by_name}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt className="text-slate-400">Last activity</dt>
            <dd className="font-medium text-slate-800">{lastActivityLabel(lead, activities)}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {tel ? (
            <a href={tel} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          ) : null}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-green-50 py-2.5 text-xs font-bold text-green-700 hover:bg-green-100">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          ) : null}
          <button type="button" onClick={onLogCall} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Phone className="h-3.5 w-3.5" /> Log Call
          </button>
          <button type="button" onClick={onSendEmail} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          {lead.linkedin_url ? (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
              <Link2 className="h-3.5 w-3.5" /> LinkedIn Profile
            </a>
          ) : null}
          <button type="button" onClick={onScheduleFollowUp} className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Calendar className="h-3.5 w-3.5" /> Schedule Follow-up
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(e.target.value as EmployeeLead["status"])}
            className={cn("w-full rounded-xl px-3 py-2 text-sm font-bold capitalize", leadStatusTone(lead.status))}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity Timeline</h4>
        </div>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet — log a call or send an email.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="shrink-0 text-base">{ACTIVITY_ICONS[a.activity_type]}</span>
                <div>
                  <p className="text-slate-800">{a.summary}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lead.notes ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{lead.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FollowUpQueue({
  title,
  leads,
  tone,
  onSelect,
  selectedId,
}: {
  title: string;
  leads: EmployeeLead[];
  tone: "amber" | "red" | "slate";
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (!leads.length) return null;
  const colors = {
    amber: "border-amber-200 bg-amber-50/60",
    red: "border-red-200 bg-red-50/60",
    slate: "border-slate-200 bg-slate-50/60",
  };

  return (
    <div className={cn("rounded-xl border p-4", colors[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title} ({leads.length})</p>
      <ul className="mt-2 space-y-1">
        {leads.slice(0, 5).map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-left text-sm font-semibold transition hover:bg-white/80",
                selectedId === l.id && "bg-white ring-1 ring-blue-200"
              )}
            >
              {l.company_name}
              <span className="ml-2 text-xs font-normal text-slate-500">{l.contact_name}</span>
            </button>
          </li>
        ))}
      </ul>
      {leads.length > 5 ? <p className="mt-1 text-xs text-slate-400">+{leads.length - 5} more in table</p> : null}
    </div>
  );
}

export function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}
