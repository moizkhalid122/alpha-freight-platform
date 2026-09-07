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

export function readGoogTransCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function syncGoogleTranslateCookie(localeId: string, reload = true): boolean {
  if (typeof document === "undefined") return false;

  const code = getGoogleTranslateCode(localeId);
  const host = window.location.hostname;
  const expected = code ? `/en/${code}` : null;
  const current = readGoogTransCookie();

  if (expected === current) return false;

  if (expected) {
    document.cookie = `googtrans=${encodeURIComponent(expected)}; path=/`;
    if (host && !host.startsWith("localhost")) {
      document.cookie = `googtrans=${encodeURIComponent(expected)}; path=/; domain=.${host}`;
    }
  } else {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    if (host && !host.startsWith("localhost")) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}`;
    }
  }

  if (reload) window.location.reload();
  return true;
}

/** Re-apply translate after client-side navigation (no reload). */
export function reapplyGoogleTranslate(): void {
  if (typeof document === "undefined") return;
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select?.value) return;
  select.dispatchEvent(new Event("change"));
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
