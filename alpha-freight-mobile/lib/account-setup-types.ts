export type AccountType = "company" | "individual";

export type IdentityDocument = "driving_licence" | "passport" | "residence_permit";

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

export const ANNUAL_REVENUE_OPTIONS = [
  "Up to £25,000",
  "£25,001 - £50,000",
  "£50,001 - £100,000",
  "£100,001 - £250,000",
  "Over £250,000",
] as const;

export const IDENTITY_DOCUMENTS: {
  id: IdentityDocument;
  label: string;
  icon: string;
}[] = [
  { id: "driving_licence", label: "Full UK driving licence", icon: "card-outline" },
  { id: "passport", label: "Passport", icon: "book-outline" },
  { id: "residence_permit", label: "Residence permit card", icon: "home-outline" },
];

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
