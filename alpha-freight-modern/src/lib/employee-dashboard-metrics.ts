import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";
import type {
  EmployeeCall,
  EmployeeCommission,
  EmployeeLead,
  EmployeeTask,
} from "@/lib/employee-types";
import { CALL_DAILY_TARGET, computeCallStats } from "@/lib/employee-calls-utils";

export type DayBucket = { label: string; date: string; calls: number; outbound: number; connected: number };

export type LeadPipelinePoint = { status: string; label: string; count: number; value: number; fill: string };

export type CommissionMonthPoint = { month: string; pending: number; approved: number; paid: number; total: number };

export type DashboardStats = {
  openTasks: number;
  highPriorityTasks: number;
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionPct: number;
  activeLeads: number;
  newLeadsWeek: number;
  pipelineValue: number;
  wonValue: number;
  dueTodayLeads: number;
  overdueLeads: number;
  callsToday: number;
  callsWeek: number;
  callTargetPct: number;
  talkMinutesToday: number;
  connectedToday: number;
  commissionPending: number;
  commissionApproved: number;
  commissionPaidMonth: number;
  commissionTotalMonth: number;
  performanceScore: number;
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  meeting_booked: "Meeting",
  negotiation: "Negotiation",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#6366f1",
  interested: "#818cf8",
  meeting_booked: "#4f46e5",
  negotiation: "#7c3aed",
  qualified: "#0ea5e9",
  won: "#059669",
  lost: "#cbd5e1",
};

const PIPELINE_ORDER = [
  "new",
  "contacted",
  "interested",
  "meeting_booked",
  "negotiation",
  "qualified",
  "won",
  "lost",
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isThisWeek(iso: string): boolean {
  const d = parseISO(iso);
  const weekAgo = subDays(new Date(), 7);
  return d >= weekAgo;
}

export function buildCallsTrend(calls: EmployeeCall[], days = 7): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = startOfDay(subDays(new Date(), i));
    const dateStr = format(day, "yyyy-MM-dd");
    const dayCalls = calls.filter((c) => isSameDay(parseISO(c.called_at), day));
    buckets.push({
      label: format(day, "EEE"),
      date: dateStr,
      calls: dayCalls.length,
      outbound: dayCalls.filter((c) => c.direction === "outbound").length,
      connected: dayCalls.filter((c) =>
        /connected|qualified|callback|meeting|booked/i.test(c.outcome ?? "")
      ).length,
    });
  }
  return buckets;
}

export function buildLeadPipeline(leads: EmployeeLead[]): LeadPipelinePoint[] {
  const counts = new Map<string, { count: number; value: number }>();
  for (const status of PIPELINE_ORDER) {
    counts.set(status, { count: 0, value: 0 });
  }
  for (const lead of leads) {
    const key = lead.status in LEAD_STATUS_LABELS ? lead.status : "new";
    const cur = counts.get(key) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(lead.value_gbp ?? 0);
    counts.set(key, cur);
  }
  return PIPELINE_ORDER.filter((s) => (counts.get(s)?.count ?? 0) > 0).map((status) => ({
    status,
    label: LEAD_STATUS_LABELS[status] ?? status,
    count: counts.get(status)?.count ?? 0,
    value: counts.get(status)?.value ?? 0,
    fill: LEAD_STATUS_COLORS[status] ?? "#64748b",
  }));
}

export function buildCommissionTrend(commissions: EmployeeCommission[], months = 6): CommissionMonthPoint[] {
  const buckets: CommissionMonthPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, "yyyy-MM");
    const monthLabel = format(d, "MMM yy");
    const monthRows = commissions.filter((c) => (c.period_month ?? c.created_at).slice(0, 7) === key);

    const pending = monthRows.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount_gbp), 0);
    const approved = monthRows.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.amount_gbp), 0);
    const paid = monthRows.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount_gbp), 0);

    buckets.push({
      month: monthLabel,
      pending,
      approved,
      paid,
      total: pending + approved + paid,
    });
  }

  return buckets;
}

export function getDueTodayLeads(leads: EmployeeLead[]): EmployeeLead[] {
  const today = todayStr();
  return leads.filter(
    (l) => l.next_follow_up === today && !["won", "lost"].includes(l.status)
  );
}

export function getOverdueLeads(leads: EmployeeLead[]): EmployeeLead[] {
  const today = todayStr();
  return leads.filter(
    (l) =>
      l.next_follow_up &&
      l.next_follow_up < today &&
      !["won", "lost"].includes(l.status)
  );
}

export function computePerformanceScore(stats: {
  callTargetPct: number;
  taskCompletionPct: number;
  followUpHealthPct: number;
  pipelineActivePct: number;
  hasActivity: boolean;
}): number {
  if (!stats.hasActivity) return 0;
  const score =
    stats.callTargetPct * 0.35 +
    stats.taskCompletionPct * 0.3 +
    stats.followUpHealthPct * 0.2 +
    stats.pipelineActivePct * 0.15;
  return Math.min(100, Math.round(score));
}

export function hasEmployeeDashboardData(
  tasks: EmployeeTask[],
  leads: EmployeeLead[],
  calls: EmployeeCall[],
  commissions: EmployeeCommission[]
): boolean {
  return tasks.length > 0 || leads.length > 0 || calls.length > 0 || commissions.length > 0;
}

export function computeDashboardStats(
  tasks: EmployeeTask[],
  leads: EmployeeLead[],
  calls: EmployeeCall[],
  commissions: EmployeeCommission[]
): DashboardStats {
  const callStats = computeCallStats(calls);
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status));
  const pipelineValue = activeLeads.reduce((s, l) => s + Number(l.value_gbp ?? 0), 0);
  const wonValue = leads.filter((l) => l.status === "won").reduce((s, l) => s + Number(l.value_gbp ?? 0), 0);
  const dueToday = getDueTodayLeads(leads).length;
  const overdue = getOverdueLeads(leads).length;
  const followUpHealthPct =
    activeLeads.length === 0
      ? 100
      : Math.round(((activeLeads.length - overdue) / activeLeads.length) * 100);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthCommissions = commissions.filter(
    (c) => (c.period_month ?? c.created_at).slice(0, 7) === currentMonth
  );

  const taskCompletionPct =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  const pipelineActivePct = Math.min(
    100,
    Math.round((activeLeads.filter((l) => l.status !== "new").length / Math.max(activeLeads.length, 1)) * 100)
  );

  const performanceScore = computePerformanceScore({
    callTargetPct: callStats.dailyTargetPct,
    taskCompletionPct,
    followUpHealthPct,
    pipelineActivePct,
    hasActivity: hasEmployeeDashboardData(tasks, leads, calls, commissions),
  });

  return {
    openTasks: openTasks.length,
    highPriorityTasks: openTasks.filter((t) => t.priority === "high").length,
    tasksCompleted: completedTasks.length,
    tasksTotal: tasks.length,
    taskCompletionPct,
    activeLeads: activeLeads.length,
    newLeadsWeek: leads.filter((l) => l.status === "new" && isThisWeek(l.created_at)).length,
    pipelineValue,
    wonValue,
    dueTodayLeads: dueToday,
    overdueLeads: overdue,
    callsToday: callStats.today,
    callsWeek: callStats.week,
    callTargetPct: callStats.dailyTargetPct,
    talkMinutesToday: callStats.talkMinutesToday,
    connectedToday: callStats.connectedToday,
    commissionPending: commissions
      .filter((c) => c.status === "pending")
      .reduce((s, c) => s + Number(c.amount_gbp), 0),
    commissionApproved: commissions
      .filter((c) => c.status === "approved")
      .reduce((s, c) => s + Number(c.amount_gbp), 0),
    commissionPaidMonth: monthCommissions
      .filter((c) => c.status === "paid")
      .reduce((s, c) => s + Number(c.amount_gbp), 0),
    commissionTotalMonth: monthCommissions.reduce((s, c) => s + Number(c.amount_gbp), 0),
    performanceScore,
  };
}

export { CALL_DAILY_TARGET };
