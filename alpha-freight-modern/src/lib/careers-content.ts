export type CareerTeam = "Design" | "Engineering" | "Operations" | "Product" | "Growth";

export type CareerOpening = {
  slug: string;
  title: string;
  location: string;
  type: string;
  team: CareerTeam;
  summary: string;
  highlights: string[];
  salary: string;
  experience: string;
  image: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
};

export const careerTeams = ["All", "Design", "Engineering", "Operations", "Product", "Growth"] as const;

export const careerOpenings: CareerOpening[] = [
  {
    slug: "product-designer",
    title: "Senior Product Designer",
    location: "London, United Kingdom",
    type: "Full-Time",
    team: "Design",
    summary: "Shape premium marketplace experiences across supplier, carrier, and admin surfaces.",
    highlights: ["Design systems", "Prototyping", "User research"],
    salary: "£65k – £85k",
    experience: "5+ years",
    image: "/alpha-table.png",
    about:
      "You will own high-impact product surfaces across the Alpha Freight ecosystem — from supplier load posting to carrier wallet flows and admin operations tooling.",
    responsibilities: [
      "Lead end-to-end design for core marketplace workflows and new product initiatives.",
      "Build and evolve the Alpha Freight design system across web and mobile touchpoints.",
      "Partner with engineering and product to ship polished, production-ready experiences.",
      "Run lightweight research with suppliers, carriers, and internal operators.",
      "Present concepts, rationale, and iteration paths to leadership with clarity.",
    ],
    requirements: [
      "Strong portfolio demonstrating B2B or marketplace product design.",
      "Experience with design systems, prototyping, and high-fidelity UI execution.",
      "Ability to simplify complex operational workflows into intuitive interfaces.",
      "Comfort working in a fast-moving product environment with direct stakeholder feedback.",
    ],
    niceToHave: [
      "Experience in logistics, mobility, or operations software.",
      "Motion design or micro-interaction craft.",
      "Familiarity with Figma, Framer, and frontend design constraints.",
    ],
  },
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    location: "Remote, Europe",
    type: "Full-Time",
    team: "Engineering",
    summary: "Build fast, polished product interfaces on Next.js with strong attention to motion and detail.",
    highlights: ["Next.js", "TypeScript", "Performance"],
    salary: "£55k – £78k",
    experience: "3+ years",
    image: "/service-detail-2.avif",
    about:
      "Join the team building Alpha Freight’s public marketing surfaces and authenticated supplier/carrier product experiences on a modern Next.js stack.",
    responsibilities: [
      "Develop responsive, accessible interfaces across marketing and product areas.",
      "Collaborate on component architecture, performance, and UI quality standards.",
      "Integrate APIs, realtime updates, maps, and payment flows into user-facing features.",
      "Improve frontend reliability through testing, code review, and pragmatic refactoring.",
      "Contribute to a premium visual standard across the platform.",
    ],
    requirements: [
      "Strong experience with React, Next.js, and TypeScript.",
      "Solid understanding of CSS, responsive layout, and component-driven development.",
      "Ability to translate design intent into polished production UI.",
      "Clear communication and ownership in a small engineering team.",
    ],
    niceToHave: [
      "Framer Motion, Mapbox, Stripe, or Supabase experience.",
      "Performance optimization and Core Web Vitals awareness.",
      "Interest in logistics or operations software.",
    ],
  },
  {
    slug: "ops-analyst",
    title: "Operations Intelligence Analyst",
    location: "Birmingham, United Kingdom",
    type: "Full-Time",
    team: "Operations",
    summary: "Turn freight operations data into decisions that improve carrier quality and supplier outcomes.",
    highlights: ["Analytics", "Workflow design", "Reporting"],
    salary: "£38k – £52k",
    experience: "2+ years",
    image: "/how-3.jpg",
    about:
      "This role sits between marketplace operations and product — helping Alpha Freight understand network performance, verification health, and supplier/carrier outcomes.",
    responsibilities: [
      "Monitor operational metrics across loads, verification, payouts, and support patterns.",
      "Build reporting views and weekly insight summaries for leadership and product teams.",
      "Identify bottlenecks in onboarding, bidding, tracking, and settlement workflows.",
      "Partner with admin and support teams to improve process quality and response speed.",
      "Translate operational findings into clear recommendations for product prioritization.",
    ],
    requirements: [
      "Experience in operations, analytics, or business intelligence.",
      "Strong spreadsheet, reporting, and data interpretation skills.",
      "Ability to communicate insights clearly to technical and non-technical stakeholders.",
      "Detail-oriented mindset with practical problem-solving ability.",
    ],
    niceToHave: [
      "Exposure to logistics, transport, or marketplace businesses.",
      "Experience with SQL, dashboards, or CRM/ops tooling.",
      "Process improvement or workflow design background.",
    ],
  },
  {
    slug: "product-manager",
    title: "Product Manager, Marketplace",
    location: "London / Hybrid",
    type: "Full-Time",
    team: "Product",
    summary: "Own load posting, bidding, and award flows across one of the UK’s most ambitious freight platforms.",
    highlights: ["Roadmapping", "Cross-functional leadership", "B2B product"],
    salary: "£60k – £82k",
    experience: "4+ years",
    image: "/service-detail-3.avif",
    about:
      "You will define and deliver the core marketplace loop that connects suppliers and carriers — from load creation through bidding, award, tracking, and settlement support.",
    responsibilities: [
      "Own roadmap and execution for marketplace workflows and related growth initiatives.",
      "Work closely with design, engineering, operations, and leadership on prioritization.",
      "Define success metrics for load liquidity, award speed, and network quality.",
      "Gather feedback from suppliers, carriers, and internal teams to refine product direction.",
      "Write clear specs, acceptance criteria, and release plans for high-impact features.",
    ],
    requirements: [
      "Proven product management experience in B2B, marketplace, or operations software.",
      "Strong ability to balance user needs, business goals, and delivery constraints.",
      "Excellent written communication and stakeholder management.",
      "Comfort operating in a fast-moving environment with incomplete information.",
    ],
    niceToHave: [
      "Freight, logistics, or mobility domain knowledge.",
      "Experience with payments, verification, or two-sided marketplaces.",
      "Technical fluency with modern web product stacks.",
    ],
  },
  {
    slug: "growth-lead",
    title: "Growth Lead, Carrier Network",
    location: "United Kingdom",
    type: "Full-Time",
    team: "Growth",
    summary: "Expand verified carrier coverage through partnerships, onboarding, and network quality initiatives.",
    highlights: ["Partnerships", "Funnel optimization", "Field ops"],
    salary: "£45k – £65k",
    experience: "3+ years",
    image: "/alpha freight truck.jpg",
    about:
      "Alpha Freight’s carrier network is a core product advantage. This role focuses on growing verified capacity, improving onboarding conversion, and strengthening field-level partnerships.",
    responsibilities: [
      "Drive carrier acquisition and activation across key UK lanes and segments.",
      "Design and optimize onboarding funnels from signup through verification and first load.",
      "Build relationships with fleet operators, transport firms, and industry partners.",
      "Collaborate with operations and product to reduce friction in network growth.",
      "Track growth metrics and report progress against network coverage goals.",
    ],
    requirements: [
      "Experience in growth, partnerships, or business development.",
      "Strong communication skills and comfort with outbound relationship building.",
      "Analytical mindset with ability to improve funnels and conversion points.",
      "Self-directed execution in a startup-style product environment.",
    ],
    niceToHave: [
      "Freight, logistics, or transport industry network.",
      "Experience with CRM systems and lifecycle campaigns.",
      "Field sales or operator partnership background.",
    ],
  },
];

export const generalApplicationOpening: CareerOpening = {
  slug: "general-application",
  title: "General Application",
  location: "United Kingdom / Remote",
  type: "Open",
  team: "Growth",
  summary: "Share your profile for upcoming roles across design, engineering, product, operations, and growth.",
  highlights: ["Open profile", "Future roles", "Talent network"],
  salary: "Role dependent",
  experience: "All levels",
  image: "/alpha-man.png",
  about:
    "If you do not see the perfect role today, we still want to hear from strong builders, operators, and designers who want to help modernize UK freight.",
  responsibilities: [
    "Tell us what kind of work energizes you.",
    "Share your background, portfolio, or relevant experience.",
    "Join our talent network for upcoming team openings.",
  ],
  requirements: [
    "Clear communication about your skills and interests.",
    "Relevant experience in product, engineering, design, operations, or growth.",
    "Interest in building serious logistics infrastructure.",
  ],
  niceToHave: [
    "Freight or marketplace experience.",
    "Portfolio, GitHub, or case studies.",
    "Availability and location preferences.",
  ],
};

export function getCareerOpening(slug: string): CareerOpening | undefined {
  if (slug === generalApplicationOpening.slug) return generalApplicationOpening;
  return careerOpenings.find((opening) => opening.slug === slug);
}

export function getRelatedOpenings(slug: string, limit = 3): CareerOpening[] {
  const current = getCareerOpening(slug);
  if (!current) return careerOpenings.slice(0, limit);

  return careerOpenings
    .filter((opening) => opening.slug !== slug)
    .sort((a, b) => {
      if (a.team === current.team && b.team !== current.team) return -1;
      if (b.team === current.team && a.team !== current.team) return 1;
      return 0;
    })
    .slice(0, limit);
}
