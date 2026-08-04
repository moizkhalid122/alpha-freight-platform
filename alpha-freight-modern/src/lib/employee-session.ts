import type { SupabaseClient, User } from "@supabase/supabase-js";

type ProfileRoleRow = { role?: string | null };

export async function userHasEmployeeAccess(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  const metaRole = String(user.user_metadata?.role ?? "").toLowerCase();
  if (metaRole === "employee") {
    return true;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return metaRole === "employee";
  }

  return String(profile?.role ?? "").toLowerCase() === "employee";
}
