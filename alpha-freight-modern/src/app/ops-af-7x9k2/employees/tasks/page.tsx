"use client";

import { useState } from "react";
import { ListTodo, Plus } from "lucide-react";
import {
  AdminHrHeader,
  AdminHrTabs,
  AdminPanel,
} from "@/components/admin/AdminHrShell";
import EmployeePortalLinkCard from "@/components/admin/EmployeePortalLinkCard";
import { useAdminEmployees } from "@/hooks/useAdminEmployeeData";
import type { EmployeeTask } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";

export default function AdminEmployeeTasksPage() {
  const { employees, loading } = useAdminEmployees();
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
  };

  return (
    <div>
      <AdminHrHeader
        title="Assign Tasks"
        description="Managers assign one-off tasks to employees — calls, follow-ups, training, etc."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/tasks" />
      <EmployeePortalLinkCard />

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
