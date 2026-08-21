import type { fetchAdminOverviewBundle } from "@/lib/admin-overview-data";
import type { fetchAdminLoadsBundleRest, fetchAdminProfilesRest } from "@/lib/admin-rest";

export const ADMIN_API_CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
export const ADMIN_API_SERVER_CACHE_MS = 5 * 60_000;

type OverviewCacheEntry = {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchAdminOverviewBundle>>;
};

type LoadsCacheEntry = {
  expiresAt: number;
  body: Awaited<ReturnType<typeof fetchAdminLoadsBundleRest>>;
};

type ProfilesCacheEntry = {
  expiresAt: number;
  profiles: Awaited<ReturnType<typeof fetchAdminProfilesRest>>;
};

let overviewCache: OverviewCacheEntry | null = null;
let loadsCache: LoadsCacheEntry | null = null;
const profileCache = new Map<string, ProfilesCacheEntry>();

export function getAdminOverviewCache(now = Date.now()) {
  return overviewCache && overviewCache.expiresAt > now ? overviewCache : null;
}

export function setAdminOverviewCache(body: OverviewCacheEntry["body"], now = Date.now()) {
  overviewCache = { expiresAt: now + ADMIN_API_SERVER_CACHE_MS, body };
}

export function getStaleAdminOverviewCache() {
  return overviewCache;
}

export function invalidateAdminOverviewCache() {
  overviewCache = null;
}

export function getAdminLoadsCache(now = Date.now()) {
  return loadsCache && loadsCache.expiresAt > now ? loadsCache : null;
}

export function setAdminLoadsCache(body: LoadsCacheEntry["body"], now = Date.now()) {
  loadsCache = { expiresAt: now + ADMIN_API_SERVER_CACHE_MS, body };
}

export function getStaleAdminLoadsCache() {
  return loadsCache;
}

export function invalidateAdminLoadsCache() {
  loadsCache = null;
}

export function getAdminProfilesCache(cacheKey: string, now = Date.now()) {
  const cached = profileCache.get(cacheKey);
  return cached && cached.expiresAt > now ? cached : null;
}

export function setAdminProfilesCache(
  cacheKey: string,
  profiles: ProfilesCacheEntry["profiles"],
  now = Date.now()
) {
  profileCache.set(cacheKey, { expiresAt: now + ADMIN_API_SERVER_CACHE_MS, profiles });
}

export function getStaleAdminProfilesCache(cacheKey: string) {
  return profileCache.get(cacheKey) ?? null;
}

export function invalidateAdminProfilesCache() {
  profileCache.clear();
}
