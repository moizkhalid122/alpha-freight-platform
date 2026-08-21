import { fetchAdminOverviewRest } from "@/lib/admin-rest";

export type AdminOverviewBundle = {
  profiles: Record<string, unknown>[];
  loads: Record<string, unknown>[];
  bids: Record<string, unknown>[];
};

/** Server/API: REST only — avoids slow Supabase JS client on Windows. */
export async function fetchAdminOverviewBundle(): Promise<AdminOverviewBundle> {
  return fetchAdminOverviewRest();
}
