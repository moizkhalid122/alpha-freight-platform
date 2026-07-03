import type { NextRequest } from "next/server";
import { isAdminPanelEmail } from "@/lib/admin-access";
import { isAdminServiceConfigured } from "@/lib/supabase-admin";

export type AdminAccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function verifyAdminApiAccess(request: NextRequest): Promise<AdminAccessResult> {
  // Local admin console: allow requests through. Data access uses service role when
  // configured, otherwise falls back to the caller's Supabase session (legacy behaviour).
  if (process.env.NODE_ENV === "development") {
    return { ok: true };
  }

  if (!isAdminServiceConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        "Admin service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local and restart the server.",
    };
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!bearerToken) {
    return { ok: false, status: 401, error: "Missing admin authorization token." };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const userClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }

  const { getAdminSupabase } = await import("@/lib/supabase-admin");
  const admin = getAdminSupabase();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, status: 500, error: profileError.message };
  }

  if (String(profile?.role ?? "").toLowerCase() !== "admin" && !isAdminPanelEmail(user.email)) {
    return {
      ok: false,
      status: 403,
      error: "Admin role required. Set profiles.role = 'admin' for this user in Supabase.",
    };
  }

  return { ok: true };
}
