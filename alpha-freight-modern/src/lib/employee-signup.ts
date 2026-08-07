import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export type CompleteEmployeeSignupInput = {
  userId: string;
  session: Session;
  fullName: string;
  position?: string;
  department?: string;
};

export type CompleteEmployeeSignupResult = {
  profileReady: boolean;
  hrReady: boolean;
  warning?: string;
};

export type EnsureEmployeeAccountInput = {
  userId: string;
  fullName?: string;
  position?: string;
  department?: string;
  session?: Session | null;
};

function resolveEmployeeIdentity(user: User | null, input: EnsureEmployeeAccountInput) {
  const meta = user?.user_metadata ?? {};
  return {
    fullName:
      input.fullName?.trim() ||
      (typeof meta.full_name === "string" ? meta.full_name : "") ||
      user?.email?.split("@")[0] ||
      "Employee",
    position:
      input.position?.trim() ||
      (typeof meta.position === "string" ? meta.position : "") ||
      (typeof meta.job_title === "string" ? meta.job_title : "") ||
      "Team Member",
    department: input.department?.trim() || "Sales",
    email: user?.email ?? null,
  };
}

async function ensureEmployeeAccountViaApi(
  session: Session,
  input: EnsureEmployeeAccountInput & { fullName: string; position: string; department: string }
): Promise<void> {
  const response = await fetch("/api/employee/setup-profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: input.fullName,
      position: input.position,
      department: input.department,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not set up your employee account on the server.");
  }
}

import { formatAuthError } from "@/lib/format-error";
import { generateEmployeeCode } from "@/lib/employee-code";

async function upsertEmployeeRows(
  supabase: SupabaseClient,
  userId: string,
  identity: { fullName: string; position: string; department: string; email?: string | null }
) {
  const now = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: identity.fullName,
      role: "employee",
      created_at: now,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(formatAuthError(profileError));
  }

  const { error: hrError } = await supabase.from("employee_profiles").upsert(
    {
      id: userId,
      employee_code: generateEmployeeCode(userId),
      job_title: identity.position,
      department: identity.department,
      status: "active",
      onboarding_completed: false,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (hrError && !/duplicate key/i.test(hrError.message)) {
    throw new Error(formatAuthError(hrError));
  }
}

/** Fast path: upsert profiles + employee_profiles (2 calls). API fallback only if needed. */
export async function ensureEmployeeAccount(
  supabase: SupabaseClient,
  input: EnsureEmployeeAccountInput
): Promise<void> {
  const { userId } = input;

  let user: User | null = null;
  if (!input.fullName?.trim()) {
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  }

  const identity = resolveEmployeeIdentity(user, input);

  try {
    await upsertEmployeeRows(supabase, userId, identity);
    return;
  } catch (err) {
    const message = formatAuthError(err);
    const needsServer =
      /foreign key|permission denied|row-level security|policy|duplicate key/i.test(message) ||
      /42501|23503/i.test(message);

    if (!needsServer) {
      throw new Error(message);
    }

    const session = input.session ?? (await supabase.auth.getSession()).data.session;
    if (!session) {
      throw new Error(
        "Could not save your profile. Please sign in again — your account was created but setup needs one more step."
      );
    }

    await ensureEmployeeAccountViaApi(session, {
      ...input,
      fullName: identity.fullName,
      position: identity.position,
      department: identity.department,
    });
  }
}

/** Browser-side profile setup immediately after auth.signUp. */
export async function completeEmployeeSignup(
  supabase: SupabaseClient,
  input: CompleteEmployeeSignupInput
): Promise<CompleteEmployeeSignupResult> {
  const { userId, session, fullName, position = "Team Member", department = "Sales" } = input;

  try {
    await ensureEmployeeAccount(supabase, { userId, fullName, position, department, session });
    return { profileReady: true, hrReady: true };
  } catch (err) {
    return {
      profileReady: false,
      hrReady: false,
      warning: err instanceof Error ? err.message : "Employee account setup failed.",
    };
  }
}
