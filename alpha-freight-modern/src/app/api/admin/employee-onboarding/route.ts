import { NextRequest, NextResponse } from "next/server";

import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import {
  EMPLOYEE_DOCUMENTS_BUCKET,
  employeeStoragePath,
  resolveEmployeeDocumentUrl,
} from "@/lib/employee-onboarding";

const ONBOARDING_SELECT =
  "id, employee_code, job_title, department, phone, address, profile_photo_url, cv_url, id_document_url, onboarding_completed, accepted_nda_at, accepted_employment_at, accepted_commission_at, updated_at";

export type AdminEmployeeOnboardingRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  cv_url: string | null;
  id_document_url: string | null;
  onboarding_completed: boolean;
  accepted_nda_at: string | null;
  accepted_employment_at: string | null;
  accepted_commission_at: string | null;
  updated_at: string | null;
};

async function signIfStored(
  db: ReturnType<typeof getSupabaseForAdminApi>,
  url: string | null
): Promise<string | null> {
  if (!url) return null;
  const path = employeeStoragePath(url);
  if (!path) return url;

  const { data, error } = await db.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return resolveEmployeeDocumentUrl(db, url);
  }
  return data.signedUrl;
}

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const [{ data: hrRows, error: hrErr }, { data: profiles, error: profileErr }] = await Promise.all([
      db.from("employee_profiles").select(ONBOARDING_SELECT).order("updated_at", { ascending: false }),
      db.from("profiles").select("id, full_name, role").eq("role", "employee"),
    ]);

    if (hrErr) {
      return NextResponse.json({ error: hrErr.message }, { status: 500 });
    }
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rows = hrRows ?? [];

    const missingProfileIds = rows.map((r) => r.id).filter((id) => !profileMap.has(id));
    if (missingProfileIds.length) {
      const { data: extraProfiles } = await db
        .from("profiles")
        .select("id, full_name, role")
        .in("id", missingProfileIds);
      for (const profile of extraProfiles ?? []) {
        profileMap.set(profile.id, profile);
      }
    }

    const emailMap = new Map<string, string>();
    await Promise.all(
      rows.map(async (row) => {
        const { data } = await db.auth.admin.getUserById(row.id);
        const email = data.user?.email;
        if (email) emailMap.set(row.id, email);
      })
    );

    const onboarding: AdminEmployeeOnboardingRow[] = await Promise.all(
      rows.map(async (row) => {
        const profile = profileMap.get(row.id);
        const [photo, cv, idDoc] = await Promise.all([
          signIfStored(db, row.profile_photo_url),
          signIfStored(db, row.cv_url),
          signIfStored(db, row.id_document_url),
        ]);

        return {
          id: row.id,
          full_name: profile?.full_name ?? null,
          email: emailMap.get(row.id) ?? null,
          employee_code: row.employee_code ?? null,
          job_title: row.job_title ?? null,
          department: row.department ?? null,
          phone: row.phone ?? null,
          address: row.address ?? null,
          profile_photo_url: photo,
          cv_url: cv,
          id_document_url: idDoc,
          onboarding_completed: Boolean(row.onboarding_completed),
          accepted_nda_at: row.accepted_nda_at ?? null,
          accepted_employment_at: row.accepted_employment_at ?? null,
          accepted_commission_at: row.accepted_commission_at ?? null,
          updated_at: row.updated_at ?? null,
        };
      })
    );

    onboarding.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

    return NextResponse.json(
      { onboarding },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (error) {
    console.error("[admin/employee-onboarding]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch onboarding records." },
      { status: 500 }
    );
  }
}
