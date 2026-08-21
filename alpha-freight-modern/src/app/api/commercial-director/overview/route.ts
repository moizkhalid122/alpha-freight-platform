import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);

    const [suppliers, carriers, loads, employees] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "supplier"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "carrier"),
      db.from("loads").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee"),
    ]);

    return NextResponse.json({
      shippers: suppliers.count ?? 0,
      forwarders: carriers.count ?? 0,
      loads: loads.count ?? 0,
      employees: employees.count ?? 0,
    });
  } catch (error) {
    console.error("[commercial-director/overview]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load overview." },
      { status: 500 }
    );
  }
}
