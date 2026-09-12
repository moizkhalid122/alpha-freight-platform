"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  loadConciergeMemory,
  saveConciergeMemory,
  type ConciergeVoiceMemory,
} from "@/lib/concierge/concierge-session";
import { mergeProfileIntoMemory, recordConciergeVisit } from "@/lib/concierge/concierge-return-visitor";

export function useConciergeMemorySync(pathname: string) {
  const syncedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  const syncFromServer = useCallback(async (): Promise<ConciergeVoiceMemory> => {
    const local = loadConciergeMemory();
    try {
      const res = await fetch("/api/concierge/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: local }),
      });
      if (!res.ok) return local;
      const data = (await res.json()) as { memory?: ConciergeVoiceMemory };
      const merged = { ...local, ...(data.memory || {}) };
      saveConciergeMemory(merged);
      return merged;
    } catch {
      return local;
    }
  }, []);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    void syncFromServer();
  }, [syncFromServer]);

  const trackVisit = useCallback((path: string): ConciergeVoiceMemory => {
    const current = loadConciergeMemory();
    const next = recordConciergeVisit(current, path);
    saveConciergeMemory(next);
    void fetch("/api/concierge/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory: next }),
    }).catch(() => {});
    return next;
  }, []);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    trackVisit(pathname);
  }, [pathname, trackVisit]);

  return { syncFromServer, trackVisit };
}
