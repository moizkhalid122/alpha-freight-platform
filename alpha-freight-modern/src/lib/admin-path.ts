/** Secret admin console URL — set ADMIN_PANEL_PATH in Vercel env to customize. */
export const ADMIN_PANEL_PATH =
  process.env.ADMIN_PANEL_PATH?.trim().replace(/\/+$/, "") || "/ops-af-7x9k2";

export const LEGACY_ADMIN_PREFIX = "/admin";

export function adminRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  if (suffix.startsWith(LEGACY_ADMIN_PREFIX)) {
    return `${ADMIN_PANEL_PATH}${suffix.slice(LEGACY_ADMIN_PREFIX.length) || ""}`;
  }
  return `${ADMIN_PANEL_PATH}${suffix}`;
}

export function isAdminPanelPath(pathname: string): boolean {
  return pathname === ADMIN_PANEL_PATH || pathname.startsWith(`${ADMIN_PANEL_PATH}/`);
}

export function isLegacyAdminPath(pathname: string): boolean {
  return pathname === LEGACY_ADMIN_PREFIX || pathname.startsWith(`${LEGACY_ADMIN_PREFIX}/`);
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === adminRoute("/login");
}
