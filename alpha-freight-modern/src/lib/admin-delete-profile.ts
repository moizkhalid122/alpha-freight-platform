import { supabaseAuthDeleteUser, supabaseHttpsDelete, supabaseHttpsGet } from "@/lib/supabase-node-http";

const DELETABLE_ROLES = new Set(["carrier", "supplier"]);

export type DeleteProfileResult = {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
};

type ProfileRow = { id: string; role: string | null };

async function readProfileRole(profileId: string): Promise<{ role: string | null; error: string | null }> {
  try {
    const rows = await supabaseHttpsGet<ProfileRow[]>(
      "profiles",
      `select=id,role&id=eq.${encodeURIComponent(profileId)}&limit=1`,
      8_000
    );
    if (rows.error) {
      return { role: null, error: rows.error };
    }
    return { role: rows.data?.[0]?.role ?? null, error: null };
  } catch (error) {
    return {
      role: null,
      error: error instanceof Error ? error.message : "Unable to read profile role.",
    };
  }
}

export async function deleteMarketplaceProfile(
  profileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { role, error: roleError } = await readProfileRole(profileId);

  if (roleError) {
    return { ok: false, error: roleError };
  }

  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) {
    return { ok: false, error: "Profile not found." };
  }

  if (!DELETABLE_ROLES.has(normalizedRole)) {
    return {
      ok: false,
      error: `Only carrier and supplier accounts can be deleted here. Found role "${normalizedRole}".`,
    };
  }

  const authDelete = await supabaseAuthDeleteUser(profileId, 25_000);
  if (authDelete.ok) {
    return { ok: true };
  }

  const profileDelete = await supabaseHttpsDelete(
    "profiles",
    `id=eq.${encodeURIComponent(profileId)}`,
    12_000
  );
  if (profileDelete.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    error: profileDelete.error || authDelete.error || "Unable to delete account.",
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}

export async function deleteMarketplaceProfiles(profileIds: string[]): Promise<DeleteProfileResult> {
  const deleted: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  const outcomes = await mapWithConcurrency(profileIds, 4, async (profileId) => ({
    profileId,
    result: await deleteMarketplaceProfile(profileId),
  }));

  outcomes.forEach(({ profileId, result }) => {
    if (result.ok) {
      deleted.push(profileId);
    } else {
      failed.push({ id: profileId, error: result.error });
    }
  });

  return { deleted, failed };
}
