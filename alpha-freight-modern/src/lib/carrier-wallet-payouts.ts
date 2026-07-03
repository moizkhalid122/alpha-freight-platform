"use client";

export type CarrierWalletPayoutStatus = "processing" | "completed" | "on_hold" | "failed";

export type CarrierWalletPayoutRecord = {
  id: string;
  carrierId: string;
  amount: number;
  internalNote?: string;
  statementDescriptor: string;
  bankName: string;
  accountHolder: string;
  accountSuffix: string;
  createdAt: string;
  status: CarrierWalletPayoutStatus;
};

const STORAGE_KEY = "alpha-carrier-wallet-payouts";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCarrierWalletPayouts(carrierId?: string | null): CarrierWalletPayoutRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed) ? parsed : [];

    if (!carrierId) return records;
    return records.filter((item) => item?.carrierId === carrierId);
  } catch {
    return [];
  }
}

export function saveCarrierWalletPayout(record: CarrierWalletPayoutRecord) {
  if (!canUseStorage()) return record;

  const existing = readCarrierWalletPayouts();
  const filtered = existing.filter((item) => item.id !== record.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...filtered]));
  return record;
}

export function mergeCarrierWalletPayout(
  payoutId: string,
  updates: Partial<CarrierWalletPayoutRecord>
) {
  if (!canUseStorage()) return null;

  const existing = readCarrierWalletPayouts();
  let nextRecord: CarrierWalletPayoutRecord | null = null;

  const nextRecords = existing.map((item) => {
    if (item.id !== payoutId) return item;
    nextRecord = {
      ...item,
      ...updates,
    };
    return nextRecord;
  });

  if (nextRecord) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  }

  return nextRecord;
}
