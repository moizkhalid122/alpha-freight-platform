import type { AccountSetupDraft, AccountType, IdentityDocument } from "@/lib/account-setup-types";
import { identityDocumentExtrasKey } from "@/lib/account-setup-upload";
import { supabase } from "@/lib/supabase";

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

function composeAddress(draft: Pick<AccountSetupDraft, "houseNumber" | "street" | "addressLine1" | "addressLine2" | "city" | "postcode" | "countyState">) {
  const line1 =
    [draft.houseNumber, draft.street].map((part) => part.trim()).filter(Boolean).join(" ") ||
    draft.addressLine1.trim();

  return [line1, draft.addressLine2, draft.city, draft.postcode, draft.countyState, "United Kingdom"]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export async function isAccountSetupComplete(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(profile?.profile_extras);
  return extras.accountSetupComplete === true;
}

export async function saveAccountSetup(draft: AccountSetupDraft): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  if (
    !draft.accountType ||
    !draft.phone.trim() ||
    !(draft.street.trim() || draft.addressLine1.trim()) ||
    !draft.city.trim() ||
    !draft.postcode.trim() ||
    !draft.identityDocument ||
    !draft.identityDocumentUrl
  ) {
    throw new Error("Please complete all required setup steps.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(profile?.profile_extras);
  const fullName = profile?.full_name?.trim() || String(user.user_metadata?.full_name ?? "").trim();
  const accountType = draft.accountType as AccountType;
  const address = composeAddress(draft);
  const addressLine1 =
    [draft.houseNumber, draft.street].map((part) => part.trim()).filter(Boolean).join(" ") ||
    draft.addressLine1.trim();
  const identityDocument = draft.identityDocument as IdentityDocument;

  const mergedExtras: Record<string, unknown> = {
    ...extras,
    accountType,
    accountSetupComplete: true,
    verificationStatus: "review",
    countryCode: draft.countryCode || "+44",
    phone: draft.phone.trim(),
    city: draft.city.trim() || null,
    addressLine1,
    addressLine2: draft.addressLine2.trim() || null,
    street: draft.street.trim() || null,
    houseNumber: draft.houseNumber.trim() || null,
    countyState: draft.countyState.trim() || null,
    postcode: draft.postcode.trim() || null,
    countryName: "United Kingdom",
    address,
    contactPerson: fullName || null,
    companyName:
      accountType === "company"
        ? profile?.company_name?.trim() || fullName || null
        : fullName || null,
    identityDocument,
    identityDocumentUrl: draft.identityDocumentUrl,
    identityDocumentFileName: draft.identityDocumentFileName,
    [identityDocumentExtrasKey(identityDocument)]: draft.identityDocumentUrl,
    accountUses: draft.accountUses,
    annualRevenue: draft.annualRevenue || null,
    operatingRegion: "United Kingdom",
    email: user.email ?? extras.email ?? null,
  };

  if (accountType === "company") {
    mergedExtras.business_address = address;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: accountType === "company" ? profile?.company_name || fullName : profile?.company_name,
      profile_extras: mergedExtras,
    })
    .eq("id", user.id);

  if (error) throw error;
}

export { composeAddress };
