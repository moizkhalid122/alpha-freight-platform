import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!isAdminServiceConfigured()) {
    return NextResponse.json({ shipments: [], bookings: [] });
  }

  const db = getAdminSupabase();
  const [shipmentsResult, bookingsResult] = await Promise.all([
    db.from("air_shipments").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("air_bookings").select("*").order("booked_at", { ascending: false }).limit(200),
  ]);

  if (shipmentsResult.error) {
    return NextResponse.json({ error: shipmentsResult.error.message, shipments: [], bookings: [] });
  }

  return NextResponse.json({
    shipments: shipmentsResult.data ?? [],
    bookings: bookingsResult.error ? [] : bookingsResult.data ?? [],
  });
}
