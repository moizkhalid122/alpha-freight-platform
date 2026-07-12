import * as ImagePicker from "expo-image-picker";
import { formatSupplierMoney } from "@/lib/supplier-payments";
import { supabase } from "@/lib/supabase";

const COMPLETED_STATUSES = ["completed", "delivered"];

export type SupplierProfileStats = {
  totalLoads: number;
  completedLoads: number;
  totalSpend: number;
  completionRate: number;
};

export type SupplierProfileData = {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
  displayName: string;
  initials: string;
  phone: string;
  address: string;
  taxId: string;
  industry: string;
  monthlyVolume: string;
  commodity: string;
  city: string;
  verificationStatus: "verified" | "pending" | "review";
  memberSince: string;
  avatarUrl: string | null;
  completionPercent: number;
  stats: SupplierProfileStats;
};

export type SupplierProfileEditPayload = {
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  taxId: string;
  industry: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

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

function readFirstString(
  extras: Record<string, unknown>,
  keys: string[],
  fallback = "Not provided"
) {
  for (const key of keys) {
    const value = extras[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function composeAddress(extras: Record<string, unknown>) {
  const direct = readFirstString(
    extras,
    ["address", "business_address", "businessAddress", "billing_address", "billingAddress"],
    ""
  );
  if (direct) return direct;

  const parts = [
    extras.addressLine1,
    extras.addressLine2,
    extras.city,
    extras.postcode,
    extras.countryName,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  if (parts.length) return parts.join(", ");
  return "Not provided";
}

function resolvePhone(extras: Record<string, unknown>, userMetadata?: Record<string, unknown>) {
  const phone = readFirstString(extras, ["phone", "alternatePhone", "contactPhone"], "");
  if (phone) {
    const code = readFirstString(extras, ["countryCode"], "");
    if (code && !phone.startsWith("+")) {
      return `${code} ${phone}`.trim();
    }
    return phone;
  }

  const metaPhone = userMetadata?.phone;
  if (typeof metaPhone === "string" && metaPhone.trim()) return metaPhone.trim();

  return "Not provided";
}

function normalizeVerificationStatus(value: unknown): SupplierProfileData["verificationStatus"] | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "pending" || raw === "rejected" || raw === "declined") return "pending";
  if (raw === "review" || raw === "under review") return "review";
  return null;
}

function resolveSupplierVerificationStatus(
  extras: Record<string, unknown>,
  profile?: { is_approved?: boolean | null; verification_status?: string | null }
): SupplierProfileData["verificationStatus"] {
  if (profile?.is_approved === true) return "verified";

  const fromColumn = normalizeVerificationStatus(profile?.verification_status);
  if (fromColumn) return fromColumn;

  const fromExtras = normalizeVerificationStatus(
    extras.verificationStatus ?? extras.verification_status
  );
  if (fromExtras) return fromExtras;

  if (extras.is_approved === true || extras.isApproved === true) return "verified";
  if (extras.accountSetupComplete === true) return "review";
  return "pending";
}

function formatMemberSince(dateValue?: string | null) {
  if (!dateValue) return "Recently joined";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return `Member since ${date.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
}

function computeCompletionPercent(
  companyName: string,
  email: string,
  phone: string,
  address: string,
  taxId: string
) {
  const checks = [
    companyName && companyName !== "Supplier Account",
    Boolean(email),
    phone !== "Not provided",
    address !== "Not provided",
    taxId !== "Not provided",
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function fetchSupplierProfile(): Promise<SupplierProfileData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, company_name, industry, role, avatar_url, created_at, profile_extras, is_approved, verification_status"
    )
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(profile?.profile_extras);
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email || readFirstString(extras, ["email"], "");
  const fullName =
    profile?.full_name?.trim() ||
    readFirstString(extras, ["contactPerson", "fullName", "full_name"], "Supplier");
  const extrasCompany = readFirstString(extras, ["companyName", "company_name"], "");
  const companyName = extrasCompany || profile?.company_name?.trim() || fullName;
  const displayName = companyName || fullName;
  const phone = resolvePhone(extras, userMetadata);
  const address = composeAddress(extras);
  const taxId = readFirstString(extras, ["taxId", "tax_id", "vatNumber", "vat_number"], "Not provided");
  const industry =
    profile?.industry?.trim() ||
    readFirstString(extras, ["industry"], "Not specified");
  const monthlyVolume = readFirstString(extras, ["monthlyVolume", "monthly_volume"], "Not provided");
  const commodity = readFirstString(extras, ["commodity", "commodityFocus"], "Not provided");
  const city = readFirstString(extras, ["city"], "");
  const avatarUrl =
    readFirstString(extras, ["avatarUrl", "avatar_url"], "") ||
    profile?.avatar_url ||
    null;

  const { data: loads } = await supabase
    .from("loads")
    .select("id, status, price")
    .eq("supplier_id", user.id);

  const safeLoads = loads ?? [];
  const completedLoads = safeLoads.filter((load) =>
    COMPLETED_STATUSES.includes(String(load.status || "").toLowerCase())
  ).length;
  const totalLoads = safeLoads.length;
  const totalSpend = safeLoads.reduce((sum, load) => sum + (Number(load.price) || 0), 0);
  const completionRate = totalLoads > 0 ? Math.round((completedLoads / totalLoads) * 100) : 0;

  const verificationStatus = resolveSupplierVerificationStatus(extras, profile ?? undefined);

  return {
    userId: user.id,
    email,
    fullName,
    companyName: companyName || fullName,
    displayName,
    initials: getInitials(displayName),
    phone,
    address,
    taxId,
    industry,
    monthlyVolume,
    commodity,
    city,
    verificationStatus,
    memberSince: formatMemberSince(profile?.created_at),
    avatarUrl,
    completionPercent: computeCompletionPercent(companyName, email, phone, address, taxId),
    stats: {
      totalLoads,
      completedLoads,
      totalSpend,
      completionRate,
    },
  };
}

export async function updateSupplierProfile(
  payload: SupplierProfileEditPayload
): Promise<SupplierProfileData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: current } = await supabase
    .from("profiles")
    .select("profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(current?.profile_extras);
  const mergedExtras = {
    ...extras,
    contactPerson: payload.fullName.trim() || null,
    companyName: payload.companyName.trim() || null,
    phone: payload.phone.trim() || null,
    address: payload.address.trim() || null,
    taxId: payload.taxId.trim() || null,
    industry: payload.industry.trim() || null,
    email: user.email || extras.email || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName.trim() || null,
      company_name: payload.companyName.trim() || null,
      industry: payload.industry.trim() || null,
      profile_extras: mergedExtras,
    })
    .eq("id", user.id);

  if (error) throw error;

  return fetchSupplierProfile();
}

export async function pickSupplierAvatar(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to update your profile photo.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.82,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadSupplierAvatar(localUri: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Please sign in again.");

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${user.id}/profile-media/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage.from("pods").upload(path, arrayBuffer, {
    upsert: true,
    contentType: "image/jpeg",
  });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from("pods").getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) throw new Error("Uploaded image URL could not be generated.");

  const { data: current } = await supabase
    .from("profiles")
    .select("profile_extras")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(current?.profile_extras);
  const mergedExtras = {
    ...extras,
    avatarUrl: publicUrl,
    avatar_url: publicUrl,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      profile_extras: mergedExtras,
    })
    .eq("id", user.id);

  if (profileError) throw profileError;

  return publicUrl;
}

export function formatSupplierStatMoney(value: number) {
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(1)}k`;
  }
  return formatSupplierMoney(value);
}
