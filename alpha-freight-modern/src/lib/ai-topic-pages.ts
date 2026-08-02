export type AiTopicPage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  initialPrompt: string;
  keywords: string[];
  relatedTool?: { label: string; href: string };
};

export const AI_TOPIC_PAGES: AiTopicPage[] = [
  {
    slug: "rpm-calculator",
    title: "RPM Calculator UK Haulage | What is RPM? | Alpha Freight AI",
    h1: "What is RPM in UK haulage?",
    description:
      "Free UK haulage RPM guide and AI calculator. Learn revenue per mile, compare loads, and ask Alpha Freight AI anything about RPM.",
    intro:
      "RPM (Revenue Per Mile) is how UK carriers compare loads fairly. Divide total payment by loaded miles — e.g. £800 ÷ 320 mi = £2.50/mi. Ask our AI to calculate RPM, profit, and whether a rate is worth taking.",
    initialPrompt: "What is RPM in UK haulage and how do I calculate it?",
    keywords: ["RPM calculator UK", "revenue per mile haulage", "RPM trucking UK"],
    relatedTool: { label: "Carrier margin tool", href: "/tools/carrier-margin" },
  },
  {
    slug: "diesel-price-uk",
    title: "UK Diesel Price Today for Haulage | Alpha Freight AI",
    h1: "UK diesel price for haulage",
    description:
      "Check UK diesel prices for HGV and haulage. Alpha Freight AI explains fuel costs, RPM impact, and live diesel guidance for carriers.",
    intro:
      "Fuel is the biggest variable cost for UK hauliers. Use Alpha Freight AI to understand today's diesel impact on your lanes, plus links to live UK fuel data and surcharge tools.",
    initialPrompt: "What is the UK diesel price today for haulage?",
    keywords: ["UK diesel price today", "HGV fuel price UK", "diesel haulage UK"],
    relatedTool: { label: "Fuel surcharge calculator", href: "/tools/fuel-surcharge" },
  },
  {
    slug: "find-loads",
    title: "How to Find Loads in the UK | Free Load Board AI | Alpha Freight",
    h1: "How to find loads in the UK",
    description:
      "Learn how UK carriers find freight loads, bid, and get paid in 7 days. Free AI guide + live load board from Alpha Freight.",
    intro:
      "Finding loads in the UK starts with a verified load board. Browse lanes, filter by equipment, submit bids, and deliver with digital POD. Ask AI for step-by-step help or sign up free for live loads.",
    initialPrompt: "How do I find loads in the UK as a carrier?",
    keywords: ["find loads UK", "haulage jobs UK", "load board UK free"],
    relatedTool: { label: "Live loads tool", href: "/tools/live-loads" },
  },
  {
    slug: "post-load",
    title: "How to Post Loads Online UK | Supplier Guide | Alpha Freight AI",
    h1: "How to post loads as a UK supplier",
    description:
      "Post freight loads online in the UK free. Alpha Freight AI explains posting, carrier bids, tracking, and payouts for shippers.",
    initialPrompt: "How do I post a load on Alpha Freight as a supplier?",
    intro:
      "Suppliers post loads free on Alpha Freight, receive verified carrier bids, track deliveries live, and pay securely. Our AI walks you through posting, pricing, and POD settlement.",
    keywords: ["post loads UK", "post freight online", "shipper load board UK"],
    relatedTool: { label: "Freight quote tool", href: "/tools/freight-quote" },
  },
  {
    slug: "pod-guide",
    title: "Digital POD Guide UK | Proof of Delivery | Alpha Freight AI",
    h1: "Digital POD & proof of delivery",
    description:
      "UK haulage digital POD guide — upload, verify, and get paid faster. Ask Alpha Freight AI about proof of delivery workflows.",
    intro:
      "Digital POD speeds up carrier payouts. Upload proof of delivery via app or web, suppliers verify, and funds move to your wallet within 7 days. Ask AI about POD requirements and common mistakes.",
    initialPrompt: "How does digital POD work on Alpha Freight?",
    keywords: ["digital POD UK", "proof of delivery haulage", "POD upload freight"],
    relatedTool: { label: "Track shipment", href: "/track" },
  },
  {
    slug: "carrier-payouts",
    title: "Carrier Payouts UK | 7-Day Pay | Alpha Freight AI",
    h1: "How carrier payouts work",
    description:
      "Alpha Freight carrier payouts in 7 days after digital POD. Free AI explains wallet, withdrawals, and UK haulage payment flow.",
    intro:
      "After verified POD, earnings appear in your Alpha Freight wallet. Standard payout window is 7 days. Ask AI about payout timing, wallet setup, and what to do if payment is delayed.",
    initialPrompt: "How do carrier payouts work on Alpha Freight?",
    keywords: ["carrier payout UK", "7 day pay haulage", "freight wallet UK"],
  },
  {
    slug: "backhaul-loads",
    title: "Backhaul Loads UK | Reduce Empty Miles | Alpha Freight AI",
    h1: "Finding backhaul loads in the UK",
    description:
      "Reduce deadhead with UK backhaul loads. Alpha Freight AI explains backhaul strategy and links to backhaul tools.",
    intro:
      "Backhaul loads fill empty return miles and protect RPM. Ask AI how to find backhaul near your delivery point, or use our backhaul tool for lane ideas.",
    initialPrompt: "How do I find backhaul loads in the UK?",
    keywords: ["backhaul loads UK", "empty miles haulage", "return loads UK"],
    relatedTool: { label: "Backhaul tool", href: "/tools/backhaul" },
  },
  {
    slug: "profit-calculator",
    title: "Haulage Profit Calculator UK | Alpha Freight AI",
    h1: "Calculate haulage profit & RPM",
    description:
      "Free UK haulage profit calculator help. Ask Alpha Freight AI: is £800 for 320 miles good? Includes fuel and margin guidance.",
    intro:
      "Before you accept a load, know your real profit after fuel and deadhead. Tell the AI your rate and miles — e.g. £800 for 320 miles — for instant RPM and profit guidance.",
    initialPrompt: "Calculate profit for £800 load over 320 miles",
    keywords: ["haulage profit calculator", "load profit UK", "RPM profit trucking"],
    relatedTool: { label: "Rate check", href: "/tools/rate-check" },
  },
  {
    slug: "book-first-load",
    title: "Book Your First Load UK | Carrier Guide | Alpha Freight AI",
    h1: "How to book your first load",
    description:
      "Step-by-step guide for UK carriers booking their first haulage load on Alpha Freight. Free AI assistant included.",
    intro:
      "New carriers: sign up free, browse available loads, submit a bid, deliver, upload POD, and get paid. Ask AI for help at any step — in English or Urdu.",
    initialPrompt: "How do I book my first load as a UK carrier?",
    keywords: ["book first load UK", "new carrier haulage", "how to bid loads UK"],
    relatedTool: { label: "Find loads", href: "/find-loads" },
  },
  {
    slug: "hgv-compliance",
    title: "HGV Compliance UK | Carrier Vetting | Alpha Freight AI",
    h1: "HGV compliance & carrier vetting",
    description:
      "UK HGV compliance, insurance, and Alpha Freight carrier vetting explained by free freight AI.",
    intro:
      "Verified carriers pass identity, insurance, safety, and equipment checks on Alpha Freight. Ask AI about vetting steps, documents needed, and why compliance protects shippers and drivers.",
    initialPrompt: "What is carrier vetting on Alpha Freight and what documents do I need?",
    keywords: ["HGV compliance UK", "carrier vetting haulage", "freight insurance UK"],
  },
];

export function getTopicBySlug(slug: string): AiTopicPage | undefined {
  return AI_TOPIC_PAGES.find((p) => p.slug === slug);
}

export function getAllTopicSlugs(): string[] {
  return AI_TOPIC_PAGES.map((p) => p.slug);
}
