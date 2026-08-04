"use client";

import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  Clock,
  Palmtree,
  Plus,
  Stethoscope,
  Wallet,
} from "lucide-react";
import {
  EmployeePageHeader,
  EmployeePanel,
  StatusBadge,
} from "@/components/employee/EmployeeShell";
import LeaveSubmittedOverlay from "@/components/employee/LeaveSubmittedOverlay";
import NothingLottie from "@/components/ui/NothingLottie";
import { useEmployeeLeave } from "@/hooks/useEmployeeData";
import type { EmployeeLeaveRequest } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const LEAVE_TYPES = [
  { value: "annual", label: "Annual leave", icon: Palmtree, accent: "indigo" as const },
  { value: "sick", label: "Sick leave", icon: Stethoscope, accent: "sky" as const },
  { value: "unpaid", label: "Unpaid leave", icon: Wallet, accent: "violet" as const },
  { value: "other", label: "Other", icon: Calendar, accent: "slate" as const },
];

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10";

const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400";

function leaveDays(start: string, end: string): number {
  try {
    return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
  } catch {
    return 1;
  }
}

function BalanceCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent: "indigo" | "sky" | "emerald" | "amber";
}) {
  const styles = {
    indigo: "border-indigo-100 bg-indigo-50/50 text-indigo-600",
    sky: "border-sky-100 bg-sky-50/50 text-sky-600",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-600",
    amber: "border-amber-100 bg-amber-50/50 text-amber-600",
  };

  return (
    <div className={cn("rounded-2xl border p-4", styles[accent])}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium opacity-60">{note}</p>
    </div>
  );
}

export default function EmployeeLeaveWorkspace() {
  const { rows, loading, userId, refetch } = useEmployeeLeave();

  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{ days: number; leaveLabel: string } | null>(null);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const approvedDays = rows
      .filter((r) => r.status === "approved")
      .reduce((s, r) => s + leaveDays(r.start_date, r.end_date), 0);
    return { pending, approved, approvedDays };
  }, [rows]);

  const requestedDays = startDate && endDate ? leaveDays(startDate, endDate) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!userId) {
      setMessage({ type: "err", text: "Sign in to submit leave requests." });
      return;
    }

    if (!startDate || !endDate) return;

    setSubmitting(true);
    const { error } = await supabase.from("employee_leave_requests").insert({
      employee_id: userId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
    });

    setSubmitting(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
    } else {
      const leaveLabel = LEAVE_TYPES.find((t) => t.value === leaveType)?.label ?? "Leave";
      setSubmittedSummary({ days: requestedDays, leaveLabel });
      setShowSuccessOverlay(true);
      setMessage(null);
      setStartDate("");
      setEndDate("");
      setReason("");
      await refetch();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <EmployeePageHeader
        title="Leave Request"
        description="Submit annual, sick, or unpaid leave — track approval status in one place."
      />

      {!userId ? (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to submit and view leave requests.
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard label="Annual balance" value="22 days" note="Remaining this year" accent="indigo" />
        <BalanceCard label="Sick leave" value="5 days" note="Paid sick allowance" accent="sky" />
        <BalanceCard label="Approved (YTD)" value={`${stats.approvedDays} days`} note={`${stats.approved} request(s)`} accent="emerald" />
        <BalanceCard label="Pending" value={String(stats.pending)} note="Awaiting approval" accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New request</h2>
              <p className="text-xs text-slate-500">Submit for manager approval</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Leave type</label>
              <div className="grid grid-cols-2 gap-2">
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = leaveType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setLeaveType(type.value)}
                      disabled={!userId}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition disabled:opacity-50",
                        active
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!userId}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!userId}
                  className={inputClass}
                />
              </div>
            </div>

            {requestedDays > 0 ? (
              <p className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs font-semibold text-indigo-700">
                Requesting <strong>{requestedDays}</strong> day{requestedDays !== 1 ? "s" : ""} of leave
              </p>
            ) : null}

            <div>
              <label className={labelClass}>Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={!userId}
                className={cn(inputClass, "h-auto py-3")}
                placeholder="Brief reason for your manager…"
              />
            </div>

            {message?.type === "err" ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-sm font-medium text-amber-900">
                {message.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!userId || submitting}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </EmployeePanel>

        <div className="space-y-4">
          <EmployeePanel className="rounded-2xl border-slate-200/80 p-0 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Request history</h2>
                  <p className="text-xs text-slate-500">{rows.length} total request(s)</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12">
                <NothingLottie className="h-40 w-40" />
                <p className="mt-1 text-center text-sm text-slate-400">No leave requests yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const days = leaveDays(row.start_date, row.end_date);
                  const typeMeta = LEAVE_TYPES.find((t) => t.value === row.leave_type);
                  const Icon = typeMeta?.icon ?? Calendar;
                  return (
                    <div key={row.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/50">
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-slate-900">
                            {typeMeta?.label ?? row.leave_type}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {format(parseISO(row.start_date), "d MMM yyyy")} →{" "}
                            {format(parseISO(row.end_date), "d MMM yyyy")}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {days} day{days !== 1 ? "s" : ""}
                            {row.reason ? ` · ${row.reason}` : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </EmployeePanel>
        </div>
      </div>

      <LeaveSubmittedOverlay
        open={showSuccessOverlay}
        days={submittedSummary?.days ?? 1}
        leaveLabel={submittedSummary?.leaveLabel ?? "Leave"}
        onClose={() => setShowSuccessOverlay(false)}
      />
    </motion.div>
  );
}
