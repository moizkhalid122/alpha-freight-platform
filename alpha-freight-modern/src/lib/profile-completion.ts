import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

export type ProfileCompletionResult = {
  percent: number;
  missing: string[];
  isOnboardingComplete: boolean;
  needsVerification: boolean;
};

function scoreFields(pairs: Array<[boolean, string]>) {
  const total = pairs.length;
  const done = pairs.filter(([complete]) => complete).length;
  const missing = pairs.filter(([complete, label]) => !complete).map(([, label]) => label);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { percent, missing };
}

export function getCarrierProfileCompletion(
  extras: CarrierProfileExtras
): ProfileCompletionResult {
  const accountType = extras.accountType || "company";
  const onboarding = scoreFields([
    [Boolean(extras.countryCode), "Country"],
    [Boolean(extras.phone), "Phone number"],
    [Boolean(extras.city), "City"],
    [
      accountType === "individual"
        ? Boolean(extras.primaryVehicle)
        : Boolean(extras.companyName),
      accountType === "individual" ? "Vehicle type" : "Company name",
    ],
  ]);

  const verification = scoreFields([
    [Boolean(extras.address || extras.addressLine1), "Business address"],
    [
      accountType === "individual"
        ? Boolean(extras.operatorId || extras.nationalId)
        : Boolean(extras.registrationNo),
      accountType === "individual" ? "Driver licence / ID" : "Company registration"],
    [Boolean(extras.insuranceExpiry), "Insurance expiry"],
    [Boolean(extras.operatingRegion), "Operating region"],
  ]);

  const percent = Math.round(onboarding.percent * 0.6 + verification.percent * 0.4);

  return {
    percent,
    missing: [...onboarding.missing, ...verification.missing],
    isOnboardingComplete: onboarding.percent === 100,
    needsVerification: verification.percent < 100,
  };
}

export function getSupplierProfileCompletion(
  extras: SupplierProfileExtras
): ProfileCompletionResult {
  const onboarding = scoreFields([
    [Boolean(extras.countryCode), "Country"],
    [Boolean(extras.phone), "Phone number"],
    [Boolean(extras.city), "City"],
    [Boolean(extras.companyName), "Business name"],
  ]);

  const verification = scoreFields([
    [Boolean(extras.address), "Billing address"],
    [Boolean(extras.registrationNo || extras.taxId), "Tax / registration"],
    [Boolean(extras.industry || extras.commodity), "Shipping profile"],
  ]);

  const percent = Math.round(onboarding.percent * 0.6 + verification.percent * 0.4);

  return {
    percent,
    missing: [...onboarding.missing, ...verification.missing],
    isOnboardingComplete: onboarding.percent === 100,
    needsVerification: verification.percent < 100,
  };
}
