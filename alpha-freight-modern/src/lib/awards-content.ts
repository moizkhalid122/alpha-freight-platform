export const AWARDS_BRAND = {
  primary: "#0a0a0a",
  panel: "#111111",
  secondary: "#3B82F6",
  glow: "rgba(59, 130, 246, 0.45)",
} as const;

export const AWARDS_EVENT = {
  title: "Alpha Freight Awards 2027",
  headline: "Alpha Freight Awards 2027",
  subheadline:
    "Recognising the UK's Most Trusted Carriers, Suppliers & Logistics Partners.",
  city: "London, United Kingdom",
  expectedCompanies: "250+",
  dateIso: "2026-12-17T18:00:00+00:00",
  displayDate: "17 December 2026",
} as const;

export const AWARD_CATEGORIES = [
  {
    id: "carrier",
    title: "Carrier of the Year",
    desc: "Outstanding haulage performance, reliability, and service across the Alpha Freight network.",
    longDesc:
      "Awarded to the carrier that consistently delivers excellence across the Alpha Freight marketplace — from bid acceptance and live tracking to digital POD and on-time completion. Winners demonstrate verified reliability, strong customer feedback, and operational discipline on every lane they serve across the UK.",
  },
  {
    id: "supplier",
    title: "Supplier of the Year",
    desc: "Excellence in load posting, carrier communication, and shipment execution.",
    longDesc:
      "Recognises suppliers who post loads with clarity, communicate professionally with carriers, and maintain high execution standards from collection to delivery. This category celebrates shippers who treat freight partners fairly, respond quickly, and build long-term trust across the Alpha Freight network.",
  },
  {
    id: "warehouse",
    title: "Warehouse Partner",
    desc: "Trusted storage, handling, and fulfilment partnership at scale.",
    longDesc:
      "Honours warehouse and fulfilment partners who provide dependable storage, accurate handling, and seamless handoffs within the supply chain. Winners show measurable performance in inventory accuracy, turnaround times, and collaboration with carriers and suppliers on the platform.",
  },
  {
    id: "innovation",
    title: "Innovation Award",
    desc: "Creative technology, process design, and forward-thinking logistics.",
    longDesc:
      "Celebrates operators who push UK logistics forward through technology, smarter processes, or creative operational design. From route optimisation and digital workflows to new service models, this award highlights businesses that solve real freight problems and raise standards for the entire industry.",
  },
  {
    id: "delivery",
    title: "Fastest Delivery",
    desc: "Consistently beating delivery windows with verified digital POD.",
    longDesc:
      "Presented to the operator with the strongest record of beating agreed delivery windows — backed by verified digital proof of delivery and live tracking data on Alpha Freight. Speed matters, but this award only recognises punctuality that is proven, documented, and trusted by partners.",
  },
  {
    id: "service",
    title: "Customer Excellence",
    desc: "Highest satisfaction from partners, carriers, and shippers.",
    longDesc:
      "Given to the company with the highest verified customer satisfaction across the marketplace — including communication quality, issue resolution, and partner experience on completed loads. This is the award for operators who treat every shipment as a reputation-building opportunity.",
  },
  {
    id: "growth",
    title: "Top Growth Company",
    desc: "Strongest year-on-year growth in marketplace activity and reach.",
    longDesc:
      "Recognises the logistics business with the strongest year-on-year growth in verified marketplace activity — loads, bids, completions, and network reach. Winners combine ambition with consistency, scaling operations while maintaining the trust and performance standards Alpha Freight demands.",
  },
  {
    id: "green",
    title: "Green Logistics",
    desc: "Measurable progress in sustainable freight and fleet efficiency.",
    longDesc:
      "Awarded for measurable progress in sustainable freight — including fleet efficiency, reduced empty miles, lower emissions initiatives, and responsible operational practices. This category celebrates operators who prove that environmental responsibility and commercial performance can move forward together.",
  },
  {
    id: "company",
    title: "Company of the Year",
    desc: "The ultimate recognition for UK logistics excellence.",
    longDesc:
      "The highest honour of the evening — presented to the UK logistics company that excels across trust, performance, service, and marketplace impact. Company of the Year winners represent the standard every operator aspires to: verified, transparent, and impossible to ignore.",
  },
] as const;

export const SELECTION_CRITERIA = [
  {
    id: "reviews",
    label: "Customer Reviews",
    value: 40,
    explanation: "Verified ratings and feedback from carriers, suppliers, and partners on completed loads.",
  },
  {
    id: "ontime",
    label: "On-Time Performance",
    value: 25,
    explanation: "Delivery punctuality measured against agreed windows with POD confirmation.",
  },
  {
    id: "response",
    label: "Response Time",
    value: 15,
    explanation: "Speed and consistency when bidding, messaging, and resolving shipment queries.",
  },
  {
    id: "verification",
    label: "Verification",
    value: 10,
    explanation: "Profile completeness, compliance documents, and platform trust verification status.",
  },
  {
    id: "activity",
    label: "Platform Activity",
    value: 10,
    explanation: "Marketplace engagement including loads, bids, tracking, and successful completions.",
  },
] as const;

export const REWARD_TIERS = [
  {
    tier: "Bronze",
    tierKey: "bronze" as const,
    highlighted: false,
    desc: "Official recognition for verified finalists and category achievers.",
    tagline: "Based on platform performance",
    perks: ["Certificate", "Badge", "Recognition"],
  },
  {
    tier: "Gold",
    tierKey: "gold" as const,
    highlighted: true,
    desc: "The premier winner package — maximum visibility, press, and the Trust Seal.",
    tagline: "Category champion package",
    perks: [
      "Crystal Trophy",
      "Official Certificate",
      "Gold Winner Badge",
      "Homepage Featured",
      "Professional Interview",
      "Social Promotion",
      "Press Release",
      "Speaking Opportunity",
      "Alpha Freight Trust Seal",
    ],
  },
  {
    tier: "Silver",
    tierKey: "silver" as const,
    highlighted: false,
    desc: "Strong visibility and promotion for runners-up and high performers.",
    tagline: "Featured across the network",
    perks: ["Certificate", "Badge", "Featured Listing", "Promotion"],
  },
] as const;

export const ABOUT_PROCESS = [
  {
    step: "01",
    title: "Mission",
    desc: "Every year Alpha Freight recognises the UK's best logistics companies based on trust, service quality, performance and customer satisfaction — not politics or manual voting.",
    tags: ["Trust", "Service quality", "Performance", "Customer satisfaction"],
    image: "/header.jpg",
  },
  {
    step: "02",
    title: "Selection",
    desc: "Winners are chosen through transparent platform data — verified reviews, on-time delivery, response time, compliance, and marketplace activity across the Alpha Freight network.",
    tags: ["Verified data", "On-time POD", "Platform scoring", "No voting"],
    image: "/joseph-paul-jOi8CLM2aaI-unsplash (1).jpg",
  },
  {
    step: "03",
    title: "Celebration",
    desc: "Category champions are honoured live in London with crystal trophies, press coverage, homepage features, and the official Alpha Freight Trust Seal.",
    tags: ["London ceremony", "Crystal trophy", "Trust seal", "Press release"],
    image: "/shay-5n2EemBYQm4-unsplash.jpg",
  },
] as const;

export const ABOUT_TIMELINE = [
  {
    year: "Mission",
    title: "Recognise UK logistics excellence",
    desc: "Every year Alpha Freight recognises the UK's best logistics companies based on trust, service quality, performance and customer satisfaction.",
  },
  {
    year: "2024",
    title: "Platform launch",
    desc: "Alpha Freight marketplace goes live across the UK with verified carriers and suppliers.",
  },
  {
    year: "2025",
    title: "Verified network",
    desc: "Carrier vetting, digital POD, and live tracking scale nationally.",
  },
  {
    year: "2026",
    title: "Awards announced",
    desc: "Alpha Freight Awards 2027 unveiled — transparent, data-driven recognition.",
  },
  {
    year: "2027",
    title: "Ceremony night",
    desc: "Winners honoured at London's most prestigious logistics awards evening.",
  },
] as const;

export const EVENT_EXPERIENCE = [
  {
    time: "08:30",
    title: "Networking",
    desc: "Connect with 250+ carriers, suppliers, and industry leaders in curated sessions.",
    image: "/Networkingk.jpg",
    bg: "#FDE8E8",
  },
  {
    time: "11:00",
    title: "Business Meetings",
    desc: "Pre-scheduled introductions with partners aligned to your lanes and capacity.",
    image: "/Business Meetings.jpg",
    bg: "#ECEBFF",
  },
  {
    time: "14:00",
    title: "Industry Speakers",
    desc: "Keynotes from UK freight leaders on technology, capacity, and sustainability.",
    image: "/joseph-paul-jOi8CLM2aaI-unsplash (1).jpg",
    bg: "#FFF4E1",
  },
  {
    time: "16:00",
    title: "Awards Ceremony",
    desc: "Live category announcements on stage with crystal trophies and press coverage.",
    image: "/Awards Ceremony.jpg",
    bg: "#E1F5FE",
  },
  {
    time: "19:00",
    title: "Dinner",
    desc: "Premium seated dining with table placements for sponsors and finalists.",
    image: "/Y- Dinner.jpg",
    bg: "#F3E5F5",
  },
  {
    time: "21:00",
    title: "Entertainment",
    desc: "Evening celebration with live entertainment and partner hospitality.",
    image: "/Entertainment.jpg",
    bg: "#E8F5E9",
  },
] as const;

export const FUTURE_SPONSORS = [
  "Volvo",
  "Scania",
  "DAF",
  "Mercedes-Benz Trucks",
  "Michelin",
  "Shell",
  "BP",
] as const;

export const AWARDS_TESTIMONIALS = [
  {
    quote:
      "Alpha Freight has transformed how we find reliable capacity. An awards programme built on real performance data is exactly what this industry needed.",
    author: "James Whitfield",
    role: "CEO",
    company: "Northern Haulage Group",
    initials: "JW",
    rating: 5,
  },
  {
    quote:
      "Recognition should mean something. Transparent scoring, verified partners, and a ceremony that celebrates operators who deliver — not politics.",
    author: "Sarah Okonkwo",
    role: "CEO",
    company: "Midlands Freight Co.",
    initials: "SO",
    rating: 5,
  },
  {
    quote:
      "We're proud to support an awards night that puts trust, on-time delivery, and customer service at the centre of UK logistics.",
    author: "David Chen",
    role: "CEO",
    company: "Atlas Supply Chain",
    initials: "DC",
    rating: 5,
  },
] as const;

export const HALL_OF_FAME_TABS = ["Carrier", "Supplier", "Innovation", "Company"] as const;

export const HALL_OF_FAME_BY_TAB: Record<
  (typeof HALL_OF_FAME_TABS)[number],
  { name: string; company: string; category: string }[]
> = {
  Carrier: [
    { name: "Finalist #1", company: "Northern Haulage Group", category: "Carrier of the Year" },
    { name: "Finalist #2", company: "Express Lane Logistics", category: "Fastest Delivery" },
    { name: "Finalist #3", company: "Midlands Freight Co.", category: "Customer Excellence" },
    { name: "Finalist #4", company: "Atlas Transport UK", category: "Green Logistics" },
  ],
  Supplier: [
    { name: "Finalist #1", company: "Atlas Supply Chain", category: "Supplier of the Year" },
    { name: "Finalist #2", company: "Premier Loads Ltd", category: "Top Growth Company" },
    { name: "Finalist #3", company: "Core Industrial Supply", category: "Customer Excellence" },
    { name: "Finalist #4", company: "Nationwide Shippers", category: "Innovation Award" },
  ],
  Innovation: [
    { name: "Finalist #1", company: "SmartRoute Technologies", category: "Innovation Award" },
    { name: "Finalist #2", company: "Digital POD Solutions", category: "Innovation Award" },
    { name: "Finalist #3", company: "Fleet AI Systems", category: "Innovation Award" },
    { name: "Finalist #4", company: "Logistics Lab UK", category: "Innovation Award" },
  ],
  Company: [
    { name: "Finalist #1", company: "Alpha Partner Network", category: "Company of the Year" },
    { name: "Finalist #2", company: "United Freight Group", category: "Company of the Year" },
    { name: "Finalist #3", company: "Sterling Logistics", category: "Company of the Year" },
    { name: "Finalist #4", company: "Prime Haulage UK", category: "Company of the Year" },
  ],
};

export const TRUST_SEALS = [
  {
    title: "Trusted Carrier",
    subtitle: "Verified haulage excellence",
    desc: "Display on websites, email signatures, and bid proposals.",
  },
  {
    title: "Trusted Supplier",
    subtitle: "Verified shipper excellence",
    desc: "Recognises outstanding load posting and partner communication.",
  },
  {
    title: "Excellence Winner",
    subtitle: "2027 category champion",
    desc: "Official seal for homepage, LinkedIn, and business cards.",
  },
] as const;

export const SPONSOR_TIERS = [
  { tier: "Headline Partner", names: ["Volvo", "Scania"] },
  { tier: "Gold Partner", names: ["DAF", "Mercedes-Benz Trucks"] },
  { tier: "Supporting Partner", names: ["Michelin", "Shell", "BP"] },
] as const;

export const HERO_STATS = [
  { label: "Companies", value: "250+" },
  { label: "Categories", value: "9" },
  { label: "Verified reviews", value: "12k+" },
] as const;

export const NOMINATION_CATEGORIES = [
  "Carrier of the Year",
  "Supplier of the Year",
  "Warehouse Partner",
  "Innovation Award",
  "Fastest Delivery",
  "Customer Excellence",
  "Top Growth Company",
  "Green Logistics",
  "Company of the Year",
  "Sponsorship enquiry",
] as const;

export const HALL_OF_FAME_WINNERS = [
  { category: "Carrier of the Year", name: "To be announced", year: "2027" },
  { category: "Supplier of the Year", name: "To be announced", year: "2027" },
  { category: "Innovation Award", name: "To be announced", year: "2027" },
  { category: "Company of the Year", name: "To be announced", year: "2027" },
] as const;

export const AWARDS_FAQ = [
  {
    q: "How are winners selected?",
    a: "Winners are chosen using transparent platform data — customer reviews (40%), on-time performance (25%), response time (15%), verification (10%), and platform activity (10%). There is no manual voting.",
  },
  {
    q: "Can anyone participate?",
    a: "Any verified Alpha Freight carrier, supplier, warehouse partner, or logistics business operating in the UK can qualify based on performance during the awards period.",
  },
  {
    q: "Is there an entry fee?",
    a: "No. Participation is based on verified platform performance. Register interest to stay updated on eligibility and event details.",
  },
  {
    q: "Can international companies join?",
    a: "The 2027 ceremony focuses on UK-based logistics businesses. International partners serving UK freight lanes may register interest for future regional awards.",
  },
  {
    q: "How do I become a sponsor?",
    a: "Use the register form and select Sponsor, or contact our partnerships team. Sponsors receive brand visibility on the logo wall, gift packages, and speaking opportunities.",
  },
] as const;

export const COMPANY_TYPES = ["Carrier", "Supplier", "Warehouse", "Sponsor"] as const;

export type CompanyType = (typeof COMPANY_TYPES)[number];
