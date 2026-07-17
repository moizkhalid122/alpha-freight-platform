export type BlogCategory = "Company News" | "Technology" | "Market Trends";

export type BlogArticle = {
  slug: string;
  category: BlogCategory;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  publishedAt: string;
  readTime: string;
  sections: Array<{ heading?: string; paragraphs: string[] }>;
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "transparency-standard-freight",
    category: "Company News",
    title: "Why Transparency is the New Standard in Freight",
    excerpt:
      "In an era of instant information, siloed data is a liability. Find out how our real-time tracking systems provide businesses with the absolute clarity they need to operate faster.",
    image: "/news-new-1.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "March 12, 2026",
    readTime: "6 min read",
    sections: [
      {
        paragraphs: [
          "Freight operations used to run on phone calls, spreadsheets, and assumptions. That model worked when delays were tolerated and visibility was optional. Today, suppliers expect live status, carriers expect fair payout clarity, and finance teams expect proof before release.",
          "Transparency is no longer a marketing phrase. It is the baseline for trust between shippers, carriers, and the platforms that connect them.",
        ],
      },
      {
        heading: "What transparency actually means",
        paragraphs: [
          "Real transparency is more than a map pin. It includes load status history, document completion, payout timing, dispute context, and who is accountable at each step.",
          "Alpha Freight builds this into the supplier portal, carrier wallet, and live GPS layer so every stakeholder sees the same operational truth.",
        ],
      },
      {
        heading: "Why it changes decision speed",
        paragraphs: [
          "When teams do not have to chase updates, they can reallocate capacity faster, approve payouts sooner, and reduce reactive support load.",
          "That speed compounds: fewer missed windows, fewer manual checks, and stronger partner relationships across the network.",
        ],
      },
    ],
  },
  {
    slug: "road-to-net-zero",
    category: "Technology",
    title: "The Road to Net-Zero: Future of Green Trucking",
    excerpt:
      "Sustainability is no longer optional in freight. Learn how high-performance fleets, route intelligence, and cleaner operations are reshaping tomorrow's transport model.",
    image: "/news-new-2.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "March 8, 2026",
    readTime: "7 min read",
    sections: [
      {
        paragraphs: [
          "Green trucking is moving from pilot projects to operational planning. Fleets are evaluating fuel efficiency, route density, idle time, and vehicle lifecycle decisions with the same rigor they apply to rate strategy.",
          "Technology makes those decisions measurable instead of theoretical.",
        ],
      },
      {
        heading: "Route intelligence reduces waste",
        paragraphs: [
          "Empty miles and poor sequencing are silent cost drivers. Route optimization and smarter load matching reduce unnecessary movement while improving on-time performance.",
          "That is both an economic win and an emissions win.",
        ],
      },
      {
        heading: "Data as the foundation",
        paragraphs: [
          "You cannot improve what you cannot see. Tracking, POD workflows, and performance analytics give operators the baseline they need to set realistic sustainability targets.",
          "Alpha Freight continues investing in visibility tooling that supports cleaner, more efficient freight movement across the UK network.",
        ],
      },
    ],
  },
  {
    slug: "final-mile-precision",
    category: "Market Trends",
    title: "Redefining the Final Mile: Speed Meets Precision",
    excerpt:
      "The last mile is often the most complex part of the journey. We explore how integrated technology and local expertise ensure your goods arrive with control and speed.",
    image: "/news-new-3.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "February 28, 2026",
    readTime: "5 min read",
    sections: [
      {
        paragraphs: [
          "Final-mile delivery is where customer experience is won or lost. It is also where operational complexity peaks: tight windows, access restrictions, handoff proof, and exception handling.",
        ],
      },
      {
        heading: "Precision starts before dispatch",
        paragraphs: [
          "Accurate load details, delivery instructions, and carrier fit reduce failure rates before wheels turn. Smart matching and verified carrier profiles raise the quality of first-attempt success.",
        ],
      },
      {
        heading: "Proof closes the loop",
        paragraphs: [
          "Digital POD and timestamped status updates give suppliers confidence that delivery happened as promised. That reduces billing friction and support overhead.",
          "In high-expectation markets, final-mile precision is not a nice-to-have. It is the product.",
        ],
      },
    ],
  },
  {
    slug: "digital-pod-momentum",
    category: "Technology",
    title: "Digital POD Is Quietly Transforming Freight Settlement",
    excerpt:
      "Faster confirmation, cleaner documentation, and fewer disputes. See why proof-of-delivery workflows are becoming central to efficient operations.",
    image: "/news-new-4.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "February 19, 2026",
    readTime: "6 min read",
    sections: [
      {
        paragraphs: [
          "Paper POD workflows create lag. Photos get lost, signatures are delayed, and finance teams wait days before approving release. Digital POD compresses that cycle.",
        ],
      },
      {
        heading: "Settlement speed improves cash flow",
        paragraphs: [
          "Carriers benefit when proof is immediate and structured. Suppliers benefit when exceptions are visible early. Platforms benefit when disputes drop.",
          "That is why POD is now part of the core product stack, not an optional add-on.",
        ],
      },
      {
        heading: "Built for auditability",
        paragraphs: [
          "A strong POD flow stores evidence, timestamps events, and ties documentation to the correct load record. That makes reconciliation easier for operations and compliance teams alike.",
        ],
      },
    ],
  },
  {
    slug: "carrier-network-signal",
    category: "Company News",
    title: "What a Stronger Carrier Network Actually Looks Like",
    excerpt:
      "Growth alone is not the metric. The real win comes from consistency, verified performance, and better operational trust between every moving part.",
    image: "/news-item-5.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "February 10, 2026",
    readTime: "5 min read",
    sections: [
      {
        paragraphs: [
          "A marketplace can add carriers quickly. The harder part is building a network that performs reliably under real-world pressure.",
        ],
      },
      {
        heading: "Verification creates signal",
        paragraphs: [
          "Document checks, vehicle validation, and performance history turn a directory into a trusted network. Suppliers can award loads with more confidence, and carriers compete on quality rather than noise.",
        ],
      },
      {
        heading: "Network effects need discipline",
        paragraphs: [
          "The best networks balance growth with standards. Alpha Freight focuses on verified partners, transparent workflows, and tools that reward consistent execution.",
        ],
      },
    ],
  },
  {
    slug: "market-rhythm-2026",
    category: "Market Trends",
    title: "Market Rhythm in 2026: Capacity, Timing, and Rate Pressure",
    excerpt:
      "Freight teams are navigating sharper demand windows and faster expectations. Here are the shifts shaping better decisions across the market.",
    image: "/news-item-6.jpg",
    author: "Alpha Freight Editorial",
    publishedAt: "January 30, 2026",
    readTime: "7 min read",
    sections: [
      {
        paragraphs: [
          "2026 freight planning is less about static annual forecasts and more about rapid response. Capacity shifts quickly, lane pressure changes by week, and customer expectations keep rising.",
        ],
      },
      {
        heading: "Timing beats average rates",
        paragraphs: [
          "Teams that post early, match faster, and track live are outperforming those still operating on delayed information loops.",
        ],
      },
      {
        heading: "Data-led bidding wins",
        paragraphs: [
          "Market rate visibility, historical lane performance, and live load status help both sides make sharper decisions. That is the rhythm modern freight platforms are built around.",
        ],
      },
    ],
  },
];

export const blogCategories = ["All", "Company News", "Technology", "Market Trends"] as const;

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): BlogArticle[] {
  const current = getBlogArticle(slug);
  if (!current) return blogArticles.slice(0, limit);

  return blogArticles
    .filter((article) => article.slug !== slug)
    .sort((a, b) => {
      if (a.category === current.category && b.category !== current.category) return -1;
      if (b.category === current.category && a.category !== current.category) return 1;
      return 0;
    })
    .slice(0, limit);
}
