export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export const LEAD_TYPES = [
  { value: "carrier", label: "Carrier" },
  { value: "supplier", label: "Supplier" },
] as const;

export type LeadType = (typeof LEAD_TYPES)[number]["value"];

export function formatFollowUpLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) {
    return d.toLocaleDateString("en-GB", { weekday: "long" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function leadStatusTone(status: string): string {
  switch (status) {
    case "won":
      return "bg-emerald-50 text-emerald-700";
    case "lost":
      return "bg-red-50 text-red-700";
    case "interested":
    case "meeting_booked":
    case "negotiation":
      return "bg-blue-50 text-blue-700";
    case "contacted":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
