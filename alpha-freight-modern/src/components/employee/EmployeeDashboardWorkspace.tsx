"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CircleDollarSign,
  ListTodo,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import MeasuredChart from "@/components/charts/MeasuredChart";
import {
  EmployeePageHeader,
  EmployeePanel,
  StatusBadge,
} from "@/components/employee/EmployeeShell";
import {
  useEmployeeCalls,
  useEmployeeCommissions,
  useEmployeeLeads,
  useEmployeeProfile,
  useEmployeeTasks,
} from "@/hooks/useEmployeeData";
import {
  buildCallsTrend,
  buildCommissionTrend,
  buildLeadPipeline,
  CALL_DAILY_TARGET,
  computeDashboardStats,
  getDueTodayLeads,
  getOverdueLeads,
  hasEmployeeDashboardData,
} from "@/lib/employee-dashboard-metrics";
import { employeeRoute } from "@/lib/employee-path";
import { cn } from "@/lib/utils";

function PerformanceRing({ score }: { score: number }) {
  const radius = 52;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-[108px] w-[108px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 p-1 shadow-inner">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <defs>
          <linearGradient id="empPerfRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <circle
          stroke="#e0e7ff"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#empPerfRing)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{score}</p>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-indigo-400">Score</p>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "indigo" | "violet" | "sky" | "emerald";
}) {
  const accents = {
    indigo: "border-indigo-100 bg-indigo-50/60 text-indigo-600",
    violet: "border-violet-100 bg-violet-50/60 text-violet-600",
    sky: "border-sky-100 bg-sky-50/60 text-sky-600",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-600",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3.5 transition hover:shadow-sm", accents[accent])}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium opacity-60">{sub}</p>
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
  note,
  icon,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ReactNode;
  accent: "indigo" | "violet" | "sky" | "emerald";
}) {
  const iconBg = {
    indigo: "bg-indigo-100 text-indigo-600",
    violet: "bg-violet-100 text-violet-600",
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:border-slate-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", iconBg[accent])}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{note}</p> : null}
    </div>
  );
}

function TargetBar({ label, current, target, unit = "" }: { label: string; current: number; target: number; unit?: string }) {
  const pct = target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">
          {current}
          {unit}/{target}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
          style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 text-sm font-semibold text-slate-900">
          {formatter ? formatter(Number(p.value ?? 0), String(p.name)) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

export default function EmployeeDashboardWorkspace() {
  const { profile } = useEmployeeProfile();
  const { rows: tasks, loading: tasksLoading } = useEmployeeTasks();
  const { rows: leads, loading: leadsLoading } = useEmployeeLeads();
  const { rows: calls, loading: callsLoading } = useEmployeeCalls();
  const { rows: commissions, loading: commissionsLoading } = useEmployeeCommissions();

  const loading = tasksLoading || leadsLoading || callsLoading || commissionsLoading;
  const hasData = hasEmployeeDashboardData(tasks, leads, calls, commissions);
  const stats = computeDashboardStats(tasks, leads, calls, commissions);
  const callsTrend = buildCallsTrend(calls);
  const leadPipeline = buildLeadPipeline(leads);
  const commissionTrend = buildCommissionTrend(commissions);
  const dueTodayLeads = getDueTodayLeads(leads);
  const overdueLeads = getOverdueLeads(leads);

  const greeting = profile?.full_name?.split(" ")[0] || "there";
  const followUpTarget = dueTodayLeads.length + overdueLeads.length;
  const connectedTarget = stats.callsToday > 0 ? Math.max(stats.connectedToday, 15) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <EmployeePageHeader
        title={`Welcome back, ${greeting}`}
        description={
          profile
            ? `${profile.job_title ?? "Team member"} · ${profile.department ?? "Operations"} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`
            : "Your daily performance workspace."
        }
        action={
          <Link
            href={employeeRoute("/ai")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Ask Team AI
          </Link>
        }
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-blue-50/80 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5 sm:items-center sm:gap-6">
            <PerformanceRing score={stats.performanceScore} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Today&apos;s performance</p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {loading
                  ? "Loading your workspace…"
                  : !hasData
                    ? "Your workspace is ready — start with your first task or call"
                    : stats.performanceScore >= 75
                      ? "Strong day — keep the momentum"
                      : stats.performanceScore >= 50
                        ? "On track — push calls & follow-ups"
                        : "Room to grow — start with your next call"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>
                  <strong className="font-semibold text-slate-800">{stats.callsToday}</strong> calls
                </span>
                <span>
                  <strong className="font-semibold text-slate-800">{stats.connectedToday}</strong> connected
                </span>
                <span>
                  <strong className="font-semibold text-slate-800">£{stats.pipelineValue.toLocaleString()}</strong> pipeline
                </span>
                <span>
                  <strong className="font-semibold text-slate-800">{stats.openTasks}</strong> tasks open
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px] lg:gap-3">
            <HeroMetric
              label="Call target"
              value={`${stats.callTargetPct}%`}
              sub={`${stats.callsToday} / ${CALL_DAILY_TARGET}`}
              accent="indigo"
            />
            <HeroMetric
              label="Tasks done"
              value={`${stats.taskCompletionPct}%`}
              sub={`${stats.tasksCompleted} / ${stats.tasksTotal}`}
              accent="sky"
            />
            <HeroMetric
              label="Due today"
              value={String(stats.dueTodayLeads)}
              sub="follow-ups"
              accent="violet"
            />
            <HeroMetric
              label="Commission"
              value={`£${stats.commissionTotalMonth.toLocaleString()}`}
              sub="this month"
              accent="emerald"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Calls today"
          value={String(stats.callsToday)}
          note={`${stats.callTargetPct}% of ${CALL_DAILY_TARGET} target · ${stats.talkMinutesToday} min talk`}
          icon={<Phone className="h-5 w-5" />}
          accent="indigo"
        />
        <DashboardStatCard
          label="Active pipeline"
          value={`£${stats.pipelineValue.toLocaleString()}`}
          note={`${stats.activeLeads} leads · ${stats.newLeadsWeek} new this week`}
          icon={<Target className="h-5 w-5" />}
          accent="violet"
        />
        <DashboardStatCard
          label="Open tasks"
          value={String(stats.openTasks)}
          note={`${stats.highPriorityTasks} high priority · ${stats.taskCompletionPct}% complete`}
          icon={<ListTodo className="h-5 w-5" />}
          accent="sky"
        />
        <DashboardStatCard
          label="Commission"
          value={`£${(stats.commissionPending + stats.commissionApproved).toLocaleString()}`}
          note={`£${stats.commissionPaidMonth.toLocaleString()} paid this month`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          accent="emerald"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <EmployeePanel className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</p>
              <h2 className="text-base font-bold text-slate-900">Calls — last 7 days</h2>
            </div>
            <Link href={employeeRoute("/calls")} className="flex items-center gap-1 text-xs font-bold text-blue-600">
              Log call <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <MeasuredChart className="h-[240px] min-w-0">
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={callsTrend}>
                <defs>
                  <linearGradient id="empCallsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip formatter={(v, n) => `${n}: ${v}`} />} />
                <Area type="monotone" dataKey="calls" name="Total calls" stroke="#6366f1" strokeWidth={2.5} fill="url(#empCallsFill)" />
                <Area type="monotone" dataKey="connected" name="Connected" stroke="#0ea5e9" strokeWidth={2} fill="transparent" />
              </AreaChart>
            )}
          </MeasuredChart>
        </EmployeePanel>

        <EmployeePanel>
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily targets</p>
            <h2 className="text-base font-bold text-slate-900">Progress today</h2>
          </div>
          <div className="space-y-5">
            <TargetBar label="Outbound calls" current={stats.callsToday} target={CALL_DAILY_TARGET} />
            <TargetBar
              label="Tasks completed"
              current={stats.tasksCompleted}
              target={Math.max(stats.tasksTotal, 1)}
            />
            <TargetBar
              label="Follow-ups cleared"
              current={Math.max(0, followUpTarget - stats.overdueLeads)}
              target={Math.max(followUpTarget, 1)}
            />
            {connectedTarget > 0 ? (
              <TargetBar label="Connected calls" current={stats.connectedToday} target={connectedTarget} />
            ) : null}
          </div>
          {stats.overdueLeads > 0 ? (
            <Link
              href={employeeRoute("/leads")}
              className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
            >
              <Zap className="h-4 w-4 text-amber-600" />
              {stats.overdueLeads} overdue follow-up{stats.overdueLeads > 1 ? "s" : ""} — act now
            </Link>
          ) : null}
        </EmployeePanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <EmployeePanel>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CRM</p>
              <h2 className="text-base font-bold text-slate-900">Lead pipeline</h2>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>
          {leadPipeline.length > 0 ? (
            <MeasuredChart className="h-[220px] min-w-0">
              {({ width, height }) => (
                <BarChart width={width} height={height} data={leadPipeline} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={72}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as { label: string; count: number; value: number };
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                          <p className="text-sm font-bold text-slate-900">{row.label}</p>
                          <p className="text-xs text-slate-500">{row.count} leads · £{row.value.toLocaleString()} value</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {leadPipeline.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </MeasuredChart>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No leads in pipeline yet.</p>
          )}
          <p className="mt-2 text-center text-xs text-slate-500">
            Won deals: <span className="font-bold text-emerald-600">£{stats.wonValue.toLocaleString()}</span>
          </p>
        </EmployeePanel>

        <EmployeePanel>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Earnings</p>
              <h2 className="text-base font-bold text-slate-900">Commission trend</h2>
            </div>
            <Link href={employeeRoute("/commission")} className="text-xs font-bold text-blue-600">
              View all
            </Link>
          </div>
          <MeasuredChart className="h-[220px] min-w-0">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={commissionTrend} barGap={4}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                        {payload.map((p) => (
                          <p key={p.name} className="text-xs font-semibold capitalize text-slate-800">
                            {p.name}: £{Number(p.value ?? 0).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="paid" name="paid" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="approved" name="approved" stackId="a" fill="#6366f1" />
                <Bar dataKey="pending" name="pending" stackId="a" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </EmployeePanel>

        <EmployeePanel>
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Breakdown</p>
            <h2 className="text-base font-bold text-slate-900">Lead status mix</h2>
          </div>
          {leadPipeline.length > 0 ? (
            <>
              <MeasuredChart className="mx-auto h-[160px] w-full max-w-[200px]">
                {({ width, height }) => (
                  <PieChart width={width} height={height}>
                    <Pie
                      data={leadPipeline}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {leadPipeline.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as { label: string; count: number };
                        return (
                          <div className="rounded-lg border bg-white px-2 py-1 text-xs font-semibold shadow">
                            {row.label}: {row.count}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                )}
              </MeasuredChart>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {leadPipeline.map((p) => (
                  <span key={p.status} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
                    {p.label} ({p.count})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No lead data yet.</p>
          )}
        </EmployeePanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <EmployeePanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due today</h2>
            <Link href={employeeRoute("/leads")} className="flex items-center gap-1 text-xs font-bold text-blue-600">
              CRM <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {dueTodayLeads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="rounded-xl border border-indigo-100/80 bg-indigo-50/40 px-4 py-3">
                <p className="font-semibold text-slate-900">{lead.company_name}</p>
                <p className="text-xs text-slate-500">{lead.contact_name ?? "No contact"} · Follow-up today</p>
              </div>
            ))}
            {overdueLeads.slice(0, 2).map((lead) => (
              <div key={lead.id} className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
                <p className="font-semibold text-slate-900">{lead.company_name}</p>
                <p className="text-xs text-amber-800/80">Overdue · {lead.next_follow_up}</p>
              </div>
            ))}
            {dueTodayLeads.length === 0 && overdueLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No follow-ups due — great job!</p>
            ) : null}
          </div>
        </EmployeePanel>

        <EmployeePanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming tasks</h2>
            <Link href={employeeRoute("/tasks")} className="flex items-center gap-1 text-xs font-bold text-blue-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {tasks
              .filter((t) => t.status !== "completed")
              .slice(0, 4)
              .map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    {task.due_date ? <p className="mt-0.5 text-xs text-slate-500">Due {task.due_date}</p> : null}
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            {tasks.filter((t) => t.status !== "completed").length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">All tasks complete!</p>
            ) : null}
          </div>
        </EmployeePanel>

        <EmployeePanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent calls</h2>
            <Link href={employeeRoute("/calls")} className="flex items-center gap-1 text-xs font-bold text-blue-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {calls.slice(0, 5).map((call) => (
              <div key={call.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold capitalize text-slate-900">
                    {call.company_name ?? `${call.direction} call`}
                  </p>
                  <p className="text-xs text-slate-500">{call.outcome ?? "No outcome"}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(call.called_at), { addSuffix: true })}
                </p>
              </div>
            ))}
            {calls.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Log your first call today.</p>
            ) : null}
          </div>
        </EmployeePanel>
      </div>
    </motion.div>
  );
}
