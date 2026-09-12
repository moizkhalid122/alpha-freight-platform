"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, RefreshCcw, ShieldCheck, UserRoundX } from "lucide-react";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults } from "@/lib/admin-query";
import { parseProfileExtras } from "@/lib/platform-data";
import type { TransportModeFilter } from "@/lib/mode-admin-paths";

type ProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  created_at?: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
  profile_extras?: unknown;
};

function modeProfilesQueryKey(role: string, mode: string, pending: boolean) {
  return ["mode-admin-profiles", role, mode, pending ? "pending" : "all"] as const;
}

async function fetchModeProfiles(role: "carrier" | "supplier", transportMode: TransportModeFilter) {
  const response = await adminFetch<{ profiles: ProfileRow[] }>(
    `/api/admin/profiles?role=${role}&transport_mode=${transportMode}`
  );
  return response.profiles ?? [];
}

function resolveStatus(profile: ProfileRow) {
  const extras = parseProfileExtras<Record<string, unknown>>(profile.profile_extras);
  const raw =
    (extras.verificationStatus as string) ||
    profile.verification_status ||
    (profile.is_approved ? "verified" : "pending");
  return String(raw).toLowerCase();
}

function isPending(profile: ProfileRow) {
  const status = resolveStatus(profile);
  return !["verified", "approved"].includes(status);
}

export default function ModeAdminProfilesPage({
  role,
  transportMode,
  pendingOnly,
  entityLabel,
  backHref,
}: {
  role: "carrier" | "supplier";
  transportMode: TransportModeFilter;
  pendingOnly: boolean;
  entityLabel: string;
  backHref: string;
}) {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: modeProfilesQueryKey(role, transportMode, pendingOnly),
    queryFn: () => fetchModeProfiles(role, transportMode),
    ...adminQueryDefaults,
  });

  const rows = useMemo(() => {
    const list = data ?? [];
    return pendingOnly ? list.filter(isPending) : list;
  }, [data, pendingOnly]);

  const updateVerification = async (
    profileId: string,
    extras: Record<string, unknown>,
    decision: "verified" | "rejected" | "info_required"
  ) => {
    setActingId(profileId);
    try {
      await adminFetch(`/api/admin/profiles/${profileId}/extras`, {
        method: "PATCH",
        body: JSON.stringify({
          profile_extras: {
            ...extras,
            verificationStatus: decision === "verified" ? "Verified" : decision === "rejected" ? "Rejected" : "Info Required",
            verificationNotes:
              decision === "rejected"
                ? "Documents rejected — please re-upload."
                : decision === "info_required"
                  ? "Additional information required."
                  : null,
            verifiedDate: decision === "verified" ? new Date().toISOString() : null,
          },
          verification_status: decision === "verified" ? "verified" : decision,
          status: decision === "verified" ? "verified" : decision === "rejected" ? "suspended" : "pending",
          is_approved: decision === "verified",
        }),
      });

      toast.success(decision === "verified" ? "Account verified." : "Status updated.");
      await queryClient.invalidateQueries({ queryKey: modeProfilesQueryKey(role, transportMode, pendingOnly) });
      await queryClient.invalidateQueries({ queryKey: modeProfilesQueryKey(role, transportMode, !pendingOnly) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update account.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="border-b border-gray-100 px-6 py-5">
          <Link href={backHref} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
            ← Back
          </Link>
          <p className={ADMIN_SECTION_LABEL}>{transportMode.toUpperCase()} · {entityLabel}</p>
          <h1 className={ADMIN_SECTION_TITLE}>
            {pendingOnly ? "Pending verification" : `All ${entityLabel.toLowerCase()}s`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {pendingOnly
              ? "Review documents and approve or reject air/sea marketplace accounts."
              : `Full directory of registered ${entityLabel.toLowerCase()}s on this mode.`}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounts…
        </div>
      ) : rows.length === 0 ? (
        <div className={`${ADMIN_CARD} p-10 text-center text-sm text-gray-500`}>
          {pendingOnly ? "No pending verifications." : `No ${entityLabel.toLowerCase()}s found yet.`}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((profile) => {
            const extras = parseProfileExtras<Record<string, unknown>>(profile.profile_extras);
            const company =
              (extras.companyName as string) ||
              profile.company_name ||
              profile.full_name ||
              "Unnamed account";
            const status = resolveStatus(profile);

            return (
              <div key={profile.id} className={`${ADMIN_CARD} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div>
                  <p className="font-semibold text-gray-900">{company}</p>
                  <p className="text-sm text-gray-500">
                    {profile.email || "—"} · Applied{" "}
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                    {status}
                  </span>
                </div>

                {pendingOnly ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actingId === profile.id}
                      onClick={() => void updateVerification(profile.id, extras, "verified")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verify
                    </button>
                    <button
                      type="button"
                      disabled={actingId === profile.id}
                      onClick={() => void updateVerification(profile.id, extras, "info_required")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Request info
                    </button>
                    <button
                      type="button"
                      disabled={actingId === profile.id}
                      onClick={() => void updateVerification(profile.id, extras, "rejected")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <UserRoundX className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
