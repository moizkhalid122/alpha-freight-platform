"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Gift,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-data-client";
import { adminFetchResilient } from "@/lib/admin-fetch-resilient";
import { adminQueryDefaults } from "@/lib/admin-query";
import type { AdminReferralRow } from "@/lib/admin-referrals";
import { cn } from "@/lib/utils";
import { AdminKpiCard, AdminPageHero, AdminPageShell } from "@/components/admin/AdminPageShell";
import { ADMIN_CARD, ADMIN_INPUT } from "@/lib/admin-ui";

type ReferralsResponse = {
  referrals: AdminReferralRow[];
  stats: {
    total: number;
    pendingApproval: number;
    readyToRelease: number;
    rewarded: number;
  };
};

type FilterValue = "all" | "carrier" | "supplier";
type QueueFilter = "all" | "needs_approval" | "ready_reward" | "rewarded";

const CARD = ADMIN_CARD;

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy");
}

async function fetchReferrals(type: FilterValue) {
  return adminFetchResilient<ReferralsResponse>(`/api/admin/referrals?type=${type}`, async () => ({
    referrals: [],
    stats: { total: 0, pendingApproval: 0, readyToRelease: 0, rewarded: 0 },
  }));
}

export default function AdminReferralsPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-referrals", typeFilter],
    queryFn: () => fetchReferrals(typeFilter),
    ...adminQueryDefaults,
  });

  const referrals = data?.referrals ?? [];
  const stats = data?.stats ?? {
    total: 0,
    pendingApproval: 0,
    readyToRelease: 0,
    rewarded: 0,
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return referrals.filter((row) => {
      if (queueFilter === "needs_approval" && !row.canApproveUser) return false;
      if (queueFilter === "ready_reward" && !row.canReleaseReward) return false;
      if (queueFilter === "rewarded" && row.earnedAmount <= 0 && row.status !== "rewarded") {
        return false;
      }

      if (!query) return true;

      const haystack = [
        row.referrer.name,
        row.referredUser.name,
        row.referralCode,
        row.type,
        row.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [referrals, queueFilter, search]);

  const handleApproveUser = async (row: AdminReferralRow) => {
    const key = `approve-${row.id}`;
    setBusyKey(key);
    try {
      await adminFetch("/api/admin/referrals", {
        method: "PATCH",
        body: JSON.stringify({
          action: "approve_user",
          referredUserId: row.referredUser.id,
        }),
      });
      toast.success(`${row.referredUser.name} approved for referral rewards.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve user.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleReleaseReward = async (row: AdminReferralRow) => {
    const key = `release-${row.id}`;
    setBusyKey(key);
    try {
      await adminFetch("/api/admin/referrals", {
        method: "PATCH",
        body: JSON.stringify({
          action: "release_reward",
          referralId: row.id,
          type: row.type,
        }),
      });
      toast.success(`Released ${formatMoney(row.rewardAmount)} to ${row.referrer.name}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to release reward.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHero
        eyebrow="Referral control"
        title="Referral approvals"
        description="Review referred users, approve their accounts, and release referral rewards once milestones are complete."
        icon={Gift}
        accent="violet"
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total referrals", value: stats.total, icon: Users, accent: "slate" as const },
          { label: "Needs approval", value: stats.pendingApproval, icon: ShieldCheck, accent: "amber" as const },
          { label: "Ready to release", value: stats.readyToRelease, icon: Sparkles, accent: "blue" as const },
          { label: "Rewards released", value: stats.rewarded, icon: CheckCircle2, accent: "emerald" as const },
        ].map((item) => (
          <AdminKpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            accent={item.accent}
          />
        ))}
      </div>

      <div className={`${CARD} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search referrer, referred user, or code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["needs_approval", "Needs approval"],
                ["ready_reward", "Ready reward"],
                ["rewarded", "Rewarded"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setQueueFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  queueFilter === value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All types"],
                ["carrier", "Carrier"],
                ["supplier", "Supplier"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  typeFilter === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <Gift className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-900">No referrals found</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Referrals will appear here when carriers or suppliers sign up using a referral link or code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Referred user</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Milestone</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const approveBusy = busyKey === `approve-${row.id}`;
                  const releaseBusy = busyKey === `release-${row.id}`;

                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{row.referrer.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">{row.referralCode}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{row.referredUser.name}</p>
                        <Link
                          href={
                            row.type === "carrier"
                              ? `/ops-af-7x9k2/carriers/${row.referredUser.id}`
                              : `/ops-af-7x9k2/suppliers/${row.referredUser.id}`
                          }
                          className="mt-0.5 inline-block text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View profile
                        </Link>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-700">{row.type}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.loadsCompleted}/{row.milestoneLoads}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {row.type === "carrier" ? "loads" : "shipments"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            row.referredUser.isReferralApproved
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {row.referredUser.isReferralApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.earnedAmount > 0 ? formatMoney(row.earnedAmount) : formatMoney(row.rewardAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {row.status === "rewarded" || row.earnedAmount > 0 ? "Released" : "Pending"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!row.canApproveUser || approveBusy || releaseBusy}
                            onClick={() => void handleApproveUser(row)}
                            className="justify-start rounded-lg"
                          >
                            {approveBusy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            Approve referred user
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!row.canReleaseReward || approveBusy || releaseBusy}
                            onClick={() => void handleReleaseReward(row)}
                            className="justify-start rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {releaseBusy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Release reward
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
