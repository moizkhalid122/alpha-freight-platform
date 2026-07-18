import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import { buildPublicSupplierListings } from "@/lib/public-directory";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ suppliers: [] });
    }

    const db = isAdminServiceConfigured()
      ? getAdminSupabase()
      : createClient(url, anonKey);

    const [profilesResult, loadsResult] = await Promise.all([
      db.from("profiles").select("*").eq("role", "supplier").order("created_at", { ascending: false }),
      db
        .from("loads")
        .select("id, supplier_id, status, created_at")
        .not("supplier_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message, suppliers: [] }, { status: 500 });
    }

    const suppliers = buildPublicSupplierListings(
      profilesResult.data ?? [],
      loadsResult.data ?? [],
    );

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("[public/suppliers]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch suppliers.",
        suppliers: [],
      },
      { status: 500 },
    );
  }
}
