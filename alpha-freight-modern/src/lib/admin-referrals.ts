import type { SupabaseClient } from "@supabase/supabase-js";
import { isReferralUserApproved } from "@/lib/referral-approval";

export type AdminReferralType = "carrier" | "supplier";

export type AdminReferralRow = {
  id: string;
  type: AdminReferralType;
  referralCode: string;
  status: string;
  rewardAmount: number;
  milestoneLoads: number;
  loadsCompleted: number;
  earnedAmount: number;
  rewardedAt: string | null;
  createdAt: string;
  referrer: {
    id: string;
    name: string;
    role: string | null;
  };
  referredUser: {
    id: string;
    name: string;
    role: string | null;
    verificationStatus: string | null;
    isApproved: boolean | null;
    isReferralApproved: boolean;
  };
  canApproveUser: boolean;
  canReleaseReward: boolean;
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

type ProfileRecord = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  verification_status: string | null;
  is_approved: boolean | null;
};

function profileName(profile?: ProfileRecord | null) {
  return profile?.company_name || profile?.full_name || "Unknown user";
}

async function countCompletedLoads(
  db: SupabaseClient,
  userId: string,
  type: AdminReferralType
) {
  const column = type === "carrier" ? "carrier_id" : "supplier_id";
  const { count, error } = await db
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq(column, userId)
    .in("status", ["completed", "delivered"]);

  if (error) return 0;
  return count || 0;
}

function buildAdminReferralRow(
  record: ReferralRecord,
  type: AdminReferralType,
  profileMap: Map<string, ProfileRecord>,
  loadsCompleted: number
): AdminReferralRow {
  const referrer = profileMap.get(record.referrer_id);
  const referredUser = profileMap.get(record.referred_user_id);
  const rewardAmount = Number(record.reward_amount || 0);
  const earnedAmount = Number(record.earned_amount || 0);
  const milestoneLoads = record.milestone_loads || (type === "carrier" ? 5 : 10);
  const isReferralApproved = isReferralUserApproved(referredUser);
  const milestoneMet = loadsCompleted >= milestoneLoads;
  const alreadyRewarded = earnedAmount > 0 || record.status === "rewarded";

  return {
    id: record.id,
    type,
    referralCode: record.referral_code,
    status: record.status,
    rewardAmount,
    milestoneLoads,
    loadsCompleted,
    earnedAmount,
    rewardedAt: record.rewarded_at,
    createdAt: record.created_at,
    referrer: {
      id: record.referrer_id,
      name: profileName(referrer),
      role: referrer?.role ?? null,
    },
    referredUser: {
      id: record.referred_user_id,
      name: profileName(referredUser),
      role: referredUser?.role ?? null,
      verificationStatus: referredUser?.verification_status ?? null,
      isApproved: referredUser?.is_approved ?? null,
      isReferralApproved,
    },
    canApproveUser: !isReferralApproved,
    canReleaseReward: isReferralApproved && milestoneMet && !alreadyRewarded,
  };
}

export async function fetchAdminReferrals(
  db: SupabaseClient,
  filter: "all" | AdminReferralType = "all"
) {
  const tables: AdminReferralType[] =
    filter === "all" ? ["carrier", "supplier"] : [filter];

  const referralRecords: Array<{ type: AdminReferralType; record: ReferralRecord }> = [];

  for (const type of tables) {
    const table = type === "carrier" ? "carrier_referrals" : "supplier_referrals";
    const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });

    if (error) {
      if (/does not exist|schema cache/i.test(error.message)) continue;
      throw error;
    }

    for (const row of (data || []) as ReferralRecord[]) {
      referralRecords.push({ type, record: row });
    }
  }

  const profileIds = new Set<string>();
  for (const item of referralRecords) {
    profileIds.add(item.record.referrer_id);
    profileIds.add(item.record.referred_user_id);
  }

  const profileMap = new Map<string, ProfileRecord>();
  if (profileIds.size > 0) {
    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select("id, full_name, company_name, role, verification_status, is_approved")
      .in("id", [...profileIds]);

    if (profilesError) throw profilesError;

    for (const profile of (profiles || []) as ProfileRecord[]) {
      profileMap.set(profile.id, profile);
    }
  }

  const rows: AdminReferralRow[] = [];
  for (const item of referralRecords) {
    const loadsCompleted = await countCompletedLoads(db, item.record.referred_user_id, item.type);
    rows.push(buildAdminReferralRow(item.record, item.type, profileMap, loadsCompleted));
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: rows.length,
    pendingApproval: rows.filter((row) => row.canApproveUser).length,
    readyToRelease: rows.filter((row) => row.canReleaseReward).length,
    rewarded: rows.filter((row) => row.earnedAmount > 0 || row.status === "rewarded").length,
  };

  return { referrals: rows, stats };
}

export async function approveReferredUserForReferral(
  db: SupabaseClient,
  referredUserId: string
) {
  const { data, error } = await db
    .from("profiles")
    .update({
      verification_status: "verified",
      is_approved: true,
    })
    .eq("id", referredUserId)
    .select("id, verification_status, is_approved")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("Referred user profile not found.");

  return data;
}

export async function releaseReferralReward(
  db: SupabaseClient,
  params: { referralId: string; type: AdminReferralType }
) {
  const table = params.type === "carrier" ? "carrier_referrals" : "supplier_referrals";

  const { data: record, error: fetchError } = await db
    .from(table)
    .select("*")
    .eq("id", params.referralId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!record) throw new Error("Referral record not found.");

  const referral = record as ReferralRecord;
  const loadsCompleted = await countCompletedLoads(db, referral.referred_user_id, params.type);
  const milestoneLoads = referral.milestone_loads || (params.type === "carrier" ? 5 : 10);
  const rewardAmount = Number(referral.reward_amount || 0);

  const { data: referredProfile, error: profileError } = await db
    .from("profiles")
    .select("id, verification_status, is_approved")
    .eq("id", referral.referred_user_id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!isReferralUserApproved(referredProfile as ProfileRecord)) {
    throw new Error("Referred user must be admin-approved before releasing the reward.");
  }

  if (loadsCompleted < milestoneLoads) {
    throw new Error(
      `Milestone not met yet (${loadsCompleted}/${milestoneLoads} ${params.type === "carrier" ? "loads" : "shipments"}).`
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from(table)
    .update({
      loads_completed: loadsCompleted,
      earned_amount: rewardAmount,
      status: "rewarded",
      rewarded_at: referral.rewarded_at || now,
      updated_at: now,
    })
    .eq("id", params.referralId)
    .select("*")
    .maybeSingle();

  if (updateError) throw updateError;
  return updated;
}
