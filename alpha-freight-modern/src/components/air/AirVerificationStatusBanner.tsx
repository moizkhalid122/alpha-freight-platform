"use client";

import Link from "next/link";
import { AlertTriangle, Clock3, ShieldAlert, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AirRole } from "@/lib/air-portal";
import {
  airOnboardingPath,
  airVerificationPath,
  buildAirVerificationSnapshot,
  resolveAirExtras,
} from "@/lib/air-account-verification";

type AirVerificationStatusBannerProps = {
  role: AirRole;
};

export default function AirVerificationStatusBanner({ role }: AirVerificationStatusBannerProps) {
  const [snapshot, setSnapshot] = useState<
    ReturnType<typeof buildAirVerificationSnapshot> | null
  >(null);

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

    const extras = resolveAirExtras(user.id, profile?.profile_extras);
    setSnapshot(
      buildAirVerificationSnapshot(
        role,
        extras,
        profile?.verification_status,
        profile?.is_approved
      )
    );
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

  const verificationHref = airVerificationPath(role);
  const onboardingHref = airOnboardingPath(role);

  if (snapshot.alert.type === "pending_review") {
    return (
      <div className="w-full border-b border-sky-100 bg-sky-50/90 px-4 py-3 sm:px-6">
        <div className="flex items-start gap-2.5">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Air account under review</p>
            <p className="text-[12px] text-slate-600">
              Documents submitted — verification usually within 24–48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (snapshot.alert.type === "missing") {
    return (
      <div className="w-full border-b border-amber-100 bg-amber-50/90 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Documents required</p>
              <p className="text-[12px] text-slate-600">{snapshot.alert.documents.join(", ")}</p>
            </div>
          </div>
          <Link
            href={onboardingHref}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-sky-600 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-sky-700 sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5" />
            Complete onboarding
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
              <p className="text-[13px] font-semibold text-slate-900">Verification rejected</p>
              <p className="text-[12px] text-slate-600">{snapshot.alert.reason}</p>
            </div>
          </div>
          <Link
            href={verificationHref}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-rose-600 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-rose-700 sm:self-auto"
          >
            Re-upload documents
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
