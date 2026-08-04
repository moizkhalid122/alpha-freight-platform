import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

const HR_SELECT =
  "id, employee_code, department, job_title, status, hire_date, commission_rate, phone, updated_at";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const [{ data: roleProfiles, error: roleErr }, { data: hrRows, error: hrErr }] = await Promise.all([
      db.from("profiles").select("id, full_name, created_at, role").eq("role", "employee"),
      db.from("employee_profiles").select(HR_SELECT),
    ]);

    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 500 });
    }
    if (hrErr) {
      return NextResponse.json({ error: hrErr.message }, { status: 500 });
    }

    const profileMap = new Map((roleProfiles ?? []).map((p) => [p.id, p]));
    const hrMap = new Map((hrRows ?? []).map((r) => [r.id, r]));

    const missingProfileIds = (hrRows ?? []).map((hr) => hr.id).filter((id) => !profileMap.has(id));
    if (missingProfileIds.length) {
      const { data: extraProfiles } = await db
        .from("profiles")
        .select("id, full_name, created_at, role")
        .in("id", missingProfileIds);
      for (const profile of extraProfiles ?? []) {
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

    return NextResponse.json(
      { employees },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (error) {
    console.error("[admin/employees]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch employees." },
      { status: 500 }
    );
  }
}
