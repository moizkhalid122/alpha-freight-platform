import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import {
  buildVerifyEmployeeResult,
  employeeCodeToUuidPrefix,
  generateEmployeeCode,
  isOfficialEmployeeEmail,
  normalizeEmployeeCodeInput,
  parseVerificationQuery,
  type EmployeeVerifyRow,
  type ProfileVerifyRow,
} from "@/lib/verify-employee";

export const runtime = "nodejs";

const HR_SELECT =
  "id, employee_code, job_title, department, status, onboarding_completed";

async function fetchProfile(db: ReturnType<typeof getAdminSupabase>, userId: string) {
  const { data } = await db
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileVerifyRow | null) ?? null;
}

async function fetchAllHrRows(db: ReturnType<typeof getAdminSupabase>) {
  const { data, error } = await db.from("employee_profiles").select(HR_SELECT).limit(500);
  if (error) {
    console.error("[verify-employee] hr list", error.message);
    return [];
  }
  return (data as EmployeeVerifyRow[]) ?? [];
}

function matchHrByCode(hrRows: EmployeeVerifyRow[], code: string): EmployeeVerifyRow | null {
  const normalized = normalizeEmployeeCodeInput(code);
  const uuidPrefix = employeeCodeToUuidPrefix(normalized);

  for (const hr of hrRows) {
    const stored = hr.employee_code?.trim().toUpperCase() ?? "";
    if (stored && stored === normalized) return hr;
    if (generateEmployeeCode(hr.id) === normalized) return hr;
    if (uuidPrefix && hr.id.toLowerCase().startsWith(uuidPrefix)) return hr;
  }

  return null;
}

async function lookupByEmail(db: ReturnType<typeof getAdminSupabase>, email: string) {
  const { data: profileByEmail } = await db
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("role", "employee")
    .ilike("email", email)
    .maybeSingle();

  if (!profileByEmail) return { profile: null, hr: null };

  const { data: hrRow } = await db.from("employee_profiles").select(HR_SELECT).eq("id", profileByEmail.id).maybeSingle();
  return {
    profile: profileByEmail as ProfileVerifyRow,
    hr: (hrRow as EmployeeVerifyRow | null) ?? null,
  };
}

async function lookupByCode(db: ReturnType<typeof getAdminSupabase>, code: string) {
  const hrRows = await fetchAllHrRows(db);
  const hr = matchHrByCode(hrRows, code);
  if (!hr) return { profile: null, hr: null };

  const profile = await fetchProfile(db, hr.id);
  if (!profile || profile.role !== "employee") return { profile: null, hr: null };

  return { profile, hr };
}

function persistEmployeeCode(
  db: ReturnType<typeof getAdminSupabase>,
  userId: string,
  code: string,
  existing: string | null
) {
  if (existing?.trim()) return;
  void db
    .from("employee_profiles")
    .update({ employee_code: code, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { verified: false, message: "Verification is temporarily unavailable.", reason: "not_found" },
      { status: 503 }
    );
  }

  let body: { query?: string } = {};
  try {
    body = (await request.json()) as { query?: string };
  } catch {
    return NextResponse.json(
      { verified: false, message: "Invalid request.", reason: "invalid_input" },
      { status: 400 }
    );
  }

  const parsed = parseVerificationQuery(body.query ?? "");
  if (!parsed) {
    return NextResponse.json({
      verified: false,
      message: "Enter a valid Employee ID or official @alphafreightuk.com email.",
      reason: "invalid_input",
    });
  }

  if (parsed.type === "email" && !isOfficialEmployeeEmail(parsed.value)) {
    return NextResponse.json({
      verified: false,
      message: "Employee Not Found",
      reason: "invalid_email",
    });
  }

  const db = getAdminSupabase();

  try {
    const { profile, hr } =
      parsed.type === "email"
        ? await lookupByEmail(db, parsed.value)
        : await lookupByCode(db, parsed.value);

    const employeeCode =
      hr?.employee_code?.trim().toUpperCase() ||
      (profile ? generateEmployeeCode(profile.id) : parsed.type === "code" ? parsed.value : "");

    if (profile && employeeCode) {
      persistEmployeeCode(db, profile.id, employeeCode, hr?.employee_code ?? null);
    }

    const email = profile?.email?.trim().toLowerCase() ?? null;
    const result = buildVerifyEmployeeResult(profile, hr, email, employeeCode);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[public/verify-employee]", error);
    return NextResponse.json(
      { verified: false, message: "Unable to verify right now. Please try again.", reason: "not_found" },
      { status: 500 }
    );
  }
}
