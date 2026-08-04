"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLoadLiveTracking,
  hasDisplayableCarrierTracking,
  type LoadLiveTracking,
  subscribeLoadLiveTracking,
} from "@/lib/load-gps-tracking";

export function useLoadLiveTracking(loadId?: string | null, loadStatus?: string | null) {
  const [snapshot, setSnapshot] = useState<LoadLiveTracking | null>(null);
  const [loading, setLoading] = useState(Boolean(loadId));
  const [hasGps, setHasGps] = useState(false);

  const applySnapshot = useCallback(
    (result: LoadLiveTracking | null) => {
      setSnapshot(result);
      setHasGps(hasDisplayableCarrierTracking(result, loadStatus));
    },
    [loadStatus]
  );

  const refresh = useCallback(async () => {
    if (!loadId) return null;
    const result = await fetchLoadLiveTracking(loadId);
    applySnapshot(result);
    return result;
  }, [applySnapshot, loadId]);

  useEffect(() => {
    if (!loadId) {
      setSnapshot(null);
      setLoading(false);
      setHasGps(false);
      return;
    }

    let active = true;
    setLoading(true);

    void fetchLoadLiveTracking(loadId)
      .then((result) => {
        if (!active) return;
        applySnapshot(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeLoadLiveTracking(loadId, (next) => {
      applySnapshot(next);
    });

    const poll = window.setInterval(() => {
      void fetchLoadLiveTracking(loadId).then((result) => {
        if (!active) return;
        applySnapshot(result);
      });
    }, 8000);

    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      unsubscribe();
    };
  }, [applySnapshot, loadId, refresh]);

  return { snapshot, loading, hasGps, refresh };
}
