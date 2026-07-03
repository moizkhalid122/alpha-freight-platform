"use client";

export type ReferralPayoutRecord = {
  id: string;
  userId: string;
  role: "carrier" | "supplier";
  amount: number;
  createdAt: string;
  status: "processing" | "completed";
};

const STORAGE_KEY = "alpha-referral-payouts";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readReferralPayouts(userId?: string | null): ReferralPayoutRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed) ? (parsed as ReferralPayoutRecord[]) : [];
    if (!userId) return records;
    return records.filter((item) => item.userId === userId);
  } catch {
    return [];
  }
}

export function saveReferralPayout(record: ReferralPayoutRecord) {
  if (!canUseStorage()) return record;

  const existing = readReferralPayouts();
  const filtered = existing.filter((item) => item.id !== record.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...filtered]));
  return record;
}

export function getReferralPaidOutTotal(userId: string) {
  return readReferralPayouts(userId)
    .filter((item) => item.status === "completed" || item.status === "processing")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function getAvailableReferralBalance(userId: string, totalEarned: number) {
  return Math.max(0, totalEarned - getReferralPaidOutTotal(userId));
}
