export type RevenueStreamType = "transaction" | "recurring" | "one-time" | "affiliate" | "b2b";

export type RevenueStream = {
  id: number;
  name: string;
  type: RevenueStreamType;
  note?: string;
};

export type RevenueFunnelStage = {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  color: string;
  border: string;
  badge: string;
  streams: RevenueStream[];
};

export const REVENUE_FUNNEL_STAGES: RevenueFunnelStage[] = [
  {
    id: "acquisition",
    step: 1,
    title: "New User → Free Tools / AI / Directory",
    subtitle: "Bring guests onto the platform — build trust with free value, monetise with premium tools.",
    color: "from-sky-500/10 to-blue-50",
    border: "border-sky-200",
    badge: "Acquisition",
    streams: [
      { id: 14, name: "Freight Tools Pro", type: "recurring", note: "Advanced calculators + export" },
      { id: 42, name: "Market Intelligence Report", type: "one-time", note: "Paid lane rate reports" },
      { id: 43, name: "Lane Rate Data Export", type: "one-time", note: "CSV/API data packs" },
      { id: 44, name: "Analytics Dashboard Premium", type: "recurring", note: "Pro market insights" },
    ],
  },
  {
    id: "content",
    step: 2,
    title: "SEO + Blog + Academy",
    subtitle: "Drive traffic through content — revenue from courses, ads, and job listings.",
    color: "from-violet-500/10 to-purple-50",
    border: "border-violet-200",
    badge: "Content & SEO",
    streams: [
      { id: 30, name: "Academy Paid Courses", type: "one-time" },
      { id: 31, name: "Academy Certification Bundle", type: "one-time" },
      { id: 32, name: "Webinar / Training Tickets", type: "one-time" },
      { id: 39, name: "Partner Banner Ads", type: "affiliate" },
      { id: 40, name: "Sponsored Blog Placement", type: "affiliate" },
      { id: 41, name: "Job Listing Fees", type: "one-time", note: "Careers page postings" },
    ],
  },
  {
    id: "signup",
    step: 3,
    title: "Signup — Carrier or Supplier",
    subtitle: "Keep join free — begin monetisation after conversion.",
    color: "from-emerald-500/10 to-green-50",
    border: "border-emerald-200",
    badge: "Conversion",
    streams: [
      { id: 13, name: "Alpha Enterprise Plan", type: "recurring", note: "High-volume shippers & 3PLs" },
      { id: 16, name: "White-Label SaaS Subscription", type: "recurring", note: "Brokers use their own brand" },
    ],
  },
  {
    id: "onboarding",
    step: 4,
    title: "Onboarding + Verification",
    subtitle: "Monetise during verification — insurance, finance, and fast-track services.",
    color: "from-amber-500/10 to-yellow-50",
    border: "border-amber-200",
    badge: "Onboarding",
    streams: [
      { id: 22, name: "Fast-Track Verification", type: "one-time", note: "24h approval vs 2 days" },
      { id: 23, name: "Paid Compliance Certificate", type: "one-time", note: "Profile badge" },
      { id: 24, name: "Background Check Add-On", type: "one-time" },
      { id: 25, name: "GIT Insurance Referral", type: "affiliate" },
      { id: 26, name: "Fuel Card Referral", type: "affiliate" },
      { id: 27, name: "Breakdown Cover Referral", type: "affiliate" },
      { id: 28, name: "Vehicle Finance Referral", type: "affiliate" },
      { id: 29, name: "Tyre & Maintenance Referral", type: "affiliate" },
    ],
  },
  {
    id: "first-load",
    step: 5,
    title: "First Load Posted or Bid",
    subtitle: "Core marketplace — commission and visibility fees on every load.",
    color: "from-[#FFD666]/20 to-amber-50",
    border: "border-[#FFD666]/60",
    badge: "Core Transaction",
    streams: [
      { id: 1, name: "Transaction Commission", type: "transaction", note: "Supplier 4% + Carrier 3%" },
      { id: 2, name: "Minimum Fee Per Load", type: "transaction", note: "e.g. £15 floor per load" },
      { id: 3, name: "Urgent Load Surcharge", type: "transaction" },
      { id: 4, name: "Special Handling Fee", type: "transaction", note: "ADR, refrigerated, tail lift" },
      { id: 17, name: "Featured Load Boost", type: "one-time", note: "Top of board 48h" },
      { id: 18, name: "Urgent Load Badge", type: "one-time" },
    ],
  },
  {
    id: "operations",
    step: 6,
    title: "Messaging + Tracking + POD",
    subtitle: "Extra revenue from documents and compliance during load execution.",
    color: "from-cyan-500/10 to-teal-50",
    border: "border-cyan-200",
    badge: "Operations",
    streams: [{ id: 38, name: "Document Generation Fee", type: "one-time", note: "Rate con, BOL, invoice PDF" }],
  },
  {
    id: "payment",
    step: 7,
    title: "Payment + 7-Day Payout",
    subtitle: "Financial services revenue from checkout and payout speed.",
    color: "from-indigo-500/10 to-blue-50",
    border: "border-indigo-200",
    badge: "Payments",
    streams: [
      { id: 5, name: "Payment Processing Fee", type: "transaction", note: "Stripe cost + margin" },
      { id: 6, name: "Instant Payout Fee", type: "transaction", note: "Same-day carrier payout" },
      { id: 7, name: "Next-Day Payout Fee", type: "transaction" },
      { id: 8, name: "Wallet / Early Payment Service", type: "transaction" },
      { id: 9, name: "Invoice Factoring Partnership", type: "affiliate" },
      { id: 10, name: "Escrow / Payment Protection Fee", type: "transaction" },
    ],
  },
  {
    id: "retention",
    step: 8,
    title: "Review + Referral",
    subtitle: "Directory premium and referrals once trust is established.",
    color: "from-rose-500/10 to-pink-50",
    border: "border-rose-200",
    badge: "Retention",
    streams: [
      { id: 19, name: "Premium Directory Listing", type: "recurring" },
      { id: 20, name: "Sponsored Carrier Profile", type: "recurring" },
      { id: 21, name: "Sponsored Supplier Profile", type: "recurring" },
    ],
  },
  {
    id: "network",
    step: 9,
    title: "Social Feed Network Effect",
    subtitle: "Grow the community — reach new users and partners through the network.",
    color: "from-fuchsia-500/10 to-pink-50",
    border: "border-fuchsia-200",
    badge: "Network",
    streams: [
      { id: 39, name: "Partner Banner Ads", type: "affiliate", note: "Feed & community placements" },
    ],
  },
  {
    id: "power-user",
    step: 10,
    title: "Lane Alerts + Recurring Loads",
    subtitle: "Daily power users — subscription upsell opportunity.",
    color: "from-orange-500/10 to-orange-50",
    border: "border-orange-200",
    badge: "Power User",
    streams: [
      { id: 11, name: "Alpha Pro — Supplier Plan", type: "recurring" },
      { id: 12, name: "Alpha Pro — Carrier Plan", type: "recurring" },
      { id: 15, name: "API Subscription", type: "recurring" },
    ],
  },
  {
    id: "enterprise",
    step: 11,
    title: "Power User / Subscription + B2B",
    subtitle: "Enterprise, managed service, and vertical expansion — highest revenue potential.",
    color: "from-slate-800/10 to-slate-100",
    border: "border-slate-300",
    badge: "Enterprise",
    streams: [
      { id: 33, name: "Managed Brokerage Service", type: "b2b", note: "12–15% high-touch loads" },
      { id: 34, name: "Dedicated Lane Manager Retainer", type: "b2b" },
      { id: 35, name: "Custom Integration / Setup Fee", type: "b2b" },
      { id: 36, name: "Air Freight Booking Margin", type: "transaction" },
      { id: 37, name: "Sea Freight Booking Margin", type: "transaction" },
    ],
  },
];

/** Flat list of all 44 unique revenue streams for summary tables. */
export const ALL_REVENUE_STREAMS: RevenueStream[] = [
  { id: 1, name: "Transaction Commission", type: "transaction" },
  { id: 2, name: "Minimum Fee Per Load", type: "transaction" },
  { id: 3, name: "Urgent Load Surcharge", type: "transaction" },
  { id: 4, name: "Special Handling Fee", type: "transaction" },
  { id: 5, name: "Payment Processing Fee", type: "transaction" },
  { id: 6, name: "Instant Payout Fee", type: "transaction" },
  { id: 7, name: "Next-Day Payout Fee", type: "transaction" },
  { id: 8, name: "Wallet / Early Payment Service", type: "transaction" },
  { id: 9, name: "Invoice Factoring Partnership", type: "affiliate" },
  { id: 10, name: "Escrow / Payment Protection Fee", type: "transaction" },
  { id: 11, name: "Alpha Pro — Supplier Plan", type: "recurring" },
  { id: 12, name: "Alpha Pro — Carrier Plan", type: "recurring" },
  { id: 13, name: "Alpha Enterprise Plan", type: "recurring" },
  { id: 14, name: "Freight Tools Pro", type: "recurring" },
  { id: 15, name: "API Subscription", type: "recurring" },
  { id: 16, name: "White-Label SaaS Subscription", type: "recurring" },
  { id: 17, name: "Featured Load Boost", type: "one-time" },
  { id: 18, name: "Urgent Load Badge", type: "one-time" },
  { id: 19, name: "Premium Directory Listing", type: "recurring" },
  { id: 20, name: "Sponsored Carrier Profile", type: "recurring" },
  { id: 21, name: "Sponsored Supplier Profile", type: "recurring" },
  { id: 22, name: "Fast-Track Verification", type: "one-time" },
  { id: 23, name: "Paid Compliance Certificate", type: "one-time" },
  { id: 24, name: "Background Check Add-On", type: "one-time" },
  { id: 25, name: "GIT Insurance Referral", type: "affiliate" },
  { id: 26, name: "Fuel Card Referral", type: "affiliate" },
  { id: 27, name: "Breakdown Cover Referral", type: "affiliate" },
  { id: 28, name: "Vehicle Finance Referral", type: "affiliate" },
  { id: 29, name: "Tyre & Maintenance Referral", type: "affiliate" },
  { id: 30, name: "Academy Paid Courses", type: "one-time" },
  { id: 31, name: "Academy Certification Bundle", type: "one-time" },
  { id: 32, name: "Webinar / Training Tickets", type: "one-time" },
  { id: 33, name: "Managed Brokerage Service", type: "b2b" },
  { id: 34, name: "Dedicated Lane Manager Retainer", type: "b2b" },
  { id: 35, name: "Custom Integration / Setup Fee", type: "b2b" },
  { id: 36, name: "Air Freight Booking Margin", type: "transaction" },
  { id: 37, name: "Sea Freight Booking Margin", type: "transaction" },
  { id: 38, name: "Document Generation Fee", type: "one-time" },
  { id: 39, name: "Partner Banner Ads", type: "affiliate" },
  { id: 40, name: "Sponsored Blog Placement", type: "affiliate" },
  { id: 41, name: "Job Listing Fees", type: "one-time" },
  { id: 42, name: "Market Intelligence Report", type: "one-time" },
  { id: 43, name: "Lane Rate Data Export", type: "one-time" },
  { id: 44, name: "Analytics Dashboard Premium", type: "recurring" },
];

export const REVENUE_TYPE_LABELS: Record<RevenueStreamType, string> = {
  transaction: "Per transaction",
  recurring: "Monthly / recurring",
  "one-time": "One-time fee",
  affiliate: "Partner affiliate",
  b2b: "B2B / enterprise",
};

export const REVENUE_TYPE_COLORS: Record<RevenueStreamType, string> = {
  transaction: "bg-amber-100 text-amber-900",
  recurring: "bg-blue-100 text-blue-900",
  "one-time": "bg-violet-100 text-violet-900",
  affiliate: "bg-emerald-100 text-emerald-900",
  b2b: "bg-slate-200 text-slate-900",
};

export const REVENUE_MODEL_SUMMARY = {
  headline: "Strategic Revenue & Growth Plan",
  documentTitle: "Strategic Revenue Plan 2026",
  subheadline:
    "Do not rely on commission alone (5–7%). Monetise at every step of the user journey — transaction, subscription, affiliate, and enterprise.",
  currentCommission: "Supplier 4% + Carrier 3% = ~7% per load (live today)",
  confidential: "Confidential · Internal strategy document",
  priorityTop5: [
    "Instant Payout Fee",
    "Alpha Pro Subscription",
    "Featured Load Boost",
    "GIT Insurance Referral",
    "Fast-Track Verification",
  ],
};

export const GROWTH_FUNNEL_NODES = [
  { id: "new-user", label: "New User", row: 0, col: 0 },
  { id: "free-tools", label: "Free Tools / AI / Directory", row: 1, col: 0 },
  { id: "seo", label: "SEO + Blog + Academy", row: 2, col: 0 },
  { id: "signup", label: "Signup Carrier or Supplier", row: 3, col: 0 },
  { id: "onboarding", label: "Onboarding + Verification", row: 4, col: 0 },
  { id: "first-load", label: "First Load Posted or Bid", row: 5, col: 0 },
  { id: "ops", label: "Messaging + Tracking + POD", row: 6, col: 0 },
  { id: "payment", label: "Payment + 7-Day Payout", row: 0, col: 2 },
  { id: "review", label: "Review + Referral", row: 1, col: 2 },
  { id: "social", label: "Social Feed Network Effect", row: 2, col: 2 },
  { id: "lane", label: "Lane Alerts + Recurring Loads", row: 4, col: 2 },
  { id: "power", label: "Power User / Subscription", row: 5, col: 2 },
] as const;

export const REVENUE_PILLARS = [
  {
    title: "Transaction Revenue",
    subtitle: "Revenue on every load",
    count: 10,
    color: "border-amber-400/40 bg-amber-500/10",
    examples: ["Commission", "Minimum fee", "Instant payout", "Urgent surcharge"],
  },
  {
    title: "Recurring Revenue",
    subtitle: "Fixed monthly income",
    count: 6,
    color: "border-blue-400/40 bg-blue-500/10",
    examples: ["Alpha Pro", "Enterprise", "API", "White-label"],
  },
  {
    title: "Affiliate Revenue",
    subtitle: "Passive income from partners",
    count: 9,
    color: "border-emerald-400/40 bg-emerald-500/10",
    examples: ["Insurance", "Fuel cards", "Factoring", "Banner ads"],
  },
  {
    title: "Enterprise & B2B",
    subtitle: "High value, fewer clients",
    count: 5,
    color: "border-violet-400/40 bg-violet-500/10",
    examples: ["Managed brokerage", "Lane manager", "Air/Sea margin"],
  },
] as const;

export const PLAN_PHASES = [
  {
    phase: "Phase A",
    timeline: "Days 1–30",
    title: "Quick revenue start",
    items: ["Minimum fee £15/load", "Instant payout 2%", "Featured load £29", "Insurance partner link", "Fast-track verification £99"],
  },
  {
    phase: "Phase B",
    timeline: "Days 31–90",
    title: "Recurring revenue",
    items: ["Alpha Pro subscription", "Premium directory", "Fuel card widget", "Academy paid enroll", "Enterprise sales CRM"],
  },
  {
    phase: "Phase C",
    timeline: "Months 4–12",
    title: "Scale & moat",
    items: ["White-label SaaS", "Public API", "Managed brokerage", "Air freight live", "Market intelligence product"],
  },
] as const;

export const REVENUE_PROJECTIONS: Array<{
  stream: string;
  m6: string;
  m12: string;
  highlight?: boolean;
}> = [
  { stream: "Transaction commission", m6: "£6,700", m12: "£11,200" },
  { stream: "Instant payout fees", m6: "£1,200", m12: "£2,000" },
  { stream: "Pro subscriptions", m6: "£2,100", m12: "£3,500" },
  { stream: "Featured loads + directory", m6: "£900", m12: "£1,500" },
  { stream: "Partner affiliates", m6: "£400", m12: "£800" },
  { stream: "Academy + verification", m6: "£600", m12: "£1,200" },
  { stream: "Total (conservative)", m6: "£11,900", m12: "£20,200", highlight: true },
];

export const EXECUTIVE_SUMMARY = [
  "Alpha Freight currently depends on transaction commission alone — revenue stays £0 until paid loads are completed.",
  "This plan defines 44 distinct revenue streams — monetisation at every step of the user journey.",
  "Strategy: keep join free; charge for premium speed, visibility, data, and financial services.",
  "Launch instant payout, subscriptions, and affiliates first — revenue can start before volume scales.",
  "12-month conservative target: ~£20k/month (~£242k/year) when products and volume are both executed.",
];
