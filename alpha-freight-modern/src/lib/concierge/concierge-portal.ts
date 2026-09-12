import type { ConciergeAgentTool } from "@/lib/chat-types";

export const CONCIERGE_PORTAL_PAGES = [
  { path: "/carrier/dashboard", title: "Carrier dashboard", role: "carrier" as const },
  { path: "/carrier/my-loads", title: "My active loads", role: "carrier" as const },
  { path: "/carrier/available-loads", title: "Available loads", role: "carrier" as const },
  { path: "/carrier/my-bids", title: "My bids", role: "carrier" as const },
  { path: "/carrier/earnings", title: "Earnings", role: "carrier" as const },
  { path: "/carrier/referrals", title: "Referrals", role: "carrier" as const },
  { path: "/supplier/dashboard", title: "Supplier dashboard", role: "supplier" as const },
  { path: "/supplier/post-load", title: "Post a load", role: "supplier" as const },
  { path: "/supplier/my-posts", title: "My posted loads", role: "supplier" as const },
  { path: "/supplier/my-bids", title: "Load bids", role: "supplier" as const },
  { path: "/supplier/referrals", title: "Referrals", role: "supplier" as const },
];

export function isPortalPath(pathname: string): boolean {
  return pathname.startsWith("/carrier") || pathname.startsWith("/supplier");
}

export function buildPortalGuide(pathname: string): string {
  if (pathname.startsWith("/carrier")) {
    return `PORTAL MODE — logged-in carrier workspace.
- "Show my loads" / "active loads" → /carrier/my-loads
- "Find loads" / "available loads" → /carrier/available-loads
- "My bids" → /carrier/my-bids
- "Earnings" / "wallet" → /carrier/earnings or /carrier/wallet
- "Referrals" / "share my code" → /carrier/referrals
Navigate immediately when intent is clear.`;
  }
  if (pathname.startsWith("/supplier")) {
    return `PORTAL MODE — logged-in supplier workspace.
- "Post a load" / "new load" → /supplier/post-load
- "My loads" / "posted loads" → /supplier/my-posts
- "Track shipment" → /supplier/track
- "Referrals" / "share" → /supplier/referrals
Navigate immediately when intent is clear.`;
  }
  return "";
}

export function buildPortalInstantActions(message: string, pagePath: string): ConciergeAgentTool[] {
  if (!isPortalPath(pagePath)) return [];
  const lower = message.toLowerCase();

  if (pagePath.startsWith("/carrier")) {
    if (/\b(my load|my loads|active load|active loads|current load)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/my-loads", label: "My loads" }];
    }
    if (/\b(find load|find loads|available load|available loads|browse load)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/available-loads", label: "Available loads" }];
    }
    if (/\b(my bid|my bids|bids)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/my-bids", label: "My bids" }];
    }
    if (/\b(earning|earnings|wallet|payout)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/earnings", label: "Earnings" }];
    }
    if (/\b(referral|referrals|share.*code)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/referrals", label: "Referrals" }];
    }
    if (/\b(dashboard|home)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/carrier/dashboard", label: "Dashboard" }];
    }
  }

  if (pagePath.startsWith("/supplier")) {
    if (/\b(post load|post a load|new load|create load)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/supplier/post-load", label: "Post a load" }];
    }
    if (/\b(my load|my loads|posted load|my posts)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/supplier/my-posts", label: "My posts" }];
    }
    if (/\b(track|tracking|shipment)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/supplier/track", label: "Track" }];
    }
    if (/\b(referral|referrals|share.*code)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/supplier/referrals", label: "Referrals" }];
    }
    if (/\b(dashboard|home)\b/i.test(lower)) {
      return [{ type: "navigate", path: "/supplier/dashboard", label: "Dashboard" }];
    }
  }

  return [];
}
