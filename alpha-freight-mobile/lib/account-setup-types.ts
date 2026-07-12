export type AccountType = "company" | "individual";

export type IdentityDocument =
  | "driving_licence"
  | "passport"
  | "residence_permit"
  | "company_registration";

export type AccountSetupDraft = {
  accountType: AccountType | null;
  countryCode: string;
  phone: string;
  street: string;
  houseNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  countyState: string;
  identityDocument: IdentityDocument | null;
  identityDocumentLocalUri: string | null;
  identityDocumentUrl: string | null;
  identityDocumentFileName: string | null;
  accountUses: string[];
  annualRevenue: string;
};

export const ACCOUNT_USE_OPTIONS = [
  "Accept freight loads across the UK",
  "Manage fleet operations",
  "Track earnings and payouts",
  "Build my carrier profile",
] as const;

export const SUPPLIER_ACCOUNT_USE_OPTIONS = [
  "Post freight loads across the UK",
  "Find reliable carriers for my shipments",
  "Manage load payments and proof of delivery",
  "Build my supplier profile",
] as const;

export type AppSetupRole = "carrier" | "supplier";

export function getAccountUseOptions(role: AppSetupRole) {
  return role === "supplier" ? SUPPLIER_ACCOUNT_USE_OPTIONS : ACCOUNT_USE_OPTIONS;
}

export function getAccountTypeCopy(role: AppSetupRole) {
  if (role === "supplier") {
    return {
      subtitle: "Select how you'll ship freight on Alpha Freight.",
      businessSub: "Company, manufacturer, wholesaler or logistics buyer",
      personalSub: "Individual shipper or sole trader",
    };
  }

  return {
    subtitle: "Select how you'll operate on Alpha Freight.",
    businessSub: "Company, fleet operator or haulage business",
    personalSub: "Owner-driver or sole trader",
  };
}

export function getAccountSetupQuestion2Copy(role: AppSetupRole) {
  if (role === "supplier") {
    return {
      title: "What's your estimated annual shipping spend?",
      subtitle: "This helps us tailor your supplier experience.",
    };
  }

  return {
    title: "What's your estimated annual freight revenue?",
    subtitle: "This helps us tailor your carrier experience.",
  };
}

export const ANNUAL_REVENUE_OPTIONS = [
  "Up to £25,000",
  "£25,001 - £50,000",
  "£50,001 - £100,000",
  "£100,001 - £250,000",
  "Over £250,000",
] as const;

export const CARRIER_IDENTITY_DOCUMENTS: {
  id: IdentityDocument;
  label: string;
  icon: string;
}[] = [
  { id: "driving_licence", label: "Full UK driving licence", icon: "card-outline" },
  { id: "passport", label: "Passport", icon: "book-outline" },
  { id: "residence_permit", label: "Residence permit card", icon: "home-outline" },
];

export const SUPPLIER_IDENTITY_DOCUMENTS: {
  id: IdentityDocument;
  label: string;
  icon: string;
}[] = [
  { id: "passport", label: "Passport", icon: "book-outline" },
  { id: "residence_permit", label: "Residence permit card", icon: "home-outline" },
  { id: "company_registration", label: "Company registration certificate", icon: "business-outline" },
];

/** @deprecated Use getIdentityDocuments(role) */
export const IDENTITY_DOCUMENTS = CARRIER_IDENTITY_DOCUMENTS;

export function getIdentityDocuments(role: AppSetupRole) {
  return role === "supplier" ? SUPPLIER_IDENTITY_DOCUMENTS : CARRIER_IDENTITY_DOCUMENTS;
}

export function getRequirementsCopy(role: AppSetupRole) {
  if (role === "supplier") {
    return {
      idBody:
        "We accept passport, residence permit card, or a company registration certificate for business accounts. You'll need to present your original documents.",
      idNote:
        "Non-British citizens may need to provide a valid right to reside document.",
    };
  }

  return {
    idBody:
      "We accept full UK driving licence, passport or residence permit card. You'll need to present your original documents.",
    idNote:
      "Non-British citizens may need to provide a valid right to reside document.",
  };
}

export function getDocumentsStepCopy(role: AppSetupRole) {
  if (role === "supplier") {
    return {
      title: "Verify your business identity",
      subtitle: "Choose your place of issue and select a document for supplier verification.",
      sectionHeading: "Your proof of identity",
      sectionSub:
        "Suppliers can verify with passport, residence permit, or company registration.",
    };
  }

  return {
    title: "Get your documents ready",
    subtitle: "Choose your place of issue and prepare your documents.",
    sectionHeading: "Your proof of identity",
    sectionSub: "Based on your place of issue please choose one of the following documents.",
  };
}

export const UK_ADDRESS_SUGGESTIONS = [
  { postcode: "EC1V 0HB", city: "London", line1: "EC1V 0HB" },
  { postcode: "M1 1AE", city: "Manchester", line1: "Piccadilly" },
  { postcode: "B1 1BB", city: "Birmingham", line1: "Corporation Street" },
  { postcode: "LS1 1UR", city: "Leeds", line1: "City Square" },
  { postcode: "G1 1XQ", city: "Glasgow", line1: "George Square" },
  { postcode: "CF10 1EP", city: "Cardiff", line1: "St Mary Street" },
  { postcode: "EH1 1YZ", city: "Edinburgh", line1: "Royal Mile" },
  { postcode: "BS1 4DJ", city: "Bristol", line1: "Broad Street" },
];
