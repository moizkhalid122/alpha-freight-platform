"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONCIERGE_FIELD_FILL_EVENT,
  consumePendingFieldFill,
} from "@/lib/concierge/concierge-companion";
import { isFastRealtimeLatencyMode } from "@/lib/concierge/concierge-cost";
import { dispatchSignupGuideReady } from "@/lib/concierge/concierge-signup-guide";

const DEFAULT_FIELD_ORDER = ["fullName", "email", "referralCode"] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function scrollFieldIntoView(fieldKey: string): void {
  const el = document.querySelector(`[data-concierge-field="${fieldKey}"]`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function useConciergeAnimatedForm<T extends Record<string, string>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  allowedFields: (keyof T)[] = ["fullName", "email", "referralCode"] as (keyof T)[],
  options?: {
    signupRole?: "carrier" | "supplier";
    fieldOrder?: string[];
  },
) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const animateField = useCallback(
    async (fieldKey: keyof T, value: string) => {
      setActiveField(String(fieldKey));
      setIsAnimating(true);
      scrollFieldIntoView(String(fieldKey));

      const instant = isFastRealtimeLatencyMode();
      if (instant) {
        setFormData((prev) => ({ ...prev, [fieldKey]: value }));
      } else {
        const charDelay = 12;
        for (let i = 1; i <= value.length; i++) {
          const partial = value.slice(0, i);
          setFormData((prev) => ({ ...prev, [fieldKey]: partial }));
          await sleep(charDelay);
        }
      }

      setActiveField(null);
    },
    [setFormData],
  );

  const applyFields = useCallback(
    (fields: Record<string, string>) => {
      const preferredOrder = options?.fieldOrder || [...DEFAULT_FIELD_ORDER];
      const ordered = [
        ...preferredOrder.filter((key) => fields[key]),
        ...Object.keys(fields).filter((key) => !preferredOrder.includes(key)),
      ];

      queueRef.current = queueRef.current.then(async () => {
        setIsAnimating(true);
        try {
          for (const key of ordered) {
            if (!allowedFields.includes(key as keyof T)) continue;
            const value = fields[key]?.trim();
            if (!value) continue;
            await animateField(key as keyof T, value);
            await sleep(isFastRealtimeLatencyMode() ? 40 : 120);
          }
        } finally {
          setIsAnimating(false);
          setActiveField(null);
          if (options?.signupRole) {
            dispatchSignupGuideReady(options.signupRole);
          }
        }
      });
    },
    [allowedFields, animateField, options?.signupRole],
  );

  useEffect(() => {
    const onFill = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail && typeof detail === "object") applyFields(detail);
    };

    window.addEventListener(CONCIERGE_FIELD_FILL_EVENT, onFill);

    const tryPending = () => {
      const pending = consumePendingFieldFill();
      if (pending?.fields) applyFields(pending.fields);
    };

    tryPending();
    const retryId = window.setTimeout(tryPending, 900);

    return () => {
      window.removeEventListener(CONCIERGE_FIELD_FILL_EVENT, onFill);
      window.clearTimeout(retryId);
    };
  }, [applyFields]);

  return { activeField, isAnimating };
}
