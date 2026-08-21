"use client";

import { withTimeout } from "@/lib/employee-auth-utils";
import { supabase } from "@/lib/supabase";
import { buildCommercialMetricsFromRows } from "@/lib/commercial-director-metrics";
import type { CommercialProfileRow } from "@/lib/commercial-director-profiles-query";

const CLIENT_TIMEOUT_MS = 12_000;

type SupabaseResult<T> = { data: T | null; error: { message?: string } | null };

async function runSupabaseQuery<T>(
  query: PromiseLike<SupabaseResult<T>>,
  label: string
): Promise<SupabaseResult<T>> {
  return withTimeout(Promise.resolve(query), CLIENT_TIMEOUT_MS, label);
}

export async function fetchCommercialProfilesDirect(role: "supplier" | "carrier" | "employee") {
  const { data, error } = await runSupabaseQuery(
    supabase
      .from("profiles")
      .select("id,full_name,company_name,role,created_at,industry,profile_extras,avatar_url")
      .eq("role", role)
      .order("created_at", { ascending: false }),
    "Commercial profiles"
  );

  if (error) throw error;
  return (data ?? []) as CommercialProfileRow[];
}

export async function fetchCommercialLoadsDirect() {
  const { data, error } = await runSupabaseQuery(
    supabase
      .from("loads")
      .select("id,origin,destination,status,price,created_at,title,supplier_id,carrier_id")
      .order("created_at", { ascending: false })
      .limit(500),
    "Commercial loads"
  );

  if (error) throw error;
  return data ?? [];
}

export async function fetchCommercialMetricsDirect() {
  const [suppliersRes, carriersRes, employeesRes, loadsRes, leadsRes, tasksRes, bidsRes, commissionsRes] =
    await Promise.all([
      runSupabaseQuery(
        supabase.from("profiles").select("id").eq("role", "supplier"),
        "Supplier count"
      ),
      runSupabaseQuery(
        supabase.from("profiles").select("id").eq("role", "carrier"),
        "Carrier count"
      ),
      runSupabaseQuery(
        supabase.from("profiles").select("id").eq("role", "employee"),
        "Employee count"
      ),
      runSupabaseQuery(
        supabase
          .from("loads")
          .select("id,origin,destination,status,price,created_at,title")
          .order("created_at", { ascending: false })
          .limit(120),
        "Commercial metrics loads"
      ),
      runSupabaseQuery(
        supabase
          .from("employee_leads")
          .select("company_name,contact_name,status,value_gbp,created_at")
          .order("created_at", { ascending: false })
          .limit(120),
        "Commercial leads"
      ),
      runSupabaseQuery(
        supabase
          .from("employee_tasks")
          .select("title,status,priority,due_date,created_at")
          .order("created_at", { ascending: false })
          .limit(120),
        "Commercial tasks"
      ),
      runSupabaseQuery(
        supabase
          .from("bids")
          .select("load_id,amount,status,created_at")
          .order("created_at", { ascending: false })
          .limit(120),
        "Commercial bids"
      ),
      runSupabaseQuery(
        supabase
          .from("employee_commissions")
          .select("amount_gbp,status,period_month,created_at")
          .order("created_at", { ascending: false })
          .limit(120),
        "Commercial commissions"
      ),
    ]);

  if (loadsRes.error) throw loadsRes.error;

  return buildCommercialMetricsFromRows({
    overview: {
      shippers: suppliersRes.data?.length ?? 0,
      forwarders: carriersRes.data?.length ?? 0,
      employees: employeesRes.data?.length ?? 0,
      loads: loadsRes.data?.length ?? 0,
    },
    loads: loadsRes.data ?? [],
    leads: leadsRes.error ? [] : (leadsRes.data ?? []),
    tasks: tasksRes.error ? [] : (tasksRes.data ?? []),
    bids: bidsRes.error ? [] : (bidsRes.data ?? []),
    commissions: commissionsRes.error ? [] : (commissionsRes.data ?? []),
  });
}

export async function fetchCommercialNetworkDirect() {
  const [suppliers, carriers, employees] = await Promise.all([
    fetchCommercialProfilesDirect("supplier"),
    fetchCommercialProfilesDirect("carrier"),
    fetchCommercialProfilesDirect("employee"),
  ]);

  return { suppliers, carriers, employees };
}
