/** Road freight admin (existing). */
export const ROAD_ADMIN_PATH =
  process.env.ADMIN_PANEL_PATH?.trim().replace(/\/+$/, "") || "/ops-af-7x9k2";

/** Air freight admin console. */
export const AIR_ADMIN_PATH =
  process.env.AIR_ADMIN_PANEL_PATH?.trim().replace(/\/+$/, "") || "/ops-air-6f4n8";

/** Sea freight admin console. */
export const SEA_ADMIN_PATH =
  process.env.SEA_ADMIN_PANEL_PATH?.trim().replace(/\/+$/, "") || "/ops-sea-3h7p2";

/** Master HQ — all modes unified. */
export const HQ_ADMIN_PATH =
  process.env.HQ_ADMIN_PANEL_PATH?.trim().replace(/\/+$/, "") || "/ops-hq-0m9x5";

export type TransportModeFilter = "road" | "air" | "ship";

export function airAdminRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${AIR_ADMIN_PATH}${suffix}`;
}

export function seaAdminRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${SEA_ADMIN_PATH}${suffix}`;
}

export function hqAdminRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${HQ_ADMIN_PATH}${suffix}`;
}

export function isAirAdminPanelPath(pathname: string): boolean {
  return pathname === AIR_ADMIN_PATH || pathname.startsWith(`${AIR_ADMIN_PATH}/`);
}

export function isSeaAdminPanelPath(pathname: string): boolean {
  return pathname === SEA_ADMIN_PATH || pathname.startsWith(`${SEA_ADMIN_PATH}/`);
}

export function isHqAdminPanelPath(pathname: string): boolean {
  return pathname === HQ_ADMIN_PATH || pathname.startsWith(`${HQ_ADMIN_PATH}/`);
}

export function isModeAdminPanelPath(pathname: string): boolean {
  return isAirAdminPanelPath(pathname) || isSeaAdminPanelPath(pathname) || isHqAdminPanelPath(pathname);
}

export function isAirAdminLoginPath(pathname: string): boolean {
  return pathname === airAdminRoute("/login");
}

export function isSeaAdminLoginPath(pathname: string): boolean {
  return pathname === seaAdminRoute("/login");
}

export function isHqAdminLoginPath(pathname: string): boolean {
  return pathname === hqAdminRoute("/login");
}
