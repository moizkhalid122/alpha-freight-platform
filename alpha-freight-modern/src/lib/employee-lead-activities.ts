import { supabase } from "@/lib/supabase";
import type { LeadActivity } from "@/lib/employee-types";

const LEGACY_KEY = "af_lead_activities";

function legacyStorageKey(userId: string) {
  return `${LEGACY_KEY}_${userId}`;
}

function rowToActivity(row: {
  id: string;
  lead_id: string;
  activity_type: string;
  summary: string;
  created_at: string;
}): LeadActivity {
  return {
    id: row.id,
    lead_id: row.lead_id,
    activity_type: row.activity_type as LeadActivity["activity_type"],
    summary: row.summary,
    created_at: row.created_at,
  };
}

function loadLegacyActivities(userId: string, leadId: string): LeadActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(legacyStorageKey(userId)) || "{}") as Record<
      string,
      LeadActivity[]
    >;
    return (all[leadId] ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

async function migrateLegacyActivities(userId: string, leadId: string): Promise<void> {
  const legacy = loadLegacyActivities(userId, leadId);
  if (!legacy.length) return;

  const payload = legacy.map((item) => ({
    lead_id: leadId,
    employee_id: userId,
    activity_type: item.activity_type,
    summary: item.summary,
    created_at: item.created_at,
  }));

  const { error } = await supabase.from("employee_lead_activities").insert(payload);
  if (error) {
    console.warn("Legacy activity migration skipped:", error.message);
    return;
  }

  try {
    const all = JSON.parse(localStorage.getItem(legacyStorageKey(userId)) || "{}") as Record<
      string,
      LeadActivity[]
    >;
    delete all[leadId];
    localStorage.setItem(legacyStorageKey(userId), JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export async function loadLeadActivities(userId: string, leadId: string): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from("employee_lead_activities")
    .select("id, lead_id, activity_type, summary, created_at")
    .eq("employee_id", userId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadLeadActivities:", error.message);
    return loadLegacyActivities(userId, leadId);
  }

  if ((data ?? []).length === 0) {
    const legacy = loadLegacyActivities(userId, leadId);
    if (legacy.length) {
      await migrateLegacyActivities(userId, leadId);
      return legacy;
    }
  }

  return (data ?? []).map(rowToActivity);
}

export async function appendLeadActivity(
  userId: string,
  leadId: string,
  activity: Omit<LeadActivity, "id" | "lead_id" | "created_at"> & { created_at?: string }
): Promise<LeadActivity | null> {
  const createdAt = activity.created_at ?? new Date().toISOString();

  const { data, error } = await supabase
    .from("employee_lead_activities")
    .insert({
      lead_id: leadId,
      employee_id: userId,
      activity_type: activity.activity_type,
      summary: activity.summary,
      created_at: createdAt,
    })
    .select("id, lead_id, activity_type, summary, created_at")
    .single();

  if (error) {
    console.error("appendLeadActivity:", error.message);
    return null;
  }

  await supabase
    .from("employee_leads")
    .update({ last_activity_at: createdAt })
    .eq("id", leadId)
    .eq("employee_id", userId);

  return rowToActivity(data);
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function lastActivityLabel(
  lead: { last_activity_at?: string | null },
  activities: LeadActivity[]
): string {
  if (activities[0]) return formatActivityTime(activities[0].created_at);
  if (lead.last_activity_at) return formatActivityTime(lead.last_activity_at);
  return "No activity";
}
