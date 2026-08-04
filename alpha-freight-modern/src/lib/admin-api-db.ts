import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

export function createAuthedSupabaseFromRequest(request: NextRequest): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
  }

  return createClient(url, anonKey);
}

/** Service role when configured; otherwise session/anon client (same as pre-API admin pages). */
export function getSupabaseForAdminApi(request: NextRequest): SupabaseClient {
  if (isAdminServiceConfigured()) {
    return getAdminSupabase();
  }
  return createAuthedSupabaseFromRequest(request);
}

export function adminApiUsesServiceRole() {
  return isAdminServiceConfigured();
}
