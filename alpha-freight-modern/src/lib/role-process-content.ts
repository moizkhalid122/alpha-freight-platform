import type { LucideIcon } from "lucide-react";

export type ProcessStep = {
  step: string;
  title: string;
  desc: string;
};

export type InfoPoint = {
  title: string;
  desc: string;
};

export type RoleProcessContent = {
  slug: "supplier" | "carrier";
  path: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  signupHref: string;
  signupLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  informationTitle: string;
  informationIntro: string;
  informationPoints: InfoPoint[];
  feeLabel: string;
  feeValue: string;
  feeNote: string;
  processTitle: string;
  processIntro: string;
  processSteps: ProcessStep[];
  requirementsTitle: string;
  requirements: string[];
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
};

export const supplierProcessContent: RoleProcessContent = {
  slug: "supplier",
  path: "/supplier-information",
  eyebrow: "For suppliers & shippers",
  heroTitle: "Supplier information & process",
  heroSubtitle:
    "Everything you need to post freight on Alpha Freight — from account setup and load posting to carrier bids, payment, tracking, and delivery close-out.",
  signupHref: "/auth/signup?role=supplier",
  signupLabel: "Create supplier account",
  secondaryHref: "/post-loads",
  secondaryLabel: "How posting works",
  informationTitle: "Supplier information",
  informationIntro:
    "Alpha Freight is a UK freight marketplace for businesses that need haulage moved reliably. Suppliers post loads, receive bids from verified carriers, pay securely, and track shipments to delivery.",
  informationPoints: [
    {
      title: "Who can join",
      desc: "Manufacturers, distributors, retailers, 3PLs, and any UK business posting road freight loads.",
    },
    {
      title: "What you can do",
      desc: "Post loads, review carrier bids, assign jobs, pay online, track live, approve POD, and manage refunds.",
    },
    {
      title: "Account cost",
      desc: "Free to sign up and post. No monthly subscription. You pay when your load goes live on the board.",
    },
    {
      title: "Service fee",
      desc: "Fixed 4% Alpha Freight service fee on your load price — shown clearly before you pay.",
    },
    {
      title: "Payment options",
      desc: "Pay Now by card or bank transfer, or use Pay Later and settle within 7 days before the load goes live.",
    },
    {
      title: "Support & AI",
      desc: "Supplier dashboard, AI load advisor, proactive post-load copilot, and in-platform support.",
    },
  ],
  feeLabel: "Supplier service fee",
  feeValue: "4% fixed",
  feeNote: "Added to your load price at checkout. Example: £1,000 load → £1,040 total.",
  processTitle: "Supplier process",
  processIntro: "From signup to delivery — the standard Alpha Freight supplier journey.",
  processSteps: [
    {
      step: "01",
      title: "Create your supplier account",
      desc: "Sign up free, complete your company profile, and add verification documents if requested.",
    },
    {
      step: "02",
      title: "Post your load",
      desc: "Enter route, cargo, vehicle requirements, UK postcodes, and your load price in the guided post-load form.",
    },
    {
      step: "03",
      title: "Review commission & pay",
      desc: "See load price + 4% service fee breakdown. Pay Now or choose Pay Later (due within 7 days).",
    },
    {
      step: "04",
      title: "Load goes live",
      desc: "After payment confirms, your load appears on the carrier board for verified hauliers to bid.",
    },
    {
      step: "05",
      title: "Review & accept bids",
      desc: "Compare carrier bids in My Bids, check fit and rates, then assign the carrier you want.",
    },
    {
      step: "06",
      title: "Track the shipment",
      desc: "Monitor pickup, transit, and delivery from your supplier dashboard with live tracking.",
    },
    {
      step: "07",
      title: "Approve POD & close",
      desc: "Review proof of delivery, confirm completion, and resolve any issues through support or refunds if needed.",
    },
  ],
  requirementsTitle: "What suppliers need ready",
  requirements: [
    "UK company or trading details for your profile",
    "Pickup and delivery locations with UK postcodes",
    "Load price (transport budget) and cargo details",
    "Payment method for Pay Now or Pay Later settlement",
    "Contact details for pickup and delivery coordination",
  ],
  faqs: [
    {
      q: "Is it free to post loads?",
      a: "Creating an account and building your load is free. Payment — including the 4% service fee — is required before the load goes live for carriers.",
    },
    {
      q: "When do I pay?",
      a: "Before your load appears on the marketplace. You can pay immediately or use Pay Later and settle within 7 days.",
    },
    {
      q: "Can I cancel after posting?",
      a: "Yes. Cancellations before carrier acceptance normally qualify for a refund of the amount paid, subject to our refund policy.",
    },
    {
      q: "How do I choose a carrier?",
      a: "Review bids in My Bids, compare rates and carrier profiles, then accept the bid that best fits your lane and timing.",
    },
  ],
  ctaTitle: "Ready to post your first load?",
  ctaSubtitle: "Join free — pay only when your freight goes live",
};

export const carrierProcessContent: RoleProcessContent = {
  slug: "carrier",
  path: "/carrier-information",
  eyebrow: "For carriers & hauliers",
  heroTitle: "Carrier / haulier information & process",
  heroSubtitle:
    "How UK carriers and hauliers find loads, bid, deliver, upload POD, and get paid on Alpha Freight — with no monthly fees and net rates shown upfront.",
  signupHref: "/auth/signup?role=carrier",
  signupLabel: "Create carrier account",
  secondaryHref: "/find-loads",
  secondaryLabel: "Browse live loads",
  informationTitle: "Carrier / haulier information",
  informationIntro:
    "Alpha Freight connects verified UK carriers and owner-operators with live freight from suppliers. Browse loads, bid on lanes that fit your fleet, deliver with digital POD, and receive payment through your carrier wallet.",
  informationPoints: [
    {
      title: "Who can join",
      desc: "Hauliers, HGV operators, owner-drivers, and fleet businesses with valid UK operator credentials.",
    },
    {
      title: "What you can do",
      desc: "Browse loads, submit bids, manage assigned jobs, upload POD, track earnings, and request bank payouts.",
    },
    {
      title: "Account cost",
      desc: "Free forever. No membership fee and no charge to bid on loads.",
    },
    {
      title: "Platform fee",
      desc: "Fixed 3% deducted from the displayed load rate — you see and receive the net amount.",
    },
    {
      title: "Payout timing",
      desc: "After POD verification, payment is normally processed within 7 days to your carrier wallet.",
    },
    {
      title: "Tools included",
      desc: "Smart load matching, AI assistant, margin calculators, route maps, and fleet document management.",
    },
  ],
  feeLabel: "Carrier platform fee",
  feeValue: "3% fixed",
  feeNote: "Deducted from the load rate shown on the board. Example: £1,000 load → you receive £970.",
  processTitle: "Carrier process",
  processIntro: "From signup to payout — the standard Alpha Freight carrier journey.",
  processSteps: [
    {
      step: "01",
      title: "Create your carrier account",
      desc: "Register free, add operator details, vehicles, insurance, and complete profile verification.",
    },
    {
      step: "02",
      title: "Browse available loads",
      desc: "Search the live load board by route, equipment, and rate. Prices shown are net after the 3% platform fee.",
    },
    {
      step: "03",
      title: "Submit your bid",
      desc: "Bid on loads that fit your fleet and lanes. Track bid status in My Bids.",
    },
    {
      step: "04",
      title: "Get assigned & plan the job",
      desc: "When the supplier accepts your bid, the load moves to My Loads with full route and cargo details.",
    },
    {
      step: "05",
      title: "Collect & deliver",
      desc: "Complete pickup and delivery to the agreed schedule. Use the driver panel and maps as needed.",
    },
    {
      step: "06",
      title: "Upload proof of delivery",
      desc: "Submit digital POD through the platform so Alpha Freight can verify completion.",
    },
    {
      step: "07",
      title: "Get paid",
      desc: "After POD verification, funds release to your carrier wallet — normally within 7 days — then withdraw to your bank.",
    },
  ],
  requirementsTitle: "What carriers need ready",
  requirements: [
    "Valid operator licence and insurance documents",
    "Vehicle details (type, capacity, MOT where applicable)",
    "Bank details for payout setup in the carrier wallet",
    "Ability to upload clear proof of delivery photos",
    "Contact details for dispatch and job updates",
  ],
  faqs: [
    {
      q: "Do carriers pay to join or bid?",
      a: "No. Carrier accounts and bidding are free. A fixed 3% platform fee is deducted from the rate shown on each load.",
    },
    {
      q: "What rate do I see on the load board?",
      a: "The net amount you receive after the 3% fee — not the supplier's gross load price.",
    },
    {
      q: "When do I get paid?",
      a: "After delivery and POD verification, payment is normally processed within 7 days into your carrier wallet.",
    },
    {
      q: "What equipment types are listed?",
      a: "Curtain-side, refrigerated, flatbed, general haulage, and other UK road freight types posted by suppliers.",
    },
  ],
  ctaTitle: "Ready to find your next load?",
  ctaSubtitle: "Join free — bid on live UK freight today",
};
