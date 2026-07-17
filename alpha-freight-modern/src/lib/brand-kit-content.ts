export const brandPillars = [
  {
    title: "Premium Operations",
    body: "Every surface should feel like a control tower — calm, precise, and built for people who move freight for a living.",
  },
  {
    title: "Trust by Default",
    body: "Verification, compliance, and transparent status are part of the brand — not optional extras buried in settings.",
  },
  {
    title: "Accent with Intent",
    body: "Alpha Lime is energy and emphasis. Use it for high-intent actions, never as wallpaper across entire screens.",
  },
];

export const brandValues = [
  {
    title: "Truth over guesswork",
    body: "Show real load status, verified carriers, and honest pricing guidance. Never invent numbers in product or marketing copy.",
  },
  {
    title: "Speed with reliability",
    body: "Fast matching and fast support only matter when deliveries stay predictable. Performance and trust go together.",
  },
  {
    title: "Operational clarity",
    body: "Suppliers and carriers should always know the next step — post, bid, track, POD, payout — without hunting through menus.",
  },
  {
    title: "Compliance first",
    body: "Insurance, vetting, and document checks protect the network. The brand should feel safe for enterprise shippers.",
  },
];

export const typeScale = [
  { name: "Display", size: "56–72px", weight: "Medium / Bold", use: "Marketing heroes, brand kit headers" },
  { name: "Heading 1", size: "40–48px", weight: "Bold", use: "Page titles, major section openers" },
  { name: "Heading 2", size: "28–32px", weight: "Semibold", use: "Dashboard sections, card titles" },
  { name: "Heading 3", size: "20–24px", weight: "Semibold", use: "Module headers, dialog titles" },
  { name: "Body Large", size: "16–18px", weight: "Medium", use: "Intro copy, empty states, AI replies" },
  { name: "Body", size: "14–15px", weight: "Regular / Medium", use: "Default UI text, forms, tables" },
  { name: "Caption", size: "12–13px", weight: "Medium", use: "Metadata, timestamps, helper text" },
  { name: "Label", size: "10–11px", weight: "Bold uppercase", use: "Eyebrows, badges, nav groups" },
];

export const typographyRules = [
  "Primary stack: system-ui, -apple-system, Segoe UI, sans-serif.",
  "Headlines use tight tracking (-0.02em to -0.04em) for a premium editorial feel.",
  "Uppercase labels always include generous letter-spacing (0.18em–0.28em).",
  "Prefer sentence case for product UI; reserve ALL CAPS for labels and badges.",
  "Line length: 45–75 characters for long-form marketing; shorter in dashboards.",
];

export const illustrationPrinciples = [
  {
    title: "Logistics-first",
    body: "Show trucks, containers, routes, warehouses, and operators — not abstract SaaS blobs.",
  },
  {
    title: "Calm contrast",
    body: "Dark navy backgrounds with controlled lime accents. Avoid rainbow gradients and cartoon mascots.",
  },
  {
    title: "Minimal noise",
    body: "One focal subject per frame. Use blur, depth, and light streaks sparingly for motion.",
  },
  {
    title: "Product-connected",
    body: "Illustrations should match real app flows: tracking maps, load cards, POD, payouts.",
  },
];

export const illustrationExamples = [
  { src: "/ai image 1.avif", alt: "AI logistics visual", caption: "Technology + operations blend" },
  { src: "/alpha-freight-hero.png", alt: "Alpha Freight hero", caption: "Hero marketing composition" },
  { src: "/alpha-mobile-app-image.png", alt: "Mobile app visual", caption: "App-led product storytelling" },
  { src: "/alpha image.png", alt: "Brand illustration", caption: "Network / platform visual" },
];

export const iconographyItems = [
  { name: "Truck", use: "Loads, fleet, carrier workflows" },
  { name: "MapPin", use: "Routes, pickup, delivery points" },
  { name: "Package", use: "Cargo, commodity, shipment units" },
  { name: "ShieldCheck", use: "Vetting, insurance, verified carriers" },
  { name: "Wallet", use: "Payouts, earnings, wallet balance" },
  { name: "Navigation", use: "Live tracking, GPS, in-transit status" },
  { name: "FileText", use: "POD, documents, compliance uploads" },
  { name: "Users", use: "Suppliers, carriers, directory profiles" },
];

export const iconographyRules = [
  "Use Lucide-style outline icons at 1.5px stroke for consistency with the product.",
  "Default sizes: 16px inline, 20px buttons, 24px section headers, 32px empty states.",
  "Icon color follows text hierarchy — slate-500 for secondary, slate-900 for primary.",
  "Alpha Lime icons only inside lime badges or dark hero panels — not everywhere.",
  "Always pair icons with text labels in operational UI (never icon-only critical actions).",
];

export const photographyExamples = [
  {
    src: "/service-detail-1.jpg",
    title: "Industrial operations",
    caption: "Real yard and equipment context — credible for heavy freight.",
  },
  {
    src: "/alpha-freight-truck-2.avif",
    title: "Road freight",
    caption: "UK trucking environments with natural light and motion.",
  },
  {
    src: "/alpha-freight-container-2.avif",
    title: "Container logistics",
    caption: "Port and container imagery for intermodal stories.",
  },
  {
    src: "/how-1.jpg",
    title: "People at work",
    caption: "Operators and drivers — authentic, not stock-smiling clichés.",
  },
  {
    src: "/avi-richards-pdrckQDTxWY-unsplash.jpg",
    title: "Urban logistics",
    caption: "City movement, crosswalks, and infrastructure depth.",
  },
  {
    src: "/service-detail-2.avif",
    title: "Premium detail",
    caption: "Tight crops for cards, social, and case studies.",
  },
];

export const photographyRules = {
  do: [
    "Use real UK logistics environments — yards, motorways, warehouses, ports.",
    "Prefer natural or cinematic light with controlled contrast.",
    "Show diversity of equipment: curtainsiders, containers, flatbed, specialist.",
    "Leave space for headline copy in hero crops (left or top third).",
  ],
  dont: [
    "No generic clip-art trucks or oversaturated cartoon visuals.",
    "Avoid fake dashboard overlays on unrelated stock photos.",
    "Do not use low-resolution or heavily watermarked images.",
    "Avoid busy backgrounds that compete with UI screenshots.",
  ],
};

export const socialTemplates = [
  {
    title: "LinkedIn announcement",
    ratio: "1200 × 627",
    body: "Dark navy background, Alpha wordmark top-left, lime eyebrow, one strong headline, optional product screenshot.",
  },
  {
    title: "Instagram / feed square",
    ratio: "1080 × 1080",
    body: "High-contrast photo or app visual, minimal text, logo watermark bottom-right.",
  },
  {
    title: "YouTube thumbnail",
    ratio: "1280 × 720",
    body: "Bold yellow headline blocks, human presenter optional, 3–4 words max, high contrast for mobile.",
  },
  {
    title: "WhatsApp / status",
    ratio: "1080 × 1920",
    body: "Vertical crop of app UI or load map with short CTA and alphafreightuk.com URL.",
  },
];

export const materialGuidelines = [
  {
    title: "Sales deck",
    body: "Midnight cover slide, lime accent line, white interior slides. One idea per slide. Use real product screenshots.",
  },
  {
    title: "One-pager PDF",
    body: "A4, 12mm margins, Paper background, charcoal text, lime only for CTAs and section dividers.",
  },
  {
    title: "Email signature",
    body: "Logo symbol 32px, name + title, support@alphafreightuk.com, +44 7782 294718, alphafreightuk.com",
  },
  {
    title: "Partner co-brand",
    body: "Alpha logo left, partner logo right, equal height, clear space equal to logo height on all sides.",
  },
];

export const websitePatterns = [
  {
    title: "Marketing pages",
    body: "Large uppercase headlines, dark hero bands, white content sections, lime sparingly for CTAs.",
    href: "/",
  },
  {
    title: "Supplier / Carrier portals",
    body: "White cards, slate borders, blue/violet accents for data UI, premium density without clutter.",
    href: "/auth/select",
  },
  {
    title: "Directory & loads",
    body: "Map-forward layouts, trust badges, verified labels, strong table/card hierarchy.",
    href: "/directory",
  },
  {
    title: "Support & docs",
    body: "Readable body copy, calm backgrounds, clear step lists, accessible contrast ratios.",
    href: "/support",
  },
];

export const toneWords = {
  use: ["Verified", "Live", "Lane-fit", "POD", "Payout", "In transit", "Post a load", "Smart matching"],
  avoid: ["Revolutionary", "Disruptive", "Synergy", "Best-in-class", "Maybe", "Kind of", "ASAP!!!"],
};

export const logoDonts = [
  "Do not stretch, rotate, or skew the logo.",
  "Do not change logo colors outside approved variants.",
  "Do not place the logo on busy photos without a solid overlay.",
  "Do not use Alpha Lime wordmark on lime backgrounds (contrast fail).",
  "Minimum clear space: height of the logo symbol on all sides.",
];
