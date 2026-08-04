import type { NextRequest } from "next/server";

import { isAdminPanelEmail } from "@/lib/admin-access";
import { withTimeout } from "@/lib/employee-auth-utils";
export type AdminAccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function verifyAdminApiAccess(request: NextRequest): Promise<AdminAccessResult> {
  const allowDevBypass =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_ADMIN_BYPASS === "true";

  if (allowDevBypass) {
    return { ok: true };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await withTimeout(adminClient.auth.getUser(bearerToken), 10000, "Admin auth");

  if (authError || !user) {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }

  if (isAdminPanelEmail(user.email)) {
    return { ok: true };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || String(profile?.role ?? "").toLowerCase() !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Admin role required.",
    };
  }

  return { ok: true };
}
