import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isAdminPanelEmail } from "@/lib/admin-access";

type ProfileRoleRow = { role?: string | null };

export async function userHasAdminAccess(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (isAdminPanelEmail(user.email)) {
    return true;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return false;
  }

  return String(profile?.role ?? "").toLowerCase() === "admin";
}
