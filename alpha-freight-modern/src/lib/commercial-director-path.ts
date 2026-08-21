/** Private Commercial Director console URL. */
export const COMMERCIAL_DIRECTOR_PANEL_PATH =
  process.env.COMMERCIAL_DIRECTOR_PANEL_PATH?.trim().replace(/\/+$/, "") ||
  "/comm-af-8k3m7";

export function commercialDirectorRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${COMMERCIAL_DIRECTOR_PANEL_PATH}${suffix}`;
}

export function isCommercialDirectorPanelPath(pathname: string): boolean {
  return (
    pathname === COMMERCIAL_DIRECTOR_PANEL_PATH ||
    pathname.startsWith(`${COMMERCIAL_DIRECTOR_PANEL_PATH}/`)
  );
}

export function isCommercialDirectorLoginPath(pathname: string): boolean {
  return pathname === commercialDirectorRoute("/login");
}
