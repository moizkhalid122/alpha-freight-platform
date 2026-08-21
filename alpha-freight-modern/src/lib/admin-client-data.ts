"use client";

import { withTimeout } from "@/lib/employee-auth-utils";
import { supabase } from "@/lib/supabase";
import { LOAD_LIST_SELECT } from "@/lib/admin-data-client";

const CLIENT_TIMEOUT_MS = 12_000;

type SupabaseResult<T> = { data: T | null; error: { message?: string } | null };

async function runSupabaseQuery<T>(
  query: PromiseLike<SupabaseResult<T>>,
  label: string
): Promise<SupabaseResult<T>> {
  return withTimeout(Promise.resolve(query), CLIENT_TIMEOUT_MS, label);
}

export async function fetchProfilesDirect(role?: string) {
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (role && role !== "all") {
    query = query.eq("role", role);
  }
  const { data, error } = await runSupabaseQuery(query, "Profiles");
  if (error) throw error;
  return data ?? [];
}

export async function fetchLoadsBundleDirect() {
  const [loadsResult, profilesResult, bidsResult] = await Promise.all([
    runSupabaseQuery(
      supabase.from("loads").select(LOAD_LIST_SELECT).order("created_at", { ascending: false }),
      "Loads"
    ),
    runSupabaseQuery(
      supabase
        .from("profiles")
        .select("id, full_name, company_name, role, profile_extras")
        .order("created_at", { ascending: false }),
      "Load profiles"
    ),
    runSupabaseQuery(
      supabase
        .from("bids")
        .select("id, load_id, carrier_id, amount, status, created_at")
        .order("created_at", { ascending: false }),
      "Bids"
    ),
  ]);

  if (loadsResult.error) throw loadsResult.error;

  return {
    loads: loadsResult.data ?? [],
    profiles: profilesResult.error ? [] : (profilesResult.data ?? []),
    bids: bidsResult.error ? [] : (bidsResult.data ?? []),
  };
}

export async function fetchVehiclesDirect() {
  const { data, error } = await runSupabaseQuery(supabase.from("vehicles").select("*"), "Vehicles");
  if (error) throw error;
  return data ?? [];
}
