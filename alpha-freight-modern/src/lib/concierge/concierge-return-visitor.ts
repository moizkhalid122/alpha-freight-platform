import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import { getConciergePage } from "@/lib/concierge/concierge-site-map";

const PORTAL_LABELS: Record<string, string> = {
  "/carrier/dashboard": "carrier dashboard",
  "/carrier/my-loads": "your active loads",
  "/carrier/available-loads": "available loads",
  "/supplier/dashboard": "supplier dashboard",
  "/supplier/post-load": "post a load",
  "/supplier/my-posts": "your posted loads",
};

export function pageLabelFromPath(pathname: string): string {
  const page = getConciergePage(pathname);
  if (page?.title) return page.title.toLowerCase();
  if (PORTAL_LABELS[pathname]) return PORTAL_LABELS[pathname];
  if (pathname.includes("/auth/signup")) {
    return pathname.includes("supplier") ? "supplier signup" : "carrier signup";
  }
  if (pathname.includes("/pricing")) return "pricing";
  if (pathname.includes("/find-loads")) return "find loads";
  return pathname.replace(/^\//, "").replace(/-/g, " ") || "the site";
}

export function recordConciergeVisit(
  memory: ConciergeVoiceMemory,
  pathname: string,
): ConciergeVoiceMemory {
  const now = new Date().toISOString();
  const visitCount = (memory.visitCount || 0) + 1;
  return {
    ...memory,
    visitCount,
    lastPage: pathname,
    lastPageLabel: pageLabelFromPath(pathname),
    lastVisitAt: now,
    firstVisitAt: memory.firstVisitAt || now,
    visitorId: memory.visitorId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `v-${Date.now()}`),
  };
}

export function buildReturnVisitorGreeting(
  memory: ConciergeVoiceMemory,
  pathname: string,
): string | null {
  if ((memory.visitCount || 0) < 2) return null;

  const name = memory.userName?.trim();
  const currentPage = pageLabelFromPath(pathname);

  if (name) {
    return `Hey ${name}! Good to have you back — you're on ${currentPage} right now. What can I help with?`;
  }
  return `Hey! Welcome back — you're on ${currentPage}. How can I help?`;
}

export function mergeProfileIntoMemory(
  memory: ConciergeVoiceMemory,
  profile: {
    full_name?: string | null;
    role?: string | null;
    referral_code?: string | null;
    email?: string | null;
  },
): ConciergeVoiceMemory {
  const next = { ...memory };
  if (profile.full_name?.trim()) next.userName = profile.full_name.trim();
  if (profile.email?.trim()) next.userEmail = profile.email.trim().toLowerCase();
  if (profile.role === "carrier" || profile.role === "supplier") next.role = profile.role;
  if (profile.referral_code?.trim()) next.userReferralCode = profile.referral_code.trim().toUpperCase();
  return next;
}
