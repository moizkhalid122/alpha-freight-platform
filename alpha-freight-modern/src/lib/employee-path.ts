/** Private employee portal URL — set EMPLOYEE_PANEL_PATH in Vercel env to customize. */
export const EMPLOYEE_PANEL_PATH =
  process.env.EMPLOYEE_PANEL_PATH?.trim().replace(/\/+$/, "") || "/team-af-4m2x9";

export const LEGACY_EMPLOYEE_PREFIX = "/employee";

export function employeeRoute(subpath = ""): string {
  const suffix = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  if (suffix.startsWith(LEGACY_EMPLOYEE_PREFIX)) {
    return `${EMPLOYEE_PANEL_PATH}${suffix.slice(LEGACY_EMPLOYEE_PREFIX.length) || ""}`;
  }
  return `${EMPLOYEE_PANEL_PATH}${suffix}`;
}

/** Share this login URL with every employee. */
export function employeeLoginPath(): string {
  return employeeRoute("/login");
}

export function employeeSignupPath(): string {
  return employeeRoute("/signup");
}

export function employeeOnboardingPath(): string {
  return employeeRoute("/onboarding");
}

export function isEmployeeSignupPath(pathname: string): boolean {
  return pathname === employeeSignupPath();
}

export function isEmployeeOnboardingPath(pathname: string): boolean {
  return pathname === employeeOnboardingPath();
}

export function isEmployeePublicAuthPath(pathname: string): boolean {
  return isEmployeeLoginPath(pathname) || isEmployeeSignupPath(pathname);
}

export function isEmployeePanelPath(pathname: string): boolean {
  return pathname === EMPLOYEE_PANEL_PATH || pathname.startsWith(`${EMPLOYEE_PANEL_PATH}/`);
}

export function isLegacyEmployeePath(pathname: string): boolean {
  return pathname === LEGACY_EMPLOYEE_PREFIX || pathname.startsWith(`${LEGACY_EMPLOYEE_PREFIX}/`);
}

export function isEmployeeLoginPath(pathname: string): boolean {
  return pathname === employeeLoginPath();
}
