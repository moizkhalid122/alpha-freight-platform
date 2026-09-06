"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Clapperboard,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditorIntakeLinkCard from "@/components/admin/EditorIntakeLinkCard";
import { AdminKpiCard, AdminPageHero, AdminPageShell, AdminPanel } from "@/components/admin/AdminPageShell";
import { adminFetch } from "@/lib/admin-data-client";
import { adminQueryDefaults } from "@/lib/admin-query";
import { parseEditorIntakeMetadata } from "@/lib/editor-intake-admin";
import type { InquiryRecord, InquiryStatus } from "@/lib/inquiry-content";
import { ADMIN_CARD, ADMIN_INPUT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | InquiryStatus;

type InquiriesResponse = {
  inquiries: InquiryRecord[];
  stats: {
    total: number;
    new: number;
    read: number;
    replied: number;
    resolved: number;
  };
};

const CARD = ADMIN_CARD;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy HH:mm");
}

async function fetchEditorIntake() {
  return adminFetch<InquiriesResponse>("/api/admin/inquiries?type=editor_intake");
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function LinkField({ label, href }: { label: string; href: string | null | undefined }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
    >
      <span>{label}</span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </a>
  );
}

export default function AdminEditorIntakePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-editor-intake"],
    queryFn: fetchEditorIntake,
    ...adminQueryDefaults,
  });

  const rows = data?.inquiries ?? [];
  const stats = data?.stats ?? { total: 0, new: 0, read: 0, replied: 0, resolved: 0 };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!query) return true;
      const meta = parseEditorIntakeMetadata(row.metadata);
      const haystack = [
        row.full_name,
        row.email,
        row.phone,
        meta.roleLabel,
        meta.genderLabel,
        meta.portfolio_url,
        meta.city,
        meta.country,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, statusFilter]);

  const selected = filteredRows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null;
  const selectedMeta = selected ? parseEditorIntakeMetadata(selected.metadata) : null;

  const updateSubmission = async (id: string, status: InquiryStatus, adminNotes?: string) => {
    setBusyId(id);
    try {
      await adminFetch("/api/admin/inquiries", {
        method: "PATCH",
        body: JSON.stringify({ id, status, adminNotes }),
      });
      toast.success("Submission updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-editor-intake"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update submission.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHero
        eyebrow="HR & Creative"
        title="Editor Intake"
        description="All private editor form submissions — photo, ID, portfolio, and contact details in one place."
        icon={Clapperboard}
        accent="violet"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <EditorIntakeLinkCard />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total", value: stats.total, accent: "slate" as const },
          { label: "New", value: stats.new, accent: "blue" as const },
          { label: "Read", value: stats.read, accent: "amber" as const },
          { label: "Replied", value: stats.replied, accent: "violet" as const },
          { label: "Resolved", value: stats.resolved, accent: "emerald" as const },
        ].map((item) => (
          <AdminKpiCard key={item.label} label={item.label} value={item.value} icon={UserRound} accent={item.accent} />
        ))}
      </div>

      <AdminPanel className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, role, city..."
            className={cn(ADMIN_INPUT, "pl-10")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "read", "replied", "resolved"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]",
                statusFilter === status
                  ? "bg-violet-600 text-white shadow-sm"
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
          <Clapperboard className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No editor submissions yet</p>
          <p className="mt-2 text-sm text-slate-500">Share the private form link above. Submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className={`${CARD} max-h-[720px] overflow-y-auto`}>
            {filteredRows.map((row) => {
              const meta = parseEditorIntakeMetadata(row.metadata);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(row.id);
                    setNotesDraft(row.admin_notes ?? "");
                  }}
                  className={cn(
                    "w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50",
                    selected?.id === row.id && "bg-violet-50/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{row.full_name}</p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                        row.status === "new" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-violet-700">{meta.roleLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.email}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(row.created_at)}</p>
                </button>
              );
            })}
          </div>

          {selected && selectedMeta ? (
            <div className={`${CARD} space-y-6 p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {selectedMeta.photo_url ? (
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    <Image
                      src={selectedMeta.photo_url}
                      alt={selected.full_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{selected.full_name}</h2>
                  <p className="mt-1 text-sm font-semibold text-violet-700">{selectedMeta.roleLabel}</p>
                  <p className="mt-2 text-sm text-slate-600">{selected.email}</p>
                  {selected.phone ? <p className="text-sm text-slate-600">{selected.phone}</p> : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Gender" value={selectedMeta.genderLabel} />
                <DetailField label="Experience" value={selectedMeta.experience_years ? `${selectedMeta.experience_years} years` : null} />
                <DetailField label="Preferred start" value={selectedMeta.preferred_start_date ?? null} />
                <DetailField label="Location" value={[selectedMeta.city, selectedMeta.country].filter(Boolean).join(", ") || null} />
                <DetailField label="WhatsApp" value={selectedMeta.whatsapp ?? null} />
                <DetailField label="Received" value={formatDate(selected.created_at)} />
              </div>

              <DetailField label="Address" value={selectedMeta.address ?? null} />
              <DetailField label="Tools" value={selectedMeta.tools ?? null} />
              <DetailField label="Equipment" value={selectedMeta.equipment ?? null} />

              <div className="grid gap-3 sm:grid-cols-2">
                <LinkField label="Open portfolio" href={selectedMeta.portfolio_url ?? null} />
                <LinkField label="Open LinkedIn" href={selectedMeta.linkedin_url ?? null} />
                <LinkField label="Open Instagram" href={selectedMeta.instagram_url ?? null} />
                <LinkField label="Open ID document" href={selectedMeta.id_document_url ?? null} />
              </div>

              {selected.message ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Notes from applicant</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.message.split("\n\n").slice(-1)[0]}</p>
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
                <Button disabled={busyId === selected.id} onClick={() => updateSubmission(selected.id, "read", notesDraft)}>
                  Mark read
                </Button>
                <Button variant="secondary" disabled={busyId === selected.id} onClick={() => updateSubmission(selected.id, "replied", notesDraft)}>
                  Mark replied
                </Button>
                <Button variant="secondary" disabled={busyId === selected.id} onClick={() => updateSubmission(selected.id, "resolved", notesDraft)}>
                  Mark resolved
                </Button>
                <Button variant="ghost" disabled={busyId === selected.id} onClick={() => updateSubmission(selected.id, selected.status, notesDraft)}>
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
