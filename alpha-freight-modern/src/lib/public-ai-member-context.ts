import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMemberProPromptBlock } from "@/lib/openai-model-router";

export async function fetchPublicMemberPromptContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const proBlock = buildMemberProPromptBlock();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, city, company_name")
      .eq("id", userId)
      .maybeSingle();

    const lines: string[] = [];
    if (profile?.full_name) lines.push(`Name: ${profile.full_name}`);
    if (profile?.role) lines.push(`Account role: ${profile.role}`);
    if (profile?.city) lines.push(`City: ${profile.city}`);
    if (profile?.company_name) lines.push(`Company: ${profile.company_name}`);

    if (!lines.length) return proBlock;

    return `${proBlock}\n\nMember profile (use naturally — do not read out as a list):\n${lines.map((line) => `- ${line}`).join("\n")}`;
  } catch {
    return proBlock;
  }
}
