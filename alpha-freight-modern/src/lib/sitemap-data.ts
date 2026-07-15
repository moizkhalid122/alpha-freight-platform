export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphafreightuk.com"
).replace(/\/$/, "");

/** Public marketing + legal pages for sitemap (user-approved list). */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/company-overview",
  "/contact",
  "/career",
  "/blog",
  "/partners",
  "/success-stories",
  "/solution",
  "/services",
  "/7-day-payouts",
  "/technology",
  "/network",
  "/products/supplier-portal",
  "/products/mobile-app",
  "/products/white-label",
  "/products/tracking",
  "/products/optimizer",
  "/products/pod",
  "/products/analytics",
  "/products/ai",
  "/products/smart-matching",
  "/products/ai-assistant",
  "/products/api",
  "/products/rates",
  "/available-loads",
  "/directory",
  "/suppliers",
  "/support",
  "/knowledge-base",
  "/learning-series",
  "/academy",
  "/docs",
  "/system-status",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
] as const;

/** Carrier directory company profile slugs (matches /directory/[id]). */
export const CARRIER_DIRECTORY_IDS = [
  "amz-prep",
  "synex-logistics",
  "jmd-haulage",
  "ws-transportation",
  "wt-transport",
  "transporter-eng",
  "carntyne-transport",
  "major-freight",
  "road-transport-media",
  "1",
] as const;

/** Supplier directory company profile slugs (matches /suppliers/[id]). */
export const SUPPLIER_DIRECTORY_IDS = [
  "british-steel",
  "barrett-steel",
  "parker-steel",
  "advanced-fab",
  "manufactory",
  "contracts-engineering",
  "wcm",
  "fabricon-design",
  "beck-pollitzer",
] as const;

export type SitemapChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export function getPathPriority(path: string): number {
  if (path === "/") return 1;
  if (path === "/directory" || path === "/suppliers") return 0.85;
  if (path.startsWith("/products/")) return 0.8;
  if (path === "/available-loads" || path === "/solution" || path === "/contact") return 0.75;
  if (path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/cookie")) return 0.4;
  return 0.65;
}

export function getPathChangeFrequency(path: string): SitemapChangeFrequency {
  if (path === "/" || path === "/available-loads") return "daily";
  if (path === "/blog" || path === "/system-status" || path === "/learning-series") return "weekly";
  if (path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/cookie")) return "yearly";
  return "weekly";
}
