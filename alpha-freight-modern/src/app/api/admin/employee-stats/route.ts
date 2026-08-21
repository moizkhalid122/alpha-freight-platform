import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { fetchAdminEmployeeStatsRest } from "@/lib/admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let statsCache: {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchAdminEmployeeStatsRest>>;
} | null = null;

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = Date.now();
  if (statsCache && statsCache.expiresAt > now) {
    return NextResponse.json(statsCache.body, { headers: CACHE_HEADERS });
  }

  try {
    const body = await fetchAdminEmployeeStatsRest();
    statsCache = { expiresAt: now + SERVER_CACHE_MS, body };
    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/employee-stats] REST failed, trying Supabase client:", restError);

    try {
      const db = getSupabaseForAdminApi(request);
      const [leads, calls, commissions, tasks] = await Promise.all([
        db
          .from("employee_leads")
          .select("employee_id, status, value_gbp")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("employee_calls")
          .select("employee_id, duration_minutes, called_at")
          .order("called_at", { ascending: false })
          .limit(500),
        db
          .from("employee_commissions")
          .select("employee_id, amount_gbp, status")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("employee_tasks")
          .select("employee_id, status")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      const firstError = leads.error || calls.error || commissions.error || tasks.error;
      if (firstError) {
        return NextResponse.json({ error: firstError.message }, { status: 500 });
      }

      const body = {
        leads: leads.data ?? [],
        calls: calls.data ?? [],
        commissions: commissions.data ?? [],
        tasks: tasks.data ?? [],
      };

      statsCache = { expiresAt: now + SERVER_CACHE_MS, body };
      return NextResponse.json(body, { headers: CACHE_HEADERS });
    } catch (fallbackError) {
      console.error("[admin/employee-stats]", fallbackError);
      if (statsCache) {
        return NextResponse.json(statsCache.body, { headers: CACHE_HEADERS });
      }
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : "Unable to fetch employee stats." },
        { status: 503 }
      );
    }
  }
}
