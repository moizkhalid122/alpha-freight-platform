"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getSiteLocaleId,
  SITE_LOCALE_CHANGE_EVENT,
} from "@/lib/site-language-preference";
import {
  hideGoogleTranslateUi,
  initGoogleTranslateElement,
  reapplyGoogleTranslate,
  setGoogTransCookie,
} from "@/lib/site-google-translate";

const GOOGLE_SCRIPT_ID = "google-translate-script";

function loadGoogleTranslateScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById(GOOGLE_SCRIPT_ID)) {
      resolve();
      return;
    }

    window.googleTranslateElementInit = () => {
      initGoogleTranslateElement();
      window.setTimeout(() => {
        hideGoogleTranslateUi();
        reapplyGoogleTranslate(getSiteLocaleId());
      }, 300);
      resolve();
    };

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onload = () => {
      const g = (window as Window & { google?: { translate?: { TranslateElement?: unknown } } }).google;
      if (g?.translate?.TranslateElement) resolve();
    };
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export default function SiteGoogleTranslator() {
  const pathname = usePathname();
  const readyRef = useRef(false);

  useEffect(() => {
    let observer: MutationObserver | undefined;

    const boot = window.setTimeout(async () => {
      setGoogTransCookie(getSiteLocaleId());
      await loadGoogleTranslateScript();
      readyRef.current = true;
      reapplyGoogleTranslate(getSiteLocaleId());
      hideGoogleTranslateUi();

      observer = new MutationObserver(() => hideGoogleTranslateUi());
      observer.observe(document.body, { childList: true, subtree: true });
    }, 50);

    const onLocaleChange = () => {
      const localeId = getSiteLocaleId();
      setGoogTransCookie(localeId);
      window.setTimeout(() => {
        reapplyGoogleTranslate(localeId);
        hideGoogleTranslateUi();
      }, 200);
    };
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);

    return () => {
      window.clearTimeout(boot);
      observer?.disconnect();
      window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    const timer = window.setTimeout(() => reapplyGoogleTranslate(getSiteLocaleId()), 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
}
