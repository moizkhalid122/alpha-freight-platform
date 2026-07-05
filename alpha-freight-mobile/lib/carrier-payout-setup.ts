import { supabase } from "@/lib/supabase";

export type CarrierPayoutDetails = {
  payoutSetupComplete: boolean;
  payoutMethod: string;
  bankAccountHolderName: string;
  bankName: string;
  bankCountry: string;
  bankSortCode: string;
  bankAccountNumber: string;
  bankAccountType: "personal" | "corporate";
};

export type PayoutSetupForm = {
  accountHolderName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: "personal" | "corporate";
};

function parseExtras(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function readString(extras: Record<string, unknown>, key: string) {
  const value = extras[key];
  return typeof value === "string" ? value.trim() : "";
}

export function maskAccountNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}

export function formatSortCode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export function payoutDetailsToForm(details: CarrierPayoutDetails): PayoutSetupForm {
  return {
    accountHolderName: details.bankAccountHolderName,
    bankName: details.bankName,
    sortCode: details.bankSortCode,
    accountNumber: details.bankAccountNumber,
    confirmAccountNumber: details.bankAccountNumber,
    accountType: details.bankAccountType,
  };
}

export function mapExtrasToPayoutDetails(extras: Record<string, unknown>): CarrierPayoutDetails {
  const accountType = readString(extras, "bankAccountType").toLowerCase();
  return {
    payoutSetupComplete: extras.payoutSetupComplete === true,
    payoutMethod: readString(extras, "payoutMethod") || "Bank transfer",
    bankAccountHolderName: readString(extras, "bankAccountHolderName"),
    bankName: readString(extras, "bankName"),
    bankCountry: readString(extras, "bankCountry") || "United Kingdom",
    bankSortCode: readString(extras, "bankSortCode"),
    bankAccountNumber: readString(extras, "bankAccountNumber"),
    bankAccountType: accountType === "corporate" ? "corporate" : "personal",
  };
}

export async function fetchCarrierPayoutDetails(): Promise<CarrierPayoutDetails | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  return mapExtrasToPayoutDetails(parseExtras(profile?.profile_extras));
}

export async function saveCarrierPayoutSetup(form: PayoutSetupForm): Promise<CarrierPayoutDetails> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be signed in to save payout details.");

  const { data: current } = await supabase
    .from("profiles")
    .select("profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(current?.profile_extras);
  const mergedExtras = {
    ...extras,
    payoutMethod: "Bank transfer",
    preferredPaymentMethod: "Bank Transfer",
    payoutSetupComplete: true,
    bankAccountHolderName: form.accountHolderName.trim(),
    bankName: form.bankName.trim(),
    bankCountry: "United Kingdom",
    bankSortCode: formatSortCode(form.sortCode),
    bankAccountNumber: form.accountNumber.replace(/\D/g, ""),
    bankAccountType: form.accountType,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ profile_extras: mergedExtras })
    .eq("id", user.id);

  if (error) throw error;

  return mapExtrasToPayoutDetails(mergedExtras);
}

export function validatePayoutSetupForm(form: PayoutSetupForm) {
  if (!form.accountHolderName.trim()) return "Enter the account holder name.";
  if (!form.bankName.trim()) return "Enter your bank name.";
  if (form.sortCode.replace(/\D/g, "").length !== 6) return "Enter a valid 6-digit sort code.";
  if (form.accountNumber.replace(/\D/g, "").length !== 8) return "Enter a valid 8-digit account number.";
  if (form.accountNumber.trim() !== form.confirmAccountNumber.trim()) {
    return "Account numbers do not match.";
  }
  return null;
}
