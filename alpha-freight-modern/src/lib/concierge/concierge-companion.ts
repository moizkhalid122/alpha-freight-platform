export const CONCIERGE_COMPANION_EVENT = "alpha-concierge-companion";
export const CONCIERGE_FIELD_FILL_EVENT = "alpha-concierge-field-fill";
export const CONCIERGE_PAUSE_REALTIME_EVENT = "alpha-concierge-pause-realtime";
export const CONCIERGE_HIGHLIGHT_EVENT = "alpha-concierge-highlight";
export const CONCIERGE_CLICK_EVENT = "alpha-concierge-click";
export const CONCIERGE_SIGNUP_COMPLETE_EVENT = "alpha-concierge-signup-complete";
export const CONCIERGE_CELEBRATE_EVENT = "alpha-concierge-celebrate";
export const CONCIERGE_ONBOARDING_CONTEXT_EVENT = "alpha-concierge-onboarding-context";

export function requestPauseRealtimeBilling(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONCIERGE_PAUSE_REALTIME_EVENT));
}

const COMPANION_KEY = "alpha_concierge_companion";
const PENDING_FILL_KEY = "alpha_concierge_pending_fill";
const CAPTIONS_KEY = "alpha_concierge_captions";

export type StoredConciergeCaptions = {
  user: string | null;
  assistant: string | null;
  ts: number;
};

export function saveConciergeCaptions(user: string | null, assistant: string | null): void {
  if (typeof window === "undefined") return;
  if (!user?.trim() && !assistant?.trim()) return;
  try {
    sessionStorage.setItem(
      CAPTIONS_KEY,
      JSON.stringify({
        user: user?.trim() || null,
        assistant: assistant?.trim() || null,
        ts: Date.now(),
      } satisfies StoredConciergeCaptions),
    );
  } catch {
    /* ignore */
  }
}

export function readConciergeCaptions(): StoredConciergeCaptions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CAPTIONS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredConciergeCaptions;
    if (Date.now() - data.ts > 30 * 60_000) {
      sessionStorage.removeItem(CAPTIONS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearConciergeCaptions(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CAPTIONS_KEY);
  } catch {
    /* ignore */
  }
}

export function isConciergeSessionLive(): boolean {
  return readConciergeCompanion().active;
}

export type ConciergeCompanionState = {
  active: boolean;
  path?: string;
  ts: number;
};

export type ConciergeFieldFillPayload = {
  fields: Record<string, string>;
  ts: number;
};

export function readConciergeCompanion(): ConciergeCompanionState {
  if (typeof window === "undefined") return { active: false, ts: 0 };
  try {
    const raw = sessionStorage.getItem(COMPANION_KEY);
    if (!raw) return { active: false, ts: 0 };
    const data = JSON.parse(raw) as ConciergeCompanionState;
    if (Date.now() - data.ts > 30 * 60_000) {
      sessionStorage.removeItem(COMPANION_KEY);
      return { active: false, ts: 0 };
    }
    return data;
  } catch {
    return { active: false, ts: 0 };
  }
}

export function enableConciergeCompanion(path?: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      COMPANION_KEY,
      JSON.stringify({ active: true, path, ts: Date.now() } satisfies ConciergeCompanionState),
    );
    window.dispatchEvent(new Event(CONCIERGE_COMPANION_EVENT));
  } catch {
    /* ignore */
  }
}

export function disableConciergeCompanion(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(COMPANION_KEY);
    sessionStorage.removeItem(PENDING_FILL_KEY);
    sessionStorage.removeItem(CAPTIONS_KEY);
    window.dispatchEvent(new Event(CONCIERGE_COMPANION_EVENT));
  } catch {
    /* ignore */
  }
}

export function dispatchConciergeFieldFill(fields: Record<string, string>): void {
  if (typeof window === "undefined" || !Object.keys(fields).length) return;
  try {
    sessionStorage.setItem(
      PENDING_FILL_KEY,
      JSON.stringify({ fields, ts: Date.now() } satisfies ConciergeFieldFillPayload),
    );
    window.dispatchEvent(
      new CustomEvent(CONCIERGE_FIELD_FILL_EVENT, { detail: fields }),
    );
  } catch {
    /* ignore */
  }
}

export function consumePendingFieldFill(maxAgeMs = 120_000): ConciergeFieldFillPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_FILL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConciergeFieldFillPayload;
    sessionStorage.removeItem(PENDING_FILL_KEY);
    if (Date.now() - data.ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function peekPendingFieldFill(maxAgeMs = 120_000): ConciergeFieldFillPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_FILL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConciergeFieldFillPayload;
    if (Date.now() - data.ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function dispatchConciergeHighlight(target: string): void {
  if (typeof window === "undefined" || !target.trim()) return;
  window.dispatchEvent(
    new CustomEvent(CONCIERGE_HIGHLIGHT_EVENT, { detail: { target: target.trim() } }),
  );
}

export function dispatchConciergeClick(target: string): void {
  if (typeof window === "undefined" || !target.trim()) return;
  window.dispatchEvent(
    new CustomEvent(CONCIERGE_CLICK_EVENT, { detail: { target: target.trim() } }),
  );
}

export function dispatchConciergeSignupComplete(detail: {
  role: "carrier" | "supplier";
  fullName?: string;
  email?: string;
}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONCIERGE_SIGNUP_COMPLETE_EVENT, { detail }));
}

export function dispatchConciergeCelebrate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONCIERGE_CELEBRATE_EVENT));
}

export function dispatchConciergeOnboardingContext(
  context: import("@/lib/concierge/concierge-onboarding").ConciergeOnboardingContext,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONCIERGE_ONBOARDING_CONTEXT_EVENT, { detail: context }));
}

export function dispatchConciergeOnboardingHighlight(target: string): void {
  dispatchConciergeHighlight(target);
}

export function pathsMatch(currentPath: string, currentSearch: string, targetPath: string): boolean {
  try {
    const current = new URL(currentPath + currentSearch, window.location.origin);
    const target = new URL(targetPath, window.location.origin);
    return current.pathname === target.pathname && current.search === target.search;
  } catch {
    return `${currentPath}${currentSearch}` === targetPath;
  }
}
