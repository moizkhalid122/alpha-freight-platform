import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const employeeId = request.nextUrl.searchParams.get("employeeId")?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const [
      profileRes,
      leadsRes,
      callsRes,
      tasksRes,
      commissionsRes,
      activitiesRes,
      trainingRes,
      leaveRes,
      documentsRes,
    ] = await Promise.all([
      db
        .from("employee_profiles")
        .select("id, employee_code, department, job_title, status, hire_date, commission_rate, phone")
        .eq("id", employeeId)
        .maybeSingle(),
      db.from("employee_leads").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(200),
      db.from("employee_calls").select("*").eq("employee_id", employeeId).order("called_at", { ascending: false }).limit(200),
      db.from("employee_tasks").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(200),
      db.from("employee_commissions").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(100),
      db
        .from("employee_lead_activities")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(300),
      db.from("employee_training").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
      db.from("employee_leave_requests").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
      db.from("employee_documents").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
    ]);

    const { data: profileRow } = await db.from("profiles").select("full_name, email").eq("id", employeeId).maybeSingle();

    const firstError =
      leadsRes.error ||
      callsRes.error ||
      tasksRes.error ||
      commissionsRes.error ||
      activitiesRes.error ||
      trainingRes.error ||
      leaveRes.error ||
      documentsRes.error;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: profileRes.data
        ? {
            ...profileRes.data,
            full_name: profileRow?.full_name ?? null,
            email: profileRow?.email ?? null,
          }
        : {
            id: employeeId,
            full_name: profileRow?.full_name ?? null,
            email: profileRow?.email ?? null,
          },
      leads: leadsRes.data ?? [],
      calls: callsRes.data ?? [],
      tasks: tasksRes.data ?? [],
      commissions: commissionsRes.data ?? [],
      activities: activitiesRes.data ?? [],
      training: trainingRes.data ?? [],
      leave: leaveRes.data ?? [],
      documents: documentsRes.data ?? [],
    });
  } catch (error) {
    console.error("[admin/employee-record]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch employee record." },
      { status: 500 }
    );
  }
}
