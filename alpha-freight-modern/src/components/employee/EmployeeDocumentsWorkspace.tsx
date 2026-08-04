"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  FolderOpen,
  Search,
  Upload,
  User,
} from "lucide-react";
import EmployeeModal from "@/components/employee/EmployeeModal";
import {
  EmployeePageHeader,
  EmployeePanel,
  EmployeeStatCard,
  EmployeeStatGrid,
} from "@/components/employee/EmployeeShell";
import { useEmployeeDocuments } from "@/hooks/useEmployeeData";
import {
  CATEGORY_META,
  computeDocumentStats,
  DOCUMENT_CATEGORIES,
  documentsToCsv,
  downloadDocListCsv,
  fileExtension,
  filterDocuments,
  formatFileSize,
  loadReadDocIds,
  markDocRead,
} from "@/lib/employee-documents-utils";
import { employeeRoute } from "@/lib/employee-path";
import type { EmployeeDocument } from "@/lib/employee-types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function EmployeeDocumentsWorkspace() {
  const { rows, loading, userId, refetch } = useEmployeeDocuments();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState<"all" | "company" | "personal">("all");
  const [search, setSearch] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) setReadIds(loadReadDocIds(userId));
  }, [userId, rows]);

  const stats = useMemo(() => computeDocumentStats(rows, readIds), [rows, readIds]);
  const filtered = useMemo(
    () => filterDocuments(rows, category, scope, search),
    [rows, category, scope, search]
  );
  const selected = rows.find((d) => d.id === selectedId) ?? null;
  const requiredDocs = useMemo(() => rows.filter((d) => d.is_required), [rows]);

  const handleMarkRead = (docId: string) => {
    if (!userId) return;
    markDocRead(userId, docId);
    setReadIds(loadReadDocIds(userId));
  };

  const handleUpload = async () => {
    if (!userId) {
      setActionError("Sign in to upload documents.");
      return;
    }
    if (!uploadTitle.trim() || !uploadFile) return;
    setUploading(true);
    setActionError(null);

    const { data, error } = await supabase
      .from("employee_documents")
      .insert({
        employee_id: userId,
        title: uploadTitle.trim(),
        category: "personal",
        file_name: uploadFile.name,
        file_size_kb: Math.round(uploadFile.size / 1024),
        description: "Uploaded by employee",
      })
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      setUploading(false);
      return;
    }

    await refetch();
    setUploading(false);
    setShowUpload(false);
    setUploadTitle("");
    setUploadFile(null);
    setSelectedId((data as EmployeeDocument).id);
  };

  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-[#FFD666] px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-[#f5c84d] disabled:opacity-50";
  const btnSecondary =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50";

  return (
    <div>
      <EmployeePageHeader
        title="Documents"
        description="Company policies, sales scripts, contracts, and your personal files — all in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                downloadDocListCsv(
                  `documents-${new Date().toISOString().slice(0, 10)}.csv`,
                  documentsToCsv(rows)
                )
              }
            >
              <Download className="h-4 w-4" /> Export list
            </button>
            <button type="button" className={btnPrimary} disabled={!userId} onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4" /> Upload file
            </button>
          </div>
        }
      />

      {!userId ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sign in to view company documents and upload personal files.
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      <EmployeeStatGrid>
        <EmployeeStatCard label="Total documents" value={String(stats.total)} note={`${stats.company} company · ${stats.personal} personal`} icon={<FolderOpen className="h-5 w-5" />} />
        <EmployeeStatCard label="Required reading" value={`${stats.requiredRead}/${stats.required}`} note="Must read before go-live" icon={<BookOpen className="h-5 w-5" />} />
        <EmployeeStatCard label="Sales resources" value={String(rows.filter((d) => d.category === "sales").length)} note="Scripts & templates" icon={<FileText className="h-5 w-5" />} />
        <EmployeeStatCard label="Policies" value={String(rows.filter((d) => d.category === "policy" || d.category === "compliance").length)} note="Compliance docs" icon={<Building2 className="h-5 w-5" />} />
      </EmployeeStatGrid>

      {requiredDocs.length > 0 ? (
        <EmployeePanel className="mt-6">
          <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Required reading</h2>
          <ul className="space-y-2">
            {requiredDocs.map((doc) => {
              const read = readIds.has(doc.id);
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(doc.id); if (!read && userId) handleMarkRead(doc.id); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-left transition hover:bg-white"
                  >
                    {read ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-amber-500" />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900">{doc.title}</span>
                      <span className="text-xs text-slate-500">{read ? "Read" : "Not read yet"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#BFFF07] transition-all"
              style={{ width: `${stats.required ? Math.round((stats.requiredRead / stats.required) * 100) : 0}%` }}
            />
          </div>
        </EmployeePanel>
      ) : null}

      <EmployeePanel className="mt-6">
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "company", "personal"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold capitalize transition",
                  scope === s ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {s === "all" ? "All" : s === "company" ? "Company" : "My files"}
              </button>
            ))}
            {DOCUMENT_CATEGORIES.filter((c) => c.value !== "all").map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(category === c.value ? "all" : c.value)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold transition",
                  category === c.value ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </EmployeePanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <EmployeePanel className="col-span-full py-12 text-center text-slate-400">Loading documents…</EmployeePanel>
          ) : filtered.length === 0 ? (
            <EmployeePanel className="col-span-full py-12 text-center text-slate-400">No documents match your filters.</EmployeePanel>
          ) : (
            filtered.map((doc) => {
              const meta = CATEGORY_META[doc.category] ?? CATEGORY_META.other;
              const read = readIds.has(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={cn(
                    "flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md",
                    selectedId === doc.id && "border-blue-300 ring-2 ring-blue-100",
                    doc.is_required && !read && "border-amber-200"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg text-[#BFFF07]">
                      {meta.icon}
                    </div>
                    {doc.is_required ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Required</span>
                    ) : null}
                  </div>
                  <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold", meta.tone)}>{meta.label}</span>
                  <h3 className="mt-2 line-clamp-2 font-bold text-slate-900">{doc.title}</h3>
                  {doc.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{doc.description}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      {doc.employee_id ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {doc.employee_id ? "Personal" : "Company"}
                    </span>
                    <span>{fileExtension(doc.file_name)} · {formatFileSize(doc.file_size_kb)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected ? (
          <EmployeePanel className="sticky top-24 h-fit">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{selected.title}</h3>
            <span className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", (CATEGORY_META[selected.category] ?? CATEGORY_META.other).tone)}>
              {(CATEGORY_META[selected.category] ?? CATEGORY_META.other).label}
            </span>
            {selected.description ? <p className="mt-3 text-sm text-slate-600">{selected.description}</p> : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">File</dt><dd className="font-medium">{selected.file_name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Size</dt><dd className="font-medium">{formatFileSize(selected.file_size_kb)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Added</dt><dd className="font-medium">{new Date(selected.created_at).toLocaleDateString("en-GB")}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Scope</dt><dd className="font-medium">{selected.employee_id ? "Personal" : "Company-wide"}</dd></div>
            </dl>
            <div className="mt-4 space-y-2">
              {selected.file_url ? (
                <a href={selected.file_url} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full justify-center`}>
                  <Download className="h-4 w-4" /> Download
                </a>
              ) : (
                <button type="button" disabled className={`${btnPrimary} w-full justify-center opacity-50`}>
                  <Download className="h-4 w-4" /> Preview (connect storage)
                </button>
              )}
              {!readIds.has(selected.id) ? (
                <button type="button" onClick={() => handleMarkRead(selected.id)} disabled={!userId} className={`${btnSecondary} w-full justify-center disabled:opacity-50`}>
                  <CheckCircle2 className="h-4 w-4" /> Mark as read
                </button>
              ) : (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">✓ Marked as read</p>
              )}
            </div>
            {selected.category === "sales" || selected.category === "training" ? (
              <Link href={employeeRoute("/training")} className="mt-4 block text-center text-xs font-bold text-blue-600 hover:underline">
                Related modules in Training →
              </Link>
            ) : null}
          </EmployeePanel>
        ) : (
          <EmployeePanel className="sticky top-24 flex h-fit flex-col items-center py-12 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Select a document</p>
            <p className="mt-1 text-xs text-slate-500">View details, download, or mark as read.</p>
          </EmployeePanel>
        )}
      </div>

      <EmployeeModal open={showUpload} onClose={() => setShowUpload(false)} title="Upload personal document">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Title</label>
            <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Training certificate" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">File</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-8 text-sm text-slate-600 hover:bg-slate-50">
              <Upload className="h-5 w-5" />
              {uploadFile ? uploadFile.name : "Choose PDF, Word, or image"}
            </button>
          </div>
          <button type="button" className={`${btnPrimary} w-full justify-center`} disabled={!userId || uploading || !uploadTitle.trim() || !uploadFile} onClick={handleUpload}>
            {uploading ? "Uploading…" : "Upload document"}
          </button>
          <p className="text-center text-xs text-slate-400">Personal uploads are visible only to you and HR admin.</p>
        </div>
      </EmployeeModal>
    </div>
  );
}
