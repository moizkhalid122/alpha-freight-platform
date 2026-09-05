import { supabase } from "@/lib/supabase";

export type ProfileVerificationFields = {
  verification_status?: string;
  status?: string;
  is_approved?: boolean;
};

export async function updateProfileVerificationFields(
  userId: string,
  fields: ProfileVerificationFields,
) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);

  if (!error) return { ok: true as const, skipped: false };

  if (/could not find the .* column of 'profiles'/i.test(error.message)) {
    return { ok: true as const, skipped: true };
  }

  throw error;
}
