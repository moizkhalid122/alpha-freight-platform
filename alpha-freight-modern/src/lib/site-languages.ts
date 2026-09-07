import type { LanguagePreference } from "@/lib/copilot/language";

export type SiteLocale = {
  id: string;
  country: string;
  language: string;
  flag: string;
  code: string;
  chatLanguage: LanguagePreference;
};

export const SITE_LOCALES: SiteLocale[] = [
  { id: "en-gb", country: "United Kingdom", language: "English", flag: "gb", code: "EN", chatLanguage: "english" },
  { id: "en-us", country: "United States", language: "English", flag: "us", code: "EN", chatLanguage: "english" },
  { id: "en-au", country: "Australia", language: "English", flag: "au", code: "EN", chatLanguage: "english" },
  { id: "en-ca", country: "Canada", language: "English", flag: "ca", code: "EN", chatLanguage: "english" },
  { id: "en-in", country: "India", language: "English", flag: "in", code: "EN", chatLanguage: "english" },
  { id: "en-ie", country: "Ireland", language: "English", flag: "ie", code: "EN", chatLanguage: "english" },
  { id: "en-nz", country: "New Zealand", language: "English", flag: "nz", code: "EN", chatLanguage: "english" },
  { id: "en-za", country: "South Africa", language: "English", flag: "za", code: "EN", chatLanguage: "english" },
  { id: "ur-pk", country: "Pakistan", language: "Urdu", flag: "pk", code: "UR", chatLanguage: "urdu" },
  { id: "ur-pk-roman", country: "Pakistan", language: "Roman Urdu", flag: "pk", code: "UR", chatLanguage: "roman_urdu" },
  { id: "fi-fi", country: "Finland", language: "Suomi", flag: "fi", code: "FI", chatLanguage: "finnish" },
  { id: "es-ar", country: "Argentina", language: "Español", flag: "ar", code: "ES", chatLanguage: "english" },
  { id: "es-es", country: "Spain", language: "Español", flag: "es", code: "ES", chatLanguage: "english" },
  { id: "es-mx", country: "Mexico", language: "Español", flag: "mx", code: "ES", chatLanguage: "english" },
  { id: "pt-br", country: "Brazil", language: "Português", flag: "br", code: "PT", chatLanguage: "english" },
  { id: "pt-pt", country: "Portugal", language: "Português", flag: "pt", code: "PT", chatLanguage: "english" },
  { id: "de-de", country: "Germany", language: "Deutsch", flag: "de", code: "DE", chatLanguage: "english" },
  { id: "fr-fr", country: "France", language: "Français", flag: "fr", code: "FR", chatLanguage: "english" },
  { id: "it-it", country: "Italy", language: "Italiano", flag: "it", code: "IT", chatLanguage: "english" },
  { id: "nl-nl", country: "Netherlands", language: "Nederlands", flag: "nl", code: "NL", chatLanguage: "english" },
  { id: "pl-pl", country: "Poland", language: "Polski", flag: "pl", code: "PL", chatLanguage: "english" },
  { id: "tr-tr", country: "Turkey", language: "Türkçe", flag: "tr", code: "TR", chatLanguage: "english" },
  { id: "ar-sa", country: "Saudi Arabia", language: "العربية", flag: "sa", code: "AR", chatLanguage: "english" },
  { id: "ar-ae", country: "United Arab Emirates", language: "العربية", flag: "ae", code: "AR", chatLanguage: "english" },
  { id: "hi-in", country: "India", language: "हिन्दी", flag: "in", code: "HI", chatLanguage: "english" },
  { id: "zh-cn", country: "China", language: "中文", flag: "cn", code: "ZH", chatLanguage: "english" },
  { id: "ja-jp", country: "Japan", language: "日本語", flag: "jp", code: "JA", chatLanguage: "english" },
  { id: "ko-kr", country: "South Korea", language: "한국어", flag: "kr", code: "KO", chatLanguage: "english" },
  { id: "sv-se", country: "Sweden", language: "Svenska", flag: "se", code: "SV", chatLanguage: "english" },
  { id: "no-no", country: "Norway", language: "Norsk", flag: "no", code: "NO", chatLanguage: "english" },
  { id: "da-dk", country: "Denmark", language: "Dansk", flag: "dk", code: "DA", chatLanguage: "english" },
  { id: "ro-ro", country: "Romania", language: "Română", flag: "ro", code: "RO", chatLanguage: "english" },
  { id: "uk-ua", country: "Ukraine", language: "Українська", flag: "ua", code: "UK", chatLanguage: "english" },
  { id: "ru-ru", country: "Russia", language: "Русский", flag: "ru", code: "RU", chatLanguage: "english" },
];

export const DEFAULT_SITE_LOCALE_ID = "en-gb";

export function findSiteLocale(id: string): SiteLocale {
  return SITE_LOCALES.find((locale) => locale.id === id) ?? SITE_LOCALES[0];
}

export function filterSiteLocales(query: string): SiteLocale[] {
  const q = query.trim().toLowerCase();
  if (!q) return SITE_LOCALES;
  return SITE_LOCALES.filter(
    (locale) =>
      locale.country.toLowerCase().includes(q) ||
      locale.language.toLowerCase().includes(q) ||
      locale.code.toLowerCase().includes(q),
  );
}
