"use client";

export type CarrierPaymentStatus =
  | "pending_review"
  | "verified"
  | "paid"
  | "failed"
  | "on_hold";

export type CarrierPaymentPriority = "high" | "medium" | "low";

export type CarrierPaymentRecord = {
  transactionId: string;
  loadId: string;
  carrierId: string;
  supplierId: string | null;
  amount: number;
  baseRate: number;
  fuelSurcharge: number;
  vatAmount: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: CarrierPaymentStatus;
  priority: CarrierPaymentPriority;
  verificationNotes?: string;
  disputeReason?: string;
  requestedInfoAt?: string | null;
  verifiedAt?: string | null;
  releasedAt?: string | null;
  heldAt?: string | null;
  rejectedAt?: string | null;
};

const STORAGE_KEY = "alpha-carrier-payment-orders";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCarrierPaymentOrders(): CarrierPaymentRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCarrierPaymentOrders(records: CarrierPaymentRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function upsertCarrierPaymentOrder(record: CarrierPaymentRecord) {
  const existing = readCarrierPaymentOrders();
  const filtered = existing.filter((item) => item.transactionId !== record.transactionId);
  saveCarrierPaymentOrders([record, ...filtered]);
  return record;
}

export function mergeCarrierPaymentOrder(
  transactionId: string,
  updates: Partial<CarrierPaymentRecord>
) {
  const existing = readCarrierPaymentOrders();
  let nextRecord: CarrierPaymentRecord | null = null;

  const nextRecords = existing.map((item) => {
    if (item.transactionId !== transactionId) return item;
    nextRecord = {
      ...item,
      ...updates,
    };
    return nextRecord;
  });

  if (nextRecord) {
    saveCarrierPaymentOrders(nextRecords);
  }

  return nextRecord;
}

