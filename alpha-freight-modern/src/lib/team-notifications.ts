import type {
  EmployeeCommission,
  EmployeeLead,
  EmployeeLeaveRequest,
  EmployeeTask,
} from "@/lib/employee-types";
import { getDueTodayLeads, getOverdueLeads } from "@/lib/employee-dashboard-metrics";
import { employeeRoute } from "@/lib/employee-path";

export type TeamNotificationKind = "lead" | "task" | "commission" | "leave";

export type TeamNotification = {
  id: string;
  kind: TeamNotificationKind;
  title: string;
  message: string;
  href: string;
  tone: "urgent" | "info" | "success";
  createdAt: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function isTaskDue(task: EmployeeTask): boolean {
  if (task.status === "completed") return false;
  if (!task.due_date) return false;
  return task.due_date <= todayStr();
}

export function buildTeamNotifications(input: {
  leads: EmployeeLead[];
  tasks: EmployeeTask[];
  commissions: EmployeeCommission[];
  leaveRequests: EmployeeLeaveRequest[];
}): TeamNotification[] {
  const items: TeamNotification[] = [];

  for (const lead of getOverdueLeads(input.leads)) {
    items.push({
      id: `lead-overdue-${lead.id}`,
      kind: "lead",
      title: "Overdue follow-up",
      message: `${lead.company_name} — follow-up was due ${lead.next_follow_up ?? ""}`,
      href: employeeRoute("/leads"),
      tone: "urgent",
      createdAt: lead.next_follow_up ?? lead.created_at,
    });
  }

  for (const lead of getDueTodayLeads(input.leads)) {
    items.push({
      id: `lead-today-${lead.id}`,
      kind: "lead",
      title: "Follow-up due today",
      message: lead.company_name,
      href: employeeRoute("/leads"),
      tone: "info",
      createdAt: lead.next_follow_up ?? lead.created_at,
    });
  }

  for (const task of input.tasks) {
    if (task.status === "completed") continue;

    if (isTaskDue(task)) {
      items.push({
        id: `task-due-${task.id}`,
        kind: "task",
        title: task.priority === "high" ? "High priority task due" : "Task due",
        message: task.title,
        href: employeeRoute("/tasks"),
        tone: task.priority === "high" ? "urgent" : "info",
        createdAt: task.due_date ?? task.created_at,
      });
    } else if (task.status === "pending" && task.task_source === "admin") {
      items.push({
        id: `task-new-${task.id}`,
        kind: "task",
        title: "New task assigned",
        message: task.title,
        href: employeeRoute("/tasks"),
        tone: "info",
        createdAt: task.created_at,
      });
    }
  }

  for (const commission of input.commissions) {
    if (commission.status === "pending") {
      items.push({
        id: `commission-pending-${commission.id}`,
        kind: "commission",
        title: "Commission pending approval",
        message: `£${Number(commission.amount_gbp).toLocaleString()}${commission.company_name ? ` — ${commission.company_name}` : ""}`,
        href: employeeRoute("/commission"),
        tone: "info",
        createdAt: commission.created_at,
      });
    } else if (commission.status === "approved") {
      items.push({
        id: `commission-approved-${commission.id}`,
        kind: "commission",
        title: "Commission approved",
        message: `£${Number(commission.amount_gbp).toLocaleString()} ready for payout`,
        href: employeeRoute("/commission"),
        tone: "success",
        createdAt: commission.created_at,
      });
    }
  }

  const recentCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  for (const leave of input.leaveRequests) {
    if (leave.status === "pending") continue;
    const at = new Date(leave.created_at).getTime();
    if (Number.isNaN(at) || at < recentCutoff) continue;

    items.push({
      id: `leave-${leave.status}-${leave.id}`,
      kind: "leave",
      title: leave.status === "approved" ? "Leave approved" : "Leave update",
      message: `${leave.leave_type.replace(/_/g, " ")} · ${leave.start_date} to ${leave.end_date}`,
      href: employeeRoute("/leave"),
      tone: leave.status === "approved" ? "success" : "urgent",
      createdAt: leave.created_at,
    });
  }

  const toneOrder = { urgent: 0, info: 1, success: 2 };
  return items.sort((a, b) => {
    const toneDiff = toneOrder[a.tone] - toneOrder[b.tone];
    if (toneDiff !== 0) return toneDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

const SEEN_KEY = "af_team_notif_seen";

export function getSeenTeamNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markTeamNotificationsSeen(ids: string[]) {
  if (typeof window === "undefined" || !ids.length) return;
  const seen = getSeenTeamNotificationIds();
  for (const id of ids) seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
}

export function filterUnreadTeamNotifications(notifications: TeamNotification[]): TeamNotification[] {
  const seen = getSeenTeamNotificationIds();
  return notifications.filter((n) => !seen.has(n.id));
}
