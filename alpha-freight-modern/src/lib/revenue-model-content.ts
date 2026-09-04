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

/** Format GBP for display — uses M / k for millions scale. */
export function formatRevenueGbp(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return millions >= 10 ? `£${Math.round(millions)}M` : `£${millions.toFixed(2)}M`;
  }
  if (amount >= 10_000) return `£${Math.round(amount / 1_000)}k`;
  return `£${amount.toLocaleString("en-GB")}`;
}

export type StreamMonthlyTarget = {
  id: number;
  name: string;
  type: RevenueStreamType;
  /** Month-12 monthly target (GBP) — full-effort scenario. */
  m12Monthly: number;
  launchMonth: number;
  note?: string;
};

/**
 * All 44 streams · Month-12 monthly earning target (GBP).
 * Total target: £1.15M/month · £13.7M annual run-rate.
 */
export const STREAM_MONTHLY_TARGETS: StreamMonthlyTarget[] = [
  { id: 1, name: "Transaction Commission", type: "transaction", m12Monthly: 309_000, launchMonth: 1, note: "Core · ~7% per load" },
  { id: 2, name: "Minimum Fee Per Load", type: "transaction", m12Monthly: 48_000, launchMonth: 1, note: "£15 floor" },
  { id: 3, name: "Urgent Load Surcharge", type: "transaction", m12Monthly: 14_000, launchMonth: 6 },
  { id: 4, name: "Special Handling Fee", type: "transaction", m12Monthly: 12_000, launchMonth: 6, note: "ADR · fridge · tail lift" },
  { id: 5, name: "Payment Processing Fee", type: "transaction", m12Monthly: 18_000, launchMonth: 1 },
  { id: 6, name: "Instant Payout Fee", type: "transaction", m12Monthly: 32_000, launchMonth: 3, note: "2% same-day" },
  { id: 7, name: "Next-Day Payout Fee", type: "transaction", m12Monthly: 8_000, launchMonth: 5 },
  { id: 8, name: "Wallet / Early Payment Service", type: "transaction", m12Monthly: 10_000, launchMonth: 8 },
  { id: 9, name: "Invoice Factoring Partnership", type: "affiliate", m12Monthly: 22_000, launchMonth: 7 },
  { id: 10, name: "Escrow / Payment Protection Fee", type: "transaction", m12Monthly: 8_000, launchMonth: 6 },
  { id: 11, name: "Alpha Pro — Supplier Plan", type: "recurring", m12Monthly: 38_000, launchMonth: 4, note: "£49/mo × ~775 users" },
  { id: 12, name: "Alpha Pro — Carrier Plan", type: "recurring", m12Monthly: 34_000, launchMonth: 3, note: "£29/mo × ~1,170 users" },
  { id: 13, name: "Alpha Enterprise Plan", type: "recurring", m12Monthly: 72_000, launchMonth: 7, note: "£299+/mo · 3PLs" },
  { id: 14, name: "Freight Tools Pro", type: "recurring", m12Monthly: 6_000, launchMonth: 6 },
  { id: 15, name: "API Subscription", type: "recurring", m12Monthly: 20_000, launchMonth: 7 },
  { id: 16, name: "White-Label SaaS Subscription", type: "recurring", m12Monthly: 88_000, launchMonth: 10, note: "Broker branded platform" },
  { id: 17, name: "Featured Load Boost", type: "one-time", m12Monthly: 14_000, launchMonth: 1, note: "£29 · top 48h" },
  { id: 18, name: "Urgent Load Badge", type: "one-time", m12Monthly: 4_000, launchMonth: 1 },
  { id: 19, name: "Premium Directory Listing", type: "recurring", m12Monthly: 10_000, launchMonth: 4 },
  { id: 20, name: "Sponsored Carrier Profile", type: "recurring", m12Monthly: 11_000, launchMonth: 4 },
  { id: 21, name: "Sponsored Supplier Profile", type: "recurring", m12Monthly: 8_000, launchMonth: 4 },
  { id: 22, name: "Fast-Track Verification", type: "one-time", m12Monthly: 7_000, launchMonth: 1, note: "£99 · 24h approval" },
  { id: 23, name: "Paid Compliance Certificate", type: "one-time", m12Monthly: 5_000, launchMonth: 3 },
  { id: 24, name: "Background Check Add-On", type: "one-time", m12Monthly: 3_000, launchMonth: 7 },
  { id: 25, name: "GIT Insurance Referral", type: "affiliate", m12Monthly: 18_000, launchMonth: 2 },
  { id: 26, name: "Fuel Card Referral", type: "affiliate", m12Monthly: 15_000, launchMonth: 2 },
  { id: 27, name: "Breakdown Cover Referral", type: "affiliate", m12Monthly: 6_000, launchMonth: 5 },
  { id: 28, name: "Vehicle Finance Referral", type: "affiliate", m12Monthly: 12_000, launchMonth: 5 },
  { id: 29, name: "Tyre & Maintenance Referral", type: "affiliate", m12Monthly: 5_000, launchMonth: 7 },
  { id: 30, name: "Academy Paid Courses", type: "one-time", m12Monthly: 4_000, launchMonth: 5 },
  { id: 31, name: "Academy Certification Bundle", type: "one-time", m12Monthly: 3_000, launchMonth: 6 },
  { id: 32, name: "Webinar / Training Tickets", type: "one-time", m12Monthly: 2_500, launchMonth: 10 },
  { id: 33, name: "Managed Brokerage Service", type: "b2b", m12Monthly: 125_000, launchMonth: 8, note: "12–15% high-touch loads" },
  { id: 34, name: "Dedicated Lane Manager Retainer", type: "b2b", m12Monthly: 58_000, launchMonth: 10 },
  { id: 35, name: "Custom Integration / Setup Fee", type: "b2b", m12Monthly: 12_000, launchMonth: 11 },
  { id: 36, name: "Air Freight Booking Margin", type: "transaction", m12Monthly: 24_000, launchMonth: 12 },
  { id: 37, name: "Sea Freight Booking Margin", type: "transaction", m12Monthly: 18_000, launchMonth: 12 },
  { id: 38, name: "Document Generation Fee", type: "one-time", m12Monthly: 5_500, launchMonth: 5 },
  { id: 39, name: "Partner Banner Ads", type: "affiliate", m12Monthly: 6_000, launchMonth: 8 },
  { id: 40, name: "Sponsored Blog Placement", type: "affiliate", m12Monthly: 3_000, launchMonth: 9 },
  { id: 41, name: "Job Listing Fees", type: "one-time", m12Monthly: 2_000, launchMonth: 9 },
  { id: 42, name: "Market Intelligence Report", type: "one-time", m12Monthly: 7_000, launchMonth: 9 },
  { id: 43, name: "Lane Rate Data Export", type: "one-time", m12Monthly: 8_000, launchMonth: 11 },
  { id: 44, name: "Analytics Dashboard Premium", type: "recurring", m12Monthly: 10_000, launchMonth: 11 },
];

export const STREAM_MONTHLY_TARGETS_TOTAL = STREAM_MONTHLY_TARGETS.reduce((sum, s) => sum + s.m12Monthly, 0);

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
  yearOneTargetMonthly: "£1.15M",
  yearOneTargetAnnual: "£13.7M run-rate",
  yearOneCumulative: "£6.8M",
};

export type RevenueScenarioId = "conservative" | "target" | "stretch";

export type RevenueScenario = {
  id: RevenueScenarioId;
  label: string;
  description: string;
  m12Monthly: number;
  yearRunRate: number;
  yearCumulative: number;
};

/** Three scenarios — target assumes full execution + consistent outreach. */
export const REVENUE_SCENARIOS: RevenueScenario[] = [
  {
    id: "conservative",
    label: "Conservative",
    description: "Products live but slow user growth · safe floor",
    m12Monthly: 420_000,
    yearRunRate: 5_040_000,
    yearCumulative: 2_800_000,
  },
  {
    id: "target",
    label: "Target (full effort)",
    description: "Daily sales, onboarding, product launches on schedule",
    m12Monthly: 1_145_000,
    yearRunRate: 13_740_000,
    yearCumulative: 6_800_000,
  },
  {
    id: "stretch",
    label: "Stretch",
    description: "Multiple enterprise + white-label wins by Q4",
    m12Monthly: 1_750_000,
    yearRunRate: 21_000_000,
    yearCumulative: 9_500_000,
  },
];

export type MonthlyForecastRow = {
  month: number;
  label: string;
  conservative: number;
  target: number;
  stretch: number;
  loadsCompleted: number;
  newSignups: number;
  focus: string;
};

/** Month-by-month revenue forecast (GBP) — target column is primary execution plan. */
export const REVENUE_MONTHLY_FORECAST: MonthlyForecastRow[] = [
  { month: 1, label: "Month 1", conservative: 18_000, target: 28_000, stretch: 45_000, loadsCompleted: 120, newSignups: 180, focus: "Launch min fee, featured load, fast-track verification" },
  { month: 2, label: "Month 2", conservative: 35_000, target: 55_000, stretch: 90_000, loadsCompleted: 280, newSignups: 320, focus: "Insurance + fuel affiliate widgets live" },
  { month: 3, label: "Month 3", conservative: 72_000, target: 120_000, stretch: 185_000, loadsCompleted: 550, newSignups: 450, focus: "Instant payout + Alpha Pro carrier plan" },
  { month: 4, label: "Month 4", conservative: 125_000, target: 210_000, stretch: 320_000, loadsCompleted: 850, newSignups: 550, focus: "Supplier Pro + premium directory listings" },
  { month: 5, label: "Month 5", conservative: 185_000, target: 320_000, stretch: 480_000, loadsCompleted: 1200, newSignups: 600, focus: "Academy paid courses + compliance certificate" },
  { month: 6, label: "Month 6", conservative: 265_000, target: 450_000, stretch: 650_000, loadsCompleted: 1550, newSignups: 650, focus: "Document fees + next-day payout tier" },
  { month: 7, label: "Month 7", conservative: 320_000, target: 580_000, stretch: 820_000, loadsCompleted: 1850, newSignups: 700, focus: "Enterprise outreach + API beta" },
  { month: 8, label: "Month 8", conservative: 360_000, target: 720_000, stretch: 1_020_000, loadsCompleted: 2150, newSignups: 750, focus: "Managed brokerage pilot + sponsored profiles" },
  { month: 9, label: "Month 9", conservative: 385_000, target: 850_000, stretch: 1_200_000, loadsCompleted: 2450, newSignups: 800, focus: "Market intelligence report + job listings" },
  { month: 10, label: "Month 10", conservative: 400_000, target: 950_000, stretch: 1_380_000, loadsCompleted: 2650, newSignups: 850, focus: "White-label SaaS first client" },
  { month: 11, label: "Month 11", conservative: 410_000, target: 1_000_000, stretch: 1_550_000, loadsCompleted: 2750, newSignups: 900, focus: "Lane data export + analytics premium" },
  { month: 12, label: "Month 12", conservative: 420_000, target: 1_145_000, stretch: 1_750_000, loadsCompleted: 2800, newSignups: 950, focus: "All 44 streams active · optimise conversion" },
];

export type MonthlyRevenueBreakdown = {
  category: string;
  m3: number;
  m6: number;
  m9: number;
  m12: number;
};

/** Target scenario revenue mix by category (GBP/month). */
export const REVENUE_BREAKDOWN_TARGET: MonthlyRevenueBreakdown[] = [
  { category: "Transaction commission + min fee", m3: 85_000, m6: 295_000, m9: 545_000, m12: 380_000 },
  { category: "Payment & payout fees", m3: 8_000, m6: 58_000, m9: 100_000, m12: 76_000 },
  { category: "Pro & enterprise subscriptions", m3: 18_000, m6: 102_000, m9: 190_000, m12: 278_000 },
  { category: "Featured loads + directory", m3: 12_000, m6: 38_000, m9: 68_000, m12: 47_000 },
  { category: "Onboarding + verification + docs", m3: 15_000, m6: 42_000, m9: 72_000, m12: 20_500 },
  { category: "Affiliate & partner revenue", m3: 8_000, m6: 28_000, m9: 58_000, m12: 87_000 },
  { category: "Academy + content + ads", m3: 0, m6: 15_000, m9: 32_000, m12: 11_500 },
  { category: "B2B managed + integrations", m3: 0, m6: 48_000, m9: 175_000, m12: 245_000 },
];

export type StreamActivation = {
  streamId: number;
  launchMonth: number;
  priority: "P1" | "P2" | "P3";
  effort: "Low" | "Medium" | "High";
  note?: string;
};

/** When each of the 44 streams should go live (target plan). */
export const STREAM_ACTIVATION_SCHEDULE: StreamActivation[] = [
  { streamId: 1, launchMonth: 1, priority: "P1", effort: "Low", note: "Already live" },
  { streamId: 2, launchMonth: 1, priority: "P1", effort: "Low", note: "£15 min fee" },
  { streamId: 5, launchMonth: 1, priority: "P1", effort: "Low" },
  { streamId: 17, launchMonth: 1, priority: "P1", effort: "Low", note: "£29 featured boost" },
  { streamId: 18, launchMonth: 1, priority: "P1", effort: "Low" },
  { streamId: 22, launchMonth: 1, priority: "P1", effort: "Medium", note: "£99 fast-track" },
  { streamId: 25, launchMonth: 2, priority: "P1", effort: "Low", note: "GIT insurance partner" },
  { streamId: 26, launchMonth: 2, priority: "P1", effort: "Low" },
  { streamId: 6, launchMonth: 3, priority: "P1", effort: "Medium", note: "2% instant payout" },
  { streamId: 12, launchMonth: 3, priority: "P1", effort: "Medium", note: "Carrier Pro £29/mo" },
  { streamId: 23, launchMonth: 3, priority: "P2", effort: "Low" },
  { streamId: 11, launchMonth: 4, priority: "P1", effort: "Medium", note: "Supplier Pro £49/mo" },
  { streamId: 19, launchMonth: 4, priority: "P2", effort: "Low" },
  { streamId: 20, launchMonth: 4, priority: "P2", effort: "Low" },
  { streamId: 21, launchMonth: 4, priority: "P2", effort: "Low" },
  { streamId: 7, launchMonth: 5, priority: "P2", effort: "Medium" },
  { streamId: 27, launchMonth: 5, priority: "P2", effort: "Low" },
  { streamId: 28, launchMonth: 5, priority: "P2", effort: "Low" },
  { streamId: 30, launchMonth: 5, priority: "P2", effort: "Medium" },
  { streamId: 38, launchMonth: 5, priority: "P2", effort: "Low" },
  { streamId: 3, launchMonth: 6, priority: "P2", effort: "Low" },
  { streamId: 4, launchMonth: 6, priority: "P2", effort: "Low" },
  { streamId: 10, launchMonth: 6, priority: "P2", effort: "High" },
  { streamId: 14, launchMonth: 6, priority: "P2", effort: "Medium" },
  { streamId: 31, launchMonth: 6, priority: "P3", effort: "Medium" },
  { streamId: 9, launchMonth: 7, priority: "P2", effort: "Medium", note: "Factoring partner" },
  { streamId: 13, launchMonth: 7, priority: "P1", effort: "High", note: "Enterprise £299+/mo" },
  { streamId: 15, launchMonth: 7, priority: "P2", effort: "High" },
  { streamId: 24, launchMonth: 7, priority: "P3", effort: "Medium" },
  { streamId: 29, launchMonth: 7, priority: "P3", effort: "Low" },
  { streamId: 33, launchMonth: 8, priority: "P1", effort: "High", note: "12–15% managed loads" },
  { streamId: 8, launchMonth: 8, priority: "P2", effort: "High" },
  { streamId: 39, launchMonth: 8, priority: "P3", effort: "Low" },
  { streamId: 40, launchMonth: 9, priority: "P3", effort: "Low" },
  { streamId: 41, launchMonth: 9, priority: "P3", effort: "Low" },
  { streamId: 42, launchMonth: 9, priority: "P2", effort: "Medium" },
  { streamId: 34, launchMonth: 10, priority: "P1", effort: "High", note: "Lane manager retainer" },
  { streamId: 16, launchMonth: 10, priority: "P2", effort: "High" },
  { streamId: 32, launchMonth: 10, priority: "P3", effort: "Medium" },
  { streamId: 43, launchMonth: 11, priority: "P2", effort: "Medium" },
  { streamId: 44, launchMonth: 11, priority: "P2", effort: "Medium" },
  { streamId: 35, launchMonth: 11, priority: "P2", effort: "High" },
  { streamId: 36, launchMonth: 12, priority: "P3", effort: "High" },
  { streamId: 37, launchMonth: 12, priority: "P3", effort: "High" },
];

export type MonthlyExecutionPlan = {
  month: number;
  title: string;
  revenueTarget: number;
  streamsToLaunch: number[];
  salesActions: string[];
  productActions: string[];
  kpis: string[];
};

/** Month-by-month execution checklist — primary operating plan. */
export const TWELVE_MONTH_EXECUTION: MonthlyExecutionPlan[] = [
  {
    month: 1,
    title: "Foundation & first £",
    revenueTarget: 28_000,
    streamsToLaunch: [2, 5, 17, 18, 22],
    salesActions: ["20 carrier + 15 supplier outreach/day", "3 broker WhatsApp groups", "LinkedIn 5 posts/week"],
    productActions: ["Min fee £15 live", "Featured load checkout", "Fast-track verification page"],
    kpis: ["12 loads completed", "18 signups", "5 paid add-ons"],
  },
  {
    month: 2,
    title: "Affiliate engine",
    revenueTarget: 55_000,
    streamsToLaunch: [25, 26],
    salesActions: ["Insurance partner co-marketing", "Fuel card signup in onboarding", "Referral ask after 1st load"],
    productActions: ["Affiliate widgets in dashboard", "Track referral clicks"],
    kpis: ["28 loads", "8 affiliate leads", "£200+ affiliate revenue"],
  },
  {
    month: 3,
    title: "Recurring revenue starts",
    revenueTarget: 120_000,
    streamsToLaunch: [6, 12, 23],
    salesActions: ["Pro plan upsell on 3rd load", "Instant payout pitch to carriers", "2 enterprise discovery calls"],
    productActions: ["Stripe instant payout", "Carrier Pro billing", "Compliance badge"],
    kpis: ["55 loads", "15 Pro subs", "25% instant payout adoption"],
  },
  {
    month: 4,
    title: "Supplier monetisation",
    revenueTarget: 210_000,
    streamsToLaunch: [11, 19, 20, 21],
    salesActions: ["Supplier Pro demos", "Directory premium pitch", "Case study from early user"],
    productActions: ["Supplier Pro tier", "Sponsored profile slots"],
    kpis: ["85 loads", "20 combined Pro subs", "5 directory upgrades"],
  },
  {
    month: 5,
    title: "Education & ops fees",
    revenueTarget: 320_000,
    streamsToLaunch: [7, 27, 28, 30, 38],
    salesActions: ["Academy launch webinar", "Breakdown cover in carrier onboarding", "Document fee at checkout"],
    productActions: ["Academy checkout", "PDF doc generation fee"],
    kpis: ["120 loads", "10 course enrollments", "£400 doc revenue"],
  },
  {
    month: 6,
    title: "Mid-year push",
    revenueTarget: 450_000,
    streamsToLaunch: [3, 4, 10, 14, 31],
    salesActions: ["Q2 review with top 10 users", "Enterprise pipeline CRM", "Partner banner outreach"],
    productActions: ["Urgent/special handling fees", "Freight Tools Pro", "Escrow option"],
    kpis: ["155 loads", "£12.8k revenue", "1 enterprise pilot"],
  },
  {
    month: 7,
    title: "Enterprise & API",
    revenueTarget: 580_000,
    streamsToLaunch: [9, 13, 15, 24, 29],
    salesActions: ["5 enterprise demos/week", "Factoring partner intro", "API early access list"],
    productActions: ["Enterprise plan page", "API keys beta"],
    kpis: ["185 loads", "1 enterprise signed", "£800 MRR enterprise"],
  },
  {
    month: 8,
    title: "B2B managed service",
    revenueTarget: 720_000,
    streamsToLaunch: [33, 8, 39],
    salesActions: ["Managed brokerage proposal to 3PLs", "Banner ad sales", "Wallet early payment pitch"],
    productActions: ["Managed load workflow", "Partner ad slots"],
    kpis: ["215 loads", "1 managed client", "£2k B2B revenue"],
  },
  {
    month: 9,
    title: "Data products",
    revenueTarget: 850_000,
    streamsToLaunch: [40, 41, 42],
    salesActions: ["Market report pre-sales", "Job listing outreach to fleets", "Sponsored blog packages"],
    productActions: ["Intelligence report PDF", "Careers listing checkout"],
    kpis: ["245 loads", "5 report sales", "£900 data revenue"],
  },
  {
    month: 10,
    title: "White-label & retainers",
    revenueTarget: 950_000,
    streamsToLaunch: [34, 16, 32],
    salesActions: ["White-label demo to 2 brokers", "Lane manager retainer pitch", "Training ticket bundle"],
    productActions: ["White-label config", "Retainer billing"],
    kpis: ["265 loads", "1 white-label LOI", "£3k B2B monthly"],
  },
  {
    month: 11,
    title: "Analytics moat",
    revenueTarget: 1_000_000,
    streamsToLaunch: [43, 44, 35],
    salesActions: ["Data export to shippers", "Analytics premium trial", "Integration setup quotes"],
    productActions: ["Lane rate CSV export", "Analytics dashboard Pro"],
    kpis: ["275 loads", "10 analytics subs", "£1.2k data MRR"],
  },
  {
    month: 12,
    title: "Full stack live",
    revenueTarget: 1_145_000,
    streamsToLaunch: [36, 37],
    salesActions: ["Air/sea freight pilot clients", "Year-end upsell campaign", "2027 enterprise pipeline"],
    productActions: ["Air/sea booking flow", "All 44 streams audited"],
    kpis: ["280 loads", "£34.2k revenue", "44/44 streams active"],
  },
];

export const REVENUE_ASSUMPTIONS = [
  "Average load value £650–£900 (UK domestic pallet / partial / single truck).",
  "Platform take ~7% commission (Supplier 4% + Carrier 3%) plus £15 minimum fee where applicable.",
  "Target M12: ~2,800 completed loads/month from ~950 active carriers and ~550 active suppliers.",
  "Instant payout adopted by ~35% of carriers at 2% fee by month 12.",
  "Pro + enterprise MRR: ~£238k/month at M12 across Supplier Pro, Carrier Pro, Enterprise, Tools, API, Analytics.",
  "B2B managed brokerage + white-label + lane retainers contribute ~£207k/month by month 12.",
  "Affiliate revenue scales with onboarding — requires signed partner deals (insurance, fuel, factoring).",
  "Conservative M12: £420k/month (£5M run-rate). Stretch: £1.75M/month with multiple enterprise wins.",
] as const;

export const DAILY_EFFORT_TARGETS = {
  outreach: "20 new contacts/day (carriers, suppliers, brokers)",
  followUp: "10 follow-ups/day on warm pipeline",
  content: "1 LinkedIn post + 1 SEO/blog piece per week",
  product: "2 revenue features shipped per month (avg)",
  support: "Same-day response on all load/payment issues",
  review: "Weekly revenue dashboard review every Monday",
} as const;

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
  { stream: "Transaction commission + min fee", m6: "£280k", m12: "£357k" },
  { stream: "Payment & payout fees", m6: "£55k", m12: "£68k" },
  { stream: "Pro & enterprise subscriptions", m6: "£95k", m12: "£238k" },
  { stream: "Featured loads + directory", m6: "£38k", m12: "£47k" },
  { stream: "Onboarding + verification + docs", m6: "£42k", m12: "£20.5k" },
  { stream: "Affiliate & partner revenue", m6: "£28k", m12: "£87k" },
  { stream: "Academy + content + ads", m6: "£15k", m12: "£25.5k" },
  { stream: "B2B managed + integrations", m6: "£45k", m12: "£207k" },
  { stream: "Total — target (full effort)", m6: "£480k", m12: "£1.15M", highlight: true },
  { stream: "Total — conservative (floor)", m6: "£265k", m12: "£420k" },
];

export const EXECUTIVE_SUMMARY = [
  "Alpha Freight currently depends on transaction commission alone — revenue stays £0 until paid loads are completed.",
  "This plan defines 44 distinct revenue streams — monetisation at every step of the user journey.",
  "Strategy: keep join free; charge for premium speed, visibility, data, and financial services.",
  "With full daily effort, Month-12 target is £1.15M/month — £13.7M annual run-rate across all 44 streams.",
  "Year 1 cumulative target: ~£6.8M collected · conservative floor ~£2.8M · stretch ~£9.5M with enterprise wins.",
  "Critical path: loads + commission first, then instant payout + Pro subs (M3), then B2B managed + white-label (M8+).",
];
