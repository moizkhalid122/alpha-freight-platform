"use client";

export type CarrierPodVerificationStatus =
  | "pending"
  | "verified"
  | "on_hold"
  | "rejected"
  | "info_required";

export type CarrierPodUploadRecord = {
  name: string;
  url: string;
  uploadedAt: string;
  mode: "upload" | "team";
  verificationStatus: CarrierPodVerificationStatus;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  requestedInfoAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectedAt?: string | null;
  reviewNote?: string | null;
};

const STORAGE_KEY = "alpha-carrier-pod-uploads";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCarrierPodUploads(): Record<string, CarrierPodUploadRecord> {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeCarrierPodUploads(records: Record<string, CarrierPodUploadRecord>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function mergeCarrierPodUpload(loadId: string, updates: Partial<CarrierPodUploadRecord>) {
  const current = readCarrierPodUploads();
  const existing = current[loadId];
  if (!existing) return null;

  const nextRecord: CarrierPodUploadRecord = {
    ...existing,
    ...updates,
  };

  writeCarrierPodUploads({
    ...current,
    [loadId]: nextRecord,
  });

  return nextRecord;
}
