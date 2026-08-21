import { isAdminServiceConfigured } from "@/lib/supabase-admin";
import { supabaseHttpsDelete } from "@/lib/supabase-node-http";

export type DeleteLoadsResult = {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
};

const RELATED_TABLES = ["bids", "supplier_payments", "load_cancellation_requests"] as const;
const REST_TIMEOUT_MS = 20_000;

async function deleteRelatedRowsViaRest(loadId: string) {
  const encodedId = encodeURIComponent(loadId);
  await Promise.all(
    RELATED_TABLES.map((table) => supabaseHttpsDelete(table, `load_id=eq.${encodedId}`, REST_TIMEOUT_MS))
  );
}

export async function deleteAdminLoad(loadId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedId = String(loadId || "").trim();
  if (!trimmedId) {
    return { ok: false, error: "Missing load id." };
  }

  if (!isAdminServiceConfigured()) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and restart the dev server.",
    };
  }

  const encodedId = encodeURIComponent(trimmedId);

  try {
    let loadDelete = await supabaseHttpsDelete("loads", `id=eq.${encodedId}`, REST_TIMEOUT_MS);
    if (loadDelete.ok) {
      return { ok: true };
    }

    await deleteRelatedRowsViaRest(trimmedId);
    loadDelete = await supabaseHttpsDelete("loads", `id=eq.${encodedId}`, REST_TIMEOUT_MS);

    if (loadDelete.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      error: loadDelete.error || "Unable to delete load.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to delete load.",
    };
  }
}

export async function deleteAdminLoads(loadIds: string[]): Promise<DeleteLoadsResult> {
  const deleted: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const loadId of loadIds) {
    const result = await deleteAdminLoad(loadId);
    if (result.ok) {
      deleted.push(loadId);
    } else {
      failed.push({ id: loadId, error: result.error });
    }
  }

  return { deleted, failed };
}
