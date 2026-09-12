import type { AirRole } from "@/lib/air-portal";

export type AirProfileVerificationStatus =
  | "registered"
  | "pending_review"
  | "verified"
  | "rejected"
  | "info_required"
  | "suspended";

export type AirDocumentKey =
  | "iata_forwarder"
  | "aoc_certificate"
  | "cargo_insurance"
  | "dangerous_goods"
  | "business_proof"
  | "vat_certificate";

export type AirDocumentDefinition = {
  key: AirDocumentKey;
  label: string;
  required: boolean;
  urlField: string;
  expiryField?: string;
};

export type AirProfileExtras = {
  companyName?: string | null;
  iataCode?: string | null;
  primaryAirport?: string | null;
  shipmentTypes?: string[] | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  countryName?: string | null;
  registrationNo?: string | null;
  taxId?: string | null;
  industry?: string | null;
  commodity?: string | null;
  operatingRegions?: string[] | null;
  airOnboardingComplete?: boolean | null;
  verificationStatus?: string | null;
  verificationNotes?: string | null;
  verifiedBy?: string | null;
  verifiedDate?: string | null;
  iataForwarderUrl?: string | null;
  aocCertificateUrl?: string | null;
  cargoInsuranceUrl?: string | null;
  cargoInsuranceExpiry?: string | null;
  dangerousGoodsUrl?: string | null;
  businessProofUrl?: string | null;
  vatCertificateUrl?: string | null;
};

export type AirVerificationAlert =
  | { type: "missing"; documents: string[] }
  | { type: "rejected"; reason: string; documents: string[] }
  | { type: "expiry_warning"; document: string; daysLeft: number }
  | { type: "expired"; documents: string[] }
  | { type: "pending_review" }
  | { type: "verified" }
  | null;

export type AirVerificationSnapshot = {
  status: AirProfileVerificationStatus;
  alert: AirVerificationAlert;
  canUseMarketplace: boolean;
  onboardingComplete: boolean;
  progressPercent: number;
  missingDocuments: string[];
};

const normalizeStatus = (value?: string | null): AirProfileVerificationStatus => {
  const raw = (value || "").toLowerCase().trim();
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "rejected") return "rejected";
  if (raw === "info_required" || raw === "info required") return "info_required";
  if (raw === "suspended") return "suspended";
  if (raw === "pending_review" || raw === "pending" || raw === "in review") return "pending_review";
  return "registered";
};

export function getAirForwarderDocuments(): AirDocumentDefinition[] {
  return [
    {
      key: "iata_forwarder",
      label: "IATA / FIATA Forwarder Licence",
      required: true,
      urlField: "iataForwarderUrl",
    },
    {
      key: "aoc_certificate",
      label: "Air Operator Certificate (AOC) or Agency Agreement",
      required: true,
      urlField: "aocCertificateUrl",
    },
    {
      key: "cargo_insurance",
      label: "Air Cargo Insurance",
      required: true,
      urlField: "cargoInsuranceUrl",
      expiryField: "cargoInsuranceExpiry",
    },
    {
      key: "dangerous_goods",
      label: "Dangerous Goods Certification (IATA DGR)",
      required: false,
      urlField: "dangerousGoodsUrl",
    },
  ];
}

export function getAirShipperDocuments(): AirDocumentDefinition[] {
  return [
    {
      key: "business_proof",
      label: "Proof of Business (Co. registration or UTR letter)",
      required: true,
      urlField: "businessProofUrl",
    },
    {
      key: "vat_certificate",
      label: "VAT Certificate",
      required: false,
      urlField: "vatCertificateUrl",
    },
  ];
}

export function getAirDocuments(role: AirRole): AirDocumentDefinition[] {
  return role === "carrier" ? getAirForwarderDocuments() : getAirShipperDocuments();
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
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function resolveAirExtras(
  userId: string,
  profileExtras: unknown
): AirProfileExtras {
  const parsed =
    profileExtras && typeof profileExtras === "object"
      ? (profileExtras as Record<string, unknown>)
      : {};

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(`af_air_onboarding_${userId}`);
      if (local) {
        const data = JSON.parse(local) as Record<string, unknown>;
        return { ...parsed, ...data, airOnboardingComplete: true } as AirProfileExtras;
      }
    } catch {
      /* ignore */
    }
  }

  return parsed as AirProfileExtras;
}

export function isAirOnboardingComplete(extras: AirProfileExtras, role: AirRole): boolean {
  if (extras.airOnboardingComplete) return true;
  const base =
    Boolean(extras.companyName?.trim()) &&
    Boolean(extras.phone?.trim()) &&
    Boolean(extras.primaryAirport?.trim());
  if (role === "carrier") {
    return base && Boolean(extras.iataCode?.trim() || extras.registrationNo?.trim());
  }
  return base && Boolean(extras.registrationNo?.trim() || extras.industry?.trim());
}

export function buildAirVerificationSnapshot(
  role: AirRole,
  extras: AirProfileExtras,
  columnStatus?: string | null,
  isApproved?: boolean | null
): AirVerificationSnapshot {
  const docs = getAirDocuments(role);
  const extrasRecord = extras as Record<string, unknown>;
  const missingDocuments = docs
    .filter((doc) => doc.required && !readUrl(extrasRecord, doc.urlField))
    .map((doc) => doc.label);

  const uploadedCount = docs.filter((doc) => readUrl(extrasRecord, doc.urlField)).length;
  const progressPercent = Math.round((uploadedCount / docs.length) * 100);

  const status = normalizeStatus(
    extras.verificationStatus || columnStatus || (isApproved ? "verified" : undefined)
  );

  const onboardingComplete = isAirOnboardingComplete(extras, role);
  const expiredDocs: string[] = [];
  const expiryWarnings: { document: string; daysLeft: number }[] = [];

  for (const doc of docs) {
    if (!doc.expiryField) continue;
    const days = daysUntil(readUrl(extrasRecord, doc.expiryField) ?? undefined);
    if (days === null) continue;
    if (days < 0) expiredDocs.push(doc.label);
    else if (days <= 30) expiryWarnings.push({ document: doc.label, daysLeft: days });
  }

  let alert: AirVerificationAlert = null;

  if (status === "rejected") {
    alert = {
      type: "rejected",
      reason: extras.verificationNotes || "Application rejected — please re-upload documents.",
      documents: missingDocuments,
    };
  } else if (status === "verified") {
    alert = { type: "verified" };
  } else if (expiredDocs.length > 0) {
    alert = { type: "expired", documents: expiredDocs };
  } else if (expiryWarnings.length > 0) {
    alert = {
      type: "expiry_warning",
      document: expiryWarnings[0].document,
      daysLeft: expiryWarnings[0].daysLeft,
    };
  } else if (missingDocuments.length > 0 && onboardingComplete) {
    alert = { type: "missing", documents: missingDocuments };
  } else if (status === "pending_review" || (onboardingComplete && missingDocuments.length === 0)) {
    alert = { type: "pending_review" };
  }

  const canUseMarketplace =
    status === "verified" && onboardingComplete && missingDocuments.length === 0 && expiredDocs.length === 0;

  return {
    status,
    alert,
    canUseMarketplace,
    onboardingComplete,
    progressPercent,
    missingDocuments,
  };
}

export function airVerificationPath(role: AirRole): string {
  return role === "carrier" ? "/air/forwarder/verification" : "/air/shipper/verification";
}

export function airOnboardingPath(role: AirRole): string {
  return `/air/onboarding?role=${role === "carrier" ? "carrier" : "supplier"}`;
}

export function mapAirDocumentUrlsToExtras(
  role: AirRole,
  documentValues: Record<string, string>
): Partial<AirProfileExtras> {
  const docs = getAirDocuments(role);
  const result: Partial<AirProfileExtras> = {};

  for (const doc of docs) {
    const url = documentValues[doc.key];
    if (!url) continue;
    (result as Record<string, string>)[doc.urlField] = url;
  }

  return result;
}
