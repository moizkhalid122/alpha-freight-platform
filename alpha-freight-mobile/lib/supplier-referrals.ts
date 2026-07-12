import { supabase } from "@/lib/supabase";
import { isReferralUserApproved } from "@/lib/referral-approval";

export const REFERRAL_APP_URL = "https://alphafreightuk.com";
export const SUPPLIER_REFERRAL_MILESTONE_LOADS = 10;
export const SUPPLIER_REFERRAL_BASE_REWARD = 100;

export type ReferralDisplayStatus = "Pending" | "Active" | "Completed";

export type SupplierReferralRow = {
  id: string;
  name: string;
  date: string;
  status: ReferralDisplayStatus;
  earned: number;
  loads: number;
  joinedAt: string;
};

export type SupplierReferralStats = {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  pendingRewards: number;
};

export type SupplierReferralDashboard = {
  referralCode: string;
  supplierName: string;
  stats: SupplierReferralStats;
  referrals: SupplierReferralRow[];
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  referral_code: string | null;
  role: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
  status?: string | null;
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
  /supplier_referrals|referral_code|schema cache|relation.*does not exist|could not find the table/i.test(
    message
  );

export function buildSupplierReferralCode(userId: string) {
  return `AF-SUP-${userId.slice(0, 8).toUpperCase()}`;
}

export function buildSupplierReferralSignupLink(referralCode: string) {
  const params = new URLSearchParams({
    role: "supplier",
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
  storedStatus: string,
  isApproved: boolean
) {
  if (storedEarned > 0 || storedStatus === "rewarded") return storedEarned;
  if (!isApproved) return 0;
  if (loadsCompleted >= milestoneLoads) return rewardAmount;
  return 0;
}

async function countCompletedLoadsForSupplier(supplierId: string) {
  const { count, error } = await supabase
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .in("status", ["completed", "delivered"]);

  if (error) return 0;
  return count || 0;
}

async function ensureSupplierReferralCode(supplierId: string) {
  const code = buildSupplierReferralCode(supplierId);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", supplierId)
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
    .eq("id", supplierId);

  if (updateError && !isMissingTableError(updateError.message)) {
    console.warn("[supplier-referrals] Unable to save referral code:", updateError.message);
  }

  return code;
}

export async function fetchSupplierReferralDashboard(): Promise<SupplierReferralDashboard | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const supplierId = user.id;
  const referralCode = await ensureSupplierReferralCode(supplierId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", supplierId)
    .maybeSingle();

  const supplierName = profile?.company_name || profile?.full_name || "Partner";

  const { data: referralRows, error } = await supabase
    .from("supplier_referrals")
    .select("*")
    .eq("referrer_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return {
        referralCode,
        supplierName,
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
      .select("id, full_name, company_name, referral_code, role, verification_status, is_approved, status")
      .in("id", referredIds);

    for (const row of (referredProfiles || []) as ProfileRow[]) {
      profileMap.set(row.id, row);
    }
  }

  const referrals: SupplierReferralRow[] = [];
  let totalEarned = 0;
  let pendingRewards = 0;
  let activeReferrals = 0;
  let pendingReferrals = 0;

  for (const record of records) {
    const loadsCompleted = await countCompletedLoadsForSupplier(record.referred_user_id);
    const milestoneLoads = record.milestone_loads || SUPPLIER_REFERRAL_MILESTONE_LOADS;
    const rewardAmount = Number(record.reward_amount || SUPPLIER_REFERRAL_BASE_REWARD);
    const referredProfile = profileMap.get(record.referred_user_id);
    const isApproved = isReferralUserApproved(referredProfile);
    const displayStatus = resolveDisplayStatus(loadsCompleted, milestoneLoads);
    const earned = resolveEarnedAmount(
      loadsCompleted,
      milestoneLoads,
      rewardAmount,
      Number(record.earned_amount || 0),
      record.status,
      isApproved
    );

    const name =
      referredProfile?.company_name ||
      referredProfile?.full_name ||
      `Supplier ${record.referred_user_id.slice(0, 8).toUpperCase()}`;

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
    supplierName,
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
