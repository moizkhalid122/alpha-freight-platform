"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarOff,
  CircleDollarSign,
  FileText,
  ListTodo,
  Phone,
  Target,
  User,
} from "lucide-react";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployeeRecord } from "@/hooks/useAdminEmployeeData";
import { adminRoute } from "@/lib/admin-path";

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <AdminPanel className="overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{count} record{count === 1 ? "" : "s"}</p>
        </div>
      </div>
      {children}
    </AdminPanel>
  );
}

export default function AdminEmployeeRecordPage() {
  const params = useParams();
  const employeeId = typeof params.id === "string" ? params.id : null;
  const { record, loading, error } = useAdminEmployeeRecord(employeeId);

  if (!employeeId) {
    return <p className="text-slate-500">Invalid employee.</p>;
  }

  const profile = record?.profile;
  const name = profile?.full_name ?? profile?.email ?? "Employee";

  return (
    <div>
      <Link
        href={adminRoute("/employees")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      <AdminHrHeader
        title={loading ? "Loading…" : name}
        description="Complete A–Z record — profile, leads, calls, tasks, commission, CRM activity, training, leave, and documents."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees" />

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <AdminPanel>
          <p className="text-center text-slate-400">Loading full employee record…</p>
        </AdminPanel>
      ) : record ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminPanel>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Leads</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{record.leads.length}</p>
            </AdminPanel>
            <AdminPanel>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Calls</p>
              <p className="mt-1 text-2xl font-black text-blue-600">{record.calls.length}</p>
            </AdminPanel>
            <AdminPanel>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tasks</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{record.tasks.length}</p>
            </AdminPanel>
            <AdminPanel>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CRM activity</p>
              <p className="mt-1 text-2xl font-black text-indigo-600">{record.activities.length}</p>
            </AdminPanel>
          </div>

          <Section title="Profile" icon={User} count={1}>
            <dl className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{profile?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Employee code</dt>
                <dd className="mt-1 font-mono text-sm text-slate-800">{profile?.employee_code ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</dt>
                <dd className="mt-1 text-sm text-slate-800">{profile?.department ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Job title</dt>
                <dd className="mt-1 text-sm text-slate-800">{profile?.job_title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</dt>
                <dd className="mt-1 capitalize text-sm text-slate-800">{profile?.status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commission rate</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{profile?.commission_rate ?? 0}%</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone</dt>
                <dd className="mt-1 text-sm text-slate-800">{profile?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hire date</dt>
                <dd className="mt-1 text-sm text-slate-800">{profile?.hire_date ?? "—"}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Leads (CRM)" icon={Target} count={record.leads.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">Region</th>
                    <th className="px-5 py-3">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                        No leads
                      </td>
                    </tr>
                  ) : (
                    record.leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-5 py-3 font-semibold text-slate-900">{lead.company_name}</td>
                        <td className="px-5 py-3 text-slate-600">{lead.contact_name ?? "—"}</td>
                        <td className="px-5 py-3 capitalize text-slate-700">{lead.status.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3">
                          {lead.value_gbp ? `£${Number(lead.value_gbp).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{lead.region ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{lead.next_follow_up ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Calls" icon={Phone} count={record.calls.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">When</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Direction</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Outcome</th>
                    <th className="px-5 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.calls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                        No calls
                      </td>
                    </tr>
                  ) : (
                    record.calls.map((call) => (
                      <tr key={call.id}>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                          {new Date(call.called_at).toLocaleString("en-GB")}
                        </td>
                        <td className="px-5 py-3 font-medium">{call.company_name ?? "—"}</td>
                        <td className="px-5 py-3 capitalize">{call.direction}</td>
                        <td className="px-5 py-3">
                          {call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}
                        </td>
                        <td className="px-5 py-3">{call.outcome ?? "—"}</td>
                        <td className="max-w-xs px-5 py-3 text-xs text-slate-500">{call.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Tasks" icon={ListTodo} count={record.tasks.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.tasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        No tasks
                      </td>
                    </tr>
                  ) : (
                    record.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-5 py-3 font-semibold text-slate-900">{task.title}</td>
                        <td className="px-5 py-3 capitalize">{task.status.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3 capitalize">{task.priority}</td>
                        <td className="px-5 py-3">{task.due_date ?? "—"}</td>
                        <td className="px-5 py-3 capitalize">{task.task_source ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Commission" icon={CircleDollarSign} count={record.commissions.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.commissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        No commission records
                      </td>
                    </tr>
                  ) : (
                    record.commissions.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-3">{c.period_month ?? "—"}</td>
                        <td className="px-5 py-3 font-semibold">£{Number(c.amount_gbp).toLocaleString()}</td>
                        <td className="px-5 py-3 capitalize">{c.status}</td>
                        <td className="px-5 py-3">{c.company_name ?? "—"}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{c.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="CRM Activity Timeline" icon={Activity} count={record.activities.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">When</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.activities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                        No activity logged
                      </td>
                    </tr>
                  ) : (
                    record.activities.map((act) => (
                      <tr key={act.id}>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                          {new Date(act.created_at).toLocaleString("en-GB")}
                        </td>
                        <td className="px-5 py-3 capitalize">{act.activity_type}</td>
                        <td className="px-5 py-3 text-slate-800">{act.summary}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Leave" icon={CalendarOff} count={record.leave.length}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.leave.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                        No leave requests
                      </td>
                    </tr>
                  ) : (
                    record.leave.map((lv) => (
                      <tr key={lv.id}>
                        <td className="px-5 py-3 capitalize">{lv.leave_type}</td>
                        <td className="px-5 py-3">
                          {lv.start_date} → {lv.end_date}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">{lv.reason ?? "—"}</td>
                        <td className="px-5 py-3 capitalize">{lv.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Documents & Training" icon={FileText} count={record.documents.length + record.training.length}>
            <div className="space-y-4 p-5">
              {record.training.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Training</h3>
                  <ul className="space-y-2">
                    {record.training.map((t) => (
                      <li key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
                        <span className="font-semibold text-slate-900">{t.module_title}</span>
                        <span className="ml-2 text-slate-500">
                          — {t.status.replace(/_/g, " ")} ({t.progress_pct}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {record.documents.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Documents</h3>
                  <ul className="space-y-2">
                    {record.documents.map((doc) => (
                      <li key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
                        <span className="font-semibold text-slate-900">{doc.title}</span>
                        <span className="ml-2 capitalize text-slate-500">— {doc.category}</span>
                        {doc.file_url ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {record.training.length === 0 && record.documents.length === 0 ? (
                <p className="text-center text-slate-400">No documents or training records</p>
              ) : null}
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
