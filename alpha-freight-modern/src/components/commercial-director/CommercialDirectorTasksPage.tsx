"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import {
  formatRevenueGbp,
  getCurrentMonthForecast,
  getCurrentPlanMonth,
  getPlanMonthLabel,
  parseCommissionMtd,
} from "@/lib/commercial-director-revenue-plan";
import { DAILY_TASK_LIMIT } from "@/lib/commercial-director-role";
import { toCommercialDirectorTasks } from "@/lib/commercial-director-task-ai";
import {
  addManualTask,
  ensureTodayTasks,
  loadTaskStore,
  mergeAiTasks,
  resetTodayTasksFromPlan,
  taskStats,
  updateTaskStatus,
  type CommercialDirectorTask,
  type CommercialTaskStatus,
} from "@/lib/commercial-director-tasks";
import { useCommercialMetrics } from "@/lib/use-commercial-metrics";
import { supabase } from "@/lib/supabase";

type FilterTab = "today" | "completed" | "dismissed";

const CATEGORY_LABEL: Record<CommercialDirectorTask["category"], string> = {
  sales: "Sales",
  relationships: "Relationships",
  contracts: "Contracts",
  funding: "Funding",
  operations: "Operations",
  revenue: "Revenue",
  ai: "AI",
  manual: "Manual",
};

const SOURCE_BADGE: Record<CommercialDirectorTask["source"], string> = {
  plan: "Plan",
  ai: "AI",
  manual: "Manual",
};

function priorityClass(p: CommercialDirectorTask["priority"]) {
  if (p === "high") return "bg-red-50 text-red-700 ring-red-200";
  if (p === "low") return "bg-gray-50 text-gray-600 ring-gray-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

function TaskRow({
  task,
  onComplete,
  onDismiss,
  onRestore,
}: {
  task: CommercialDirectorTask;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const done = task.status === "completed";
  const dismissed = task.status === "dismissed";

  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3.5 transition ${
        done
          ? "border-emerald-100 bg-emerald-50/50"
          : dismissed
            ? "border-gray-100 bg-gray-50/60 opacity-70"
            : "border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${priorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {CATEGORY_LABEL[task.category]}
          </span>
          {task.streamId ? (
            <span className="font-mono text-[10px] text-gray-400">#{String(task.streamId).padStart(2, "0")}</span>
          ) : null}
        </div>
        <p className={`mt-2 text-[14px] font-semibold leading-snug text-gray-900 ${done || dismissed ? "line-through" : ""}`}>
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{task.description}</p>
        ) : null}
        {task.streamName ? (
          <p className="mt-1 text-[11px] font-medium text-blue-600">{task.streamName}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
        {task.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              title="Complete"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => onDismiss(task.id)}
              title="Dismiss"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onRestore(task.id)}
            title="Restore to pending"
            className="rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommercialDirectorTasksPage({
  initialMetrics,
}: {
  initialMetrics?: CommercialMetricsPayload;
}) {
  const planMonth = getCurrentPlanMonth();
  const monthForecast = getCurrentMonthForecast(planMonth);
  const { data: metrics } = useCommercialMetrics({ initialMetrics });
  const actualMtd = parseCommissionMtd(metrics ?? initialMetrics);

  const [tasks, setTasks] = useState<CommercialDirectorTask[]>([]);
  const [tab, setTab] = useState<FilterTab>("today");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const autoGeneratedRef = useRef(false);

  const refreshFromStore = useCallback(() => {
    const store = loadTaskStore() ?? ensureTodayTasks();
    setTasks(store.tasks);
    return store;
  }, []);

  useEffect(() => {
    refreshFromStore();
  }, [refreshFromStore]);

  const stats = useMemo(() => taskStats(tasks), [tasks]);

  const filtered = useMemo(() => {
    if (tab === "completed") return tasks.filter((t) => t.status === "completed");
    if (tab === "dismissed") return tasks.filter((t) => t.status === "dismissed");
    return tasks.filter((t) => t.status === "pending");
  }, [tasks, tab]);

  const handleStatus = (id: string, status: CommercialTaskStatus) => {
    updateTaskStatus(id, status);
    refreshFromStore();
  };

  const generateAiTasks = useCallback(
    async (replace = true) => {
      setAiLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch("/api/commercial-director/tasks/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            actualMtd,
            monthTarget: monthForecast.target,
            count: DAILY_TASK_LIMIT,
          }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "AI task generation failed");
        }

        const payload = (await res.json()) as { tasks: Parameters<typeof toCommercialDirectorTasks>[0] };
        mergeAiTasks(toCommercialDirectorTasks(payload.tasks), replace);
        refreshFromStore();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not generate tasks");
      } finally {
        setAiLoading(false);
      }
    },
    [actualMtd, monthForecast.target, refreshFromStore]
  );

  useEffect(() => {
    if (autoGeneratedRef.current) return;
    const store = loadTaskStore();
    if (!store || !store.aiGenerated) {
      autoGeneratedRef.current = true;
      void generateAiTasks(true);
    }
  }, [generateAiTasks]);

  const handleResetPlan = () => {
    resetTodayTasksFromPlan();
    refreshFromStore();
  };

  const handleAddManual = () => {
    if (!manualTitle.trim()) return;
    addManualTask(manualTitle);
    setManualTitle("");
    setShowAdd(false);
    refreshFromStore();
  };

  return (
    <CommercialPageShell
      eyebrow="Daily execution"
      title="Today's tasks"
      description={`${DAILY_TASK_LIMIT} focused tasks — sales, deals, contracts, funding. OpenAI refreshes daily; tick ✓ complete or ✕ dismiss.`}
      actions={
        <Link
          href={commercialDirectorRoute()}
          className="rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      }
    >
      <div className="air-card rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50/70 to-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              {getPlanMonthLabel(planMonth)} · Commercial Director
            </p>
            <p className="air-font-display mt-1 text-xl font-medium text-gray-900">
              {formatRevenueGbp(monthForecast.target)} revenue · {monthForecast.loadsCompleted} loads
            </p>
            <p className="mt-1 text-[12px] text-gray-600">
              MTD {formatRevenueGbp(actualMtd)} · {stats.completed}/{stats.total} done · max {DAILY_TASK_LIMIT}/day
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Progress</p>
              <p className="air-font-display text-2xl font-semibold text-gray-900">{stats.progress}%</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-blue-100 bg-white">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["today", "Today"],
            ["completed", "Completed"],
            ["dismissed", "Dismissed"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
              tab === key ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
          <button
            type="button"
            onClick={handleResetPlan}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Default 5
          </button>
          <button
            type="button"
            onClick={() => generateAiTasks(true)}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI refresh
          </button>
        </div>
      </div>

      {showAdd ? (
        <div className="cd-kpi flex flex-col gap-3 rounded-[20px] p-4 sm:flex-row sm:items-center">
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="New task title…"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-300"
          />
          <button
            type="button"
            onClick={handleAddManual}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800"
          >
            Save task
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">{error}</div>
      ) : null}

      <section className="space-y-3">
        {aiLoading && filtered.length === 0 ? (
          <div className="air-card flex items-center justify-center gap-3 rounded-[24px] px-6 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-gray-700">OpenAI is generating today&apos;s {DAILY_TASK_LIMIT} tasks…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="air-card rounded-[24px] px-6 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-4 text-sm font-semibold text-gray-900">
              {tab === "today" ? "All tasks complete for today!" : `No ${tab} tasks`}
            </p>
            {tab === "today" ? (
              <button
                type="button"
                onClick={() => generateAiTasks(true)}
                className="mt-4 text-[13px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Generate new tasks with AI
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={(id) => handleStatus(id, "completed")}
              onDismiss={(id) => handleStatus(id, "dismissed")}
              onRestore={(id) => handleStatus(id, "pending")}
            />
          ))
        )}
      </section>
    </CommercialPageShell>
  );
}
