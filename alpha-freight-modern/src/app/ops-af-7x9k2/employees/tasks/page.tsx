"use client";

import { useState } from "react";
import Link from "next/link";
import { ListTodo, Plus } from "lucide-react";
import {
  AdminHrHeader,
  AdminHrTabs,
  AdminPanel,
} from "@/components/admin/AdminHrShell";
import EmployeePortalLinkCard from "@/components/admin/EmployeePortalLinkCard";
import {
  useAdminEmployees,
  useAdminTable,
  useEmployeeNameLookup,
} from "@/hooks/useAdminEmployeeData";
import type { EmployeeTask } from "@/lib/employee-types";
import { adminRoute } from "@/lib/admin-path";
import { supabase } from "@/lib/supabase";

export default function AdminEmployeeTasksPage() {
  const { employees, loading } = useAdminEmployees();
  const { rows: allTasks, loading: tasksLoading, refetch } = useAdminTable<EmployeeTask>("employee_tasks");
  const nameFor = useEmployeeNameLookup(employees);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<EmployeeTask["priority"]>("high");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recent, setRecent] = useState<EmployeeTask[]>([]);

  const assignTask = async () => {
    if (!employeeId || !title.trim()) return;
    setSaving(true);
    setMessage(null);

    const task: EmployeeTask = {
      id: `at_${Date.now()}`,
      employee_id: employeeId,
      title: title.trim(),
      description: description.trim() || null,
      status: "pending",
      priority,
      due_date: dueDate,
      created_at: new Date().toISOString(),
      task_source: "admin",
      assigned_by_name: "Admin",
    };

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("employee_tasks").insert({
      employee_id: employeeId,
      title: task.title,
      description: task.description,
      status: "pending",
      priority: task.priority,
      due_date: task.due_date,
      task_source: "admin",
      assigned_by: userData.user?.id ?? null,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
      setSaving(false);
      return;
    }
    setMessage(`Task assigned — employee will see it on My Tasks immediately.`);

    setRecent((prev) => [{ ...task, assigned_by_name: "You (Admin)" }, ...prev].slice(0, 8));
    setTitle("");
    setDescription("");
    setSaving(false);
    void refetch();
  };

  const pending = allTasks.filter((t) => t.status === "pending").length;
  const completed = allTasks.filter((t) => t.status === "completed").length;

  return (
    <div>
      <AdminHrHeader
        title="Tasks"
        description="Assign tasks and view every task across the team — admin, daily targets, and personal."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/tasks" />
      <EmployeePortalLinkCard />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All tasks</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{tasksLoading ? "—" : allTasks.length}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
          <p className="mt-1 text-3xl font-black text-amber-600">{tasksLoading ? "—" : pending}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{tasksLoading ? "—" : completed}</p>
        </AdminPanel>
      </div>

      <AdminPanel className="mb-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasksLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : allTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No tasks yet
                  </td>
                </tr>
              ) : (
                allTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <Link
                        href={adminRoute(`/employees/${task.employee_id}`)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {nameFor(task.employee_id)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{task.title}</td>
                    <td className="px-5 py-4 capitalize text-slate-700">{task.status.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{task.priority}</td>
                    <td className="px-5 py-4 text-slate-600">{task.due_date ?? "—"}</td>
                    <td className="px-5 py-4 capitalize text-slate-500">{task.task_source ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <AdminPanel>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">New Task</h2>
              <p className="text-xs text-slate-500">Employee ke My Tasks page par dikhega</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Employee *
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name ?? emp.email} — {emp.job_title ?? "Team"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Task title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call DHL Logistics"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Instructions
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Discuss pallet network pricing and send quote by EOD."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EmployeeTask["priority"])}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={assignTask}
              disabled={saving || !employeeId || !title.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Assign Task
            </button>

            {message ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}
          </div>
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel>
            <h3 className="text-sm font-bold text-slate-900">Kaun kya assign karta hai?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <strong className="text-slate-800">Admin / Manager</strong> — yahan se custom tasks (calls, meetings, reports).
              </li>
              <li>
                <strong className="text-slate-800">Daily targets</strong> — 30 carriers, CRM update, etc. — sales team ke liye fixed checklist (employee portal par auto).
              </li>
              <li>
                <strong className="text-slate-800">Employee</strong> — khud personal tasks add kar sakta hai.
              </li>
            </ul>
          </AdminPanel>

          {recent.length > 0 ? (
            <AdminPanel>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recently assigned
              </h3>
              <ul className="space-y-2">
                {recent.map((t) => (
                  <li key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-sm">
                    <p className="font-semibold text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">Due {t.due_date ?? "—"} · {t.priority} priority</p>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
