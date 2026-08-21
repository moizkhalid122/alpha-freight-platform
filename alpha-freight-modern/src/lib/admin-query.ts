import { fetchLoadsBundleDirect, fetchProfilesDirect } from "@/lib/admin-client-data";
import { adminFetchResilient } from "@/lib/admin-fetch-resilient";

/** Shared React Query tuning — instant navigation when data was prefetched. */
export const ADMIN_STALE_MS = 5 * 60_000;
export const ADMIN_GC_MS = 15 * 60_000;

export const adminQueryDefaults = {
  staleTime: ADMIN_STALE_MS,
  gcTime: ADMIN_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 0,
} as const;

export function adminProfilesQueryKey(role?: "supplier" | "carrier" | "employee" | "all") {
  return role && role !== "all" ? (["admin-profiles", role] as const) : (["admin-profiles", "all"] as const);
}

export function adminProfilesQueryFn(role?: "supplier" | "carrier" | "employee") {
  const path = role ? `/api/admin/profiles?role=${role}` : "/api/admin/profiles";
  return () =>
    adminFetchResilient<{ profiles: Record<string, unknown>[] }>(path, async () => ({
      profiles: await fetchProfilesDirect(role),
    }));
}

export function adminLoadsQueryKey() {
  return ["admin-loads"] as const;
}

export function adminLoadsQueryFn() {
  return () =>
    adminFetchResilient<{
      loads: Record<string, unknown>[];
      profiles: Record<string, unknown>[];
      bids: Record<string, unknown>[];
    }>("/api/admin/loads", fetchLoadsBundleDirect);
}

export function adminEmployeesQueryKey() {
  return ["admin", "employees"] as const;
}

export function adminEmployeesQueryFn() {
  return () =>
    adminFetchResilient<{ employees: Record<string, unknown>[] }>(
      "/api/admin/employees",
      async () => ({ employees: [] })
    );
}

export function adminOverviewQueryKey() {
  return ["admin-overview-premium"] as const;
}
