import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import { buildPublicCarrierListings } from "@/lib/public-directory";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ carriers: [] });
    }

    const db = isAdminServiceConfigured()
      ? getAdminSupabase()
      : createClient(url, anonKey);

    const [profilesResult, loadsResult] = await Promise.all([
      db.from("profiles").select("*").eq("role", "carrier").order("created_at", { ascending: false }),
      db
        .from("loads")
        .select("id, carrier_id, status, created_at")
        .not("carrier_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message, carriers: [] }, { status: 500 });
    }

    const carriers = buildPublicCarrierListings(
      profilesResult.data ?? [],
      loadsResult.data ?? [],
    );

    return NextResponse.json({ carriers });
  } catch (error) {
    console.error("[public/carriers]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch carriers.",
        carriers: [],
      },
      { status: 500 },
    );
  }
}
