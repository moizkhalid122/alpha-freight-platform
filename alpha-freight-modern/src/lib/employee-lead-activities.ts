import type { EmployeeLead, LeadActivity } from "@/lib/employee-types";

const ACT_KEY = "af_lead_activities";

function storageKey(userId: string) {
  return `${ACT_KEY}_${userId}`;
}

export function loadLeadActivities(userId: string, leadId: string): LeadActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(storageKey(userId)) || "{}") as Record<string, LeadActivity[]>;
    return (all[leadId] ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export function loadAllLeadActivities(userId: string): Record<string, LeadActivity[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function appendLeadActivity(
  userId: string,
  leadId: string,
  activity: Omit<LeadActivity, "id" | "lead_id" | "created_at"> & { created_at?: string }
): LeadActivity {
  const entry: LeadActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lead_id: leadId,
    activity_type: activity.activity_type,
    summary: activity.summary,
    created_at: activity.created_at ?? new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const all = loadAllLeadActivities(userId);
    all[leadId] = [entry, ...(all[leadId] ?? [])];
    localStorage.setItem(storageKey(userId), JSON.stringify(all));
  }

  return entry;
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function lastActivityLabel(lead: EmployeeLead, activities: LeadActivity[]): string {
  if (activities[0]) return formatActivityTime(activities[0].created_at);
  if (lead.last_activity_at) return formatActivityTime(lead.last_activity_at);
  return "No activity";
}
