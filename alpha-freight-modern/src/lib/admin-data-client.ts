"use client";

import { supabase } from "@/lib/supabase";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

const LOAD_DETAIL_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, updated_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state, notes, pod_url, pod_name, pod_uploaded_at, pod_verification_status, pod_review_note, pod_verified_at";

async function fallbackProfiles(role: string | null) {
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (role && role !== "all") {
    query = query.eq("role", role);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { profiles: data ?? [] };
}

async function fallbackLoads() {
  const [loadsResult, profilesResult, bidsResult] = await Promise.all([
    supabase.from("loads").select(LOAD_LIST_SELECT).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, company_name, role, profile_extras"),
    supabase.from("bids").select("id, load_id, carrier_id, amount, status, created_at"),
  ]);

  if (loadsResult.error) throw new Error(loadsResult.error.message);

  return {
    loads: loadsResult.data ?? [],
    profiles: profilesResult.error ? [] : (profilesResult.data ?? []),
    bids: bidsResult.error ? [] : (bidsResult.data ?? []),
  };
}

async function fallbackLoadDetail(loadId: string) {
  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select(LOAD_DETAIL_SELECT)
    .eq("id", loadId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!load) throw new Error("Load not found.");

  const profileIds = [load.supplier_id, load.carrier_id].filter(Boolean) as string[];

  const [bidsResult, paymentsResult, profilesResult] = await Promise.all([
    supabase
      .from("bids")
      .select("id, load_id, carrier_id, amount, status, created_at, updated_at")
      .eq("load_id", loadId)
      .order("created_at", { ascending: false }),
    supabase.from("supplier_payments").select("*").eq("load_id", loadId),
    profileIds.length
      ? supabase
          .from("profiles")
          .select(
            "id, full_name, company_name, role, created_at, verification_status, avatar_url, industry"
          )
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const bids = bidsResult.error ? [] : (bidsResult.data ?? []);
  const bidCarrierIds = [...new Set(bids.map((bid) => bid.carrier_id).filter(Boolean))] as string[];

  let bidCarrierProfiles: unknown[] = [];
  if (bidCarrierIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, role, verification_status")
      .in("id", bidCarrierIds);
    bidCarrierProfiles = data ?? [];
  }

  const relatedProfiles = profilesResult.error ? [] : (profilesResult.data ?? []);
  const profileMap = new Map<string, unknown>();
  relatedProfiles.forEach((profile) => profileMap.set(profile.id, profile));
  bidCarrierProfiles.forEach((profile) => {
    const record = profile as { id: string };
    if (!profileMap.has(record.id)) {
      profileMap.set(record.id, profile);
    }
  });

  return {
    load,
    profiles: [...profileMap.values()],
    bids,
    payments: paymentsResult.error ? [] : (paymentsResult.data ?? []),
  };
}

async function runAdminFallback<T>(path: string): Promise<T | null> {
  const url = new URL(path, "http://local");
  const pathname = url.pathname;

  if (pathname === "/api/admin/profiles") {
    return (await fallbackProfiles(url.searchParams.get("role"))) as T;
  }

  if (pathname === "/api/admin/loads") {
    return (await fallbackLoads()) as T;
  }

  const loadMatch = pathname.match(/^\/api\/admin\/loads\/([^/]+)$/);
  if (loadMatch?.[1]) {
    return (await fallbackLoadDetail(decodeURIComponent(loadMatch[1]))) as T;
  }

  return null;
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : `Admin request failed (${response.status})`;
      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    const fallback = await runAdminFallback<T>(path);
    if (fallback != null) {
      console.warn("[admin] API unavailable, using direct Supabase fallback.", error);
      return fallback;
    }
    throw error;
  }
}
