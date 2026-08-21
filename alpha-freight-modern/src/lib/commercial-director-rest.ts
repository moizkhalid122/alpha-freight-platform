import type { CommercialProfileRow } from "@/lib/commercial-director-profiles-query";
import { buildCommercialMetricsFromRows, type CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import { supabaseHttpsCount, supabaseHttpsGet } from "@/lib/supabase-node-http";

const REST_TIMEOUT_MS = 12_000;
const REST_RETRY_DELAY_MS = 350;
const REST_MAX_ATTEMPTS = 2;

const PROFILE_SELECT =
  "id,full_name,company_name,role,created_at,industry,profile_extras,avatar_url";

const HR_SELECT =
  "id,employee_code,department,job_title,status,hire_date,commission_rate,phone,updated_at";

type RestError = { message: string };

function shouldRetry(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound")
  );
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function supabaseRest<T>(
  table: string,
  query: string
): Promise<{ data: T; error: RestError | null }> {
  for (let attempt = 0; attempt < REST_MAX_ATTEMPTS; attempt += 1) {
    const result = await supabaseHttpsGet<T>(table, query, REST_TIMEOUT_MS);
    if (!result.error) {
      return { data: result.data, error: null };
    }

    if (attempt < REST_MAX_ATTEMPTS - 1 && shouldRetry(result.error)) {
      await pause(REST_RETRY_DELAY_MS);
      continue;
    }

    return { data: [] as T, error: { message: result.error } };
  }

  return { data: [] as T, error: { message: "fetch failed" } };
}

async function supabaseRestCount(table: string, query: string): Promise<number> {
  for (let attempt = 0; attempt < REST_MAX_ATTEMPTS; attempt += 1) {
    const result = await supabaseHttpsCount(table, query, REST_TIMEOUT_MS);
    if (!result.error) {
      return result.count;
    }
    if (attempt < REST_MAX_ATTEMPTS - 1 && shouldRetry(result.error)) {
      await pause(REST_RETRY_DELAY_MS);
      continue;
    }
    throw new Error(result.error);
  }
  return 0;
}

export async function fetchCommercialMetricsRest(): Promise<CommercialMetricsPayload> {
  const [
    shippers,
    forwarders,
    employees,
    loadsCount,
    loadsRes,
    leadsRes,
    tasksRes,
    bidsRes,
    commissionsRes,
  ] = await Promise.all([
    supabaseRestCount("profiles", "select=id&role=eq.supplier"),
    supabaseRestCount("profiles", "select=id&role=eq.carrier"),
    supabaseRestCount("profiles", "select=id&role=eq.employee"),
    supabaseRestCount("loads", "select=id"),
    supabaseRest<
      Array<{
        id: string;
        origin?: string | null;
        destination?: string | null;
        status?: string | null;
        price?: number | null;
        created_at?: string | null;
        title?: string | null;
      }>
    >(
      "loads",
      "select=id,origin,destination,status,price,created_at,title&order=created_at.desc&limit=120"
    ),
    supabaseRest<
      Array<{
        company_name?: string | null;
        contact_name?: string | null;
        status?: string | null;
        value_gbp?: number | null;
        created_at?: string | null;
      }>
    >(
      "employee_leads",
      "select=id,company_name,contact_name,status,value_gbp,created_at&order=created_at.desc&limit=120"
    ),
    supabaseRest<
      Array<{
        title?: string | null;
        status?: string | null;
        priority?: string | null;
        due_date?: string | null;
        created_at?: string | null;
      }>
    >(
      "employee_tasks",
      "select=id,title,status,priority,due_date,created_at&order=created_at.desc&limit=120"
    ),
    supabaseRest<
      Array<{
        load_id?: string | null;
        amount?: number | null;
        status?: string | null;
        created_at?: string | null;
      }>
    >("bids", "select=id,load_id,amount,status,created_at&order=created_at.desc&limit=120"),
    supabaseRest<
      Array<{
        amount_gbp?: number | null;
        status?: string | null;
        period_month?: string | null;
        created_at?: string | null;
      }>
    >(
      "employee_commissions",
      "select=id,amount_gbp,status,period_month,created_at&order=created_at.desc&limit=120"
    ),
  ]);

  if (loadsRes.error) throw new Error(loadsRes.error.message);

  return buildCommercialMetricsFromRows({
    overview: {
      shippers,
      forwarders,
      employees,
      loads: loadsCount,
    },
    loads: loadsRes.data ?? [],
    leads: leadsRes.error ? [] : (leadsRes.data ?? []),
    tasks: tasksRes.error ? [] : (tasksRes.data ?? []),
    bids: bidsRes.error ? [] : (bidsRes.data ?? []),
    commissions: commissionsRes.error ? [] : (commissionsRes.data ?? []),
  });
}

export async function fetchCommercialProfilesByRoleRest(
  role: "supplier" | "carrier"
): Promise<CommercialProfileRow[]> {
  const result = await supabaseRest<CommercialProfileRow[]>(
    "profiles",
    `select=${PROFILE_SELECT}&role=eq.${role}&order=created_at.desc`
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

export async function fetchCommercialEmployeesRest(): Promise<CommercialProfileRow[]> {
  const [roleProfilesRes, hrRowsRes] = await Promise.all([
    supabaseRest<Array<{ id: string; full_name: string | null; company_name: string | null; created_at: string | null; role: string | null }>>(
      "profiles",
      "select=id,full_name,company_name,created_at,role&role=eq.employee"
    ),
    supabaseRest<
      Array<{
        id: string;
        employee_code: string | null;
        department: string | null;
        job_title: string | null;
        status: string | null;
        hire_date: string | null;
        commission_rate: number | null;
        phone: string | null;
        updated_at: string | null;
      }>
    >("employee_profiles", `select=${HR_SELECT}`),
  ]);

  if (roleProfilesRes.error) throw new Error(roleProfilesRes.error.message);
  if (hrRowsRes.error) throw new Error(hrRowsRes.error.message);

  const profileMap = new Map((roleProfilesRes.data ?? []).map((profile) => [profile.id, profile]));
  const hrMap = new Map((hrRowsRes.data ?? []).map((row) => [row.id, row]));

  const missingProfileIds = (hrRowsRes.data ?? []).map((hr) => hr.id).filter((id) => !profileMap.has(id));
  if (missingProfileIds.length) {
    const extras = await supabaseRest<
      Array<{ id: string; full_name: string | null; company_name: string | null; created_at: string | null; role: string | null }>
    >(
      "profiles",
      `select=id,full_name,company_name,created_at,role&id=in.(${missingProfileIds.join(",")})`
    );
    if (extras.error) throw new Error(extras.error.message);
    for (const profile of extras.data ?? []) {
      profileMap.set(profile.id, profile);
    }
  }

  const ids = new Set([...profileMap.keys(), ...hrMap.keys()]);

  return [...ids].map((id) => {
    const profile = profileMap.get(id);
    const hr = hrMap.get(id);
    return {
      id,
      full_name: profile?.full_name ?? null,
      company_name: hr?.department ?? profile?.company_name ?? hr?.job_title ?? null,
      role: "employee",
      created_at: profile?.created_at ?? hr?.hire_date ?? null,
    };
  });
}

export type CommercialLoadRow = {
  id: string;
  origin?: string | null;
  destination?: string | null;
  status?: string | null;
  price?: number | string | null;
  created_at?: string | null;
  title?: string | null;
  supplier_id?: string | null;
  carrier_id?: string | null;
};

export async function fetchCommercialLoadsRest(): Promise<CommercialLoadRow[]> {
  const result = await supabaseRest<CommercialLoadRow[]>(
    "loads",
    "select=id,origin,destination,status,price,created_at,title,supplier_id,carrier_id&order=created_at.desc&limit=500"
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}
