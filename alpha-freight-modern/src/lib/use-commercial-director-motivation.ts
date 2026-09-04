"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotivationPayload } from "@/lib/commercial-director-motivation-ai";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "alpha-cd-motivation-v1";
const ONE_HOUR_MS = 60 * 60 * 1000;

type StoredMotivation = MotivationPayload & { fetchedAt: number };

function loadStored(): StoredMotivation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredMotivation;
  } catch {
    return null;
  }
}

function saveStored(payload: StoredMotivation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

type UseMotivationOptions = {
  actualMtd?: number;
  monthTarget?: number;
  enabled?: boolean;
};

export function useCommercialDirectorMotivation(options: UseMotivationOptions = {}) {
  const { actualMtd, monthTarget, enabled = true } = options;
  const [motivation, setMotivation] = useState<MotivationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  const fetchMotivation = useCallback(
    async (force = false) => {
      if (!enabled || fetchingRef.current) return;

      const stored = loadStored();
      const now = Date.now();
      if (!force && stored && now - stored.fetchedAt < ONE_HOUR_MS) {
        setMotivation(stored);
        return;
      }

      fetchingRef.current = true;
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch("/api/commercial-director/tasks/motivate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ actualMtd, monthTarget }),
        });

        if (!res.ok) return;

        const payload = (await res.json()) as MotivationPayload;
        const storedPayload: StoredMotivation = {
          ...payload,
          fetchedAt: now,
        };
        saveStored(storedPayload);
        setMotivation(storedPayload);
      } catch {
        // keep previous message
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [actualMtd, enabled, monthTarget]
  );

  useEffect(() => {
    void fetchMotivation(false);
  }, [fetchMotivation]);

  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      void fetchMotivation(false);
    }, ONE_HOUR_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchMotivation(false);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, fetchMotivation]);

  return {
    motivation,
    loading,
    refresh: () => fetchMotivation(true),
  };
}
