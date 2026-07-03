"use client";

export type CountryOption = {
  label: string;
  value: string;
  sub: string;
};

export const carrierOnboardingCountryOptions: CountryOption[] = [
  { label: "Austria (EUR)", value: "AT", sub: "Central Europe" },
  { label: "Bangladesh (BDT)", value: "BD", sub: "South Asia" },
  { label: "Belgium (EUR)", value: "BE", sub: "Western Europe" },
  { label: "Brazil (BRL)", value: "BR", sub: "South America" },
  { label: "Egypt (EGP)", value: "EG", sub: "North Africa" },
  { label: "France (EUR)", value: "FR", sub: "Western Europe" },
  { label: "Germany (EUR)", value: "DE", sub: "Western Europe" },
  { label: "Ghana (GHS)", value: "GH", sub: "West Africa" },
  { label: "Greece (EUR)", value: "GR", sub: "Southern Europe" },
  { label: "India (INR)", value: "IN", sub: "South Asia" },
  { label: "Lebanon (USD)", value: "LB", sub: "Western Asia" },
  { label: "Mexico (MXN)", value: "MX", sub: "North America" },
  { label: "Nepal (NPR)", value: "NP", sub: "South Asia" },
  { label: "Netherlands (EUR)", value: "NL", sub: "Western Europe" },
  { label: "Nigeria (NGN)", value: "NG", sub: "West Africa" },
  { label: "Pakistan (PKR)", value: "PK", sub: "South Asia" },
  { label: "Philippines (PHP)", value: "PH", sub: "Southeast Asia" },
  { label: "Portugal (EUR)", value: "PT", sub: "Southern Europe" },
  { label: "Spain (EUR)", value: "ES", sub: "Southern Europe" },
  { label: "Sri Lanka (LKR)", value: "LK", sub: "South Asia" },
  { label: "Türkiye (TRY)", value: "TR", sub: "Western Asia" },
  { label: "United Kingdom (GBP)", value: "GB", sub: "Northern Europe" },
  { label: "Vietnam (VND)", value: "VN", sub: "Southeast Asia" },
];

export const getCountryFlagSrc = (countryCode: string) => `/${countryCode.toUpperCase()}.svg`;

export const findCountryOption = (input?: string | null) => {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();

  return (
    carrierOnboardingCountryOptions.find((option) => option.value.toLowerCase() === normalized) ||
    carrierOnboardingCountryOptions.find((option) => option.label.toLowerCase() === normalized) ||
    carrierOnboardingCountryOptions.find((option) =>
      option.label.split(" (")[0]?.trim().toLowerCase() === normalized
    ) ||
    null
  );
};
