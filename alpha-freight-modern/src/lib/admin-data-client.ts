"use client";

import { withTimeout } from "@/lib/employee-auth-utils";
import { readJsonResponse } from "@/lib/safe-json-response";
import { createFastAuthClient, supabase } from "@/lib/supabase";
const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

const LOAD_DETAIL_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, updated_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state, notes, pod_url, pod_name, pod_uploaded_at, pod_verification_status, pod_review_note, pod_verified_at";

type CachedToken = { value: string; expiresAt: number };

let cachedToken: CachedToken | null = null;
let tokenPromise: Promise<string | null> | null = null;

function readJwtExpiryMs(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: number };
    if (typeof json.exp === "number") return json.exp * 1000;
  } catch {
    // ignore
  }
  return null;
}

async function getAdminAccessToken() {
  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), 1500, "Admin session");

    if (session?.access_token) {
      return session.access_token;
    }
  } catch {
    // Fall through.
  }

  try {
    const fastClient = createFastAuthClient();
    const {
      data: { session },
    } = await withTimeout(fastClient.auth.getSession(), 1500, "Admin fast session");

    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function getAdminAccessTokenCached(force = false) {
  const now = Date.now();
  if (!force && cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  if (!force && tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    const token = await getAdminAccessToken();
    if (token) {
      const jwtExp = readJwtExpiryMs(token);
      cachedToken = {
        value: token,
        expiresAt: jwtExp ?? now + 50 * 60_000,
      };
    } else {
      cachedToken = null;
    }
    tokenPromise = null;
    return token;
  })();

  return tokenPromise;
}

async function attachAdminAuthHeader(headers: Headers, waitMs: number, force = false) {
  const token = await Promise.race([
    getAdminAccessTokenCached(force),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), waitMs)),
  ]);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}

export async function warmAdminAccessToken() {
  await getAdminAccessTokenCached(true);
}

export async function adminFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 25_000, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  if (!headers.has("Content-Type") && requestInit.body) {
    headers.set("Content-Type", "application/json");
  }

  const doFetch = () =>
    withTimeout(
      fetch(path, {
        ...requestInit,
        headers,
        credentials: "same-origin",
        cache: "no-store",
      }),
      timeoutMs,
      "Admin API"
    );

  await attachAdminAuthHeader(headers, 2000);

  let response = await doFetch();
  let payload = await readJsonResponse<Record<string, unknown>>(response).catch(() => ({}));

  if (response.status === 401) {
    cachedToken = null;
    await attachAdminAuthHeader(headers, 1200, true);
    response = await doFetch();
    payload = await readJsonResponse<Record<string, unknown>>(response).catch(() => ({}));
  }

  if (response.status === 401) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        cachedToken = {
          value: data.session.access_token,
          expiresAt: readJwtExpiryMs(data.session.access_token) ?? Date.now() + 50 * 60_000,
        };
        headers.set("Authorization", `Bearer ${data.session.access_token}`);
        response = await doFetch();
        payload = await readJsonResponse<Record<string, unknown>>(response).catch(() => ({}));
      }
    } catch {
      // Keep original response.
    }
  }

  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : `Admin request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export type DeleteAdminProfilesResult = {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
};

export type DeleteAdminLoadsResult = DeleteAdminProfilesResult;

export async function deleteAdminProfiles(ids: string[]) {
  const timeoutMs = Math.min(180_000, 25_000 + ids.length * 12_000);
  return adminFetch<DeleteAdminProfilesResult>("/api/admin/profiles", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
    timeoutMs,
  });
}

export async function deleteAdminLoads(ids: string[]) {
  const timeoutMs = Math.min(120_000, 30_000 + ids.length * 8_000);
  return adminFetch<DeleteAdminLoadsResult>("/api/admin/loads", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
    timeoutMs,
  });
}

export { LOAD_LIST_SELECT, LOAD_DETAIL_SELECT };
