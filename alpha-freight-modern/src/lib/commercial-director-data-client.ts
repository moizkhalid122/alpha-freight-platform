"use client";

import { withTimeout } from "@/lib/employee-auth-utils";
import { readJsonResponse } from "@/lib/safe-json-response";
import { createFastAuthClient, supabase } from "@/lib/supabase";

async function getCommercialDirectorAccessToken() {
  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), 2000, "Commercial Director session");

    if (session?.access_token) {
      return session.access_token;
    }
  } catch {
    // Try direct auth client fallback below.
  }

  try {
    const fastClient = createFastAuthClient();
    const {
      data: { session },
    } = await withTimeout(fastClient.auth.getSession(), 2000, "Commercial Director fast session");

    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function commercialDirectorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  // Server reads the login cookie first — don't block the request on slow getSession().
  const token = await Promise.race([
    getCommercialDirectorAccessToken(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 300)),
  ]);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const doFetch = () =>
    withTimeout(
      fetch(path, {
        ...init,
        headers,
        credentials: "same-origin",
        cache: "no-store",
      }),
      25_000,
      "Commercial Director API"
    );

  let response = await doFetch();
  let payload = await readJsonResponse<Record<string, unknown>>(response).catch(() => ({}));

  if (response.status === 401) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        headers.set("Authorization", `Bearer ${data.session.access_token}`);
        response = await doFetch();
        payload = await readJsonResponse<Record<string, unknown>>(response).catch(() => ({}));
      }
    } catch {
      // Keep original 401 response.
    }
  }

  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
