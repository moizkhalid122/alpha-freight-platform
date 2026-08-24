export type LeadershipProfile = {
  id: string;
  name: string;
  title: string;
  image: string;
  imageAlt: string;
  bio: string;
  highlights: string[];
  email?: string;
  linkedin?: string;
};

/** Update names, bios, images, and links when details are ready. */
export const leadershipProfiles: LeadershipProfile[] = [
  {
    id: "ceo",
    name: "Khalid Mehmood",
    title: "Chief Executive Officer",
    image: "/leadership/ceo.png",
    imageAlt: "Chief Executive Officer — Alpha Freight",
    bio: "Leads Alpha Freight's vision and platform strategy — steering the company's evolution from a UK load board into a trusted digital freight marketplace. Brings deep operational experience across haulage, carrier networks, and long-term marketplace growth.",
    highlights: [
      "Strategic leadership across UK freight operations",
      "Platform vision and company direction",
      "Partnerships and long-term growth",
    ],
  },
  {
    id: "commercial-director",
    name: "Alastair James Massey",
    title: "Commercial Director / Director of Operations",
    image: "/leadership/commercial-director.jpg",
    imageAlt: "Commercial Director — Alpha Freight",
    bio: "Leads UK commercial growth, operational execution and company-level funding coordination across the Alpha Freight network. Focused on durable carrier and supplier relationships, scalable UK freight operations and transparent commercial performance.",
    highlights: [
      "UK commercial strategy and revenue growth",
      "Operational leadership and freight dispatch",
      "Commercial funding and client success",
    ],
  },
];

export const leadershipIntro = {
  eyebrow: "Executive Leadership — Alpha Freight",
  headline: "Leadership That Transforms UK Freight.",
  subtext:
    "Our executive team combines deep industry expertise with a clear vision — building the UK's most trusted digital logistics marketplace for carriers and suppliers.",
  heroImage: "/leadership/hero.png",
  heroImageAlt: "Alpha Freight executive leadership",
};

export const leadershipTrackRecord = {
  badge: "Track Record",
  headline: ["Measured by trust,", "not transactions."],
  description:
    "Since 2020, Alpha Freight has partnered with carriers and suppliers across the UK — building a freight marketplace through disciplined operations, verified networks, and long-term relationships rather than short-term volume.",
  stats: [
    { value: "2020", label: "Founded" },
    { value: "12K+", label: "Verified carriers" },
    { value: "50K+", label: "Monthly shipments" },
  ],
  footerText:
    "A platform built for transparent pricing, verified haulage partners, and reliable UK freight operations at scale.",
  footerLink: { label: "See how we operate", href: "/about" },
};

export const leadershipOnSection = {
  badge: "On Leadership",
  headline: "Stewardship, not personality.",
  description:
    "Every decision is guided by a consistent executive team — built on accountability, transparency, and long-term platform integrity, not any single individual.",
};

export const leadershipImpactSection = {
  headlineLead: "Building",
  headlineRest: "High-Impact Freight Leadership",
  paragraphs: [
    "Many logistics businesses reach a point where operational capacity alone is no longer enough. Carrier vetting, payment delays, poor visibility, and marketplace friction can prevent both hauliers and suppliers from reaching their full potential.",
    "Without the right platform and leadership, operators often experience:",
  ],
  checklist: [
    "Unverified carrier risk",
    "Payment delays and disputes",
    "Poor shipment visibility",
    "Limited network growth",
  ],
  cta: { label: "Contact Our Team", href: "/contact" },
  images: {
    back: { src: "/leadership/ceo-impact.png", alt: "Khalid Mehmood — CEO" },
    front: { src: "/leadership/commercial-director-impact.png", alt: "Alastair James Massey — Commercial Director" },
  },
};
