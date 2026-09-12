export type ConciergePublicPage = {
  path: string;
  title: string;
  purpose: string;
  keywords: string[];
  forms?: string[];
  tips?: string;
};

/** Public marketing pages Alpha can open and explain (from sitemap + nav). */
export const CONCIERGE_PUBLIC_PAGES: ConciergePublicPage[] = [
  { path: "/", title: "Home", purpose: "Overview of Alpha Freight UK marketplace", keywords: ["home", "start", "alpha freight"] },
  {
    path: "/about",
    title: "About",
    purpose: "Company story, mission, why Alpha Freight",
    keywords: ["about", "who are you", "company"],
  },
  {
    path: "/pricing",
    title: "Pricing",
    purpose: "Plans, fees, supplier vs carrier pricing",
    keywords: ["pricing", "cost", "fees", "kitna", "price"],
    tips: "Explain UK marketplace model — no hidden broker markups; suppliers post, carriers bid.",
  },
  {
    path: "/contact",
    title: "Contact",
    purpose: "Contact form, phone, support enquiry",
    keywords: ["contact", "call", "email us", "reach", "human"],
    forms: ["name", "email", "phone", "subject", "message"],
    tips: "Offer to fill the contact form with their name, email, and message.",
  },
  {
    path: "/support",
    title: "Support",
    purpose: "Help centre and support resources",
    keywords: ["support", "help", "madad"],
  },
  {
    path: "/solution",
    title: "Solution",
    purpose: "How the platform works end-to-end",
    keywords: ["solution", "how it works", "platform"],
  },
  {
    path: "/find-loads",
    title: "Find loads",
    purpose: "Carriers browse available UK loads",
    keywords: ["find load", "find loads", "available load", "loads", "load dhundo"],
    tips: "Carriers need an account — only mention signup if they ask; never redirect on greeting.",
  },
  {
    path: "/available-loads",
    title: "Available loads",
    purpose: "Live load board preview",
    keywords: ["available loads", "load board", "live loads"],
  },
  {
    path: "/post-loads",
    title: "Post loads",
    purpose: "Suppliers learn how to post freight",
    keywords: ["post load", "post loads", "ship freight", "supplier load"],
    tips: "Direct suppliers to signup only if they ask to register — never redirect on greeting.",
  },
  {
    path: "/carrier-information",
    title: "Carrier info",
    purpose: "Benefits for hauliers and carriers",
    keywords: ["carrier info", "haulier", "driver", "hgv", "truck"],
    tips: "7-day payouts, verified loads, UK focus.",
  },
  {
    path: "/supplier-information",
    title: "Supplier info",
    purpose: "Benefits for shippers and suppliers",
    keywords: ["supplier info", "shipper", "sender"],
  },
  {
    path: "/auth/signup?role=carrier",
    title: "Carrier signup",
    purpose: "Register as a carrier",
    keywords: ["carrier signup", "register carrier", "join carrier", "carrier account"],
    forms: ["fullName", "email", "password", "referralCode"],
  },
  {
    path: "/auth/signup?role=supplier",
    title: "Supplier signup",
    purpose: "Register as a supplier",
    keywords: ["supplier signup", "register supplier", "shipper signup"],
    forms: ["fullName", "email", "password", "referralCode"],
  },
  {
    path: "/auth/login",
    title: "Login",
    purpose: "Sign in to existing account",
    keywords: ["login", "sign in", "log in", "already have account"],
    forms: ["email", "password"],
  },
  {
    path: "/directory",
    title: "Carrier directory",
    purpose: "Browse verified carriers",
    keywords: ["directory", "carriers list", "find carrier"],
  },
  {
    path: "/suppliers",
    title: "Supplier directory",
    purpose: "Browse suppliers on the network",
    keywords: ["suppliers", "shipper directory"],
  },
  {
    path: "/tools",
    title: "Tools hub",
    purpose: "Free freight calculators and tools",
    keywords: ["tools", "calculator", "calculators"],
  },
  {
    path: "/tools/carrier-margin",
    title: "Margin calculator",
    purpose: "RPM and profit margin for carriers",
    keywords: ["margin", "profit", "rpm", "rate per mile"],
  },
  {
    path: "/tools/fuel-surcharge",
    title: "Fuel surcharge",
    purpose: "Fuel surcharge calculator",
    keywords: ["fuel", "diesel", "surcharge"],
  },
  {
    path: "/tools/freight-quote",
    title: "Freight quote",
    purpose: "Estimate freight cost",
    keywords: ["quote", "estimate", "freight cost"],
  },
  {
    path: "/tools/distance",
    title: "Distance calculator",
    purpose: "Route distance for UK lanes",
    keywords: ["distance", "miles", "route length"],
  },
  {
    path: "/tools/lane-rates",
    title: "Lane rates",
    purpose: "Typical lane rate benchmarks",
    keywords: ["lane rate", "lane rates", "market rate"],
  },
  {
    path: "/tools/live-loads",
    title: "Live loads tool",
    purpose: "Load search tool",
    keywords: ["live loads tool"],
  },
  {
    path: "/ai",
    title: "Alpha AI chat",
    purpose: "Text AI assistant for freight questions",
    keywords: ["ai chat", "text chat", "assistant"],
  },
  {
    path: "/industries",
    title: "Industries",
    purpose: "Freight by industry sector",
    keywords: ["industries", "sector", "construction", "retail", "food"],
  },
  {
    path: "/services",
    title: "Services",
    purpose: "Alpha Freight service offerings",
    keywords: ["services", "what you offer"],
  },
  {
    path: "/7-day-payouts",
    title: "7-day payouts",
    purpose: "Fast carrier payment promise",
    keywords: ["payout", "payment", "7 day", "pay fast"],
  },
  {
    path: "/knowledge-base",
    title: "Knowledge base",
    purpose: "Articles and FAQs",
    keywords: ["faq", "knowledge", "learn", "guide"],
  },
  {
    path: "/academy",
    title: "Academy",
    purpose: "Freight education for UK market",
    keywords: ["academy", "learn freight", "training"],
  },
  {
    path: "/feedback",
    title: "Feedback",
    purpose: "Send product feedback",
    keywords: ["feedback", "review", "suggestion"],
  },
  {
    path: "/track",
    title: "Track shipment",
    purpose: "Track a load or shipment",
    keywords: ["track", "tracking", "where is my load"],
  },
  {
    path: "/products/supplier-portal",
    title: "Supplier portal",
    purpose: "Software for suppliers",
    keywords: ["supplier portal", "dashboard supplier"],
  },
  {
    path: "/products/tracking",
    title: "Tracking product",
    purpose: "Live GPS tracking for loads",
    keywords: ["tracking product", "gps"],
  },
  {
    path: "/products/ai-assistant",
    title: "AI assistant product",
    purpose: "AI tools for freight ops",
    keywords: ["ai product", "ai assistant product"],
  },
];

const PAGE_BY_PATH = new Map(CONCIERGE_PUBLIC_PAGES.map((p) => [normalizePath(p.path), p]));

function normalizePath(path: string): string {
  try {
    const url = new URL(path, "https://alphafreightuk.com");
    return `${url.pathname}${url.search}`;
  } catch {
    return path;
  }
}

export function getConciergePage(path: string): ConciergePublicPage | null {
  const key = normalizePath(path);
  return PAGE_BY_PATH.get(key) || PAGE_BY_PATH.get(key.split("?")[0] || key) || null;
}

export function findConciergePagesForQuery(message: string, limit = 3): ConciergePublicPage[] {
  const lower = message.toLowerCase();
  const scored = CONCIERGE_PUBLIC_PAGES.map((page) => {
    let score = 0;
    for (const kw of page.keywords) {
      if (lower.includes(kw.toLowerCase())) score += kw.length > 6 ? 3 : 2;
    }
    if (page.title.toLowerCase().split(/\s+/).some((w) => lower.includes(w))) score += 1;
    return { page, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.page);
}

export function buildConciergeSiteMapPrompt(maxPages = 28): string {
  const lines = CONCIERGE_PUBLIC_PAGES.slice(0, maxPages).map(
    (p) => `- ${p.path} — ${p.title}: ${p.purpose}`,
  );
  return `PUBLIC SITE PAGES (use navigate_page to open the best match):
${lines.join("\n")}
Always pick the page that solves the user's problem. Then explain briefly why it's useful.`;
}

export function buildConciergePageGuide(path: string): string {
  const page = getConciergePage(path);
  if (!page) {
    return `User is on ${path}. Help with what they likely need on this page.`;
  }
  const parts = [`CURRENT PAGE: ${page.title} (${page.path})`, `Purpose: ${page.purpose}`];
  if (page.forms?.length) {
    parts.push(`Form fields you can pre-fill: ${page.forms.join(", ")}`);
  }
  if (page.tips) parts.push(`Advice: ${page.tips}`);
  return parts.join("\n");
}

export function isAllowedConciergePath(path: string): boolean {
  const normalized = normalizePath(path);
  if (CONCIERGE_PUBLIC_PAGES.some((p) => normalizePath(p.path) === normalized)) return true;
  if (normalized.startsWith("/industries/")) return true;
  if (normalized.startsWith("/products/")) return true;
  if (normalized.startsWith("/tools/")) return true;
  if (normalized.startsWith("/auth/signup")) return true;
  if (normalized === "/auth/login") return true;
  if (normalized.startsWith("/carrier/")) return true;
  if (normalized.startsWith("/supplier/")) return true;
  if (normalized === "/brand-kit") return true;
  if (normalized === "/blog") return true;
  if (normalized === "/career") return true;
  if (normalized === "/partners") return true;
  if (normalized === "/learning-series") return true;
  if (normalized === "/docs") return true;
  return false;
}
