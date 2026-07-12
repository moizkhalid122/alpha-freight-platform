import { supabase } from "@/lib/supabase";

export type AppRole = "carrier" | "supplier";

export function normalizeAppRole(value: unknown): AppRole {
  return String(value ?? "").trim().toLowerCase() === "supplier" ? "supplier" : "carrier";
}

export async function getUserRole(userId: string): Promise<AppRole> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return normalizeAppRole(profile?.role);
}

export function homeRouteForRole(role: AppRole) {
  return role === "supplier" ? "/(supplier-main)/home" : "/(main)/home";
}

export function roleMismatchMessage(selected: AppRole, actual: AppRole) {
  if (selected === actual) return null;
  return actual === "supplier"
    ? "This account is registered as a supplier. Switch to the Supplier tab."
    : "This account is registered as a carrier. Switch to the Carrier tab.";
}
