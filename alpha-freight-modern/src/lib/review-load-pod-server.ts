import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingPodColumnError } from "@/lib/load-pod-verification";

export type PodReviewDecision = "verified" | "rejected" | "info_required";

type ReviewLoadPodParams = {
  loadId: string;
  supplierId: string;
  decision: PodReviewDecision;
  note?: string;
};

function buildPodReviewUpdates(decision: PodReviewDecision, note: string | undefined, now: string) {
  const updates: Record<string, unknown> = {
    pod_verification_status: decision,
    pod_review_note: note || null,
    updated_at: now,
  };

  if (decision === "verified") {
    updates.status = "completed";
    updates.pod_verified_at = now;
  } else {
    updates.pod_verified_at = null;
  }

  return updates;
}

function reviewWasApplied(
  load: Record<string, unknown>,
  decision: PodReviewDecision,
  minimalFallback: boolean
) {
  const status = String(load.status || "").toLowerCase();
  const podStatus = String(load.pod_verification_status || "").toLowerCase();

  if (decision === "verified") {
    return status === "completed" || podStatus === "verified";
  }

  if (minimalFallback) {
    return false;
  }

  return podStatus === decision;
}

async function fetchSupplierLoad(
  supabase: SupabaseClient,
  loadId: string,
  supplierId: string
) {
  const { data, error } = await supabase
    .from("loads")
    .select("*")
    .eq("id", loadId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (error) {
    return { load: null, error: error.message };
  }

  return { load: data, error: null };
}

export async function reviewLoadPodServer(
  supabase: SupabaseClient,
  params: ReviewLoadPodParams
) {
  const now = new Date().toISOString();
  const note = params.note?.trim() || undefined;

  const { data: existingLoad, error: loadError } = await supabase
    .from("loads")
    .select("id, supplier_id, status, pod_url")
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId)
    .maybeSingle();

  if (loadError) {
    return { ok: false as const, error: loadError.message };
  }

  if (!existingLoad) {
    return { ok: false as const, error: "Load not found or access denied." };
  }

  if (!existingLoad.pod_url) {
    return { ok: false as const, error: "No POD document is available for this load yet." };
  }

  const attempts: Array<{ updates: Record<string, unknown>; minimalFallback: boolean }> = [
    { updates: buildPodReviewUpdates(params.decision, note, now), minimalFallback: false },
  ];

  if (params.decision === "verified") {
    attempts.push({
      updates: { status: "completed", updated_at: now },
      minimalFallback: true,
    });
  }

  let lastError: string | null = null;

  for (const attempt of attempts) {
    const { error } = await supabase
      .from("loads")
      .update(attempt.updates)
      .eq("id", params.loadId)
      .eq("supplier_id", params.supplierId);

    if (error) {
      lastError = error.message;
      if (!isMissingPodColumnError(error.message)) {
        break;
      }
      continue;
    }

    const refreshed = await fetchSupplierLoad(supabase, params.loadId, params.supplierId);
    if (!refreshed.load) {
      lastError = refreshed.error || "Update succeeded but the load could not be reloaded.";
      break;
    }

    if (reviewWasApplied(refreshed.load, params.decision, attempt.minimalFallback)) {
      return { ok: true as const, load: refreshed.load };
    }

    lastError = "Update did not apply. Check Supabase RLS policies for supplier load updates.";
  }

  return {
    ok: false as const,
    error:
      lastError ||
      "Unable to update POD review. Run supplier-pod-review-fix.sql in Supabase SQL Editor, then try again.",
  };
}
