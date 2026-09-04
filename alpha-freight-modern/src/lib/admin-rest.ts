import { supabaseHttpsGet } from "@/lib/supabase-node-http";

const REST_TIMEOUT_MS = 10_000;
const REST_RETRY_DELAY_MS = 350;
const REST_MAX_ATTEMPTS = 2;

const LOAD_LIST_SELECT =
  "id,supplier_id,carrier_id,origin,destination,pickup_location,delivery_location,price,status,created_at,title,commodity,equipment,weight,pickup_date,delivery_date,payment_route,payment_state";

function shouldRetry(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("network") ||
    lower.includes("econnreset")
  );
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function supabaseRest<T>(table: string, query: string): Promise<T> {
  for (let attempt = 0; attempt < REST_MAX_ATTEMPTS; attempt += 1) {
    const result = await supabaseHttpsGet<T>(table, query, REST_TIMEOUT_MS);
    if (!result.error) {
      return result.data;
    }
    if (attempt < REST_MAX_ATTEMPTS - 1 && shouldRetry(result.error)) {
      await pause(REST_RETRY_DELAY_MS);
      continue;
    }
    throw new Error(result.error);
  }
  throw new Error("fetch failed");
}

export async function fetchAdminProfilesRest(options?: {
  role?: string | null;
  ids?: string[];
}) {
  let query = "select=*&order=created_at.desc";
  if (options?.role && options.role !== "all") {
    query += `&role=eq.${options.role}`;
  }
  if (options?.ids?.length) {
    query += `&id=in.(${options.ids.join(",")})`;
  }
  return supabaseRest<Record<string, unknown>[]>("profiles", query);
}

export async function fetchAdminLoadsBundleRest() {
  const [loads, profiles, bids] = await Promise.all([
    supabaseRest<Record<string, unknown>[]>(
      "loads",
      `select=${LOAD_LIST_SELECT}&order=created_at.desc`
    ),
    supabaseRest<Record<string, unknown>[]>(
      "profiles",
      "select=id,full_name,company_name,role,profile_extras"
    ).catch(() => [] as Record<string, unknown>[]),
    supabaseRest<Record<string, unknown>[]>(
      "bids",
      "select=id,load_id,carrier_id,amount,status,created_at"
    ).catch(() => [] as Record<string, unknown>[]),
  ]);

  return { loads, profiles, bids };
}

export async function fetchProfileRoleRest(userId: string): Promise<string | null> {
  const rows = await supabaseRest<Array<{ role: string | null }>>(
    "profiles",
    `select=role&id=eq.${userId}&limit=1`
  );
  return rows[0]?.role ?? null;
}

export async function fetchAdminOverviewRest() {
  const [profiles, bundle] = await Promise.all([
    fetchAdminProfilesRest(),
    fetchAdminLoadsBundleRest(),
  ]);
  return {
    profiles,
    loads: bundle.loads,
    bids: bundle.bids,
  };
}

export async function fetchAdminFeedbackRest() {
  return supabaseRest<Record<string, unknown>[]>(
    "user_feedback",
    "select=*&order=created_at.desc&limit=200"
  );
}

export async function fetchAdminInquiriesRest() {
  return supabaseRest<Record<string, unknown>[]>(
    "website_inquiries",
    "select=*&order=created_at.desc&limit=200"
  );
}

export async function fetchAdminEmployeeStatsRest() {
  const [leads, calls, commissions, tasks] = await Promise.all([
    supabaseRest<Record<string, unknown>[]>(
      "employee_leads",
      "select=employee_id,status,value_gbp&order=created_at.desc&limit=500"
    ).catch(() => [] as Record<string, unknown>[]),
    supabaseRest<Record<string, unknown>[]>(
      "employee_calls",
      "select=employee_id,duration_minutes,called_at&order=called_at.desc&limit=500"
    ).catch(() => [] as Record<string, unknown>[]),
    supabaseRest<Record<string, unknown>[]>(
      "employee_commissions",
      "select=employee_id,amount_gbp,status&order=created_at.desc&limit=500"
    ).catch(() => [] as Record<string, unknown>[]),
    supabaseRest<Record<string, unknown>[]>(
      "employee_tasks",
      "select=employee_id,status&order=created_at.desc&limit=500"
    ).catch(() => [] as Record<string, unknown>[]),
  ]);

  return { leads, calls, commissions, tasks };
}

export async function fetchAdminEmployeesRest() {
  const HR_SELECT =
    "id,employee_code,department,job_title,status,hire_date,commission_rate,phone,updated_at";

  const [roleProfiles, hrRows] = await Promise.all([
    supabaseRest<Array<{ id: string; full_name: string | null; created_at: string | null; role: string | null }>>(
      "profiles",
      "select=id,full_name,created_at,role&role=eq.employee"
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

  const profileMap = new Map(roleProfiles.map((p) => [p.id, p]));
  const hrMap = new Map(hrRows.map((r) => [r.id, r]));

  const missingProfileIds = hrRows.map((hr) => hr.id).filter((id) => !profileMap.has(id));
  if (missingProfileIds.length) {
    const extras = await supabaseRest<
      Array<{ id: string; full_name: string | null; created_at: string | null; role: string | null }>
    >(
      "profiles",
      `select=id,full_name,created_at,role&id=in.(${missingProfileIds.join(",")})`
    );
    for (const profile of extras) {
      profileMap.set(profile.id, profile);
    }
  }

  const ids = new Set([...profileMap.keys(), ...hrMap.keys()]);
  const employees = [...ids].map((id) => {
    const p = profileMap.get(id);
    const hr = hrMap.get(id);
    return {
      id,
      employee_code: hr?.employee_code ?? null,
      department: hr?.department ?? "—",
      job_title: hr?.job_title ?? "Team Member",
      status: hr?.status ?? "active",
      hire_date: hr?.hire_date ?? null,
      commission_rate: Number(hr?.commission_rate ?? 0),
      phone: hr?.phone ?? null,
      full_name: p?.full_name ?? null,
      email: null,
    };
  });

  employees.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  return employees;
}
