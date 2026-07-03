"use client";

import { supabase } from "@/lib/supabase";

export const REFERRAL_APP_URL = "https://alphafreightuk.com";
export const CARRIER_REFERRAL_MILESTONE_LOADS = 5;
export const CARRIER_REFERRAL_BASE_REWARD = 50;

export type ReferralDisplayStatus = "Pending" | "Active" | "Completed";

export type CarrierReferralRow = {
  id: string;
  name: string;
  date: string;
  status: ReferralDisplayStatus;
  earned: number;
  loads: number;
  joinedAt: string;
};

export type CarrierReferralStats = {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  pendingRewards: number;
};

export type CarrierReferralDashboard = {
  referralCode: string;
  carrierName: string;
  stats: CarrierReferralStats;
  referrals: CarrierReferralRow[];
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  referral_code: string | null;
  role: string | null;
};

type ReferralRecord = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: string;
  reward_amount: number | string;
  milestone_loads: number;
  loads_completed: number;
  earned_amount: number | string;
  rewarded_at: string | null;
  created_at: string;
};

const isMissingTableError = (message: string) =>
  /carrier_referrals|referral_code|schema cache|relation.*does not exist|could not find the table/i.test(
    message
  );

export function buildCarrierReferralCode(userId: string) {
  return `AF-CAR-${userId.slice(0, 8).toUpperCase()}`;
}

export function buildCarrierReferralSignupLink(referralCode: string) {
  const params = new URLSearchParams({
    role: "carrier",
    ref: referralCode,
  });
  return `${REFERRAL_APP_URL}/auth/signup?${params.toString()}`;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function resolveDisplayStatus(loadsCompleted: number, milestoneLoads: number): ReferralDisplayStatus {
  if (loadsCompleted >= milestoneLoads) return "Completed";
  if (loadsCompleted > 0) return "Active";
  return "Pending";
}

function resolveEarnedAmount(
  loadsCompleted: number,
  milestoneLoads: number,
  rewardAmount: number,
  storedEarned: number,
  storedStatus: string
) {
  if (storedEarned > 0 || storedStatus === "rewarded") return storedEarned;
  if (loadsCompleted >= milestoneLoads) return rewardAmount;
  return 0;
}

async function countCompletedLoadsForCarrier(carrierId: string) {
  const { count, error } = await supabase
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq("carrier_id", carrierId)
    .in("status", ["completed", "delivered"]);

  if (error) return 0;
  return count || 0;
}

export async function ensureCarrierReferralCode(carrierId: string) {
  const code = buildCarrierReferralCode(carrierId);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", carrierId)
    .maybeSingle();

  if (error && !isMissingTableError(error.message)) {
    throw error;
  }

  if (profile?.referral_code) {
    return profile.referral_code;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", carrierId);

  if (updateError && !isMissingTableError(updateError.message)) {
    console.warn("[carrier-referrals] Unable to save referral code:", updateError.message);
  }

  return code;
}

async function findReferrerByCode(referralCode: string): Promise<ProfileRow | null> {
  const normalized = referralCode.trim().toUpperCase();

  const { data: byStoredCode, error: storedError } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, referral_code, role")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (!storedError && byStoredCode?.role === "carrier") {
    return byStoredCode as ProfileRow;
  }

  const { data: carriers, error: carriersError } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, referral_code, role")
    .eq("role", "carrier");

  if (carriersError || !carriers?.length) return null;

  const matched = (carriers as ProfileRow[]).find(
    (profile) => buildCarrierReferralCode(profile.id) === normalized
  );

  return matched || null;
}

export async function recordCarrierReferralFromSignup(params: {
  referredUserId: string;
  referralCode: string;
}) {
  const referralCode = params.referralCode.trim().toUpperCase();
  if (!referralCode) return;

  const referrer = await findReferrerByCode(referralCode);
  if (!referrer || referrer.id === params.referredUserId) return;

  const { data: existing } = await supabase
    .from("carrier_referrals")
    .select("id")
    .eq("referred_user_id", params.referredUserId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from("profiles").update({ referred_by_code: referralCode }).eq("id", params.referredUserId);

  const { error } = await supabase.from("carrier_referrals").insert([
    {
      referrer_id: referrer.id,
      referred_user_id: params.referredUserId,
      referral_code: referralCode,
      status: "pending",
      reward_amount: CARRIER_REFERRAL_BASE_REWARD,
      milestone_loads: CARRIER_REFERRAL_MILESTONE_LOADS,
    },
  ]);

  if (error && !isMissingTableError(error.message)) {
    console.warn("[carrier-referrals] Unable to record referral:", error.message);
  }
}

export async function fetchCarrierReferralDashboard(
  carrierId: string
): Promise<CarrierReferralDashboard> {
  const referralCode = await ensureCarrierReferralCode(carrierId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", carrierId)
    .maybeSingle();

  const carrierName = profile?.company_name || profile?.full_name || "Partner";

  const { data: referralRows, error } = await supabase
    .from("carrier_referrals")
    .select("*")
    .eq("referrer_id", carrierId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return {
        referralCode,
        carrierName,
        stats: {
          totalReferrals: 0,
          activeReferrals: 0,
          pendingReferrals: 0,
          totalEarned: 0,
          pendingRewards: 0,
        },
        referrals: [],
      };
    }
    throw error;
  }

  const records = (referralRows || []) as ReferralRecord[];
  const referredIds = records.map((row) => row.referred_user_id);

  const profileMap = new Map<string, ProfileRow>();
  if (referredIds.length > 0) {
    const { data: referredProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, referral_code, role")
      .in("id", referredIds);

    for (const row of (referredProfiles || []) as ProfileRow[]) {
      profileMap.set(row.id, row);
    }
  }

  const referrals: CarrierReferralRow[] = [];
  let totalEarned = 0;
  let pendingRewards = 0;
  let activeReferrals = 0;
  let pendingReferrals = 0;

  for (const record of records) {
    const loadsCompleted = await countCompletedLoadsForCarrier(record.referred_user_id);
    const milestoneLoads = record.milestone_loads || CARRIER_REFERRAL_MILESTONE_LOADS;
    const rewardAmount = Number(record.reward_amount || CARRIER_REFERRAL_BASE_REWARD);
    const displayStatus = resolveDisplayStatus(loadsCompleted, milestoneLoads);
    const earned = resolveEarnedAmount(
      loadsCompleted,
      milestoneLoads,
      rewardAmount,
      Number(record.earned_amount || 0),
      record.status
    );

    if (loadsCompleted !== record.loads_completed || record.status !== displayStatus.toLowerCase()) {
      const nextStatus =
        loadsCompleted >= milestoneLoads
          ? earned > 0 || record.status === "rewarded"
            ? "rewarded"
            : "completed"
          : loadsCompleted > 0
            ? "active"
            : "pending";

      await supabase
        .from("carrier_referrals")
        .update({
          loads_completed: loadsCompleted,
          status: nextStatus,
          earned_amount: earned,
          rewarded_at: earned > 0 ? record.rewarded_at || new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)
        .eq("referrer_id", carrierId);
    }

    const referredProfile = profileMap.get(record.referred_user_id);
    const name =
      referredProfile?.company_name ||
      referredProfile?.full_name ||
      `Carrier ${record.referred_user_id.slice(0, 8).toUpperCase()}`;

    referrals.push({
      id: record.id,
      name,
      date: formatRelativeDate(record.created_at),
      status: displayStatus,
      earned,
      loads: loadsCompleted,
      joinedAt: record.created_at,
    });

    if (displayStatus === "Active") activeReferrals += 1;
    if (displayStatus === "Pending") pendingReferrals += 1;
    if (earned > 0) totalEarned += earned;
    else if (displayStatus === "Completed") pendingRewards += rewardAmount;
  }

  return {
    referralCode,
    carrierName,
    stats: {
      totalReferrals: referrals.length,
      activeReferrals,
      pendingReferrals,
      totalEarned,
      pendingRewards,
    },
    referrals,
  };
}
