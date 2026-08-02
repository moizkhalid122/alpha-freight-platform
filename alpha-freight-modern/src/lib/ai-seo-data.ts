import { AI_TOPIC_PAGES } from "@/lib/ai-topic-pages";
import { absoluteUrl } from "@/lib/seo";

export const AI_MAIN_FAQS = [
  {
    question: "What is Alpha Freight AI?",
    answer:
      "Alpha Freight AI is a free UK freight and haulage assistant for loads, RPM, diesel, POD, payouts, and marketplace help — no login required.",
  },
  {
    question: "Is UK freight AI free?",
    answer:
      "Yes. Guest users get free messages every hour. Sign up for unlimited AI, live load board, and wallet features.",
  },
  {
    question: "What can I ask UK freight AI?",
    answer:
      "RPM and profit calculations, UK diesel prices, how to find loads, post loads, digital POD, carrier payouts, backhaul strategy, HGV compliance, and Alpha Freight platform help.",
  },
  {
    question: "Freight AI without typing UK?",
    answer:
      "Alpha Freight AI defaults to UK haulage context — HGV routes, UK diesel, and British freight — even if you omit UK.",
  },
  {
    question: "Is Alpha Freight AI better than ChatGPT for haulage?",
    answer:
      "Alpha Freight AI is built for UK freight — RPM, load board, POD, and payout workflows — with links to Alpha Freight tools and signup.",
  },
  {
    question: "How do carriers find loads with AI?",
    answer:
      "Ask Alpha Freight AI for lane advice, then sign up free to browse live UK loads, bid, deliver, and get paid in 7 days after digital POD.",
  },
] as const;

export function getAiTopicListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alpha Freight AI guides — UK freight topics",
    itemListElement: AI_TOPIC_PAGES.map((topic, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: topic.h1,
      url: absoluteUrl(`/ai/${topic.slug}`),
    })),
  };
}

export function getAiBreadcrumbSchema(slug?: string, label?: string) {
  const items = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Free UK Freight AI", url: absoluteUrl("/ai") },
  ];
  if (slug && label) {
    items.push({ name: label, url: absoluteUrl(`/ai/${slug}`) });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const AI_GUIDE_FOOTER_LINKS = AI_TOPIC_PAGES.map((topic) => ({
  name: topic.h1,
  href: `/ai/${topic.slug}`,
}));

export function buildLlmsTxt(): string {
  const lines = [
    "# Alpha Freight",
    "> Free UK freight AI for haulage, logistics, RPM, diesel, loads, POD, and payouts.",
    "",
    "## Primary",
    `- Free UK Freight AI: ${absoluteUrl("/ai")}`,
    `- Find loads UK: ${absoluteUrl("/find-loads")}`,
    `- Post loads UK: ${absoluteUrl("/post-loads")}`,
    `- Carrier signup: ${absoluteUrl("/auth/carrier-signup")}`,
    "",
    "## AI topic guides",
    ...AI_TOPIC_PAGES.map(
      (topic) => `- ${topic.h1}: ${absoluteUrl(`/ai/${topic.slug}`)}`
    ),
    "",
    "## Tools",
    `- Live loads: ${absoluteUrl("/tools/live-loads")}`,
    `- RPM / rate check: ${absoluteUrl("/tools/rate-check")}`,
    `- Fuel surcharge: ${absoluteUrl("/tools/fuel-surcharge")}`,
    `- Backhaul: ${absoluteUrl("/tools/backhaul")}`,
    "",
    "## Contact",
    `- Website: ${absoluteUrl("/")}`,
    `- Support: ${absoluteUrl("/support")}`,
  ];
  return lines.join("\n");
}
