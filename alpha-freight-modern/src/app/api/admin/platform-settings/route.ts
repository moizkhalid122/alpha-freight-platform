import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { parsePlatformSettings } from "@/lib/platform-data";

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const db = getSupabaseForAdminApi(request);
    const { data, error } = await db
      .from("platform_settings")
      .select("settings, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: parsePlatformSettings(data?.settings),
      updated_at: data?.updated_at ?? null,
    });
  } catch (error) {
    console.error("[admin/platform-settings GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const settings = parsePlatformSettings(body.settings);

    const db = getSupabaseForAdminApi(request);
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    const { data, error } = await db
      .from("platform_settings")
      .upsert(
        {
          id: "default",
          settings,
          updated_at: new Date().toISOString(),
          updated_by: bearerToken ? undefined : null,
        },
        { onConflict: "id" }
      )
      .select("settings, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: parsePlatformSettings(data.settings),
      updated_at: data.updated_at ?? null,
    });
  } catch (error) {
    console.error("[admin/platform-settings PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save settings." },
      { status: 500 }
    );
  }
}
