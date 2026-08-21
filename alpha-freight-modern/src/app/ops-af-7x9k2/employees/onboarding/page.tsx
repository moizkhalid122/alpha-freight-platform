"use client";

import { ExternalLink, FileText, ShieldCheck } from "lucide-react";

import AdminProfilePhotoPreview from "@/components/admin/AdminProfilePhotoPreview";
import { AdminHrHeader, AdminHrTabs, AdminPanel } from "@/components/admin/AdminHrShell";
import { useAdminEmployeeOnboarding, type AdminEmployeeOnboardingRow } from "@/hooks/useAdminEmployeeData";

function formatWhen(value: string | null) {
  if (!value) return "Not accepted";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OnboardingBadge({ completed }: { completed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
        completed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {completed ? "Completed" : "In progress"}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-page-stack space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</p>
    </div>
  );
}

function DocumentLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return <span className="text-sm text-slate-400">Not uploaded</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function OnboardingCard({ row }: { row: AdminEmployeeOnboardingRow }) {
  return (
    <AdminPanel className="overflow-hidden">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex shrink-0 items-start gap-4">
          <AdminProfilePhotoPreview
            src={row.profile_photo_url}
            alt={row.full_name ?? "Employee photo"}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{row.full_name ?? "Unnamed team member"}</h3>
              <OnboardingBadge completed={row.onboarding_completed} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{row.email ?? "No email"}</p>
            {row.employee_code ? (
              <p className="mt-1 font-mono text-xs text-slate-400">{row.employee_code}</p>
            ) : null}
          </div>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Position" value={row.job_title} />
          <DetailRow label="Department" value={row.department} />
          <DetailRow label="Phone" value={row.phone} />
          <DetailRow label="Address" value={row.address} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CV</p>
            <div className="mt-1">
              <DocumentLink href={row.cv_url} label="View CV" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID document</p>
            <div className="mt-1">
              <DocumentLink href={row.id_document_url} label="View ID" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Policy acceptance
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">NDA</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatWhen(row.accepted_nda_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Founding team agreement</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatWhen(row.accepted_employment_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Commission policy</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatWhen(row.accepted_commission_at)}</p>
          </div>
        </div>
      </div>

      {row.updated_at ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          Last updated {formatWhen(row.updated_at)}
        </p>
      ) : null}
    </AdminPanel>
  );
}

export default function AdminEmployeeOnboardingPage() {
  const { onboarding, loading, error } = useAdminEmployeeOnboarding();

  const completed = onboarding.filter((row) => row.onboarding_completed);
  const pending = onboarding.filter((row) => !row.onboarding_completed);

  return (
    <div className="admin-page-stack space-y-4">
      <AdminHrHeader
        title="Employee onboarding"
        description="Review profile details, documents, and policy acceptances submitted by founding team members."
      />
      <AdminHrTabs activePath="/ops-af-7x9k2/employees/onboarding" />

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      {!loading && onboarding.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-3">
          <AdminPanel className="min-w-[140px] py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{onboarding.length}</p>
          </AdminPanel>
          <AdminPanel className="min-w-[140px] py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">{completed.length}</p>
          </AdminPanel>
          <AdminPanel className="min-w-[140px] py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In progress</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{pending.length}</p>
          </AdminPanel>
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <AdminPanel>Loading onboarding submissions…</AdminPanel>
        ) : onboarding.length === 0 ? (
          <AdminPanel>
            No onboarding submissions yet. Employees appear here after they sign up and start onboarding.
          </AdminPanel>
        ) : (
          onboarding.map((row) => <OnboardingCard key={row.id} row={row} />)
        )}
      </div>
    </div>
  );
}
