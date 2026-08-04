"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calculator,
  CircleDollarSign,
  Clock,
  Download,
  Landmark,
  Search,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  EmployeePageHeader,
  EmployeePanel,
  EmployeeStatCard,
  EmployeeStatGrid,
  EmployeeTableShell,
} from "@/components/employee/EmployeeShell";
import { useEmployeeCommissions, useEmployeeLeads, useEmployeeUserId } from "@/hooks/useEmployeeData";
import {
  COMMISSION_RULES,
  commissionStatusTone,
  commissionsToCsv,
  computeCommissionStats,
  downloadCommissionCsv,
  estimateCommission,
  filterCommissions,
  formatPeriodMonth,
  groupByMonth,
  maskAccountNumber,
} from "@/lib/employee-commission-utils";
import { employeeRoute } from "@/lib/employee-path";
import { fetchEmployeeOnboarding } from "@/lib/employee-onboarding";
import type { EmployeeCommission } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function EmployeeCommissionWorkspace() {
  const userId = useEmployeeUserId();
  const { rows, loading } = useEmployeeCommissions();
  const { rows: leads } = useEmployeeLeads();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "paid">("all");
  const [search, setSearch] = useState("");
  const [commissionRate, setCommissionRate] = useState(8);
  const [calcDealValue, setCalcDealValue] = useState("10000");

  const [bankAccountName, setBankAccountName] = useState("");
  const [bankSortCode, setBankSortCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankLoading, setBankLoading] = useState(true);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMessage, setBankMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setBankLoading(false);
      return;
    }

    Promise.all([
      fetchEmployeeOnboarding(supabase, userId),
      supabase.from("employee_profiles").select("commission_rate, bank_account_name, bank_sort_code, bank_account_number").eq("id", userId).maybeSingle(),
    ]).then(([onboarding, profile]) => {
      const bank = profile.data ?? onboarding;
      if (bank) {
        setBankAccountName(bank.bank_account_name || "");
        setBankSortCode(bank.bank_sort_code || "");
        setBankAccountNumber(bank.bank_account_number || "");
      }
      if (profile.data?.commission_rate != null) {
        setCommissionRate(Number(profile.data.commission_rate));
      }
      setBankLoading(false);
    });
  }, [userId]);

  const stats = useMemo(() => computeCommissionStats(rows), [rows]);
  const monthly = useMemo(() => groupByMonth(rows), [rows]);
  const filtered = useMemo(
    () => filterCommissions(rows, statusFilter, search),
    [rows, statusFilter, search]
  );
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const pipelineLeads = useMemo(() => {
    const commissionedLeadIds = new Set(rows.map((r) => r.lead_id).filter(Boolean));
    return leads.filter(
      (l) =>
        l.status === "won" &&
        l.value_gbp &&
        !commissionedLeadIds.has(l.id)
    );
  }, [leads, rows]);

  const hasBankDetails = Boolean(bankAccountName.trim() && bankSortCode.trim() && bankAccountNumber.trim());
  const nextPayout = stats.approved + stats.pending > 0 ? "End of month (after admin approval)" : "—";
  const calcResult = estimateCommission(Number(calcDealValue) || 0, commissionRate);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setBankMessage("Sign in to save bank details.");
      return;
    }
    if (!bankAccountName.trim() || !bankSortCode.trim() || !bankAccountNumber.trim()) {
      setBankMessage("Please complete all bank fields.");
      return;
    }

    setBankSaving(true);
    setBankMessage(null);

    const bank = {
      bank_account_name: bankAccountName.trim(),
      bank_sort_code: bankSortCode.trim(),
      bank_account_number: bankAccountNumber.trim(),
    };

    const { error } = await supabase.from("employee_profiles").upsert({
      id: userId,
      ...bank,
      updated_at: new Date().toISOString(),
    });

    setBankSaving(false);
    setBankMessage(error ? error.message : "Bank details saved.");
  };

  const btnSecondary =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50";

  return (
    <div>
      <EmployeePageHeader
        title="My Commission"
        description="Track earnings, payouts, and deal commission — linked to your CRM wins."
        action={
          <button
            type="button"
            className={btnSecondary}
            onClick={() =>
              downloadCommissionCsv(
                `commission-${new Date().toISOString().slice(0, 10)}.csv`,
                commissionsToCsv(rows)
              )
            }
          >
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {!userId ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to view commission records and save bank details.
        </p>
      ) : null}

      <EmployeeStatGrid>
        <EmployeeStatCard
          label="Pending"
          value={`£${stats.pending.toLocaleString()}`}
          note={`${stats.countPending} awaiting approval`}
          icon={<Clock className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Approved"
          value={`£${stats.approved.toLocaleString()}`}
          note="Ready for next payout"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Paid (all time)"
          value={`£${stats.paidAllTime.toLocaleString()}`}
          note={`£${stats.paidThisMonth.toLocaleString()} this month`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <EmployeeStatCard
          label="Your rate"
          value={`${commissionRate}%`}
          note={`£${stats.thisMonthTotal.toLocaleString()} this month`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </EmployeeStatGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EmployeePanel>
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-900">Commission Calculator</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Estimate commission on a deal before closing. Your rate: <strong>{commissionRate}%</strong>
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Deal value (£)</label>
              <input
                type="number"
                value={calcDealValue}
                onChange={(e) => setCalcDealValue(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">You earn</p>
              <p className="text-2xl font-bold text-emerald-600">£{calcResult.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Example: £10,000 deal × {commissionRate}% = £{estimateCommission(10000, commissionRate).toLocaleString()}
          </p>
        </EmployeePanel>

        <EmployeePanel>
          <h2 className="mb-4 font-bold text-slate-900">Monthly earnings</h2>
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-400">No commission history yet.</p>
          ) : (
            <ul className="space-y-3">
              {monthly.slice(0, 6).map((m) => (
                <li key={m.month}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-slate-800">{m.label}</span>
                    <span className="font-bold text-slate-900">£{m.total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#BFFF07]"
                      style={{ width: `${m.total ? Math.round((m.paid / m.total) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">£{m.paid.toLocaleString()} paid</p>
                </li>
              ))}
            </ul>
          )}
        </EmployeePanel>
      </div>

      <EmployeePanel className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next payout</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{nextPayout}</p>
            <p className="text-xs text-slate-500">
              Approved + pending: £{(stats.approved + stats.pending).toLocaleString()}
            </p>
          </div>
          {hasBankDetails ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
              <p className="font-semibold text-emerald-800">Payout account on file</p>
              <p className="text-emerald-700">{bankAccountName} · {maskAccountNumber(bankAccountNumber)}</p>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add bank details below to receive payouts.
            </p>
          )}
        </div>
      </EmployeePanel>

      {pipelineLeads.length > 0 ? (
        <EmployeePanel className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Won deals — commission pending</h2>
            </div>
            <Link href={employeeRoute("/leads")} className="text-xs font-bold text-blue-600 hover:underline">
              Open CRM
            </Link>
          </div>
          <ul className="space-y-2">
            {pipelineLeads.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{l.company_name}</p>
                  <p className="text-xs text-slate-500">Deal £{Number(l.value_gbp).toLocaleString()}</p>
                </div>
                <p className="font-bold text-emerald-600">
                  Est. £{estimateCommission(Number(l.value_gbp), commissionRate).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </EmployeePanel>
      ) : null}

      <EmployeePanel className="mt-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bank details</h2>
            <p className="mt-1 text-sm text-slate-500">Commission payouts are sent to this account.</p>
          </div>
        </div>
        {bankLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <form onSubmit={handleSaveBank} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account holder name</label>
              <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} disabled={!userId} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm disabled:opacity-50" placeholder="Name as on bank account" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort code</label>
                <input value={bankSortCode} onChange={(e) => setBankSortCode(e.target.value)} disabled={!userId} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm disabled:opacity-50" placeholder="00-00-00" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account number</label>
                <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} disabled={!userId} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm disabled:opacity-50" placeholder="12345678" />
              </div>
            </div>
            {bankMessage ? <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{bankMessage}</p> : null}
            <button type="submit" disabled={!userId || bankSaving} className="rounded-2xl bg-[#FFD666] px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-[#f5c84d] disabled:opacity-50">
              {bankSaving ? "Saving…" : hasBankDetails ? "Update bank details" : "Save bank details"}
            </button>
          </form>
        )}
      </EmployeePanel>

      <EmployeePanel className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <h2 className="font-bold text-slate-900">How commission works</h2>
        </div>
        <ul className="space-y-2">
          {COMMISSION_RULES.map((rule) => (
            <li key={rule} className="flex gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span> {rule}
            </li>
          ))}
        </ul>
        <Link href={employeeRoute("/training")} className="mt-4 inline-flex text-xs font-bold text-blue-600 hover:underline">
          Read full Commission Rules in Training →
        </Link>
      </EmployeePanel>

      <EmployeePanel className="mt-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Commission history</h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search deals, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm"
              />
            </div>
            {(["all", "pending", "approved", "paid"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold capitalize transition",
                  statusFilter === s ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <EmployeeTableShell>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4">Deal / Company</th>
                  <th className="px-5 py-4">Deal value</th>
                  <th className="px-5 py-4">Commission</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No commission records match.</td></tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "cursor-pointer transition hover:bg-slate-50/80",
                        selectedId === row.id && "bg-blue-50/60 ring-1 ring-inset ring-blue-200"
                      )}
                    >
                      <td className="px-5 py-4 text-slate-600">{formatPeriodMonth(row.period_month)}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{row.company_name ?? "—"}</p>
                        {row.notes ? <p className="max-w-xs truncate text-xs text-slate-500">{row.notes}</p> : null}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.deal_value_gbp ? `£${Number(row.deal_value_gbp).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">£{Number(row.amount_gbp).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", commissionStatusTone(row.status))}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </EmployeeTableShell>

          {selected ? (
            <EmployeePanel className="sticky top-24 h-fit">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commission detail</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">£{Number(selected.amount_gbp).toLocaleString()}</h3>
              <span className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", commissionStatusTone(selected.status))}>
                {selected.status}
              </span>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-400">Period</dt><dd className="font-medium">{formatPeriodMonth(selected.period_month)}</dd></div>
                {selected.company_name ? (
                  <div className="flex justify-between"><dt className="text-slate-400">Company</dt><dd className="font-medium">{selected.company_name}</dd></div>
                ) : null}
                {selected.deal_value_gbp ? (
                  <div className="flex justify-between"><dt className="text-slate-400">Deal value</dt><dd className="font-medium">£{Number(selected.deal_value_gbp).toLocaleString()}</dd></div>
                ) : null}
                <div className="flex justify-between"><dt className="text-slate-400">Rate applied</dt><dd className="font-medium">{commissionRate}%</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Logged</dt><dd className="font-medium">{new Date(selected.created_at).toLocaleDateString("en-GB")}</dd></div>
              </dl>
              {selected.notes ? (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{selected.notes}</p>
                </div>
              ) : null}
              {selected.status === "pending" ? (
                <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Waiting for admin approval in HR panel.
                </p>
              ) : null}
              {selected.status === "approved" ? (
                <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Approved — included in next monthly payout.
                </p>
              ) : null}
            </EmployeePanel>
          ) : (
            <EmployeePanel className="sticky top-24 flex h-fit flex-col items-center py-12 text-center">
              <CircleDollarSign className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">Select a record</p>
              <p className="mt-1 text-xs text-slate-500">View deal and payout status.</p>
            </EmployeePanel>
          )}
        </div>
      </EmployeePanel>
    </div>
  );
}
