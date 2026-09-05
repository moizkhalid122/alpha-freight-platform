import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

export type MarketplaceRole = "carrier" | "supplier";

export type ProfileVerificationStatus =
  | "registered"
  | "pending_review"
  | "verified"
  | "rejected"
  | "info_required"
  | "suspended";

export type DocumentKey =
  | "insurance"
  | "operator"
  | "vehicle"
  | "driver_licence"
  | "business_proof"
  | "vat";

export type DocumentDefinition = {
  key: DocumentKey;
  label: string;
  required: boolean;
  urlField: keyof CarrierProfileExtras | keyof SupplierProfileExtras;
  expiryField?: keyof CarrierProfileExtras;
};

export type VerificationAlert =
  | { type: "missing"; documents: string[] }
  | { type: "rejected"; reason: string; documents: string[] }
  | { type: "expiry_warning"; document: string; daysLeft: number }
  | { type: "expired"; documents: string[] }
  | { type: "pending_review" }
  | { type: "verified" }
  | null;

export type VerificationSnapshot = {
  status: ProfileVerificationStatus;
  alert: VerificationAlert;
  canUseMarketplace: boolean;
  onboardingComplete: boolean;
  progressPercent: number;
  missingDocuments: string[];
};

const normalizeStatus = (value?: string | null): ProfileVerificationStatus => {
  const raw = (value || "").toLowerCase().trim();
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "rejected") return "rejected";
  if (raw === "info_required" || raw === "info required") return "info_required";
  if (raw === "suspended") return "suspended";
  if (raw === "pending_review" || raw === "pending" || raw === "in review") return "pending_review";
  return "registered";
};

export function getCarrierDocuments(accountType = "company"): DocumentDefinition[] {
  const docs: DocumentDefinition[] = [
    {
      key: "insurance",
      label: "Goods in Transit Insurance",
      required: true,
      urlField: "insuranceCertificateUrl",
      expiryField: "insuranceExpiry",
    },
    {
      key: "operator",
      label: "Operator Licence (O-Licence)",
      required: true,
      urlField: "operatorLicenseUrl",
    },
    {
      key: "vehicle",
      label: "Vehicle Registration (V5C)",
      required: true,
      urlField: "vehicleRegistrationUrl",
    },
  ];

  if (accountType === "individual") {
    docs.push({
      key: "driver_licence",
      label: "Driver Licence",
      required: true,
      urlField: "backgroundCheckUrl",
    });
  }

  return docs;
}

export function getSupplierDocuments(): DocumentDefinition[] {
  return [
    {
      key: "business_proof",
      label: "Proof of Business (Co. registration or UTR letter)",
      required: true,
      urlField: "businessProofUrl",
    },
    {
      key: "vat",
      label: "VAT Certificate",
      required: false,
      urlField: "vatCertificateUrl",
    },
  ];
}

function daysUntil(dateValue?: string | null) {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function readUrl(extras: Record<string, unknown>, field: string) {
  const value = extras[field];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function getMissingDocuments(
  role: MarketplaceRole,
  extras: CarrierProfileExtras | SupplierProfileExtras,
): string[] {
  const docs =
    role === "carrier"
      ? getCarrierDocuments(extras.accountType || "company")
      : getSupplierDocuments();

  return docs
    .filter((doc) => doc.required && !readUrl(extras as Record<string, unknown>, doc.urlField as string))
    .map((doc) => doc.label);
}

export function getVerificationSnapshot(
  role: MarketplaceRole,
  profile: {
    verification_status?: string | null;
    is_approved?: boolean | null;
    status?: string | null;
  } | null,
  extras: CarrierProfileExtras | SupplierProfileExtras,
): VerificationSnapshot {
  const onboardingComplete = Boolean(extras.onboardingComplete);
  const missingDocuments = getMissingDocuments(role, extras);
  const extrasStatus = normalizeStatus(extras.verificationStatus);
  const profileStatus = normalizeStatus(profile?.verification_status);
  const isApproved = profile?.is_approved === true || profile?.status === "verified";

  let status: ProfileVerificationStatus = profileStatus !== "registered" ? profileStatus : extrasStatus;
  if (isApproved || extrasStatus === "verified" || profileStatus === "verified") {
    status = "verified";
  } else if (!onboardingComplete) {
    status = "registered";
  } else if (missingDocuments.length > 0) {
    status = "info_required";
  } else if (status === "registered") {
    status = "pending_review";
  }

  const insuranceDays =
    role === "carrier" ? daysUntil((extras as CarrierProfileExtras).insuranceExpiry) : null;
  const requiredDocTotal =
    role === "carrier"
      ? getCarrierDocuments(extras.accountType || "company").filter((doc) => doc.required).length
      : getSupplierDocuments().filter((doc) => doc.required).length;
  const uploadedRequired =
    requiredDocTotal - missingDocuments.filter((label) => label !== "Goods in Transit Insurance").length;
  const progressPercent = onboardingComplete
    ? Math.min(100, Math.round((uploadedRequired / Math.max(requiredDocTotal, 1)) * 100))
    : Math.max(10, Math.round(((requiredDocTotal - missingDocuments.length) / Math.max(requiredDocTotal, 1)) * 60));

  let alert: VerificationAlert = null;

  if (!onboardingComplete) {
    alert = { type: "missing", documents: ["Complete onboarding to activate your account"] };
  } else if (status === "verified") {
    if (insuranceDays !== null && insuranceDays <= 0) {
      status = "suspended";
      alert = { type: "expired", documents: ["Goods in Transit Insurance"] };
    } else if (insuranceDays !== null && insuranceDays <= 7) {
      alert = { type: "expiry_warning", document: "Goods in Transit Insurance", daysLeft: insuranceDays };
    } else if (insuranceDays !== null && insuranceDays <= 30) {
      alert = { type: "expiry_warning", document: "Goods in Transit Insurance", daysLeft: insuranceDays };
    } else if (insuranceDays !== null && insuranceDays <= 90) {
      alert = { type: "expiry_warning", document: "Goods in Transit Insurance", daysLeft: insuranceDays };
    } else {
      alert = { type: "verified" };
    }
  } else if (status === "rejected" || status === "info_required") {
    alert = {
      type: "rejected",
      reason: extras.verificationNotes?.trim() || "Please re-upload the requested documents.",
      documents: missingDocuments.length ? missingDocuments : ["Verification documents"],
    };
  } else if (missingDocuments.length > 0) {
    alert = { type: "missing", documents: missingDocuments };
  } else if (status === "pending_review") {
    alert = { type: "pending_review" };
  } else if (status === "suspended") {
    alert = { type: "expired", documents: ["Goods in Transit Insurance"] };
  }

  const canUseMarketplace = status === "verified" && alert?.type !== "expired";

  return {
    status,
    alert,
    canUseMarketplace,
    onboardingComplete,
    progressPercent,
    missingDocuments,
  };
}
