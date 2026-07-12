import { supabase } from "@/lib/supabase";

type Role = "carrier" | "supplier";

type SignupParams = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  referralCode?: string;
};

export async function completeSignup({
  email,
  password,
  fullName,
  role,
  referralCode,
}: SignupParams) {
  const code = referralCode?.trim().toUpperCase() || null;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role,
      },
    },
  });

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error("Account could not be created. Please try again.");
  }

  if (!authData.session) {
    return {
      needsEmailVerification: true as const,
      userId: authData.user.id,
    };
  }

  const { error: profileError } = await supabase.from("profiles").upsert([
    {
      id: authData.user.id,
      full_name: fullName.trim(),
      role,
      referred_by_code: code,
      created_at: new Date().toISOString(),
      verification_status: "pending",
      is_approved: false,
    },
  ]);

  if (profileError) throw profileError;

  if (code) {
    await recordReferral(role, authData.user.id, code);
  }

  return {
    needsEmailVerification: false as const,
    userId: authData.user.id,
  };
}

async function recordReferral(role: Role, referredUserId: string, referralCode: string) {
  const referralsTable = role === "carrier" ? "carrier_referrals" : "supplier_referrals";

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("referral_code", referralCode)
    .eq("role", role)
    .maybeSingle();

  if (!referrer?.id || referrer.id === referredUserId) return;

  const { data: existing } = await supabase
    .from(referralsTable)
    .select("id")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from("profiles").update({ referred_by_code: referralCode }).eq("id", referredUserId);

  await supabase.from(referralsTable).insert([
    {
      referrer_id: referrer.id,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: "pending",
    },
  ]);
}
