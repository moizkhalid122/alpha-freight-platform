import { fetchCarrierPayoutDetails, maskAccountNumber } from "@/lib/carrier-payout-setup";
import { formatMoney, formatProfileStatMoney } from "@/lib/carrier-dashboard";
import { supabase } from "@/lib/supabase";

const ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "in-transit", "loading"];
const COMPLETED_STATUSES = ["completed", "delivered"];

export type CarrierProfileStats = {
  activeLoads: number;
  completedLoads: number;
  totalLoads: number;
  totalEarnings: number;
  completionRate: number;
};

export type CarrierProfileData = {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
  displayName: string;
  initials: string;
  phone: string;
  address: string;
  operatorId: string;
  registrationNo: string;
  payoutAccount: string;
  payoutSetupComplete: boolean;
  fleetSize: string;
  vehicleTypes: string[];
  operatingRegions: string[];
  verificationStatus: "verified" | "pending" | "review";
  memberSince: string;
  avatarUrl: string | null;
  completionPercent: number;
  stats: CarrierProfileStats;
};

export type CarrierProfileEditPayload = {
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  operatorId: string;
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

function resolveOperatorId(extras: Record<string, unknown>) {
  const operator = readFirstString(
    extras,
    [
      "operatorId",
      "operator_id",
      "operator_licence",
      "operatorLicence",
      "driver_license",
      "driverLicense",
    ],
    ""
  );
  if (operator) return operator;

  const nationalId = readFirstString(extras, ["nationalId", "national_id"], "");
  if (nationalId) return nationalId;

  return "Not provided";
}

function resolveFleetSize(extras: Record<string, unknown>, profileFleetSize?: string | number | null) {
  const fromExtras = readFirstString(extras, ["fleetSize", "fleet_size"], "");
  if (fromExtras) return fromExtras;
  if (profileFleetSize !== null && profileFleetSize !== undefined && String(profileFleetSize).trim()) {
    return String(profileFleetSize).trim();
  }
  return "Not provided";
}

function toTagList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function formatMemberSince(dateValue?: string | null) {
  if (!dateValue) return "Recently joined";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return `Member since ${date.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
}

function normalizeVerificationStatus(
  value: unknown
): CarrierProfileData["verificationStatus"] | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "pending" || raw === "rejected") return "pending";
  if (raw === "review" || raw === "under review") return "review";
  return null;
}

function resolveVerificationStatus(
  role?: string | null,
  extras: Record<string, unknown> = {},
  profile?: { verification_status?: string | null; is_approved?: boolean | null }
): CarrierProfileData["verificationStatus"] {
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

function computeCompletionPercent(
  companyName: string,
  email: string,
  phone: string,
  address: string,
  operatorId: string
) {
  const checks = [
    companyName && companyName !== "Carrier Account",
    Boolean(email),
    phone !== "Not provided",
    address !== "Not provided",
    operatorId !== "Not provided",
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function fetchCarrierProfile(): Promise<CarrierProfileData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, company_name, fleet_size, role, avatar_url, created_at, profile_extras, verification_status, is_approved"
    )
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(profile?.profile_extras);
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email || readFirstString(extras, ["email"], "");
  const fullName =
    profile?.full_name?.trim() ||
    readFirstString(extras, ["contactPerson", "fullName", "full_name"], "Carrier");
  const extrasCompany = readFirstString(extras, ["companyName", "company_name"], "");
  const companyName = extrasCompany || profile?.company_name?.trim() || fullName;
  const displayName = companyName || fullName;
  const phone = resolvePhone(extras, userMetadata);
  const address = composeAddress(extras);
  const operatorId = resolveOperatorId(extras);
  const registrationNo = readFirstString(
    extras,
    ["registrationNo", "registration_no", "companyRegistration"],
    "Not provided"
  );
  const fleetSize = resolveFleetSize(extras, profile?.fleet_size);
  const avatarUrl =
    readFirstString(extras, ["avatarUrl", "avatar_url"], "") ||
    profile?.avatar_url ||
    null;

  const payout = await fetchCarrierPayoutDetails();
  const payoutAccount = payout?.payoutSetupComplete
    ? `${payout.bankName || "Bank account"} · ${maskAccountNumber(payout.bankAccountNumber)}`
    : "Setup required";

  const vehicleTypes = toTagList(extras.vehicleTypes ?? extras.vehicle_types ?? extras.primaryVehicle);
  const operatingRegions = toTagList(
    extras.operatingRegion ?? extras.operating_region ?? extras.serviceAreas ?? extras.countryName
  );

  const { data: loads } = await supabase
    .from("loads")
    .select("id, status, price")
    .eq("carrier_id", user.id);

  const assignedLoads = loads || [];
  const completedLoads = assignedLoads.filter((load) => COMPLETED_STATUSES.includes(load.status)).length;
  const activeLoads = assignedLoads.filter((load) => ACTIVE_STATUSES.includes(load.status)).length;
  const totalEarnings = assignedLoads
    .filter((load) => COMPLETED_STATUSES.includes(load.status))
    .reduce((sum, load) => sum + (Number(load.price) || 0), 0);
  const totalLoads = assignedLoads.length;
  const completionRate = totalLoads > 0 ? Math.round((completedLoads / totalLoads) * 100) : 0;

  return {
    userId: user.id,
    email,
    fullName,
    companyName: companyName || fullName,
    displayName,
    initials: getInitials(displayName),
    phone,
    address,
    operatorId,
    registrationNo,
    payoutAccount,
    payoutSetupComplete: Boolean(payout?.payoutSetupComplete),
    fleetSize,
    vehicleTypes,
    operatingRegions,
    verificationStatus: resolveVerificationStatus(profile?.role, extras, profile ?? undefined),
    memberSince: formatMemberSince(profile?.created_at),
    avatarUrl,
    completionPercent: computeCompletionPercent(companyName, email, phone, address, operatorId),
    stats: {
      activeLoads,
      completedLoads,
      totalLoads,
      totalEarnings,
      completionRate,
    },
  };
}

export async function updateCarrierProfile(
  payload: CarrierProfileEditPayload
): Promise<CarrierProfileData | null> {
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
    operatorId: payload.operatorId.trim() || null,
    email: user.email || extras.email || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName.trim() || null,
      company_name: payload.companyName.trim() || null,
      profile_extras: mergedExtras,
    })
    .eq("id", user.id);

  if (error) throw error;

  return fetchCarrierProfile();
}

export async function signOutCarrier() {
  await supabase.auth.signOut();
}

export { formatMoney, formatProfileStatMoney };
