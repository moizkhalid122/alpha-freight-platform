"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleHelp,
  ClipboardList,
  Minus,
  Phone,
  Plus,
  Send,
  Target,
  UserCog,
  UserPlus,
} from "lucide-react";
import EmployeeModal from "@/components/employee/EmployeeModal";
import NothingLottie from "@/components/ui/NothingLottie";
import {
  EmployeePageHeader,
  EmployeePanel,
  EmployeeStatCard,
  EmployeeStatGrid,
} from "@/components/employee/EmployeeShell";
import { useEmployeeTasks } from "@/hooks/useEmployeeData";
import { adminRoute } from "@/lib/admin-path";
import { employeeRoute } from "@/lib/employee-path";
import {
  bumpDailyKpi,
  kpiProgressPct,
  loadDailyKpi,
} from "@/lib/employee-task-kpi";
import type { EmployeeTask } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type FilterTab = "today" | "admin" | "personal" | "done";

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().slice(0, 10);
}

function taskSource(task: EmployeeTask): "daily" | "admin" | "personal" {
  if (task.task_source) return task.task_source;
  if ((task.description ?? "").toLowerCase().includes("assigned by admin")) return "admin";
  return "daily";
}

export default function EmployeeTasksWorkspace() {
  const { rows, loading, userId, refetch } = useEmployeeTasks();
  const [kpi, setKpi] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<FilterTab>("today");
  const [showAdd, setShowAdd] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTaskHelp, setShowTaskHelp] = useState(false);
  const [reportText, setReportText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<{ title: string; description: string; priority: EmployeeTask["priority"] }>({
    title: "",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    if (userId) setKpi(loadDailyKpi(userId));
  }, [userId, rows]);

  const todayTasks = useMemo(
    () => rows.filter((t) => isToday(t.due_date) && t.status !== "completed"),
    [rows]
  );

  const adminTasks = useMemo(
    () => rows.filter((t) => taskSource(t) === "admin" && t.status !== "completed"),
    [rows]
  );

  const personalTasks = useMemo(
    () => rows.filter((t) => taskSource(t) === "personal" && t.status !== "completed"),
    [rows]
  );

  const completedToday = useMemo(
    () => rows.filter((t) => t.status === "completed" && isToday(t.due_date)),
    [rows]
  );

  const kpiTasks = todayTasks.filter((t) => t.target_count && t.target_count > 0);
  const kpiTotal = kpiTasks.reduce((sum, t) => sum + (t.target_count ?? 0), 0);
  const kpiDone = kpiTasks.reduce((sum, t) => sum + (kpi[t.id] ?? 0), 0);

  const allToday = useMemo(
    () => rows.filter((t) => isToday(t.due_date)),
    [rows]
  );

  const progressPct = allToday.length
    ? Math.round((allToday.filter((t) => t.status === "completed").length / allToday.length) * 100)
    : 0;

  const toggleTask = async (task: EmployeeTask) => {
    if (!userId) {
      setActionError("Sign in to update tasks.");
      return;
    }
    setActionError(null);
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("employee_tasks").update({ status: nextStatus }).eq("id", task.id);
    if (error) {
      setActionError(error.message);
      return;
    }
    await refetch();
  };

  const addPersonalTask = async () => {
    if (!userId) {
      setActionError("Sign in to add tasks.");
      return;
    }
    if (!newTask.title.trim()) return;
    setActionError(null);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("employee_tasks").insert({
      employee_id: userId,
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      status: "pending",
      priority: newTask.priority,
      due_date: today,
      task_source: "personal",
    });
    if (error) {
      setActionError(error.message);
      return;
    }
    await refetch();
    setNewTask({ title: "", description: "", priority: "medium" });
    setShowAdd(false);
  };

  const submitReport = async () => {
    const reportTask = rows.find((t) => t.title === "Submit Daily Report");
    if (reportTask && reportTask.status !== "completed") {
      await toggleTask(reportTask);
    }
    setReportText("");
    setShowReport(false);
  };

  const filteredList = useMemo(() => {
    switch (tab) {
      case "admin":
        return adminTasks;
      case "personal":
        return personalTasks;
      case "done":
        return completedToday;
      default:
        return todayTasks;
    }
  }, [tab, adminTasks, personalTasks, completedToday, todayTasks]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "today", label: "Today", count: todayTasks.length },
    { id: "admin", label: "From Admin", count: adminTasks.length },
    { id: "personal", label: "My Added", count: personalTasks.length },
    { id: "done", label: "Done Today", count: completedToday.length },
  ];

  return (
    <div>
      <EmployeePageHeader
        title="My Tasks"
        description="Daily sales targets, admin assignments, and your personal checklist."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              disabled={!userId}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowReport(true)}
              disabled={!userId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFD666] px-4 py-2.5 text-xs font-bold text-slate-900 hover:bg-[#f5c84d] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Daily Report
            </button>
          </div>
        }
      />

      {!userId ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to view and manage your tasks.
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowTaskHelp((open) => !open)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <CircleHelp className="h-4 w-4" />
          {showTaskHelp ? "Hide task guide" : "How do tasks work?"}
        </button>
        {showTaskHelp ? (
          <EmployeePanel className="mt-2 border-blue-100 bg-blue-50/40">
            <p className="text-sm font-semibold text-slate-800">Where do tasks come from?</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li>
                <strong className="text-slate-800">Daily targets</strong> — a recurring checklist for each workday
                (for example carrier calls, supplier outreach, and CRM updates). These are set by your manager or
                company defaults.
              </li>
              <li>
                <strong className="text-slate-800">Admin tasks</strong> — one-off assignments from your manager in{" "}
                <Link href={adminRoute("/employees/tasks")} className="font-semibold text-blue-600 hover:underline">
                  Admin Panel → Tasks
                </Link>{" "}
                (for example &quot;Call DHL Logistics&quot;).
              </li>
              <li>
                <strong className="text-slate-800">Personal tasks</strong> — reminders you add yourself with{" "}
                <strong className="text-slate-800">Add Task</strong>.
              </li>
            </ul>
          </EmployeePanel>
        ) : null}
      </div>

      <EmployeeStatGrid>
        <EmployeeStatCard
          label="Open today"
          value={String(todayTasks.length + adminTasks.filter((t) => !isToday(t.due_date)).length)}
          note={`${adminTasks.length} from admin`}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Daily KPI"
          value={`${kpiDone}/${kpiTotal}`}
          note="Calls & follow-ups counted"
          icon={<Target className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Completed"
          value={String(completedToday.length)}
          note="Finished today"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Progress"
          value={`${progressPct}%`}
          note="KPI + checklist combined"
          icon={<Circle className="h-5 w-5" />}
        />
      </EmployeeStatGrid>

      <EmployeePanel className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Progress</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{progressPct}%</p>
            <p className="mt-1 text-xs text-slate-500">
              {completedToday.length} done · {todayTasks.length} remaining
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
              <span>Today</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#BFFF07] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </EmployeePanel>

      {kpiTasks.length > 0 ? (
        <EmployeePanel className="mt-6">
          <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Daily Targets (count progress)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpiTasks.map((task) => {
              const current = kpi[task.id] ?? 0;
              const target = task.target_count ?? 0;
              const pct = kpiProgressPct(current, target);
              return (
                <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {current}
                    <span className="text-base font-medium text-slate-400"> / {target}</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#BFFF07] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => userId && setKpi(bumpDailyKpi(userId, task.id, -1))}
                      disabled={!userId}
                      className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-50"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!userId) return;
                        const next = bumpDailyKpi(userId, task.id, 1);
                        setKpi(next);
                        if (current + 1 >= target && task.status !== "completed") {
                          toggleTask(task);
                        }
                      }}
                      disabled={!userId}
                      className="flex-1 rounded-lg bg-[#FFD666] py-2 text-xs font-bold text-slate-900 hover:bg-[#f5c84d] disabled:opacity-50"
                    >
                      +1 Done
                    </button>
                    <button
                      type="button"
                      onClick={() => userId && setKpi(bumpDailyKpi(userId, task.id, 5))}
                      disabled={!userId}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                    >
                      +5
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </EmployeePanel>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={employeeRoute("/leads")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Target className="h-4 w-4" />
          Open CRM
        </Link>
        <Link
          href={employeeRoute("/calls")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Phone className="h-4 w-4" />
          Log Calls
        </Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
            <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", tab === t.id ? "bg-white/20" : "bg-slate-100")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <EmployeePanel className="mt-4">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {tab === "today" && "Today's Checklist"}
          {tab === "admin" && "Assigned by Admin / Manager"}
          {tab === "personal" && "Tasks You Added"}
          {tab === "done" && "Completed Today"}
        </h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading tasks…</p>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-8">
            <NothingLottie className="h-40 w-40" />
            <p className="mt-1 max-w-sm px-4 text-center text-sm text-slate-400">
              {tab === "admin"
                ? "No admin tasks right now — manager will assign from Admin Panel."
                : "Nothing here yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredList.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task)}
                disabled={!userId}
                showSource
                adminHighlight={taskSource(task) === "admin"}
              />
            ))}
          </ul>
        )}
      </EmployeePanel>

      <EmployeeModal open={showAdd} onClose={() => setShowAdd(false)} title="Add Personal Task">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Title</label>
            <input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="e.g. Call ABC Logistics back"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Notes</label>
            <textarea
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            type="button"
            onClick={addPersonalTask}
            disabled={!userId || !newTask.title.trim()}
            className="w-full rounded-xl bg-[#FFD666] py-2.5 text-sm font-bold text-slate-900 hover:bg-[#f5c84d] disabled:opacity-50"
          >
            Add Task
          </button>
        </div>
      </EmployeeModal>

      <EmployeeModal open={showReport} onClose={() => setShowReport(false)} title="Submit Daily Report" wide>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Summary bhejo — carriers contacted, suppliers reached, leads updated, aur koi blockers.
          </p>
          <textarea
            rows={8}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder={`Today's summary:\n- Carriers contacted: ${kpiDone}\n- Leads follow-up: ...\n- Blockers: ...`}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={submitReport}
            disabled={!userId || !reportText.trim()}
            className="w-full rounded-xl bg-[#FFD666] py-2.5 text-sm font-bold text-slate-900 hover:bg-[#f5c84d] disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </EmployeeModal>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  disabled,
  showSource,
  adminHighlight,
}: {
  task: EmployeeTask;
  onToggle: () => void;
  disabled?: boolean;
  showSource?: boolean;
  adminHighlight?: boolean;
}) {
  const done = task.status === "completed";
  const source = taskSource(task);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
          adminHighlight && !done && "border-blue-100 bg-blue-50/40",
          done
            ? "border-slate-100 bg-slate-50/80 opacity-70"
            : !adminHighlight && "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="mt-0.5 shrink-0 text-slate-400">
          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block font-semibold text-slate-900", done && "line-through")}>{task.title}</span>
          {task.description ? (
            <span className="mt-0.5 block text-xs text-slate-500">{task.description}</span>
          ) : null}
          {showSource && source === "admin" ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
              <UserCog className="h-3 w-3" />
              Assigned by {task.assigned_by_name ?? "Admin"}
              {isToday(task.due_date) ? " · Due Today" : task.due_date ? ` · Due ${task.due_date}` : ""}
            </span>
          ) : null}
          {showSource && source === "personal" ? (
            <span className="mt-1 block text-xs font-medium text-violet-600">Added by you</span>
          ) : null}
        </span>
        {!done && task.priority === "high" ? (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
            High
          </span>
        ) : null}
      </button>
    </li>
  );
}
