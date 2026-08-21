"use client";

import { useQuery } from "@tanstack/react-query";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import type { CommercialProfileRow } from "@/lib/commercial-director-profiles-query";
import {
  fetchCommercialLoadsDirect,
  fetchCommercialMetricsDirect,
  fetchCommercialNetworkDirect,
  fetchCommercialProfilesDirect,
} from "@/lib/commercial-director-client-data";
import { commercialDirectorFetchResilient } from "@/lib/commercial-director-fetch-resilient";

export type CommercialNetworkPayload = {
  suppliers: CommercialProfileRow[];
  carriers: CommercialProfileRow[];
  employees: CommercialProfileRow[];
};

export type CommercialLoadRow = {
  id: string;
  origin?: string | null;
  destination?: string | null;
  status?: string | null;
  price?: number | string | null;
  created_at?: string | null;
  title?: string | null;
  supplier_id?: string | null;
  carrier_id?: string | null;
};

const sharedQueryOptions = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
  retryDelay: 1000,
} as const;

const directoryQueryOptions = {
  ...sharedQueryOptions,
  staleTime: 5 * 60_000,
} as const;

function withInitialQueryOptions<T>(initialValue: T | undefined) {
  if (!initialValue) return {};
  return {
    initialData: initialValue,
    initialDataUpdatedAt: Date.now(),
    placeholderData: initialValue,
  };
}

export function useCommercialProfiles(
  role: "supplier" | "carrier" | "employee",
  options?: { initialProfiles?: CommercialProfileRow[] }
) {
  const initialPayload = options?.initialProfiles?.length
    ? { profiles: options.initialProfiles }
    : undefined;

  return useQuery({
    queryKey: ["commercial-director-profiles", role],
    queryFn: () =>
      commercialDirectorFetchResilient<{ profiles: CommercialProfileRow[] }>(
        `/api/commercial-director/profiles?role=${role}`,
        async () => ({ profiles: await fetchCommercialProfilesDirect(role) })
      ),
    ...withInitialQueryOptions(initialPayload),
    ...directoryQueryOptions,
  });
}

export function useCommercialNetwork() {
  return useQuery({
    queryKey: ["commercial-director-network"],
    queryFn: () =>
      commercialDirectorFetchResilient<CommercialNetworkPayload>(
        "/api/commercial-director/network",
        fetchCommercialNetworkDirect
      ),
    ...sharedQueryOptions,
    enabled: false,
  });
}

const metricsQueryOptions = {
  ...sharedQueryOptions,
  staleTime: 5 * 60_000,
} as const;

export function useCommercialMetrics(options?: { initialMetrics?: CommercialMetricsPayload }) {
  return useQuery({
    queryKey: ["commercial-director-metrics"],
    queryFn: () =>
      commercialDirectorFetchResilient<CommercialMetricsPayload>(
        "/api/commercial-director/metrics",
        fetchCommercialMetricsDirect
      ),
    ...withInitialQueryOptions(options?.initialMetrics),
    ...metricsQueryOptions,
    refetchInterval: 60_000,
  });
}

export function useCommercialLoads(options?: { initialLoads?: CommercialLoadRow[] }) {
  const initialPayload = options?.initialLoads?.length ? { loads: options.initialLoads } : undefined;

  return useQuery({
    queryKey: ["commercial-director-loads"],
    queryFn: () =>
      commercialDirectorFetchResilient<{ loads: CommercialLoadRow[] }>(
        "/api/commercial-director/loads",
        async () => ({ loads: await fetchCommercialLoadsDirect() })
      ),
    ...withInitialQueryOptions(initialPayload),
    ...directoryQueryOptions,
  });
}

export function prefetchCommercialProfiles(
  queryClient: {
    prefetchQuery: (options: {
      queryKey: string[];
      queryFn: () => Promise<{ profiles: CommercialProfileRow[] }>;
      staleTime: number;
    }) => Promise<unknown>;
  },
  role: "supplier" | "carrier" | "employee"
) {
  return queryClient.prefetchQuery({
    queryKey: ["commercial-director-profiles", role],
    queryFn: () =>
      commercialDirectorFetchResilient<{ profiles: CommercialProfileRow[] }>(
        `/api/commercial-director/profiles?role=${role}`,
        async () => ({ profiles: await fetchCommercialProfilesDirect(role) })
      ),
    staleTime: directoryQueryOptions.staleTime,
  });
}

export function prefetchCommercialMetrics(
  queryClient: {
    prefetchQuery: (options: {
      queryKey: string[];
      queryFn: () => Promise<CommercialMetricsPayload>;
      staleTime: number;
    }) => Promise<unknown>;
  }
) {
  return queryClient.prefetchQuery({
    queryKey: ["commercial-director-metrics"],
    queryFn: () =>
      commercialDirectorFetchResilient<CommercialMetricsPayload>(
        "/api/commercial-director/metrics",
        fetchCommercialMetricsDirect
      ),
    staleTime: metricsQueryOptions.staleTime,
  });
}

export function prefetchCommercialLoads(
  queryClient: {
    prefetchQuery: (options: {
      queryKey: string[];
      queryFn: () => Promise<{ loads: CommercialLoadRow[] }>;
      staleTime: number;
    }) => Promise<unknown>;
  }
) {
  return queryClient.prefetchQuery({
    queryKey: ["commercial-director-loads"],
    queryFn: () =>
      commercialDirectorFetchResilient<{ loads: CommercialLoadRow[] }>(
        "/api/commercial-director/loads",
        async () => ({ loads: await fetchCommercialLoadsDirect() })
      ),
    staleTime: directoryQueryOptions.staleTime,
  });
}
