export const knowledgeBaseCategories = [
  "All",
  "Getting Started",
  "Carriers",
  "Suppliers",
  "Payments",
  "Compliance",
  "Platform",
] as const;

export type KnowledgeBaseCategory = (typeof knowledgeBaseCategories)[number];

export type KnowledgeBaseArticle = {
  id: string;
  title: string;
  category: Exclude<KnowledgeBaseCategory, "All">;
  excerpt: string;
  readTime: string;
  popular?: boolean;
  content: string[];
  related: { label: string; href: string }[];
};

export const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "what-is-alpha-freight",
    title: "What is Alpha Freight?",
    category: "Getting Started",
    excerpt: "Overview of the Alpha Freight marketplace, mission, and how suppliers and carriers connect.",
    readTime: "4 min",
    popular: true,
    content: [
      "Alpha Freight is a modern logistics platform that connects UK suppliers with verified carriers through AI-powered load matching, real-time tracking, and digital proof of delivery.",
      "The platform is built for transparency: suppliers post freight, review carrier bids, and monitor shipments from one dashboard. Carriers find lane-fit loads, manage fleet activity, and receive faster settlement through the carrier wallet.",
      "Alpha Freight Solutions Limited (Company No. 16860760) operates from 124 City Road, London EC1V 2NX. Support is available Mon–Fri, 8:00 AM – 6:00 PM via support@alphafreightuk.com or +44 7782 294718.",
    ],
    related: [
      { label: "Platform overview docs", href: "/docs?tab=overview" },
      { label: "Company overview", href: "/company-overview" },
    ],
  },
  {
    id: "how-it-works",
    title: "How Alpha Freight works",
    category: "Getting Started",
    excerpt: "From load posting and AI matching to GPS tracking and 7-day carrier payouts.",
    readTime: "5 min",
    popular: true,
    content: [
      "1. Smart intake — Suppliers define route, cargo, timing, equipment, and budget. The platform analyses requirements against live carrier capacity.",
      "2. AI load matching — Verified carriers are ranked by route fit, equipment, reliability, and timing. Matching typically completes in under 60 seconds.",
      "3. Real-time visibility — GPS telemetry and status updates keep suppliers informed from pickup through delivery.",
      "4. Digital POD — Carriers upload proof of delivery via web or mobile app. Verification triggers settlement workflows automatically.",
      "5. Fast payouts — Carriers receive funds within the 7-day payout window after successful POD verification.",
    ],
    related: [
      { label: "Smart Matching product", href: "/products/smart-matching" },
      { label: "7-Day Payouts", href: "/7-day-payouts" },
    ],
  },
  {
    id: "carrier-vetting",
    title: "How carrier vetting works",
    category: "Carriers",
    excerpt: "The 5-step verification process that keeps the Alpha network trusted and compliant.",
    readTime: "6 min",
    popular: true,
    content: [
      "Every carrier on Alpha Freight passes a structured vetting flow before accessing premium loads:",
      "Step 1 — Identity and business registration review.",
      "Step 2 — Insurance verification including GIT and public liability where applicable.",
      "Step 3 — Safety and compliance checks against operating standards.",
      "Step 4 — Document and equipment review for fleet suitability.",
      "Step 5 — Performance and reliability assessment based on platform history and references.",
      "Suppliers can trust that matched carriers meet minimum insurance, compliance, and operational standards before assignment.",
    ],
    related: [
      { label: "Carrier vetting docs", href: "/docs?tab=vetting" },
      { label: "Carrier directory", href: "/directory" },
    ],
  },
  {
    id: "finding-loads",
    title: "Finding and booking loads",
    category: "Carriers",
    excerpt: "Use Available Loads, Smart Loads, and bidding workflows to fill your fleet profitably.",
    readTime: "5 min",
    content: [
      "Available Loads lists active marketplace opportunities filtered by route, timing, equipment, and earning potential.",
      "Smart Loads surfaces AI-recommended opportunities aligned with your fleet profile, operating regions, and historical performance — reducing deadhead and blind bidding.",
      "When you find a suitable load, submit a bid or accept at the posted rate depending on load type. Once assigned, the job appears in your carrier dashboard with pickup details, documents, and route guidance.",
      "Use the mobile app for in-transit updates, GPS sync, and instant POD upload at delivery.",
    ],
    related: [
      { label: "Finding loads guide", href: "/docs?tab=finding-loads" },
      { label: "Smart bidding", href: "/docs?tab=bidding" },
    ],
  },
  {
    id: "carrier-wallet",
    title: "Carrier wallet and earnings",
    category: "Carriers",
    excerpt: "Track balances, payout activity, and transaction history tied to completed loads.",
    readTime: "4 min",
    content: [
      "The Wallet section shows your available balance, pending settlements, and withdrawal history.",
      "The Earnings page summarises total revenue, active revenue, average revenue per load, completed shipment count, and trends over time.",
      "After POD verification, funds move into your wallet on the platform payout schedule. You can withdraw to your registered bank account with full audit visibility.",
      "Instant payout options may be available for eligible carriers where configured in your account settings.",
    ],
    related: [
      { label: "7-Day Payouts", href: "/7-day-payouts" },
      { label: "Digital POD", href: "/docs?tab=pod-upload" },
    ],
  },
  {
    id: "post-a-load",
    title: "How to post a load",
    category: "Suppliers",
    excerpt: "Create freight postings with route, cargo, budget, payment method, and special requirements.",
    readTime: "5 min",
    popular: true,
    content: [
      "From the Supplier Portal, open Post a Load and enter pickup and delivery locations, dates, cargo weight and volume, equipment type, and any special handling (refrigerated, ADR, tail lift, white glove).",
      "Set a minimum and maximum budget range. A realistic range improves match quality — too narrow may reduce carrier interest; too wide may attract poor-fit bids.",
      "Choose Pay Instant or Pay Later depending on your payment workflow. Pay Instant processes immediately; Pay Later queues eligible payments until you move them into checkout.",
      "Once published, carriers bid on your load. Review offers, accept the best fit, and the load moves to booked status with your chosen carrier automatically assigned.",
    ],
    related: [
      { label: "Posting freight docs", href: "/docs?tab=posting-loads" },
      { label: "Supplier portal", href: "/products/supplier-portal" },
    ],
  },
  {
    id: "supplier-bids",
    title: "Reviewing and accepting bids",
    category: "Suppliers",
    excerpt: "Compare carrier offers, accept the best match, and move loads into booked status.",
    readTime: "3 min",
    content: [
      "When carriers bid on your posted load, each offer includes rate, timing commitment, carrier profile, and vetting status.",
      "Compare bids side by side in My Bids. Consider price alongside carrier rating, equipment fit, and lane experience.",
      "Accepting a bid automatically assigns the carrier and updates load status to booked. Both parties receive notifications and can coordinate through the platform messaging tools.",
      "If no suitable bid arrives, you can adjust budget, timing, or requirements and republish the load.",
    ],
    related: [
      { label: "Real-time tracking", href: "/docs?tab=tracking" },
      { label: "Performance analytics", href: "/docs?tab=analytics" },
    ],
  },
  {
    id: "pay-instant-vs-later",
    title: "Pay Instant vs Pay Later",
    category: "Payments",
    excerpt: "Understand supplier payment options when posting and settling freight.",
    readTime: "3 min",
    content: [
      "Pay Instant is designed for immediate payment processing when you need a load confirmed and settled without delay.",
      "Pay Later keeps eligible shipment payments in a queue until you choose to move them into instant checkout — useful for accounts-payable workflows and batch approval.",
      "Both methods integrate with the supplier dashboard payment centre. Transaction history and invoice records are available for reconciliation.",
      "For carrier-side settlement after delivery, see the 7-day payout guide — supplier payment method does not delay verified carrier disbursement once POD is confirmed.",
    ],
    related: [
      { label: "7-Day Payouts", href: "/7-day-payouts" },
      { label: "Supplier pay instant", href: "/supplier/pay-instant" },
    ],
  },
  {
    id: "seven-day-payouts",
    title: "7-day payout guarantee explained",
    category: "Payments",
    excerpt: "When carriers get paid, how POD verification triggers settlement, and what affects timing.",
    readTime: "4 min",
    popular: true,
    content: [
      "Alpha Freight's 7-day payout guarantee means carriers receive funds within seven days of successful delivery confirmation and digital POD verification.",
      "Workflow: delivery completed → POD uploaded → platform verification → wallet credit → bank withdrawal.",
      "This replaces traditional 30–90 day broker cycles and reduces reliance on factoring for many carriers.",
      "Disputes or incomplete POD documentation may pause settlement until resolved. Contact support with your load reference if a payout appears delayed.",
    ],
    related: [
      { label: "7-Day Payouts page", href: "/7-day-payouts" },
      { label: "Payout docs", href: "/docs?tab=payouts" },
    ],
  },
  {
    id: "load-pricing",
    title: "How load pricing works",
    category: "Suppliers",
    excerpt: "Distance, timing, cargo, equipment, and special handling all influence the final rate.",
    readTime: "5 min",
    content: [
      "Pricing is primarily driven by route distance, pickup and delivery timing, cargo weight and volume, equipment type, and special handling requirements.",
      "Urgent loads, refrigerated equipment, ADR/hazardous cargo, tail lift access, and white glove handling each increase operational complexity and typically raise the rate.",
      "When setting budget ranges, your minimum should reflect the lowest realistic service level for the lane. Your maximum gives room for better carrier quality or time-critical movement.",
      "The platform helps suppliers review pricing inputs before publishing so expectations align with marketplace conditions.",
    ],
    related: [
      { label: "Smart Matching", href: "/products/smart-matching" },
      { label: "Contact sales", href: "/contact" },
    ],
  },
  {
    id: "support-response-times",
    title: "Support channels and response times",
    category: "Platform",
    excerpt: "Live chat, email, and phone support — plus when cases are escalated.",
    readTime: "3 min",
    content: [
      "Live chat is the fastest channel for active shipment questions — typical response under 2 minutes during business hours.",
      "Email support@alphafreightuk.com is best for non-urgent account, billing, or operational queries, usually handled within 2 hours.",
      "Phone +44 7782 294718 is available Mon–Fri, 8:00 AM – 6:00 PM for issues needing direct coordination.",
      "Escalation applies when a case affects live shipment execution, missed pickup/delivery risk, tracking failure, payment delay, or unresolved complaints requiring manager review.",
    ],
    related: [
      { label: "Help center", href: "/support" },
      { label: "System status", href: "/system-status" },
    ],
  },
  {
    id: "privacy-data",
    title: "Privacy and data protection",
    category: "Compliance",
    excerpt: "How Alpha Freight handles personal data, cookies, and platform security.",
    readTime: "4 min",
    content: [
      "Alpha Freight processes account, shipment, and communication data to operate the marketplace, verify carriers, and deliver support.",
      "Personal data is handled in line with UK GDPR requirements. You can review full details in our Privacy Policy including retention, lawful basis, and your rights.",
      "Cookie usage, analytics, and third-party integrations are documented in our cookie policy materials.",
      "For data subject requests or security concerns, contact support@alphafreightuk.com with your account email and a description of the request.",
    ],
    related: [
      { label: "Cookie policy", href: "/cookie-policy" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Company overview", href: "/company-overview" },
    ],
  },
  {
    id: "digital-pod",
    title: "Digital proof of delivery",
    category: "Platform",
    excerpt: "Upload, verify, and sync POD documents across web and mobile.",
    readTime: "3 min",
    content: [
      "Carriers upload proof of delivery through the carrier dashboard or mobile app immediately after successful delivery.",
      "Accepted formats typically include photo or PDF capture with timestamp and load reference metadata.",
      "Once verified, POD triggers status updates for the supplier and initiates the payout workflow for the carrier.",
      "Incomplete or disputed POD may delay settlement until the compliance team resolves the case — usually within 24 business hours.",
    ],
    related: [
      { label: "POD upload docs", href: "/docs?tab=pod-upload" },
      { label: "Mobile app", href: "/products/mobile-app" },
    ],
  },
  {
    id: "ai-matching-faq",
    title: "How fast is AI load matching?",
    category: "Getting Started",
    excerpt: "Matching speed, data points used, and what improves assignment quality.",
    readTime: "2 min",
    content: [
      "Alpha Freight's matching engine analyses route fit, equipment compatibility, carrier reliability, timing windows, and historical performance to rank carriers for each load.",
      "Typical match recommendations are generated in under 60 seconds after a load is published.",
      "Suppliers see ranked carrier options; carriers see Smart Loads tailored to their fleet profile.",
      "Better outcomes come from accurate load details, realistic budgets, and complete carrier profile data including operating regions and vehicle types.",
    ],
    related: [
      { label: "Smart Matching", href: "/products/smart-matching" },
      { label: "Network", href: "/network" },
    ],
  },
];

export function getKnowledgeBaseArticle(id: string) {
  return knowledgeBaseArticles.find((article) => article.id === id);
}

export function getRelatedKnowledgeBaseArticles(id: string, limit = 3) {
  const current = getKnowledgeBaseArticle(id);
  if (!current) return knowledgeBaseArticles.slice(0, limit);

  return knowledgeBaseArticles
    .filter((article) => article.id !== id)
    .sort((a, b) => {
      if (a.category === current.category && b.category !== current.category) return -1;
      if (b.category === current.category && a.category !== current.category) return 1;
      return 0;
    })
    .slice(0, limit);
}
