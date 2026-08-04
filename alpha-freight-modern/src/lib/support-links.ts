export const supportArticleLinks: Record<string, string> = {
  "Booking Loads": "/knowledge-base/finding-loads",
  "Document Uploads": "/knowledge-base/digital-pod",
  "Route Optimization": "/products/optimizer",
  "Driver Setup": "/docs?tab=overview",
  "Posting Loads": "/knowledge-base/post-a-load",
  "Real-time Tracking": "/knowledge-base/how-it-works",
  "Carrier Vetting": "/knowledge-base/carrier-vetting",
  "Analytics Guide": "/products/analytics",
  "Payout Schedule": "/knowledge-base/seven-day-payouts",
  "Invoicing Help": "/knowledge-base/pay-instant-vs-later",
  "Wallet Setup": "/knowledge-base/carrier-wallet",
  "Tax Documents": "/contact",
  "Security Setup": "/knowledge-base/privacy-data",
  "Platform Updates": "/products/releases",
  "Account Recovery": "/auth/forgot-password",
  "API Status": "/system-status",
};

export function getSupportArticleHref(label: string) {
  return supportArticleLinks[label] ?? `/knowledge-base?search=${encodeURIComponent(label)}`;
}
