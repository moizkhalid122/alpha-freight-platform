import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await context.params;
  const userId = String(id || "").trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing profile id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const profileExtras = body.profile_extras;

    if (!profileExtras || typeof profileExtras !== "object" || Array.isArray(profileExtras)) {
      return NextResponse.json({ error: "Invalid profile_extras payload." }, { status: 400 });
    }

    const db = getSupabaseForAdminApi(request);
    const { data, error } = await db
      .from("profiles")
      .update({ profile_extras: profileExtras })
      .eq("id", userId)
      .select("id, profile_extras")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("[admin/profiles/[id]/extras PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile extras." },
      { status: 500 }
    );
  }
}
