import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

export type PlatformSettings = {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  companyAddress: string;
  websiteUrl: string;
  commissionRate: number;
  minCommissionGbp: number;
  currency: string;
  verificationMode: string;
  autoApproveSuppliers: boolean;
  requirePodVerification: boolean;
  payoutSchedule: string;
  defaultPaymentTerms: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  bidAlerts: boolean;
  apiBaseUrl: string;
  stripeMode: string;
  logoFileName?: string | null;
};

export type ProfileExtrasRecord = CarrierProfileExtras | SupplierProfileExtras;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  companyName: "Alpha Freight",
  supportEmail: "support@alphafreight.co.uk",
  supportPhone: "+44 20 0000 0000",
  companyAddress: "London, United Kingdom",
  websiteUrl: "https://alphafreight.co.uk",
  commissionRate: 12,
  minCommissionGbp: 25,
  currency: "GBP",
  verificationMode: "hybrid",
  autoApproveSuppliers: false,
  requirePodVerification: true,
  payoutSchedule: "weekly",
  defaultPaymentTerms: "net-7",
  emailAlerts: true,
  smsAlerts: false,
  bidAlerts: true,
  apiBaseUrl: "http://localhost:3000/api",
  stripeMode: "test",
  logoFileName: null,
};

export function mergePlatformSettings(
  partial: Partial<PlatformSettings> | null | undefined
): PlatformSettings {
  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...(partial ?? {}),
  };
}

export function parsePlatformSettings(value: unknown): PlatformSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
  return mergePlatformSettings(value as Partial<PlatformSettings>);
}

export function parseProfileExtras<T extends ProfileExtrasRecord>(value: unknown): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as T;
  }
  return value as T;
}

export function hasProfileExtrasData(value: unknown) {
  const parsed = parseProfileExtras(value);
  return Object.keys(parsed).length > 0;
}
