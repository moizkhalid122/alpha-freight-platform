/** Internal staff / ops routes — orb hidden (not carrier/supplier customer portals). */
const INTERNAL_PATH_PREFIXES = [
  "/ops-af-7x9k2",
  "/ops-hq-0m9x5",
  "/ops-sea-3h7p2",
  "/ops-air-6f4n8",
  "/comm-af-8k3m7",
  "/team-af-4m2x9",
  "/admin",
] as const;

const INTERNAL_EXACT_PATHS = new Set([
  "/directors-agreement",
  "/executive-agreement",
  "/master-plan",
  "/revenue-model",
]);

/**
 * Show Alpha orb on all public pages plus /carrier/* and /supplier/* dashboards.
 * Hide only on internal ops, employee team tools, and confidential docs.
 */
export function shouldHideConciergeWidget(pathname: string): boolean {
  if (!pathname) return false;

  if (INTERNAL_EXACT_PATHS.has(pathname)) return true;

  return INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isConciergePortalPath(pathname: string): boolean {
  return pathname.startsWith("/carrier") || pathname.startsWith("/supplier");
}
