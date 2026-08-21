"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  prefetchCommercialLoads,
  prefetchCommercialMetrics,
  prefetchCommercialProfiles,
} from "@/lib/use-commercial-metrics";

export default function CommercialDirectorPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void prefetchCommercialMetrics(queryClient);
    void prefetchCommercialProfiles(queryClient, "supplier");
    void prefetchCommercialProfiles(queryClient, "carrier");
    void prefetchCommercialProfiles(queryClient, "employee");
    void prefetchCommercialLoads(queryClient);
  }, [queryClient]);

  return null;
}
