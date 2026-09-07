"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSiteLocaleId } from "@/lib/site-language-preference";
import {
  hideGoogleTranslateUi,
  initGoogleTranslateElement,
  reapplyGoogleTranslate,
  syncGoogleTranslateCookie,
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
        reapplyGoogleTranslate();
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
  const syncedRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    let observer: MutationObserver | undefined;
    let intervalId: number | undefined;

    const boot = window.setTimeout(async () => {
      await loadGoogleTranslateScript();
      readyRef.current = true;
      hideGoogleTranslateUi();

      observer = new MutationObserver(() => hideGoogleTranslateUi());
      observer.observe(document.body, { childList: true, subtree: true });
      intervalId = window.setInterval(hideGoogleTranslateUi, 1200);

      if (!syncedRef.current) {
        syncedRef.current = true;
        syncGoogleTranslateCookie(getSiteLocaleId(), true);
      }
    }, 50);

    return () => {
      window.clearTimeout(boot);
      observer?.disconnect();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    const timer = window.setTimeout(reapplyGoogleTranslate, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
}
