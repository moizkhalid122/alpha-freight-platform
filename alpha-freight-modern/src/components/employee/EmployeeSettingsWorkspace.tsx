"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { EmployeePageHeader, EmployeePanel } from "@/components/employee/EmployeeShell";
import { useEmployeeProfile } from "@/hooks/useEmployeeData";
import { employeeOnboardingPath, employeePolicyPath } from "@/lib/employee-path";
import { EMPLOYEE_POLICIES } from "@/lib/employee-policies";
import {
  clearLocalOnboardingComplete,
  loadEmployeeSettings,
  uploadEmployeeDocument,
  type EmployeeOnboardingRecord,
} from "@/lib/employee-onboarding";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10";

const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400";

function ToggleRow({
  label,
  desc,
  defaultOn = true,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3.5 transition hover:border-indigo-100 hover:bg-indigo-50/30">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={cn(
          "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
          on ? "bg-indigo-500" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            on ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-400">
        {label} — not uploaded
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <span className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-500" />
        {label}
      </span>
      <ExternalLink className="h-4 w-4 text-slate-400" />
    </a>
  );
}

function formatAcceptedDate(iso: string | null) {
  if (!iso) return "Not accepted";
  try {
    return format(new Date(iso), "d MMM yyyy");
  } catch {
    return "Accepted";
  }
}

export default function EmployeeSettingsWorkspace() {
  const { profile, loading: profileLoading } = useEmployeeProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [hr, setHr] = useState<EmployeeOnboardingRecord | null>(null);
  const [loadingHr, setLoadingHr] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [needsOnboardingResync, setNeedsOnboardingResync] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const loading = profileLoading || loadingHr;

  const applySettings = (data: NonNullable<Awaited<ReturnType<typeof loadEmployeeSettings>>>) => {
    setUserId(data.userId);
    setAuthEmail(data.email || null);
    setFullName(data.fullName);
    setPhone(data.phone);
    setAddress(data.address);
    setPhotoPreview(data.photoUrl);
    setCvUrl(data.cvUrl);
    setIdDocumentUrl(data.idDocumentUrl);
    setHr(data.hr);
    setNeedsOnboardingResync(data.needsOnboardingResync);
  };

  useEffect(() => {
    let active = true;

    void loadEmployeeSettings(supabase).then((data) => {
      if (!active) return;
      if (data) applySettings(data);
      setLoadingHr(false);
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void loadEmployeeSettings(supabase).then((data) => {
        if (data) applySettings(data);
      });
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
    if (profile?.email && !authEmail) setAuthEmail(profile.email);
  }, [profile?.full_name, profile?.email, fullName, authEmail]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const displayEmail = profile?.email ?? authEmail;
  const displayName = fullName || profile?.full_name || "Team member";
  const initial = (displayName || "T").charAt(0).toUpperCase();
  const jobTitle = hr?.job_title ?? profile?.job_title ?? "Team Member";
  const department = hr?.department ?? profile?.department ?? "—";

  const handleRetryOnboarding = () => {
    if (userId) clearLocalOnboardingComplete(userId);
    window.location.assign(employeeOnboardingPath());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ type: "err", text: "Sign in with an employee account to save settings." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let profilePhotoUrl = hr?.profile_photo_url ?? null;
      if (photoFile) {
        const uploaded = await uploadEmployeeDocument(userId, photoFile, "photo", { required: true });
        profilePhotoUrl = uploaded;
      } else if (photoPreview && !photoPreview.startsWith("blob:")) {
        profilePhotoUrl = hr?.profile_photo_url ?? photoPreview;
      }

      const updates = await Promise.all([
        supabase.from("profiles").update({ full_name: fullName.trim() || null }).eq("id", userId),
        supabase
          .from("employee_profiles")
          .update({
            phone: phone.trim() || null,
            address: address.trim() || null,
            profile_photo_url: profilePhotoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId),
      ]);

      const err = updates.find((u) => u.error)?.error;
      if (err) {
        setMessage({ type: "err", text: err.message });
      } else {
        setMessage({ type: "ok", text: "Settings saved successfully." });
        setPhotoFile(null);
        const refreshed = await loadEmployeeSettings(supabase);
        if (refreshed) applySettings(refreshed);
      }
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Could not save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <EmployeePageHeader
        title="Settings"
        description="Your profile from onboarding — update contact and notification preferences."
      />

      {needsOnboardingResync ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Onboarding data was not saved to the server.</p>
          <p className="mt-1 text-xs text-amber-800">
            This usually means <code className="rounded bg-amber-100 px-1">employee-onboarding.sql</code> has not been
            run in Supabase yet. Run that SQL, then complete onboarding again.
          </p>
          <button
            type="button"
            onClick={handleRetryOnboarding}
            className="mt-3 rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800"
          >
            Complete onboarding again
          </button>
        </div>
      ) : null}

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
            {photoPreview ? (
              <Image src={photoPreview} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {initial}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Your account</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {displayName || "Team member"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {jobTitle} · {department}
            </p>
            <p className="mt-2 text-sm text-slate-400">{displayEmail ?? "—"}</p>
            {hr?.onboarding_completed ? (
              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Onboarding complete
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Profile</h2>
                <p className="text-xs text-slate-500">
                  {hr?.onboarding_completed
                    ? "Details from your onboarding — update anytime below"
                    : "Complete onboarding to fill your profile automatically"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className={labelClass}>Profile photo</label>
                  <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-indigo-200">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">{initial}</div>
                      )}
                    </div>
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Upload className="h-4 w-4" />
                      Change photo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelClass}>Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Work email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={displayEmail ?? ""}
                      disabled
                      className={cn(inputClass, "bg-slate-50/80 pl-10 text-slate-500")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(inputClass, "pl-10")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Home address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className={cn(inputClass, "h-auto resize-none py-3 pl-10")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={department}
                        disabled
                        className={cn(inputClass, "bg-slate-50/80 pl-10 text-slate-500")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Position</label>
                    <input value={jobTitle} disabled className={cn(inputClass, "bg-slate-50/80 text-slate-500")} />
                  </div>
                </div>

                {message ? (
                  <p
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium",
                      message.type === "ok"
                        ? "border border-emerald-200/80 bg-emerald-50/80 text-emerald-800"
                        : "border border-amber-200/80 bg-amber-50/80 text-amber-900"
                    )}
                  >
                    {message.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={saving || !userId}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
                >
                  {saving ? "Saving…" : hr?.onboarding_completed ? "Update profile" : "Save changes"}
                </button>
              </form>
            )}
          </EmployeePanel>

          <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Onboarding documents</h2>
                <p className="text-xs text-slate-500">Uploaded during your signup onboarding</p>
              </div>
            </div>
            <div className="space-y-2">
              <DocLink label="CV / Resume" url={cvUrl} />
              <DocLink label="ID document" url={idDocumentUrl} />
            </div>
          </EmployeePanel>
        </div>

        <div className="space-y-6">
          <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Policies accepted</h2>
                <p className="text-xs text-slate-500">Recorded when you completed team onboarding · open View then Save as PDF</p>
              </div>
            </div>
            <div className="space-y-2">
              {(
                [
                  { id: "nda" as const, date: hr?.accepted_nda_at ?? null },
                  { id: "employment" as const, date: hr?.accepted_employment_at ?? null },
                  { id: "commission" as const, date: hr?.accepted_commission_at ?? null },
                ] as const
              ).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{EMPLOYEE_POLICIES[item.id].shortTitle}</p>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.date ? "text-emerald-600" : "text-slate-400"
                      )}
                    >
                      {formatAcceptedDate(item.date)}
                    </span>
                  </div>
                  <a
                    href={`${employeePolicyPath(item.id)}?from=settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </EmployeePanel>

          <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Notifications</h2>
                <p className="text-xs text-slate-500">Choose what you want to be notified about</p>
              </div>
            </div>
            <div className="space-y-2">
              <ToggleRow label="New task assigned" desc="Email when admin assigns a task" />
              <ToggleRow label="Lead updates" desc="When a lead status changes in CRM" />
              <ToggleRow label="Commission approved" desc="When your payout is approved" />
              <ToggleRow label="Leave decision" desc="When leave is approved or rejected" />
            </div>
          </EmployeePanel>

          <EmployeePanel className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Security</h2>
                <p className="text-xs text-slate-500">Account access & password</p>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              Password changes are managed through your login email. Contact HR if you need to reset access.
            </p>
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-400"
            >
              Change password — via email link
            </button>
          </EmployeePanel>
        </div>
      </div>
    </motion.div>
  );
}
