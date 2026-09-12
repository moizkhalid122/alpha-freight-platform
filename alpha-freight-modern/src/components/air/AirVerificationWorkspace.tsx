"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AirOnboardingDocumentStep from "@/components/air/AirOnboardingDocumentStep";
import AirPageShell from "@/components/air/AirPageShell";
import type { AirRole } from "@/lib/air-portal";
import {
  getAirDocuments,
  mapAirDocumentUrlsToExtras,
  resolveAirExtras,
  type AirProfileExtras,
} from "@/lib/air-account-verification";
import { updateProfileVerificationFields } from "@/lib/profile-verification";
import { supabase } from "@/lib/supabase";

export default function AirVerificationWorkspace({ role }: { role: AirRole }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_extras")
        .eq("id", user.id)
        .maybeSingle();

      const extras = resolveAirExtras(user.id, profile?.profile_extras);
      const initial: Record<string, string> = {};
      for (const doc of getAirDocuments(role)) {
        const url = (extras as Record<string, unknown>)[doc.urlField];
        if (typeof url === "string" && url) initial[doc.key] = url;
      }
      setDocuments(initial);
    })();
  }, [role]);

  const submit = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    const documentFields = mapAirDocumentUrlsToExtras(role, documents);
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_extras")
      .eq("id", userId)
      .maybeSingle();

    const current =
      profile?.profile_extras && typeof profile.profile_extras === "object"
        ? (profile.profile_extras as Record<string, unknown>)
        : {};

    const nextExtras: AirProfileExtras = {
      ...(current as AirProfileExtras),
      ...documentFields,
      verificationStatus: "Pending",
      verificationNotes: null,
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_extras: nextExtras })
      .eq("id", userId);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    try {
      await updateProfileVerificationFields(userId, {
        verification_status: "pending_review",
        status: "pending",
        is_approved: false,
      });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Unable to update verification.");
      return;
    }

    setSaving(false);
    setSaved(true);
    window.dispatchEvent(new Event("alpha-profile-updated"));
  };

  const dashboard = role === "carrier" ? "/air/forwarder/dashboard" : "/air/shipper/dashboard";

  return (
    <AirPageShell
      title="Verification documents"
      description="Re-upload documents requested by the Alpha Freight air operations team."
      backHref={dashboard}
    >
      {!userId ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <AirOnboardingDocumentStep
            role={role}
            userId={userId}
            values={documents}
            onChange={setDocuments}
            onError={setError}
          />
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {saved ? (
            <p className="mt-4 text-sm font-semibold text-emerald-700">
              Documents submitted for review.
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <button type="button" disabled={saving} onClick={() => void submit()} className="air-btn-primary max-w-xs">
              {saving ? "Submitting…" : "Submit for review"}
            </button>
            <Link href={dashboard} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to dashboard
            </Link>
          </div>
        </>
      )}
    </AirPageShell>
  );
}
