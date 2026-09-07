import { applyGoogleTranslateForLocale } from "@/lib/site-google-translate";
import { DEFAULT_SITE_LOCALE_ID, findSiteLocale, SITE_LOCALES } from "@/lib/site-languages";
import type { LanguagePreference } from "@/lib/copilot/language";

const STORAGE_KEY = "af-site-locale";

export const SITE_LOCALE_CHANGE_EVENT = "af-locale-change";

export function getSiteLocaleId(): string {
  if (typeof window === "undefined") return DEFAULT_SITE_LOCALE_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SITE_LOCALES.some((locale) => locale.id === stored)) return stored;
  return DEFAULT_SITE_LOCALE_ID;
}

export function setSiteLocaleId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(SITE_LOCALE_CHANGE_EVENT, { detail: { id } }));
  applyGoogleTranslateForLocale(id);
}

export function getChatLanguagePreference(): LanguagePreference {
  return findSiteLocale(getSiteLocaleId()).chatLanguage;
}
