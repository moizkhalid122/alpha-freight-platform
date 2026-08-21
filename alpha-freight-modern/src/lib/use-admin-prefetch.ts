"use client";

import {
  adminEmployeesQueryFn,
  adminEmployeesQueryKey,
  adminLoadsQueryFn,
  adminLoadsQueryKey,
  adminOverviewQueryKey,
  ADMIN_STALE_MS,
  adminProfilesQueryFn,
  adminProfilesQueryKey,
} from "@/lib/admin-query";
import { adminFetch } from "@/lib/admin-data-client";

type PrefetchClient = {
  prefetchQuery: (options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime: number;
  }) => Promise<unknown>;
};

export function prefetchAdminProfiles(queryClient: PrefetchClient, role?: "supplier" | "carrier" | "employee") {
  return queryClient.prefetchQuery({
    queryKey: adminProfilesQueryKey(role),
    queryFn: adminProfilesQueryFn(role),
    staleTime: ADMIN_STALE_MS,
  });
}

export function prefetchAdminLoads(queryClient: PrefetchClient) {
  return queryClient.prefetchQuery({
    queryKey: adminLoadsQueryKey(),
    queryFn: adminLoadsQueryFn(),
    staleTime: ADMIN_STALE_MS,
  });
}

export function prefetchAdminEmployees(queryClient: PrefetchClient) {
  return queryClient.prefetchQuery({
    queryKey: adminEmployeesQueryKey(),
    queryFn: adminEmployeesQueryFn(),
    staleTime: ADMIN_STALE_MS,
  });
}

export function prefetchAdminOverview(queryClient: PrefetchClient) {
  return queryClient.prefetchQuery({
    queryKey: adminOverviewQueryKey(),
    queryFn: () => adminFetch("/api/admin/overview"),
    staleTime: ADMIN_STALE_MS,
  });
}

/** Warm common admin datasets without blocking first paint. */
export function prefetchAdminWarm(queryClient: PrefetchClient) {
  void prefetchAdminOverview(queryClient);

  const schedule =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? window.requestIdleCallback.bind(window)
      : (cb: () => void) => window.setTimeout(cb, 1200);

  schedule(() => {
    void prefetchAdminProfiles(queryClient, "carrier");
    void prefetchAdminProfiles(queryClient, "supplier");
    void prefetchAdminLoads(queryClient);
  });
}
