import type { EmployeeCall } from "@/lib/employee-types";

export const CALL_OUTCOMES = [
  { value: "connected", label: "Connected — spoke to decision maker" },
  { value: "voicemail", label: "Voicemail left" },
  { value: "no_answer", label: "No answer" },
  { value: "callback", label: "Callback scheduled" },
  { value: "qualified", label: "Qualified — next step agreed" },
  { value: "not_interested", label: "Not interested" },
  { value: "wrong_number", label: "Wrong number" },
  { value: "gatekeeper", label: "Gatekeeper — follow up needed" },
  { value: "meeting_booked", label: "Meeting / demo booked" },
  { value: "general", label: "General enquiry handled" },
] as const;

export const CALL_DAILY_TARGET = 50;

const todayStr = () => new Date().toISOString().slice(0, 10);

export function isCallToday(calledAt: string): boolean {
  return calledAt.slice(0, 10) === todayStr();
}

export function isCallThisWeek(calledAt: string): boolean {
  const d = new Date(calledAt);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  return d >= weekAgo;
}

export type CallStats = {
  today: number;
  week: number;
  total: number;
  outboundToday: number;
  inboundToday: number;
  talkMinutesToday: number;
  talkMinutesWeek: number;
  connectedToday: number;
  dailyTargetPct: number;
};

export function computeCallStats(calls: EmployeeCall[]): CallStats {
  const todayCalls = calls.filter((c) => isCallToday(c.called_at));
  const weekCalls = calls.filter((c) => isCallThisWeek(c.called_at));
  const connectedToday = todayCalls.filter((c) =>
    ["connected", "qualified", "callback", "meeting_booked"].some((k) =>
      (c.outcome ?? "").toLowerCase().includes(k.replace(/_/g, " "))
    ) || (c.outcome ?? "").toLowerCase().includes("connected")
  ).length;

  return {
    today: todayCalls.length,
    week: weekCalls.length,
    total: calls.length,
    outboundToday: todayCalls.filter((c) => c.direction === "outbound").length,
    inboundToday: todayCalls.filter((c) => c.direction === "inbound").length,
    talkMinutesToday: todayCalls.reduce((s, c) => s + (c.duration_minutes ?? 0), 0),
    talkMinutesWeek: weekCalls.reduce((s, c) => s + (c.duration_minutes ?? 0), 0),
    connectedToday,
    dailyTargetPct: Math.min(100, Math.round((todayCalls.length / CALL_DAILY_TARGET) * 100)),
  };
}

export type CallFilters = {
  search: string;
  direction: "all" | "inbound" | "outbound";
  outcome: string;
  period: "all" | "today" | "week";
  callType: string;
};

export function filterCalls(calls: EmployeeCall[], f: CallFilters, leadNames: Map<string, string>): EmployeeCall[] {
  const q = f.search.trim().toLowerCase();
  return calls.filter((c) => {
    if (f.direction !== "all" && c.direction !== f.direction) return false;
    if (f.period === "today" && !isCallToday(c.called_at)) return false;
    if (f.period === "week" && !isCallThisWeek(c.called_at)) return false;
    if (f.outcome !== "all" && !(c.outcome ?? "").toLowerCase().includes(f.outcome.replace(/_/g, " "))) return false;
    if (f.callType !== "all" && c.call_type !== f.callType) return false;
    if (q) {
      const company = c.company_name ?? (c.lead_id ? leadNames.get(c.lead_id) : "") ?? "";
      const hay = [company, c.outcome, c.notes, c.contact_phone].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function callsToCsv(calls: EmployeeCall[], leadNames: Map<string, string>): string {
  const headers = ["called_at", "direction", "company", "duration_minutes", "outcome", "notes", "contact_phone"];
  const rows = calls.map((c) => {
    const company = c.company_name ?? (c.lead_id ? leadNames.get(c.lead_id) : "") ?? "";
    return [c.called_at, c.direction, company, c.duration_minutes ?? "", c.outcome ?? "", c.notes ?? "", c.contact_phone ?? ""]
      .map((v) => {
        const s = String(v);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCallsCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function outcomeTone(outcome: string | null): string {
  const o = (outcome ?? "").toLowerCase();
  if (o.includes("qualified") || o.includes("meeting") || o.includes("connected")) return "bg-emerald-50 text-emerald-700";
  if (o.includes("callback") || o.includes("voicemail")) return "bg-amber-50 text-amber-700";
  if (o.includes("not interested") || o.includes("wrong")) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export function formatCallDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
