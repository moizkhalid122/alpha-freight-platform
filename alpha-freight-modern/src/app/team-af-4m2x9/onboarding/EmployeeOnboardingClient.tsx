"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  PartyPopper,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import VideoOverlay from "@/components/VideoOverlay";
import BrandMark from "@/components/BrandMark";
import EmployeePolicyModal from "@/components/employee/EmployeePolicyModal";
import { employeePolicyPath, employeeRoute } from "@/lib/employee-path";
import {
  EMPLOYEE_POLICIES,
  type EmployeePolicyId,
} from "@/lib/employee-policies";
import {
  clearLocalOnboardingComplete,
  fetchEmployeeOnboarding,
  isLocalOnboardingComplete,
  markLocalOnboardingComplete,
  saveEmployeeOnboardingComplete,
  uploadEmployeeDocument,
} from "@/lib/employee-onboarding";
import { supabase } from "@/lib/supabase";
import { formatAuthError } from "@/lib/format-error";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "profile", title: "Your profile", icon: User },
  { id: "documents", title: "Documents", icon: FileText },
  { id: "policies", title: "Policies", icon: ShieldCheck },
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-300 focus:border-blue-500/20 focus:outline-none focus:ring-4 focus:ring-blue-500/5";

export default function EmployeeOnboardingClient() {
  const router = useRouter();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [position, setPosition] = useState("Team Member");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [acceptNda, setAcceptNda] = useState(false);
  const [acceptEmployment, setAcceptEmployment] = useState(false);
  const [acceptCommission, setAcceptCommission] = useState(false);
  const [readPolicies, setReadPolicies] = useState<Record<EmployeePolicyId, boolean>>({
    nda: false,
    employment: false,
    commission: false,
  });
  const [activePolicyId, setActivePolicyId] = useState<EmployeePolicyId | null>(null);

  const [existingCv, setExistingCv] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.replace(employeeRoute("/login"));
        return;
      }
      setUserId(user.id);
      const meta = user.user_metadata ?? {};
      if (meta.position || meta.job_title) setPosition(String(meta.position ?? meta.job_title));

      if (isLocalOnboardingComplete(user.id)) {
        clearLocalOnboardingComplete(user.id);
      }

      setBootstrapping(false);

      const record = await fetchEmployeeOnboarding(supabase, user.id);
      if (record?.onboarding_completed) {
        markLocalOnboardingComplete(user.id);
        router.replace(employeeRoute());
        return;
      }

      if (record) {
        setPosition(record.job_title || position);
        setPhone(record.phone || "");
        setAddress(record.address || "");
        setExistingCv(record.cv_url);
        if (record.profile_photo_url) setPhotoPreview(record.profile_photo_url);
      }
    }
    void load();
  }, [router]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const validateStep = () => {
    if (step === 0) {
      if (!phone.trim() || !address.trim()) {
        setError("Phone number and address are required.");
        return false;
      }
    }
    if (step === 1 && !idFile) {
      setError("ID upload is required.");
      return false;
    }
    if (step === 2 && (!acceptNda || !acceptEmployment || !acceptCommission)) {
      setError("Please read and accept all policies to continue.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void handleFinish();
  };

  const handleFinish = async () => {
    if (!userId || !validateStep()) return;
    setSubmitting(true);
    setError(null);

    try {
      let profilePhotoUrl: string | null =
        photoPreview && !photoPreview.startsWith("blob:") ? photoPreview : null;
      let cvUrl = existingCv;
      let idDocumentUrl: string | null = null;

      if (photoFile) {
        profilePhotoUrl = await uploadEmployeeDocument(userId, photoFile, "photo", { required: true });
      }
      if (cvFile) cvUrl = await uploadEmployeeDocument(userId, cvFile, "cv");
      if (idFile) idDocumentUrl = await uploadEmployeeDocument(userId, idFile, "id", { required: true });

      await saveEmployeeOnboardingComplete(supabase, userId, {
        job_title: position,
        phone: phone.trim(),
        address: address.trim(),
        profile_photo_url: profilePhotoUrl,
        cv_url: cvUrl,
        id_document_url: idDocumentUrl,
      });

      markLocalOnboardingComplete(userId);
      setComplete(true);
      setTimeout(() => setShowVideo(true), 1200);
    } catch (err) {
      setError(formatAuthError(err));
      setSubmitting(false);
    }
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (complete) {
    return (
      <>
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-white px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[#FFD666]/10 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl" />
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#FFD666] shadow-lg shadow-yellow-500/20">
              <PartyPopper className="h-9 w-9 text-slate-900" />
            </div>
            <h1 className="font-serif text-4xl font-black italic tracking-tight text-slate-900">You&apos;re all set!</h1>
            <p className="mt-3 text-sm font-medium text-slate-500">Welcome to the Alpha Freight Solutions founding team.</p>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Alpha Freight Premium</p>
          </motion.div>
        </div>
        <VideoOverlay isOpen={showVideo} onClose={() => setShowVideo(false)} targetPath={employeeRoute()} />
      </>
    );
  }

  const StepIcon = STEPS[step].icon;

  const policyItems = [
    {
      id: "nda" as const,
      policy: EMPLOYEE_POLICIES.nda,
      checked: acceptNda,
      set: setAcceptNda,
    },
    {
      id: "employment" as const,
      policy: EMPLOYEE_POLICIES.employment,
      checked: acceptEmployment,
      set: setAcceptEmployment,
    },
    {
      id: "commission" as const,
      policy: EMPLOYEE_POLICIES.commission,
      checked: acceptCommission,
      set: setAcceptCommission,
    },
  ];

  const handlePolicyRead = (policyId: EmployeePolicyId) => {
    setReadPolicies((current) => ({ ...current, [policyId]: true }));
    setActivePolicyId(null);
  };

  const handlePolicyAccept = (policyId: EmployeePolicyId, checked: boolean, setAccepted: (value: boolean) => void) => {
    if (!readPolicies[policyId]) {
      setError("Please read the full document before accepting.");
      return;
    }
    setAccepted(checked);
    setError(null);
  };

  return (
    <div className="min-h-[100dvh] bg-white font-sans">
      <header className="border-b border-slate-100 px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <BrandMark href="/" iconClassName="h-8 w-8" textClassName="text-base font-bold" />
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Briefcase className="h-3.5 w-3.5" />
            Team onboarding
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-500",
                  i <= step ? "bg-slate-900" : "bg-slate-100"
                )}
              />
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
          Step {step + 1} of {STEPS.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[#FFD666]">
                <StepIcon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{STEPS[step].title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {step === 0 && "Tell us how to reach you and confirm your role."}
                {step === 1 && "Upload your ID and optional CV."}
                {step === 2 && "Review and accept company policies."}
              </p>
            </div>

            <div className={cn("mx-auto space-y-4", step === 2 ? "max-w-lg" : "max-w-sm")}>
              {step === 0 && (
                <>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-400">Photo</div>
                      )}
                    </div>
                    <label className="flex flex-1 cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-3 py-4 text-center hover:border-slate-300">
                      <Upload className="mb-1 h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Profile photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <Field label="Phone number">
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+44 7700 900000" />
                  </Field>
                  <Field label="Address">
                    <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Full home address" />
                  </Field>
                  <Field label="Position">
                    <input readOnly value={position} className={`${inputClass} bg-slate-50 text-slate-600`} />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center hover:border-slate-300">
                    <Upload className="mb-2 h-5 w-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">ID upload (required)</span>
                    <span className="mt-1 text-xs text-slate-500">Passport or driving licence</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} />
                    {idFile ? <span className="mt-2 text-xs font-semibold text-emerald-600">{idFile.name}</span> : null}
                  </label>
                  <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center hover:border-slate-300">
                    <Upload className="mb-2 h-5 w-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">CV (optional)</span>
                    {existingCv ? <span className="mt-1 text-xs text-emerald-600">Already on file</span> : null}
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  {policyItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-2xl border p-4 transition",
                        item.checked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{item.policy.title}</p>
                          <p className={cn("mt-1 text-xs", item.checked ? "text-slate-300" : "text-slate-500")}>
                            {item.policy.summary}
                          </p>
                        </div>
                        {readPolicies[item.id] ? (
                          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            Read
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePolicyId(item.id)}
                          className={cn(
                            "rounded-xl px-3 py-2 text-xs font-bold transition",
                            item.checked
                              ? "bg-white/10 text-white hover:bg-white/15"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          Read document
                        </button>
                        <a
                          href={employeePolicyPath(item.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition",
                            item.checked
                              ? "bg-white/10 text-white hover:bg-white/15"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          Open page
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <label
                        className={cn(
                          "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3",
                          item.checked ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/70",
                          !readPolicies[item.id] && "cursor-not-allowed opacity-70"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled={!readPolicies[item.id]}
                          onChange={(e) => handlePolicyAccept(item.id, e.target.checked, item.set)}
                          className="mt-1 rounded"
                        />
                        <span className="text-sm font-semibold">
                          I agree to the {item.policy.shortTitle}
                        </span>
                      </label>
                    </div>
                  ))}
                </>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</div>
              ) : null}

              <div className="flex gap-3 pt-2">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Saving…" : step === STEPS.length - 1 ? "Complete onboarding" : "Continue"}
                  {!submitting ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <EmployeePolicyModal
        policy={activePolicyId ? EMPLOYEE_POLICIES[activePolicyId] : null}
        open={activePolicyId !== null}
        onClose={() => setActivePolicyId(null)}
        onConfirmRead={handlePolicyRead}
        alreadyRead={activePolicyId ? readPolicies[activePolicyId] : false}
      />
    </div>
  );
}
