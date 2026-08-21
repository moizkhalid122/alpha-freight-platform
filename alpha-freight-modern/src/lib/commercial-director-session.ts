import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  COMMERCIAL_DIRECTOR_ROLE,
  isCommercialDirectorEmail,
} from "@/lib/commercial-director-access";

export async function userHasCommercialDirectorAccess(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (isCommercialDirectorEmail(user.email)) {
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

  return String(profile?.role ?? "").toLowerCase() === COMMERCIAL_DIRECTOR_ROLE;
}
