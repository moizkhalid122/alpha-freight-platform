import { NextRequest, NextResponse } from "next/server";

import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

type SignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
  position?: string;
  department?: string;
};

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server signup is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const fullName = body.fullName?.trim() || email.split("@")[0] || "Employee";
  const position = body.position?.trim() || "Team Member";
  const department = body.department?.trim() || "Sales";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const admin = getAdminSupabase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "employee",
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message || "Could not create account.";
    if (/already|exists|registered/i.test(msg)) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead.", code: "email_exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      role: "employee",
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return NextResponse.json(
      {
        error: `Profile error: ${profileError.message}. Check profiles table allows role 'employee'.`,
      },
      { status: 500 }
    );
  }

  const { error: hrError } = await admin.from("employee_profiles").upsert(
    {
      id: userId,
      job_title: position,
      department,
      status: "active",
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (hrError) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return NextResponse.json(
      {
        error: `Employee table error: ${hrError.message}. Run employee-platform.sql and employee-onboarding.sql in Supabase SQL Editor.`,
        code: "missing_tables",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId, email });
}
