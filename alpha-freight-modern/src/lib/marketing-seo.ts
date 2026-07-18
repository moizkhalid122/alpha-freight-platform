import { createPageMetadata } from "@/lib/seo";

export const marketingSeo = {
  about: createPageMetadata({
    title: "About Alpha Freight | UK Freight Brokerage Platform",
    description:
      "Learn about Alpha Freight Solutions — the UK marketplace connecting verified carriers and suppliers with AI load matching, live tracking, and 7-day payouts.",
    path: "/about",
    keywords: ["about Alpha Freight", "UK freight brokerage", "logistics platform UK"],
  }),
  blog: createPageMetadata({
    title: "Freight & Logistics Blog | Alpha Freight UK",
    description:
      "Insights on UK freight brokerage, carrier networks, digital POD, load matching, sustainability, and marketplace operations from the Alpha Freight team.",
    path: "/blog",
    keywords: ["freight blog UK", "logistics insights", "carrier marketplace news"],
  }),
  solution: createPageMetadata({
    title: "Freight Solutions for Suppliers & Carriers | Alpha Freight",
    description:
      "End-to-end UK freight solutions: post loads, match verified carriers, track shipments live, and settle with digital POD and fast payouts.",
    path: "/solution",
  }),
  services: createPageMetadata({
    title: "Freight Services UK | Haulage, Distribution & Logistics | Alpha Freight",
    description:
      "Explore Alpha Freight services including full truckload, express distribution, refrigerated haulage, and managed freight across the UK network.",
    path: "/services",
  }),
  career: createPageMetadata({
    title: "Careers at Alpha Freight | Join Our Logistics Team",
    description:
      "Open roles in design, engineering, operations, product, and growth at Alpha Freight — building the UK's modern freight marketplace.",
    path: "/career",
  }),
  academy: createPageMetadata({
    title: "Alpha Freight Academy | CPC & Compliance Training UK",
    description:
      "Professional driver and compliance training from Alpha Freight Academy — CPC courses, safety certification, and load securing for UK operators.",
    path: "/academy",
  }),
  knowledgeBase: createPageMetadata({
    title: "Knowledge Base | Alpha Freight Help Centre",
    description:
      "Guides and FAQs for carriers and suppliers — load posting, vetting, payouts, digital POD, tracking, pricing, privacy, and platform setup.",
    path: "/knowledge-base",
  }),
  directory: createPageMetadata({
    title: "Verified Carrier Directory UK | Alpha Freight",
    description:
      "Browse verified UK freight carriers on Alpha Freight. Filter by location, vehicle type, and service area to find capacity you can trust.",
    path: "/directory",
  }),
  suppliers: createPageMetadata({
    title: "Verified Supplier Directory | Alpha Freight UK",
    description:
      "Discover verified suppliers posting freight on Alpha Freight. Connect with shippers and industrial partners across the UK marketplace.",
    path: "/suppliers",
  }),
  availableLoads: createPageMetadata({
    title: "Find Loads UK | Free Freight Load Board for Carriers | Alpha Freight",
    description:
      "Find loads in the UK on Alpha Freight. Browse live haulage jobs, freight lanes, and load board opportunities. Free carrier signup — bid, deliver, and get paid in 7 days.",
    path: "/available-loads",
    keywords: [
      "find loads UK",
      "find freight loads",
      "load board UK",
      "haulage jobs UK",
      "freight loads near me",
      "carrier load board",
    ],
  }),
  findLoads: createPageMetadata({
    title: "Find Loads Online UK | Haulage & Freight Jobs | Alpha Freight",
    description:
      "Find loads online in the UK with Alpha Freight. Search live freight, compare lanes, and join verified carriers earning with 7-day payouts. Free to browse and bid.",
    path: "/find-loads",
    keywords: [
      "find loads",
      "find load UK",
      "find freight loads online",
      "haulage loads UK",
      "truck loads UK",
    ],
  }),
  postLoads: createPageMetadata({
    title: "Post Loads Online UK | Free Freight Posting for Shippers | Alpha Freight",
    description:
      "Post loads online in the UK with Alpha Freight. Publish freight free, receive carrier bids from verified hauliers, track shipments live, and pay securely.",
    path: "/post-loads",
    keywords: [
      "post loads",
      "post load UK",
      "post freight online",
      "post haulage loads",
      "ship freight UK",
      "load posting platform",
    ],
  }),
  support: createPageMetadata({
    title: "Support & Help | Alpha Freight",
    description:
      "Get help with Alpha Freight — live chat, email, phone support, knowledge base articles, and system status for UK freight operations.",
    path: "/support",
  }),
  feedback: createPageMetadata({
    title: "Send Feedback | Alpha Freight",
    description:
      "Share product feedback with Alpha Freight — report bugs, request features, or tell us what to improve for carriers and suppliers in the UK.",
    path: "/feedback",
    keywords: ["Alpha Freight feedback", "product feedback", "report a bug", "feature request"],
  }),
  toolsHub: createPageMetadata({
    title: "Free Freight Tools UK | Alpha Freight",
    description:
      "Free UK freight tools from Alpha Freight — lane rates, quotes, live loads, distance, margin, fuel surcharge, delivery ETA, and more.",
    path: "/tools",
    keywords: ["freight tools UK", "haulage calculator", "lane rates UK", "track shipment", "find loads UK"],
  }),
  laneRates: createPageMetadata({
    title: "UK Lane Rate Index | Live Haulage Rates | Alpha Freight",
    description:
      "Live UK freight lane rate index from Alpha Freight marketplace data. Compare £/mile by corridor and equipment type across general, refrigerated, flatbed, and curtain-side haulage.",
    path: "/tools/lane-rates",
    keywords: ["UK lane rates", "haulage rates UK", "freight rate per mile", "logistics rate index"],
  }),
  freightQuote: createPageMetadata({
    title: "Instant Freight Quote UK | Haulage Price Calculator | Alpha Freight",
    description:
      "Calculate an instant UK freight quote by pickup, delivery, equipment, and weight. Powered by Alpha Freight marketplace lane intelligence.",
    path: "/tools/freight-quote",
    keywords: ["freight quote UK", "haulage quote calculator", "shipping cost UK", "truck freight estimate"],
  }),
  trackShipment: createPageMetadata({
    title: "Track Shipment | Public Load Tracking | Alpha Freight",
    description:
      "Track your Alpha Freight shipment by load reference (AF-XXXXXXXX). See booking status, transit progress, and delivery timeline without logging in.",
    path: "/track",
    keywords: ["track shipment UK", "freight tracking reference", "haulage tracking", "Alpha Freight track"],
  }),
  distanceCalculator: createPageMetadata({
    title: "UK Haulage Distance Calculator | Alpha Freight",
    description:
      "Calculate road miles and drive time between UK cities for haulage planning. Free distance calculator from Alpha Freight.",
    path: "/tools/distance",
    keywords: ["UK haulage distance", "freight miles calculator", "truck route distance UK"],
  }),
  liveLoads: createPageMetadata({
    title: "Find Loads UK Free | Live Load Board Preview | Alpha Freight",
    description:
      "Browse live UK freight loads on Alpha Freight. Filter open haulage jobs by route and equipment — free carrier signup to bid.",
    path: "/tools/live-loads",
    keywords: ["find loads UK free", "load board UK", "freight loads online", "haulage jobs"],
  }),
  rateCheck: createPageMetadata({
    title: "Rate vs Market Check | UK Haulage Benchmark | Alpha Freight",
    description:
      "Compare your freight rate to Alpha Freight marketplace benchmarks by lane and equipment before posting or bidding.",
    path: "/tools/rate-check",
    keywords: ["haulage rate benchmark", "freight rate comparison UK", "rate per mile check"],
  }),
  backhaulFinder: createPageMetadata({
    title: "Backhaul Lane Finder UK | Return Loads | Alpha Freight",
    description:
      "Find backhaul and return lanes from your current UK location. Reduce empty miles with Alpha Freight corridor intelligence.",
    path: "/tools/backhaul",
    keywords: ["backhaul loads UK", "return freight loads", "empty miles UK haulage"],
  }),
  palletFit: createPageMetadata({
    title: "Pallet & Vehicle Fit Calculator UK | Alpha Freight",
    description:
      "Calculate the best UK haulage equipment for your pallet count and weight — curtain-side, refrigerated, flatbed, or general haulage.",
    path: "/tools/pallet-fit",
    keywords: ["pallet load calculator", "vehicle fit UK haulage", "curtain side pallet capacity"],
  }),
  carrierMargin: createPageMetadata({
    title: "Carrier Earnings Calculator UK | Haulage Margin | Alpha Freight",
    description:
      "Estimate carrier profit after fuel and empty miles. Plan bids with Alpha Freight 7-day payout cash flow in mind.",
    path: "/tools/carrier-margin",
    keywords: ["carrier earnings calculator", "haulage profit margin", "truck bid calculator UK"],
  }),
  fuelSurcharge: createPageMetadata({
    title: "Fuel Surcharge Calculator UK | Haulage FSC | Alpha Freight",
    description:
      "Calculate fuel surcharge on UK haulage base rates. Free FSC calculator for suppliers and carriers.",
    path: "/tools/fuel-surcharge",
    keywords: ["fuel surcharge calculator", "FSC haulage UK", "freight fuel surcharge"],
  }),
  deliveryEta: createPageMetadata({
    title: "Delivery ETA Estimator UK | Haulage Arrival Time | Alpha Freight",
    description:
      "Estimate UK freight delivery windows from pickup time and distance using simplified HGV driving hours rules.",
    path: "/tools/delivery-eta",
    keywords: ["delivery ETA haulage", "freight arrival time UK", "HGV delivery estimate"],
  }),
  sevenDayPayouts: createPageMetadata({
    title: "7-Day Carrier Payouts | Alpha Freight UK",
    description:
      "Alpha Freight pays verified carriers within 7 days of delivery and POD verification — faster settlement than traditional UK freight brokers.",
    path: "/7-day-payouts",
  }),
  technology: createPageMetadata({
    title: "Freight Technology Platform | Alpha Freight",
    description:
      "AI load matching, GPS tracking, digital POD, analytics, and mobile apps — the technology stack powering Alpha Freight's UK marketplace.",
    path: "/technology",
  }),
  network: createPageMetadata({
    title: "Freight Network UK | Verified Carriers & Suppliers | Alpha Freight",
    description:
      "Join Alpha Freight's growing UK network of verified carriers and suppliers with transparent workflows and marketplace-grade tooling.",
    path: "/network",
  }),
  partners: createPageMetadata({
    title: "Partners | Alpha Freight",
    description:
      "Partner with Alpha Freight to expand freight capacity, technology integrations, and marketplace reach across the United Kingdom.",
    path: "/partners",
  }),
  successStories: createPageMetadata({
    title: "Success Stories | Alpha Freight Customers",
    description:
      "See how UK carriers and suppliers use Alpha Freight to improve load matching, visibility, settlement speed, and operational trust.",
    path: "/success-stories",
  }),
  companyOverview: createPageMetadata({
    title: "Company Overview | Alpha Freight Solutions Limited",
    description:
      "Alpha Freight Solutions Limited (Company No. 16860760) — UK freight brokerage platform headquartered at 124 City Road, London EC1V 2NX.",
    path: "/company-overview",
  }),
  privacyPolicy: createPageMetadata({
    title: "Privacy Policy | Alpha Freight",
    description:
      "How Alpha Freight collects, uses, and protects personal data for carriers, suppliers, and platform users in the United Kingdom.",
    path: "/privacy-policy",
  }),
  termsOfService: createPageMetadata({
    title: "Terms of Service | Alpha Freight",
    description:
      "Terms and conditions for using the Alpha Freight marketplace, supplier portal, carrier tools, and related services in the UK.",
    path: "/terms-of-service",
  }),
  cookiePolicy: createPageMetadata({
    title: "Cookie Policy | Alpha Freight",
    description:
      "Information about cookies, analytics, and similar technologies used on alphafreightuk.com and the Alpha Freight platform.",
    path: "/cookie-policy",
  }),
  supplierPortal: createPageMetadata({
    title: "Post Loads Online UK | Supplier Portal | Alpha Freight",
    description:
      "Post freight loads online in minutes. Alpha Freight supplier portal — publish lanes, compare verified carrier bids, track deliveries, and manage payments in one place.",
    path: "/products/supplier-portal",
    keywords: ["post loads UK", "supplier freight portal", "post haulage online", "ship freight UK"],
  }),
  mobileApp: createPageMetadata({
    title: "Freight Mobile App | Carriers & Drivers | Alpha Freight",
    description:
      "Alpha Freight mobile app for carriers — GPS tracking, load updates, digital POD upload, and wallet visibility on the go.",
    path: "/products/mobile-app",
  }),
  pod: createPageMetadata({
    title: "Digital Proof of Delivery | Alpha Freight",
    description:
      "Capture, verify, and sync digital POD across web and mobile to speed up freight settlement and reduce disputes.",
    path: "/products/pod",
  }),
  ai: createPageMetadata({
    title: "AI Freight Platform | Alpha Freight",
    description:
      "AI-powered freight operations for UK logistics — smarter matching, faster decisions, and better network performance.",
    path: "/products/ai",
  }),
  smartMatching: createPageMetadata({
    title: "AI Load Matching | Alpha Freight UK",
    description:
      "Match freight to verified carriers in under 60 seconds using route fit, equipment, reliability, and timing intelligence.",
    path: "/products/smart-matching",
  }),
  aiAssistant: createPageMetadata({
    title: "AI Assistant for Freight | Alpha Freight",
    description:
      "Ask operational questions, get load guidance, and resolve platform tasks faster with the Alpha Freight AI assistant.",
    path: "/products/ai-assistant",
  }),
  roadmap: createPageMetadata({
    title: "Product Roadmap | Alpha Freight",
    description:
      "See what Alpha Freight is building next across marketplace, mobile, payouts, analytics, and carrier verification.",
    path: "/products/roadmap",
  }),
  releases: createPageMetadata({
    title: "Product Releases | Alpha Freight Changelog",
    description:
      "Latest Alpha Freight platform releases — new features, improvements, and fixes across supplier, carrier, and admin tools.",
    path: "/products/releases",
  }),
  demo: createPageMetadata({
    title: "Book a Demo | Alpha Freight",
    description:
      "Request a demo of Alpha Freight — UK freight marketplace with verified carriers, live tracking, and 7-day payouts.",
    path: "/demo",
    noIndex: true,
  }),
  investor: createPageMetadata({
    title: "Investors | Alpha Freight",
    description:
      "Information for investors and strategic partners interested in Alpha Freight and the UK digital freight marketplace.",
    path: "/investor",
    noIndex: true,
  }),
} as const;
