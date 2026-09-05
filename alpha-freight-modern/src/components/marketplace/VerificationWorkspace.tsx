"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getCarrierDocuments,
  getSupplierDocuments,
  getVerificationSnapshot,
  type MarketplaceRole,
} from "@/lib/account-verification";
import {
  mapDocumentUrlsToExtras,
  validateOnboardingDocuments,
} from "@/components/marketplace/OnboardingDocumentStep";
import OnboardingDocumentStep from "@/components/marketplace/OnboardingDocumentStep";
import {
  persistProfileExtras,
  resolveCarrierExtras,
  resolveSupplierExtras,
} from "@/lib/profile-extras";
import { updateProfileVerificationFields } from "@/lib/profile-verification";
import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100";

export default function VerificationWorkspace({ role }: { role: MarketplaceRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState("");
  const [accountType, setAccountType] = useState("company");
  const [documentValues, setDocumentValues] = useState<Record<string, string>>({});
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [snapshot, setSnapshot] = useState<ReturnType<typeof getVerificationSnapshot> | null>(null);
  const [storedExtras, setStoredExtras] = useState<CarrierProfileExtras | SupplierProfileExtras | null>(null);

  const dashboardHref = role === "carrier" ? "/carrier/dashboard" : "/supplier/dashboard";

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(role === "carrier" ? "/auth/carrier-signup" : "/auth/supplier-signup");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_extras, verification_status, is_approved, status")
      .eq("id", user.id)
      .maybeSingle();

    const extras =
      role === "carrier"
        ? resolveCarrierExtras(user.id, profile?.profile_extras)
        : resolveSupplierExtras(user.id, profile?.profile_extras);

    const docs = role === "carrier" ? getCarrierDocuments(extras.accountType || "company") : getSupplierDocuments();
    const initialValues: Record<string, string> = {};

    docs.forEach((doc) => {
      const url = (extras as Record<string, unknown>)[doc.urlField as string];
      if (typeof url === "string" && url) initialValues[doc.key] = url;
    });

    setUserId(user.id);
    setAccountType(extras.accountType || "company");
    setDocumentValues(initialValues);
    setInsuranceExpiry(role === "carrier" ? (extras as CarrierProfileExtras).insuranceExpiry || "" : "");
    setStoredExtras(extras);
    setSnapshot(getVerificationSnapshot(role, profile, extras));
    setLoading(false);
  }, [role, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const missing = useMemo(
    () => validateOnboardingDocuments(role, accountType, documentValues),
    [role, accountType, documentValues],
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      if (missing.length > 0) {
        throw new Error(`Please upload: ${missing.join(", ")}`);
      }

      const mappedDocs = mapDocumentUrlsToExtras(role, accountType, documentValues);
      const currentExtras = storedExtras ??
        (role === "carrier"
          ? resolveCarrierExtras(userId, undefined)
          : resolveSupplierExtras(userId, undefined));

      const nextExtras =
        role === "carrier"
          ? ({
              ...currentExtras,
              ...mappedDocs,
              insuranceExpiry: insuranceExpiry || (currentExtras as CarrierProfileExtras).insuranceExpiry || null,
              verificationStatus: "Pending",
            } as CarrierProfileExtras)
          : ({
              ...currentExtras,
              ...mappedDocs,
              verificationStatus: "Pending",
            } as SupplierProfileExtras);

      await persistProfileExtras(userId, nextExtras as Record<string, unknown>);

      await updateProfileVerificationFields(userId, {
        verification_status: "pending_review",
        status: "pending",
        is_approved: false,
      });

      window.dispatchEvent(new Event("alpha-profile-updated"));
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save documents.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link href={dashboardHref} className="text-[13px] font-semibold text-slate-500 hover:text-slate-900">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Verification documents</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload or replace the documents required for a verified {role} account.
        </p>
      </div>

      {snapshot?.alert?.type === "rejected" ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{snapshot.alert.reason}</p>
          </div>
        </div>
      ) : null}

      {role === "carrier" ? (
        <div className="mb-6">
          <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
            Insurance expiry date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={insuranceExpiry}
            onChange={(event) => setInsuranceExpiry(event.target.value)}
            className={INPUT}
            required
          />
        </div>
      ) : null}

      <OnboardingDocumentStep
        role={role}
        accountType={accountType}
        userId={userId}
        values={documentValues}
        onChange={setDocumentValues}
        onError={setError}
      />

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Documents submitted for review. We usually respond within 1–2 business days.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Submit for review
      </button>

      {snapshot?.status === "verified" ? (
        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Your account is verified. Upload here only when renewing documents.
        </div>
      ) : null}
    </div>
  );
}
