import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { fetchAdminEmployeesRest } from "@/lib/admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HR_SELECT =
  "id, employee_code, department, job_title, status, hire_date, commission_rate, phone, updated_at";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let employeesCache: {
  expiresAt: number;
  employees: Awaited<ReturnType<typeof fetchAdminEmployeesRest>>;
} | null = null;

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (employeesCache && employeesCache.expiresAt > now) {
    return NextResponse.json({ employees: employeesCache.employees }, { headers: CACHE_HEADERS });
  }

  try {
    const employees = await fetchAdminEmployeesRest();
    employeesCache = { expiresAt: now + SERVER_CACHE_MS, employees };
    return NextResponse.json({ employees }, { headers: CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/employees] REST failed:", restError);
    if (employeesCache) {
      return NextResponse.json({ employees: employeesCache.employees }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ employees: [] }, { headers: CACHE_HEADERS });
  }
}
