"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2, MessageSquare, RefreshCcw, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-data-client";
import { adminFetchResilient } from "@/lib/admin-fetch-resilient";
import { adminQueryDefaults } from "@/lib/admin-query";
import {
  getFeedbackRoleLabel,
  getFeedbackTypeLabel,
  type FeedbackRecord,
  type FeedbackStatus,
} from "@/lib/feedback-content";
import { AdminKpiCard, AdminPageHero, AdminPageShell, AdminPanel } from "@/components/admin/AdminPageShell";
import { ADMIN_CARD, ADMIN_INPUT } from "@/lib/admin-ui";

type FeedbackResponse = {
  feedback: FeedbackRecord[];
  stats: {
    total: number;
    new: number;
    reviewed: number;
    resolved: number;
  };
};

type StatusFilter = "all" | FeedbackStatus;

const CARD = ADMIN_CARD;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy HH:mm");
}

async function fetchFeedback() {
  return adminFetchResilient<FeedbackResponse>("/api/admin/feedback", async () => ({
    feedback: [],
    stats: { total: 0, new: 0, reviewed: 0, resolved: 0 },
  }));
}

export default function AdminFeedbackPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: fetchFeedback,
    ...adminQueryDefaults,
  });

  const rows = data?.feedback ?? [];
  const stats = data?.stats ?? { total: 0, new: 0, reviewed: 0, resolved: 0 };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        row.full_name,
        row.email,
        row.subject,
        row.message,
        row.user_role,
        row.feedback_type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, statusFilter]);

  const selected = filteredRows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null;

  const updateFeedback = async (id: string, status: FeedbackStatus, adminNotes?: string) => {
    setBusyId(id);
    try {
      await adminFetch("/api/admin/feedback", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          status,
          adminNotes,
        }),
      });
      toast.success("Feedback updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update feedback.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHero
        eyebrow="Community"
        title="User Feedback"
        description="Product feedback from carriers, suppliers, and website visitors submitted through /feedback."
        icon={MessageSquare}
        accent="violet"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: stats.total, accent: "slate" as const },
          { label: "New", value: stats.new, accent: "blue" as const },
          { label: "Reviewed", value: stats.reviewed, accent: "amber" as const },
          { label: "Resolved", value: stats.resolved, accent: "emerald" as const },
        ].map((item) => (
          <AdminKpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={MessageSquare}
            accent={item.accent}
          />
        ))}
      </div>

      <AdminPanel className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, message..."
            className={cn(ADMIN_INPUT, "pl-10")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "reviewed", "resolved"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]",
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </AdminPanel>

      {isLoading ? (
        <div className={`${CARD} flex items-center justify-center py-20`}>
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className={`${CARD} py-20 text-center`}>
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No feedback yet</p>
          <p className="mt-2 text-sm text-slate-500">Submissions from /feedback will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className={`${CARD} max-h-[720px] overflow-y-auto`}>
            {filteredRows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setSelectedId(row.id);
                  setNotesDraft(row.admin_notes ?? "");
                }}
                className={cn(
                  "w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50",
                  selected?.id === row.id && "bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{row.full_name}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                    {row.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{getFeedbackTypeLabel(row.feedback_type)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{row.message}</p>
                <p className="mt-2 text-[11px] text-slate-400">{formatDate(row.created_at)}</p>
              </button>
            ))}
          </div>

          {selected ? (
            <div className={`${CARD} space-y-6 p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selected.full_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.email}</p>
                </div>
                {selected.rating ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    <Star className="h-4 w-4 fill-current" />
                    {selected.rating}/5
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Role</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{getFeedbackRoleLabel(selected.user_role)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{getFeedbackTypeLabel(selected.feedback_type)}</p>
                </div>
              </div>

              {selected.subject ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Subject</p>
                  <p className="mt-2 text-sm text-slate-700">{selected.subject}</p>
                </div>
              ) : null}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Message</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.message}</p>
              </div>

              {selected.page_url ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Submitted from</p>
                  <a href={selected.page_url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-violet-700 hover:underline">
                    {selected.page_url}
                  </a>
                </div>
              ) : null}

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Admin notes</span>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={busyId === selected.id}
                  onClick={() => updateFeedback(selected.id, "reviewed", notesDraft)}
                >
                  Mark reviewed
                </Button>
                <Button
                  variant="secondary"
                  disabled={busyId === selected.id}
                  onClick={() => updateFeedback(selected.id, "resolved", notesDraft)}
                >
                  Mark resolved
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === selected.id}
                  onClick={() => updateFeedback(selected.id, selected.status, notesDraft)}
                >
                  Save notes
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
