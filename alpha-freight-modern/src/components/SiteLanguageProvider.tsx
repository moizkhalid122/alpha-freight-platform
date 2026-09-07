"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTranslator,
  getUiLanguageFromLocaleId,
  isRtlLanguage,
  type SiteTranslator,
  type UiLanguage,
} from "@/lib/i18n";
import {
  getSiteLocaleId,
  SITE_LOCALE_CHANGE_EVENT,
} from "@/lib/site-language-preference";

type SiteLanguageContextValue = {
  localeId: string;
  uiLanguage: UiLanguage;
  isRtl: boolean;
  t: SiteTranslator;
};

const SiteLanguageContext = createContext<SiteLanguageContextValue | null>(null);

const DEFAULT_ENGLISH_STATE: SiteLanguageContextValue = {
  localeId: "en-gb",
  uiLanguage: "en",
  isRtl: false,
  t: createTranslator("en"),
};

function readLocaleState(): SiteLanguageContextValue {
  const localeId = getSiteLocaleId();
  const uiLanguage = getUiLanguageFromLocaleId(localeId);
  return {
    localeId,
    uiLanguage,
    isRtl: isRtlLanguage(uiLanguage),
    t: createTranslator(uiLanguage),
  };
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(DEFAULT_ENGLISH_STATE);

  const sync = useCallback(() => {
    setState(readLocaleState());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, sync);
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, sync);
  }, [sync]);

  useEffect(() => {
    document.documentElement.lang = state.localeId;
    document.documentElement.dir = state.isRtl ? "rtl" : "ltr";
  }, [state.localeId, state.isRtl]);

  const value = useMemo(
    () => ({
      localeId: state.localeId,
      uiLanguage: state.uiLanguage,
      isRtl: state.isRtl,
      t: state.t,
    }),
    [state],
  );

  return <SiteLanguageContext.Provider value={value}>{children}</SiteLanguageContext.Provider>;
}

export function useSiteLanguage() {
  const context = useContext(SiteLanguageContext);
  if (!context) {
    throw new Error("useSiteLanguage must be used within SiteLanguageProvider");
  }
  return context;
}

export function useSiteT() {
  return useSiteLanguage().t;
}
