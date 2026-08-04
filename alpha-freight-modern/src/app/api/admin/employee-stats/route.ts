import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

const ROW_LIMIT = 500;

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const [leads, calls, commissions, tasks] = await Promise.all([
      db.from("employee_leads").select("employee_id, status, value_gbp").order("created_at", { ascending: false }).limit(ROW_LIMIT),
      db.from("employee_calls").select("employee_id, duration_minutes, called_at").order("called_at", { ascending: false }).limit(ROW_LIMIT),
      db.from("employee_commissions").select("employee_id, amount_gbp, status").order("created_at", { ascending: false }).limit(ROW_LIMIT),
      db.from("employee_tasks").select("employee_id, status").order("created_at", { ascending: false }).limit(ROW_LIMIT),
    ]);

    const firstError = leads.error || calls.error || commissions.error || tasks.error;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        leads: leads.data ?? [],
        calls: calls.data ?? [],
        commissions: commissions.data ?? [],
        tasks: tasks.data ?? [],
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (error) {
    console.error("[admin/employee-stats]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch employee stats." },
      { status: 500 }
    );
  }
}
