import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const idsParam = searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  try {
    const db = getSupabaseForAdminApi(request);
    let query = db.from("profiles").select("*");

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (ids.length) {
      query = query.in("id", ids);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: data ?? [] });
  } catch (error) {
    console.error("[admin/profiles]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch profiles." },
      { status: 500 }
    );
  }
}
