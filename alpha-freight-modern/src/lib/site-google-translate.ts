/** Google Translate language code for full-page translation (null = English, no translate). */
export function getGoogleTranslateCode(localeId: string): string | null {
  if (localeId.startsWith("en-")) return null;
  if (localeId.startsWith("es-")) return "es";
  if (localeId.startsWith("pt-")) return "pt";
  if (localeId.startsWith("ur-")) return "ur";
  if (localeId.startsWith("fi-")) return "fi";
  if (localeId.startsWith("de-")) return "de";
  if (localeId.startsWith("fr-")) return "fr";
  if (localeId.startsWith("it-")) return "it";
  if (localeId.startsWith("nl-")) return "nl";
  if (localeId.startsWith("pl-")) return "pl";
  if (localeId.startsWith("tr-")) return "tr";
  if (localeId.startsWith("ar-")) return "ar";
  if (localeId.startsWith("hi-")) return "hi";
  if (localeId.startsWith("zh-")) return "zh-CN";
  if (localeId.startsWith("ja-")) return "ja";
  if (localeId.startsWith("ko-")) return "ko";
  if (localeId.startsWith("sv-")) return "sv";
  if (localeId.startsWith("no-")) return "no";
  if (localeId.startsWith("da-")) return "da";
  if (localeId.startsWith("ro-")) return "ro";
  if (localeId.startsWith("uk-")) return "uk";
  if (localeId.startsWith("ru-")) return "ru";
  return null;
}

function normalizeGoogTrans(value: string | null): string | null {
  if (!value || value === "/en/en") return null;
  return value;
}

export function readGoogTransCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return normalizeGoogTrans(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function expectedGoogTrans(localeId: string): string | null {
  const code = getGoogleTranslateCode(localeId);
  return code ? `/en/${code}` : null;
}

export function clearGoogTransCookies(): void {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
  document.cookie = `googtrans=; ${expires}; path=/`;
  if (host.includes(".")) {
    document.cookie = `googtrans=; ${expires}; path=/; domain=.${host}`;
  }
  if (host && !host.startsWith("localhost")) {
    const parts = host.split(".");
    if (parts.length >= 2) {
      const root = `.${parts.slice(-2).join(".")}`;
      document.cookie = `googtrans=; ${expires}; path=/; domain=${root}`;
    }
  }
}

export function setGoogTransCookie(localeId: string): void {
  if (typeof document === "undefined") return;
  const expected = expectedGoogTrans(localeId);
  const host = window.location.hostname;

  if (!expected) {
    clearGoogTransCookies();
    return;
  }

  document.cookie = `googtrans=${encodeURIComponent(expected)}; path=/`;
  if (host && !host.startsWith("localhost") && host.includes(".")) {
    document.cookie = `googtrans=${encodeURIComponent(expected)}; path=/; domain=.${host.split(".").slice(-2).join(".")}`;
  }
}

/** Apply translation via Google combo — no page reload. */
export function reapplyGoogleTranslate(localeId?: string): boolean {
  if (typeof document === "undefined") return false;

  const code = localeId ? getGoogleTranslateCode(localeId) : null;
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (!select) return false;

  if (!code) {
    if (select.value) {
      select.value = "";
      select.dispatchEvent(new Event("change"));
    }
    return true;
  }

  if (select.value !== code) {
    select.value = code;
    select.dispatchEvent(new Event("change"));
  }
  return true;
}

const RELOAD_GUARD_KEY = "af-locale-reload";

/** User picked a new locale — translate without reload loops. */
export function applyGoogleTranslateForLocale(localeId: string): void {
  if (typeof document === "undefined") return;

  const code = getGoogleTranslateCode(localeId);
  setGoogTransCookie(localeId);

  if (reapplyGoogleTranslate(localeId)) {
    hideGoogleTranslateUi();
    return;
  }

  // Google widget not ready yet — one controlled reload max per locale change.
  const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);
  if (guard === localeId) {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    return;
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, localeId);
  window.location.reload();
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}

export function initGoogleTranslateElement(): void {
  const google = (window as Window & { google?: { translate?: { TranslateElement: new (opts: object, id: string) => void } } }).google;
  if (!google?.translate?.TranslateElement) return;
  new google.translate.TranslateElement(
    {
      pageLanguage: "en",
      autoDisplay: false,
      includedLanguages: "es,pt,de,fr,it,nl,pl,tr,ar,hi,zh-CN,ja,ko,sv,no,da,ro,uk,ru,ur,fi",
    },
    "google_translate_element",
  );
  hideGoogleTranslateUi();
}

/** Hide injected Google Translate launcher / banner widgets. */
export function hideGoogleTranslateUi(): void {
  if (typeof document === "undefined") return;

  const selectors = [
    ".goog-te-gadget",
    ".goog-te-gadget-simple",
    ".goog-te-gadget-icon",
    ".goog-te-menu-value",
    "iframe.goog-te-menu-frame",
    ".goog-te-balloon-frame",
    ".goog-te-banner-frame",
    ".VIpgJd-ZVi9od-l4eHX-hSRGPd",
    ".VIpgJd-yAWNEb-L7lbkb",
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((node) => {
      const el = node as HTMLElement;
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      el.style.width = "0";
      el.style.height = "0";
      el.style.overflow = "hidden";
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
    });
  }

  document.querySelectorAll("body > div").forEach((node) => {
    const el = node as HTMLElement;
    if (el.id === "google_translate_element") return;
    if (el.querySelector(".goog-te-gadget, .goog-te-gadget-simple, .goog-te-combo")) {
      el.style.display = "none";
    }
  });
}
