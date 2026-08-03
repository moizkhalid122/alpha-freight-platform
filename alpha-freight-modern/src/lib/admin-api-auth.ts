import type { NextRequest } from "next/server";

import { userHasAdminAccess } from "@/lib/admin-session";

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

  const isAdmin = await userHasAdminAccess(userClient, user);
  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      error: "Admin role required.",
    };
  }

  return { ok: true };
}
