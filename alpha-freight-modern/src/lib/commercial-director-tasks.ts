import {
  buildStreamPlanRows,
  formatRevenueGbp,
  getCurrentMonthExecution,
  getCurrentMonthForecast,
  getCurrentPlanMonth,
  getPlanMonthLabel,
} from "@/lib/commercial-director-revenue-plan";
import {
  DAILY_TASK_LIMIT,
  type CommercialDirectorTaskCategory,
} from "@/lib/commercial-director-role";

export type CommercialTaskCategory = CommercialDirectorTaskCategory;

export type CommercialTaskStatus = "pending" | "completed" | "dismissed";

export type CommercialDirectorTask = {
  id: string;
  title: string;
  description?: string;
  status: CommercialTaskStatus;
  priority: "low" | "medium" | "high";
  category: CommercialDirectorTaskCategory;
  streamId?: number;
  streamName?: string;
  source: "plan" | "ai" | "manual";
  taskDate: string;
  createdAt: string;
  completedAt?: string;
};

export type CommercialTaskDayStore = {
  taskDate: string;
  planMonth: number;
  generatedAt?: string;
  aiGenerated?: boolean;
  tasks: CommercialDirectorTask[];
};

const STORAGE_KEY = "alpha-cd-revenue-tasks-v2";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return crypto.randomUUID();
}

export function getTodayTaskDate() {
  return todayIso();
}

export function loadTaskStore(): CommercialTaskDayStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CommercialTaskDayStore;
    if (parsed.taskDate !== todayIso()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTaskStore(store: CommercialTaskDayStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Five focused daily tasks — achievable, role-aligned. */
export function seedTasksFromRevenuePlan(): CommercialDirectorTask[] {
  const planMonth = getCurrentPlanMonth();
  const execution = getCurrentMonthExecution(planMonth);
  const forecast = getCurrentMonthForecast(planMonth);
  const streams = buildStreamPlanRows(planMonth);
  const topStream = streams.find((s) => s.status === "launching") ?? streams.find((s) => s.status === "live");
  const today = todayIso();
  const now = new Date().toISOString();
  const gap = formatRevenueGbp(Math.max(0, forecast.target - 0));

  const core: Array<Omit<CommercialDirectorTask, "id" | "taskDate" | "createdAt" | "status">> = [
    {
      title: "Call 5 carriers + 3 suppliers — book meetings or first loads",
      description: `Commercial Director · ${execution.salesActions[0] ?? "Outreach"}`,
      priority: "high",
      category: "sales",
      source: "plan",
    },
    {
      title: "1 face-to-face or video meeting — build relationship, pitch Alpha Freight",
      description: "Relationships · suppliers, carriers, or broker partners",
      priority: "high",
      category: "relationships",
      source: "plan",
    },
    {
      title: "Move 1 prospect toward signed contract or platform agreement",
      description: "Contracts · terms, onboarding, or partnership paperwork",
      priority: "high",
      category: "contracts",
      source: "plan",
    },
    {
      title: "Funding / finance check — lender call, runway, or revenue gap action",
      description: `Gap to target ${gap} · support company financial plan`,
      priority: "medium",
      category: "funding",
      source: "plan",
    },
    {
      title: topStream
        ? `Revenue focus: ${topStream.name} (${formatRevenueGbp(topStream.monthTarget)} this month)`
        : `Revenue focus: ${getPlanMonthLabel(planMonth)} target ${formatRevenueGbp(forecast.target)}`,
      description: topStream?.note ?? execution.kpis[0] ?? forecast.focus,
      priority: "medium",
      category: "revenue",
      streamId: topStream?.id,
      streamName: topStream?.name,
      source: "plan",
    },
  ];

  return core.slice(0, DAILY_TASK_LIMIT).map((t) => ({
    ...t,
    id: uid(),
    status: "pending" as const,
    taskDate: today,
    createdAt: now,
  }));
}

export function ensureTodayTasks(): CommercialTaskDayStore {
  const existing = loadTaskStore();
  if (existing && existing.tasks.length > 0 && existing.tasks.length <= DAILY_TASK_LIMIT + 2) {
    return existing;
  }

  const store: CommercialTaskDayStore = {
    taskDate: todayIso(),
    planMonth: getCurrentPlanMonth(),
    tasks: seedTasksFromRevenuePlan(),
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };
  saveTaskStore(store);
  return store;
}

export function setTodayTasks(tasks: CommercialDirectorTask[], aiGenerated = true) {
  const capped = tasks.slice(0, DAILY_TASK_LIMIT);
  const store: CommercialTaskDayStore = {
    taskDate: todayIso(),
    planMonth: getCurrentPlanMonth(),
    tasks: capped,
    generatedAt: new Date().toISOString(),
    aiGenerated,
  };
  saveTaskStore(store);
  return store;
}

export function updateTaskStatus(taskId: string, status: CommercialTaskStatus): CommercialTaskDayStore | null {
  const store = loadTaskStore() ?? ensureTodayTasks();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return store;

  task.status = status;
  task.completedAt = status === "completed" ? new Date().toISOString() : undefined;
  saveTaskStore(store);
  return store;
}

export function mergeAiTasks(
  newTasks: Omit<CommercialDirectorTask, "id" | "taskDate" | "createdAt" | "status">[],
  replace = true
) {
  const today = todayIso();
  const now = new Date().toISOString();

  const aiRows: CommercialDirectorTask[] = newTasks.slice(0, DAILY_TASK_LIMIT).map((t) => ({
    ...t,
    id: uid(),
    status: "pending",
    taskDate: today,
    createdAt: now,
    source: "ai" as const,
  }));

  const store = loadTaskStore();
  if (replace || !store || store.taskDate !== today) {
    return setTodayTasks(aiRows, true);
  }

  const merged = [...store.tasks.filter((t) => t.source !== "ai"), ...aiRows].slice(0, DAILY_TASK_LIMIT);
  store.tasks = merged;
  store.aiGenerated = true;
  store.generatedAt = now;
  saveTaskStore(store);
  return store;
}

export function addManualTask(title: string, description?: string) {
  const store = loadTaskStore() ?? ensureTodayTasks();
  if (store.tasks.filter((t) => t.status === "pending").length >= DAILY_TASK_LIMIT) {
    return store;
  }
  store.tasks.unshift({
    id: uid(),
    title: title.trim(),
    description: description?.trim(),
    status: "pending",
    priority: "medium",
    category: "manual",
    source: "manual",
    taskDate: todayIso(),
    createdAt: new Date().toISOString(),
  });
  store.tasks = store.tasks.slice(0, DAILY_TASK_LIMIT + 1);
  saveTaskStore(store);
  return store;
}

export function resetTodayTasksFromPlan() {
  const store: CommercialTaskDayStore = {
    taskDate: todayIso(),
    planMonth: getCurrentPlanMonth(),
    tasks: seedTasksFromRevenuePlan(),
    generatedAt: new Date().toISOString(),
    aiGenerated: false,
  };
  saveTaskStore(store);
  return store;
}

export function taskStats(tasks: CommercialDirectorTask[]) {
  const pending = tasks.filter((t) => t.status === "pending").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const dismissed = tasks.filter((t) => t.status === "dismissed").length;
  const total = tasks.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  return { pending, completed, dismissed, total, progress };
}

export function buildRevenueTaskAiContext(options?: { actualMtd?: number; monthTarget?: number }) {
  const planMonth = getCurrentPlanMonth();
  const execution = getCurrentMonthExecution(planMonth);
  const forecast = getCurrentMonthForecast(planMonth);
  const streams = buildStreamPlanRows(planMonth)
    .filter((s) => s.status !== "scheduled")
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      monthTarget: s.monthTarget,
    }));

  return {
    planMonth,
    monthLabel: getPlanMonthLabel(planMonth),
    monthTitle: execution.title,
    monthRevenueTarget: options?.monthTarget ?? forecast.target,
    actualMtd: options?.actualMtd ?? 0,
    revenueGap: Math.max(0, (options?.monthTarget ?? forecast.target) - (options?.actualMtd ?? 0)),
    loadsTarget: forecast.loadsCompleted,
    focus: forecast.focus,
    topStreams: streams,
    taskLimit: DAILY_TASK_LIMIT,
  };
}

export { DAILY_TASK_LIMIT };
