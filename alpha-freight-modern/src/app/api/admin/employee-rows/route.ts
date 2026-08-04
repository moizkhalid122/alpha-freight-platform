import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

const ALLOWED_TABLES = new Set([
  "employee_tasks",
  "employee_leads",
  "employee_calls",
  "employee_commissions",
  "employee_documents",
  "employee_training",
  "employee_leave_requests",
]);

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const table = request.nextUrl.searchParams.get("table")?.trim() ?? "";
  const orderCol = request.nextUrl.searchParams.get("order")?.trim() || "created_at";

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Invalid employee table." }, { status: 400 });
  }

  try {
    const db = getSupabaseForAdminApi(request);
    const { data, error } = await db.from(table).select("*").order(orderCol, { ascending: false }).limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (error) {
    console.error("[admin/employee-rows]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch employee rows." },
      { status: 500 }
    );
  }
}
