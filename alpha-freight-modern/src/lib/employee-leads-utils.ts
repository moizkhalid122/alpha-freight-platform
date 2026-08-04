import type { EmployeeLead } from "@/lib/employee-types";
import { formatFollowUpLabel } from "@/lib/employee-leads";

export const LEAD_SOURCES = [
  { value: "cold_call", label: "Cold Call" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "admin_assigned", label: "Admin Assigned" },
  { value: "other", label: "Other" },
] as const;

export const UK_REGIONS = [
  "London",
  "Birmingham",
  "Manchester",
  "Leeds",
  "Glasgow",
  "Liverpool",
  "Bristol",
  "Sheffield",
  "Newcastle",
  "Nottingham",
  "Southampton",
  "Other",
];

export const LEAD_EMAIL_TEMPLATES = [
  {
    id: "intro",
    label: "Intro Email",
    body: (lead: EmployeeLead) =>
      `Hi ${lead.contact_name ?? "there"},\n\nI'm reaching out from Alpha Freight — we connect UK carriers and suppliers on a modern freight platform with fast payouts and live load matching.\n\nWould you have 10 minutes this week for a quick call?\n\nBest regards`,
  },
  {
    id: "followup",
    label: "Follow-up",
    body: (lead: EmployeeLead) =>
      `Hi ${lead.contact_name ?? "there"},\n\nJust following up on my previous message about Alpha Freight services for ${lead.company_name}.\n\nHappy to share pricing and a quick platform demo at your convenience.\n\nBest regards`,
  },
  {
    id: "proposal",
    label: "Proposal",
    body: (lead: EmployeeLead) =>
      `Hi ${lead.contact_name ?? "there"},\n\nAs discussed, please find attached our proposal for ${lead.company_name}.\n\nDeal value discussed: ${lead.value_gbp ? `£${lead.value_gbp.toLocaleString()}` : "TBC"}\n\nLet me know if you'd like to proceed or have any questions.\n\nBest regards`,
  },
  {
    id: "carrier-script",
    label: "Carrier Script Email",
    body: (lead: EmployeeLead) =>
      `Hi ${lead.contact_name ?? "there"},\n\nAlpha Freight helps carriers find verified UK loads, bid competitively, and get paid in 7 days.\n\nI'd love to show you how ${lead.company_name} could fill empty miles on your routes.\n\nBest regards`,
  },
  {
    id: "supplier-script",
    label: "Supplier Script Email",
    body: (lead: EmployeeLead) =>
      `Hi ${lead.contact_name ?? "there"},\n\nAlpha Freight gives suppliers instant access to verified carriers, live tracking, and flexible payment options.\n\nCan we schedule a 15-minute demo for ${lead.company_name}?\n\nBest regards`,
  },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export function isFollowUpToday(dateStr: string | null | undefined): boolean {
  return dateStr === todayStr();
}

export function isFollowUpOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr < todayStr();
}

export function isFollowUpThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (7 - now.getDay()));
  return d >= now && d <= weekEnd;
}

export function isHotLead(status: string): boolean {
  return ["interested", "meeting_booked", "negotiation"].includes(status);
}

export function isWonThisMonth(lead: EmployeeLead): boolean {
  if (lead.status !== "won") return false;
  const d = new Date(lead.created_at);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export type LeadStats = {
  total: number;
  followUpsToday: number;
  overdue: number;
  hot: number;
  wonThisMonth: number;
  pipelineGbp: number;
  noFollowUp: number;
};

export function computeLeadStats(leads: EmployeeLead[]): LeadStats {
  const active = leads.filter((l) => !["won", "lost"].includes(l.status));
  return {
    total: leads.length,
    followUpsToday: leads.filter((l) => isFollowUpToday(l.next_follow_up) && l.status !== "won" && l.status !== "lost").length,
    overdue: leads.filter((l) => isFollowUpOverdue(l.next_follow_up) && l.status !== "won" && l.status !== "lost").length,
    hot: leads.filter((l) => isHotLead(l.status)).length,
    wonThisMonth: leads.filter(isWonThisMonth).length,
    pipelineGbp: active.reduce((s, l) => s + Number(l.value_gbp ?? 0), 0),
    noFollowUp: leads.filter((l) => !l.next_follow_up && !["won", "lost"].includes(l.status)).length,
  };
}

export type LeadFilters = {
  search: string;
  type: "all" | "carrier" | "supplier";
  status: string;
  followUp: "all" | "today" | "overdue" | "week" | "none";
  region: string;
  source: string;
};

export function filterLeads(leads: EmployeeLead[], f: LeadFilters): EmployeeLead[] {
  const q = f.search.trim().toLowerCase();
  return leads.filter((l) => {
    if (f.type !== "all" && l.lead_type !== f.type) return false;
    if (f.status !== "all" && l.status !== f.status) return false;
    if (f.region !== "all" && (l.region ?? "") !== f.region) return false;
    if (f.source !== "all" && (l.lead_source ?? "") !== f.source) return false;
    if (f.followUp === "today" && !isFollowUpToday(l.next_follow_up)) return false;
    if (f.followUp === "overdue" && !isFollowUpOverdue(l.next_follow_up)) return false;
    if (f.followUp === "week" && !isFollowUpThisWeek(l.next_follow_up)) return false;
    if (f.followUp === "none" && l.next_follow_up) return false;
    if (q) {
      const hay = [l.company_name, l.contact_name, l.contact_email, l.contact_phone, l.region]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function normalizeCompany(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export function findDuplicateLead(leads: EmployeeLead[], candidate: Partial<EmployeeLead>, excludeId?: string): EmployeeLead | null {
  const company = normalizeCompany(candidate.company_name ?? "");
  const phone = normalizePhone(candidate.contact_phone);
  for (const l of leads) {
    if (excludeId && l.id === excludeId) continue;
    if (company && normalizeCompany(l.company_name) === company) return l;
    if (phone && normalizePhone(l.contact_phone) === phone) return l;
  }
  return null;
}

export function phoneTelHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function whatsAppHref(phone: string | null | undefined): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const uk = digits.startsWith("44") ? digits : digits.startsWith("0") ? `44${digits.slice(1)}` : digits;
  return `https://wa.me/${uk}`;
}

export function estimateCommission(valueGbp: number | null, ratePct = 8): number {
  return Math.round(Number(valueGbp ?? 0) * (ratePct / 100));
}

export function leadsToCsv(leads: EmployeeLead[]): string {
  const headers = [
    "company_name",
    "contact_name",
    "contact_email",
    "contact_phone",
    "lead_type",
    "status",
    "value_gbp",
    "next_follow_up",
    "region",
    "lead_source",
    "linkedin_url",
    "notes",
  ];
  const rows = leads.map((l) =>
    headers
      .map((h) => {
        const v = l[h as keyof EmployeeLead];
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseLeadsCsv(text: string, employeeId: string): EmployeeLead[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const leads: EmployeeLead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    if (!row.company_name) continue;
    leads.push({
      id: `imp_${Date.now()}_${i}`,
      employee_id: employeeId,
      company_name: row.company_name,
      contact_name: row.contact_name || null,
      contact_email: row.contact_email || null,
      contact_phone: row.contact_phone || null,
      lead_type: (row.lead_type as EmployeeLead["lead_type"]) || "carrier",
      status: (row.status as EmployeeLead["status"]) || "new",
      value_gbp: row.value_gbp ? Number(row.value_gbp) : null,
      next_follow_up: row.next_follow_up || null,
      region: row.region || null,
      lead_source: (row.lead_source as EmployeeLead["lead_source"]) || "other",
      linkedin_url: row.linkedin_url || null,
      notes: row.notes || null,
      created_at: new Date().toISOString(),
    });
  }
  return leads;
}

export function followUpBadge(dateStr: string | null | undefined): { label: string; tone: string } {
  if (!dateStr) return { label: "No date", tone: "bg-slate-100 text-slate-500" };
  if (isFollowUpOverdue(dateStr)) return { label: `Overdue · ${formatFollowUpLabel(dateStr)}`, tone: "bg-red-50 text-red-700" };
  if (isFollowUpToday(dateStr)) return { label: "Due Today", tone: "bg-amber-50 text-amber-700" };
  return { label: formatFollowUpLabel(dateStr), tone: "bg-slate-100 text-slate-600" };
}

export function requestFollowUpReminder(leads: EmployeeLead[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const due = leads.filter((l) => isFollowUpToday(l.next_follow_up) && !["won", "lost"].includes(l.status));
  const overdue = leads.filter((l) => isFollowUpOverdue(l.next_follow_up) && !["won", "lost"].includes(l.status));
  if (due.length === 0 && overdue.length === 0) return;

  const notify = () => {
    const parts: string[] = [];
    if (due.length) parts.push(`${due.length} follow-up(s) due today`);
    if (overdue.length) parts.push(`${overdue.length} overdue`);
    new Notification("Alpha Freight CRM", { body: parts.join(" · ") });
  };

  if (Notification.permission === "granted") notify();
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((p) => {
      if (p === "granted") notify();
    });
  }
}
