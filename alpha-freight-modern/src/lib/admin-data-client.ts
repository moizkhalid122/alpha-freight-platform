"use client";

import { withTimeout } from "@/lib/employee-auth-utils";
import { supabase } from "@/lib/supabase";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

const LOAD_DETAIL_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, updated_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state, notes, pod_url, pod_name, pod_uploaded_at, pod_verification_status, pod_review_note, pod_verified_at";

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await withTimeout(supabase.auth.getSession(), 8000, "Admin session");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await withTimeout(
    fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    }),
    20000,
    "Admin API"
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : `Admin request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export { LOAD_LIST_SELECT, LOAD_DETAIL_SELECT };
