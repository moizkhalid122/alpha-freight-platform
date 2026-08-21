"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { warmAdminAccessToken } from "@/lib/admin-data-client";
import { prefetchAdminWarm } from "@/lib/use-admin-prefetch";

export default function AdminPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void warmAdminAccessToken();
    prefetchAdminWarm(queryClient);
  }, [queryClient]);

  return null;
}
