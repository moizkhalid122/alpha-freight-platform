/** Single public surface when the platform is locked — only this page is reachable. */
export const OFFICIAL_PUBLIC_WARNING_PATH = "/official-public-warning";

export type PlatformPublicMode = "live" | "warning_only";

export function getPlatformPublicMode(): PlatformPublicMode {
  const raw = process.env.PLATFORM_PUBLIC_MODE?.trim().toLowerCase();
  if (raw === "live") return "live";
  if (raw === "warning_only" || raw === "warning" || raw === "off" || raw === "locked") {
    return "warning_only";
  }
  // Production stays on public warning until explicitly set to live (safe default for deploy).
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return "warning_only";
  }
  return "live";
}

export function isPlatformWarningOnlyMode(): boolean {
  return getPlatformPublicMode() === "warning_only";
}

/** Static + warning page only — everything else redirects to the warning. */
export function isPathAllowedInWarningMode(pathname: string): boolean {
  if (pathname === OFFICIAL_PUBLIC_WARNING_PATH) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(?:png|jpe?g|webp|avif|gif|ico|svg|woff2?)$/i.test(pathname)) return true;
  return false;
}