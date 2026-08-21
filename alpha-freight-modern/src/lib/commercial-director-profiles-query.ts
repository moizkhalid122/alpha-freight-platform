import type { SupabaseClient } from "@supabase/supabase-js";

/** Same profile shape as admin `/api/admin/profiles`. */
export type CommercialProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
  industry?: string | null;
  profile_extras?: unknown;
  avatar_url?: string | null;
  [key: string]: unknown;
};

const HR_SELECT =
  "id, employee_code, department, job_title, status, hire_date, commission_rate, phone, updated_at";

export async function fetchCommercialEmployees(db: SupabaseClient): Promise<CommercialProfileRow[]> {
  const [{ data: roleProfiles, error: roleErr }, { data: hrRows, error: hrErr }] = await Promise.all([
    db.from("profiles").select("id, full_name, company_name, created_at, role").eq("role", "employee"),
    db.from("employee_profiles").select(HR_SELECT),
  ]);

  if (roleErr) throw roleErr;
  if (hrErr) throw hrErr;

  const profileMap = new Map((roleProfiles ?? []).map((profile) => [profile.id, profile]));
  const hrMap = new Map((hrRows ?? []).map((row) => [row.id, row]));

  const missingProfileIds = (hrRows ?? []).map((hr) => hr.id).filter((id) => !profileMap.has(id));
  if (missingProfileIds.length) {
    const { data: extraProfiles, error: extraErr } = await db
      .from("profiles")
      .select("id, full_name, company_name, created_at, role")
      .in("id", missingProfileIds);

    if (extraErr) throw extraErr;
    for (const profile of extraProfiles ?? []) {
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

export async function fetchCommercialProfilesByRole(
  db: SupabaseClient,
  role: "supplier" | "carrier" | "employee"
) {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, company_name, role, created_at, industry, profile_extras, avatar_url")
    .eq("role", role)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as CommercialProfileRow[], error };
}

export async function fetchCommercialNetworkProfiles(db: SupabaseClient) {
  const [directoryRes, employees] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name, company_name, role, created_at, industry, profile_extras, avatar_url")
      .in("role", ["supplier", "carrier"])
      .order("created_at", { ascending: false }),
    fetchCommercialEmployees(db),
  ]);

  if (directoryRes.error) {
    return { error: directoryRes.error, suppliers: [], carriers: [], employees: [] };
  }

  const rows = (directoryRes.data ?? []) as CommercialProfileRow[];

  return {
    error: null,
    suppliers: rows.filter((row) => row.role === "supplier"),
    carriers: rows.filter((row) => row.role === "carrier"),
    employees,
  };
}
