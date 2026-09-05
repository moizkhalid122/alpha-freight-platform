"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getVerificationSnapshot, type MarketplaceRole } from "@/lib/account-verification";
import { resolveCarrierExtras, resolveSupplierExtras } from "@/lib/profile-extras";

type VerificationStatusBannerProps = {
  role: MarketplaceRole;
};

export default function VerificationStatusBanner({ role }: VerificationStatusBannerProps) {
  const [snapshot, setSnapshot] = useState<ReturnType<typeof getVerificationSnapshot> | null>(null);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_extras, verification_status, is_approved, status")
      .eq("id", user.id)
      .maybeSingle();

    const extras =
      role === "carrier"
        ? resolveCarrierExtras(user.id, profile?.profile_extras)
        : resolveSupplierExtras(user.id, profile?.profile_extras);

    setSnapshot(getVerificationSnapshot(role, profile, extras));
  }, [role]);

  useEffect(() => {
    void refresh();
    const handleUpdate = () => void refresh();
    window.addEventListener("alpha-profile-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      window.removeEventListener("alpha-profile-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [refresh]);

  if (!snapshot?.alert || snapshot.alert.type === "verified") return null;

  const verificationHref = role === "carrier" ? "/carrier/verification" : "/supplier/verification";
  const onboardingHref = `/onboarding?role=${role}`;

  if (snapshot.alert.type === "pending_review") {
    return (
      <div className="w-full border-b border-blue-100 bg-blue-50/90 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Account under review</p>
              <p className="text-[12px] text-slate-600">
                Your documents were submitted. Our team usually reviews accounts within 1–2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (snapshot.alert.type === "expiry_warning") {
    return (
      <div className="w-full border-b border-amber-100 bg-amber-50/90 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-900">
                {snapshot.alert.document} expires in {snapshot.alert.daysLeft} day
                {snapshot.alert.daysLeft === 1 ? "" : "s"}
              </p>
              <p className="text-[12px] text-slate-600">
                Upload a renewed certificate now to avoid account suspension.
              </p>
            </div>
          </div>
          <Link
            href={verificationHref}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-amber-700 sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5" />
            Renew document
          </Link>
        </div>
      </div>
    );
  }

  if (snapshot.alert.type === "expired") {
    return (
      <div className="w-full border-b border-rose-100 bg-rose-50/90 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Account suspended — document expired</p>
              <p className="text-[12px] text-slate-600">
                {snapshot.alert.documents.join(", ")} must be renewed before bidding or posting loads again.
              </p>
            </div>
          </div>
          <Link
            href={verificationHref}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-rose-600 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-rose-700 sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload renewed document
          </Link>
        </div>
      </div>
    );
  }

  if (snapshot.alert.type === "rejected") {
    return (
      <div className="w-full border-b border-rose-100 bg-rose-50/90 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Verification action required</p>
              <p className="text-[12px] text-slate-600">{snapshot.alert.reason}</p>
            </div>
          </div>
          <Link
            href={verificationHref}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-slate-800 sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5" />
            Re-upload documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-amber-100 bg-amber-50/90 px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Complete verification to unlock the marketplace</p>
            <p className="text-[12px] text-slate-600">
              Still needed: {snapshot.alert.documents.join(", ")}.
            </p>
          </div>
        </div>
        <Link
          href={snapshot.onboardingComplete ? verificationHref : onboardingHref}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-slate-800 sm:self-auto"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {snapshot.onboardingComplete ? "Upload documents" : "Finish onboarding"}
        </Link>
      </div>
    </div>
  );
}
