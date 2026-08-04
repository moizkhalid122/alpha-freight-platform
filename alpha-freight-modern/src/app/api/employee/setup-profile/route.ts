import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

type SetupBody = {
  fullName?: string;
  position?: string;
  department?: string;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing session. Please sign in again." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let body: SetupBody = {};
  try {
    body = (await request.json()) as SetupBody;
  } catch {
    body = {};
  }

  const useAdmin = isAdminServiceConfigured();
  const authClient = useAdmin ? getAdminSupabase() : createClient(url, anonKey);

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      {
        error: useAdmin
          ? "Invalid session. Please sign in again."
          : "Invalid session. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for reliable employee signup, then restart the dev server.",
      },
      { status: 401 }
    );
  }

  const fullName = body.fullName?.trim() || user.user_metadata?.full_name || user.email?.split("@")[0] || "Employee";
  const position = body.position?.trim() || "Team Member";
  const department = body.department?.trim() || "Sales";
  const db = useAdmin ? getAdminSupabase() : createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const now = new Date().toISOString();
  const profilePayload = {
    id: user.id,
    full_name: fullName,
    role: "employee",
    created_at: now,
  };

  const { error: profileError } = await db.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    const { error: updateError } = await db
      .from("profiles")
      .update({ full_name: fullName, role: "employee" })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Profile setup failed: ${profileError.message || updateError.message}` },
        { status: 500 }
      );
    }
  }

  const { error: hrError } = await db.from("employee_profiles").upsert(
    {
      id: user.id,
      job_title: position,
      department,
      status: "active",
      onboarding_completed: false,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (hrError) {
    return NextResponse.json(
      {
        error: `Employee profile failed: ${hrError.message}. Run employee-platform.sql and employee-onboarding.sql in Supabase.`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
