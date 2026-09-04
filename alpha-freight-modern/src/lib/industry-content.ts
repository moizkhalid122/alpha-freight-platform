export type IndustryIconKey = "building" | "shopping" | "utensils" | "pill" | "car" | "package";

export type IndustrySlug =
  | "construction"
  | "retail"
  | "food"
  | "pharmaceuticals"
  | "automotive"
  | "general-freight";

export const INDUSTRY_SLUGS: IndustrySlug[] = [
  "construction",
  "retail",
  "food",
  "pharmaceuticals",
  "automotive",
  "general-freight",
];

export type IndustrySeo = {
  title: string;
  description: string;
  keywords: string[];
};

export type IndustryContent = {
  slug: IndustrySlug;
  path: string;
  name: string;
  tagline: string;
  iconKey: IndustryIconKey;
  accent: string;
  heroImage: string;
  /** Optional full-bleed hero background video (e.g. construction haulage). */
  heroVideo?: string;
  /** Word(s) highlighted in the premium serif hero headline. */
  heroHeadlineAccent?: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  seo: IndustrySeo;
  stats: Array<{ label: string; value: string }>;
  /** Premium milestone block (construction page). */
  milestones?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ value: string; label: string; iconKey: "truck" | "shield" | "map" | "check" }>;
  };
  /** Premium image showcase grid (construction page). */
  showcase?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ title: string; meta: string; image: string; size: "large" | "small"; objectPosition?: string }>;
  };
  /** Premium black feature band (construction page). */
  blackFeature?: boolean;
  /** Premium section headings (optional overrides). */
  overviewTitle?: string;
  capabilitiesTitle?: string;
  requirementsTitle?: string;
  informationIntro: string;
  informationPoints: Array<{ title: string; desc: string }>;
  capabilities: Array<{ title: string; desc: string }>;
  equipment: string[];
  processTitle: string;
  processIntro: string;
  processSteps: Array<{ step: string; title: string; desc: string }>;
  requirements: string[];
  faqs: Array<{ q: string; a: string }>;
  signupHref: string;
  signupLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  ctaTitle: string;
  ctaSubtitle: string;
};

export const industriesHubSeo: IndustrySeo = {
  title: "Industry Freight Solutions UK | Construction, Retail, Food & More | Alpha Freight",
  description:
    "Specialist UK freight solutions by industry — construction haulage, retail distribution, food & beverage, pharmaceuticals, automotive parts, and general freight on Alpha Freight's verified carrier marketplace.",
  keywords: [
    "industry freight UK",
    "sector haulage solutions",
    "construction freight UK",
    "retail distribution UK",
    "food haulage UK",
    "pharmaceutical logistics UK",
    "automotive parts freight",
    "general freight UK",
  ],
};

export const industriesHubContent = {
  eyebrow: "Industry solutions",
  title: "Freight built for your sector.",
  subtitle:
    "Alpha Freight connects UK businesses with verified carriers specialising in construction, retail, food, pharmaceuticals, automotive, and general freight — live tracking, digital POD, and marketplace pricing on every load.",
  introTitle: "One marketplace across every UK freight vertical.",
  introBody:
    "Whether you move aggregates to site, chilled food to depot, or automotive parts to production lines, Alpha Freight gives suppliers and carriers the same verified workflow — post, bid, track, and settle without broker noise.",
  stats: [
    { value: 6, suffix: "", description: "specialist industry freight solutions on Alpha Freight" },
    { value: 500, suffix: "+", description: "verified UK carriers across equipment types and sectors" },
    { value: 100, suffix: "%", description: "carrier verification before bidding on industry loads" },
    { value: 7, suffix: " days", description: "carrier payout window after verified delivery" },
  ],
  platformEyebrow: "Cross-sector platform",
  platformTitle: "Specialist haulage. Same trusted workflow.",
  platformBody:
    "Industry pages are not separate products — they are tailored entry points into one UK marketplace. Post loads with sector-specific equipment, match lane-fit carriers, and run every delivery on live tracking and digital POD.",
  processSteps: [
    {
      step: "01",
      title: "Choose your sector",
      desc: "Start from construction, retail, food, pharma, automotive, or general freight — each with equipment and compliance context built in.",
    },
    {
      step: "02",
      title: "Post or discover loads",
      desc: "Suppliers publish freight in minutes. Carriers browse live lanes matched to equipment, region, and industry requirements.",
    },
    {
      step: "03",
      title: "Track through delivery",
      desc: "Live GPS, digital POD, and verified settlement on every sector — from site tipper runs to GDP-aware pharma lanes.",
    },
  ],
};

export const industryContents: IndustryContent[] = [
  {
    slug: "construction",
    path: "/industries/construction",
    name: "Construction",
    tagline: "Aggregates, steel, plant & site deliveries",
    iconKey: "building",
    accent: "#E8A838",
    heroImage: "/images/construction-hero.webp",
    heroHeadlineAccent: "site forward",
    eyebrow: "Construction freight UK",
    heroTitle: "Construction haulage that moves your site forward",
    heroSubtitle:
      "Move aggregates, steel, timber, plant equipment, and building materials across the UK with verified flatbed and tipper carriers — live tracking, digital POD, and marketplace pricing from Alpha Freight.",
    seo: {
      title: "Construction Freight & Haulage UK | Aggregates, Steel & Site Deliveries | Alpha Freight",
      description:
        "UK construction freight on Alpha Freight — post site loads, match flatbed and tipper carriers, track deliveries live, and settle with digital POD. Aggregates, steel, timber, and plant equipment.",
      keywords: [
        "construction freight UK",
        "construction haulage",
        "aggregates haulage UK",
        "flatbed construction loads",
        "site delivery haulage",
        "building materials transport UK",
        "tipper haulage UK",
      ],
    },
    stats: [
      { label: "Equipment types", value: "Flatbed · Tipper · Hiab" },
      { label: "Carrier verification", value: "100%" },
      { label: "POD settlement", value: "Digital" },
      { label: "UK coverage", value: "Nationwide" },
    ],
    milestones: {
      eyebrow: "Built for construction",
      title: "A few numbers behind the platform",
      subtitle:
        "Verified carriers, live tracking, and digital POD from first load post to final delivery.",
      items: [
        { value: "6+", label: "Equipment types supported", iconKey: "truck" },
        { value: "100%", label: "Verified carrier network", iconKey: "shield" },
        { value: "UK-wide", label: "Nationwide site coverage", iconKey: "map" },
        { value: "Digital", label: "POD on every delivery", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected loads",
      title: "Haulage shaped by site discipline",
      subtitle:
        "From aggregate runs and steel deliveries to plant moves — verified carriers moving materials across UK construction programmes.",
      items: [
        {
          title: "Aggregate & tipper runs",
          meta: "Quarry · Midlands",
          image: "/images/construction-showcase-1.avif",
          size: "large",
        },
        {
          title: "Steel & structural delivery",
          meta: "Merchant · London",
          image: "/images/construction-showcase-2.jpg",
          size: "large",
        },
        {
          title: "Flatbed site drops",
          meta: "Civils · Manchester",
          image: "/images/construction-showcase-3.jpg",
          size: "small",
        },
        {
          title: "Plant & equipment moves",
          meta: "Plant hire · Leeds",
          image: "/images/construction-showcase-4.jpg",
          size: "small",
          objectPosition: "center 68%",
        },
        {
          title: "Just-in-time pours",
          meta: "Contractor · Bristol",
          image: "/images/construction-showcase-5.jpg",
          size: "small",
          objectPosition: "center 68%",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for contractors, merchants & plant hire",
    capabilitiesTitle: "What we move on UK construction sites",
    requirementsTitle: "Load requirements for construction freight",
    informationIntro:
      "Construction projects depend on reliable inbound materials and outbound waste movements. Alpha Freight connects contractors, merchants, and plant hire firms with verified UK carriers specialising in construction freight — without the delays of traditional broker phone chains.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "Main contractors, builders' merchants, steel stockists, plant hire, demolition, and civils teams moving materials site-to-site.",
      },
      {
        title: "Typical loads",
        desc: "Aggregates, sand, cement, steel sections, timber packs, scaffolding, prefabricated units, mini excavators, and skip movements.",
      },
      {
        title: "Carrier matching",
        desc: "AI matching scores lane fit, flatbed/tipper capability, ADR where required, and carrier reliability before you assign.",
      },
      {
        title: "Site coordination",
        desc: "Share delivery windows, gate instructions, and contact details in the load brief — carriers see everything before they bid.",
      },
      {
        title: "Visibility",
        desc: "Live GPS tracking from collection to site. Digital proof of delivery with photos reduces disputes on tight programmes.",
      },
      {
        title: "Pricing transparency",
        desc: "Compare carrier bids on one board. Fixed marketplace fees — no hidden broker mark-ups on your haulage rate.",
      },
    ],
    capabilities: [
      {
        title: "Flatbed & curtain-side",
        desc: "Long-length steel, timber, and packaged building products with proper load restraint planning.",
      },
      {
        title: "Tipper & bulk",
        desc: "Aggregates, sand, and bulk fills with carriers experienced in quarry-to-site corridors.",
      },
      {
        title: "Hiab & self-load",
        desc: "Deliveries where crane offload is required — match carriers with the right equipment profile.",
      },
      {
        title: "Time-critical site slots",
        desc: "Book morning pours and just-in-time deliveries with carriers rated for punctuality on construction lanes.",
      },
    ],
    equipment: ["Flatbed", "Tipper", "Curtain-side", "Hiab", "Low loader", "ADR (where required)"],
    processTitle: "How construction freight works on Alpha Freight",
    processIntro:
      "From first load post to POD approval — a streamlined workflow designed for site teams and transport managers.",
    processSteps: [
      {
        step: "01",
        title: "Post your construction load",
        desc: "Enter pickup (quarry, merchant, or depot), site delivery, weight, dimensions, equipment needed, and any site access notes.",
      },
      {
        step: "02",
        title: "Receive verified carrier bids",
        desc: "Carriers with construction specialisation review your load and submit competitive bids — compare price, ETA, and fit score.",
      },
      {
        step: "03",
        title: "Assign & track live",
        desc: "Award the job, share updates with your site team, and monitor the vehicle in transit until arrival.",
      },
      {
        step: "04",
        title: "Confirm POD & close",
        desc: "Approve digital proof of delivery with signature and photos. Release payment and build a preferred carrier list for repeat lanes.",
      },
    ],
    requirements: [
      "Accurate weights and dimensions — especially for steel and plant moves",
      "Site contact name and mobile for gate access",
      "Delivery window or slot booking where crane or pour teams are involved",
      "Load restraint notes for long or irregular items",
      "ADR documentation when moving fuel, chemicals, or hazmat to site",
    ],
    faqs: [
      {
        q: "Can I book flatbed carriers for steel and long-length materials?",
        a: "Yes. Specify flatbed or step-frame requirements in your load post. Carriers with construction specialisation and the right equipment can bid on your lane.",
      },
      {
        q: "Do you handle aggregate and tipper loads?",
        a: "Alpha Freight supports bulk and tipper movements. Include material type, approximate tonnage, and any weighbridge requirements in your brief.",
      },
      {
        q: "How quickly can I get a carrier for an urgent site delivery?",
        a: "Many lanes receive bids within minutes. For same-day requirements, post early with clear pickup and delivery windows and prioritise carriers with strong on-time scores.",
      },
      {
        q: "Is live tracking available for construction deliveries?",
        a: "Yes. Once assigned, you can track the shipment through the supplier dashboard and share status with site managers.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post a construction load",
    secondaryHref: "/find-loads",
    secondaryLabel: "Find construction loads",
    ctaTitle: "Move your next site load with confidence",
    ctaSubtitle:
      "Join UK contractors and merchants using Alpha Freight for construction haulage — verified carriers, live tracking, and digital POD on every delivery.",
  },
  {
    slug: "retail",
    path: "/industries/retail",
    name: "Retail",
    tagline: "Store replenishment & distribution centre runs",
    iconKey: "shopping",
    accent: "#6366f1",
    heroImage: "/images/retail-hero.png",
    heroHeadlineAccent: "shelves stocked",
    eyebrow: "Retail & distribution freight UK",
    heroTitle: "Retail freight that keeps shelves stocked",
    heroSubtitle:
      "Connect warehouses, distribution centres, and stores with verified UK carriers for store deliveries, DC transfers, and high-volume distribution — with tracking, POD, and predictable marketplace pricing.",
    seo: {
      title: "Retail Freight & Distribution UK | Store Deliveries & DC Runs | Alpha Freight",
      description:
        "UK retail freight solutions on Alpha Freight — store replenishment, warehouse-to-DC moves, multi-drop distribution, and e-commerce fulfilment haulage with verified carriers and live tracking.",
      keywords: [
        "retail freight UK",
        "store delivery haulage",
        "distribution centre freight",
        "retail logistics UK",
        "warehouse to store delivery",
        "retail distribution haulage",
        "e-commerce freight UK",
      ],
    },
    stats: [
      { label: "Multi-drop ready", value: "Yes" },
      { label: "POD capture", value: "Digital" },
      { label: "Carrier network", value: "Verified" },
      { label: "Settlement", value: "Secure" },
    ],
    milestones: {
      eyebrow: "Built for retail logistics",
      title: "Shelf-ready delivery, every time",
      subtitle:
        "Verified carriers, live tracking, and digital POD from distribution centre to store floor — built for omnichannel retail teams.",
      items: [
        { value: "Multi-drop", label: "Store route planning", iconKey: "truck" },
        { value: "100%", label: "Verified carrier network", iconKey: "shield" },
        { value: "UK-wide", label: "DC & store coverage", iconKey: "map" },
        { value: "Digital", label: "POD on every handover", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected movements",
      title: "Haulage that keeps retail moving",
      subtitle:
        "From DC trunking and store replenishment to fulfilment peaks and returns — verified carriers across UK retail supply chains.",
      items: [
        {
          title: "DC-to-store replenishment",
          meta: "Trunking · Midlands",
          image: "/images/retail-showcase-1.png",
          size: "large",
        },
        {
          title: "Warehouse fulfilment runs",
          meta: "3PL · Manchester",
          image: "/images/retail-showcase-2nd.jpg",
          size: "large",
        },
        {
          title: "Multi-drop store delivery",
          meta: "High street · London",
          image: "/images/retail-showcase-3rd.jpg",
          size: "small",
          objectPosition: "center 88%",
        },
        {
          title: "Peak season capacity",
          meta: "E-commerce · Yorkshire",
          image: "/images/retail-showcase-4.jpg",
          size: "small",
        },
        {
          title: "Returns & reverse logistics",
          meta: "Store · Bristol",
          image: "/images/retail-showcase-5.jpg",
          size: "small",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for retailers, 3PLs & fulfilment teams",
    capabilitiesTitle: "What we move across UK retail networks",
    requirementsTitle: "Load requirements for retail freight",
    informationIntro:
      "Retail and omnichannel businesses need haulage that hits delivery windows and protects brand standards at every handover. Alpha Freight gives retail logistics teams a single marketplace to source capacity for DC runs, store deliveries, and promotional peaks.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "High-street retailers, grocery chains, e-commerce brands, 3PLs, and fulfilment operators moving stock across the UK.",
      },
      {
        title: "Typical loads",
        desc: "Palletised stock, roll cages, hanging garments, promotional fixtures, returns, and seasonal inventory pushes.",
      },
      {
        title: "Delivery precision",
        desc: "Book timed deliveries to stores and DCs with clear booking-in instructions visible to carriers before assignment.",
      },
      {
        title: "Multi-drop routes",
        desc: "Plan routes with multiple delivery points — carriers see the full run and bid with accurate pricing.",
      },
      {
        title: "Peak capacity",
        desc: "Scale capacity for Black Friday, seasonal peaks, and range resets without long-term contract lock-in.",
      },
      {
        title: "Returns & reverse logistics",
        desc: "Coordinate store-to-DC returns and recall movements with the same verified carrier pool.",
      },
    ],
    capabilities: [
      {
        title: "DC-to-store replenishment",
        desc: "Regular trunking and store delivery lanes with carriers experienced in retail handover standards.",
      },
      {
        title: "Warehouse & fulfilment",
        desc: "Moves between fulfilment centres, 3PLs, and last-mile hubs for omnichannel operations.",
      },
      {
        title: "Tail-lift & ground delivery",
        desc: "Locations without docks — match carriers offering tail-lift and manual handling capability.",
      },
      {
        title: "Temperature-controlled retail",
        desc: "Chilled and frozen retail lines with refrigerated carriers when your range requires it.",
      },
    ],
    equipment: ["Curtain-side", "Box van", "Refrigerated", "Tail lift", "Double-deck trailer"],
    processTitle: "How retail freight works on Alpha Freight",
    processIntro:
      "Source reliable retail haulage in four steps — from load posting to confirmed delivery at store or DC.",
    processSteps: [
      {
        step: "01",
        title: "Define your retail movement",
        desc: "Post pallet count, delivery points, booking references, tail-lift requirements, and any time windows for store receiving teams.",
      },
      {
        step: "02",
        title: "Compare carrier bids",
        desc: "Review bids from carriers with retail specialisation — evaluate price, equipment, and reliability on your lanes.",
      },
      {
        step: "03",
        title: "Track every handover",
        desc: "Monitor progress to each drop. Site teams see when the vehicle is en route and when POD is captured.",
      },
      {
        step: "04",
        title: "Approve POD & analyse lanes",
        desc: "Digital POD with signatures and photos. Build preferred carriers for recurring DC and store routes.",
      },
    ],
    requirements: [
      "Store or DC delivery windows and booking references",
      "Pallet count, weight, and stackability notes",
      "Tail-lift or dock requirements at each drop",
      "Returns paperwork where applicable",
      "Temperature specification for chilled or frozen lines",
    ],
    faqs: [
      {
        q: "Can Alpha Freight handle multi-drop store deliveries?",
        a: "Yes. Include all delivery points in your load brief so carriers can price the full route accurately before bidding.",
      },
      {
        q: "Do you support e-commerce and fulfilment centre moves?",
        a: "Retail and e-commerce fulfilment moves are a core use case — warehouse-to-hub, hub-to-store, and peak-season capacity.",
      },
      {
        q: "How do carriers prove delivery to retail receiving teams?",
        a: "Digital POD with signature, timestamp, and optional photos is captured on delivery and synced to your dashboard.",
      },
      {
        q: "Can we use the same carriers for recurring weekly routes?",
        a: "Yes. Save preferred carriers and re-post regular lanes to streamline replenishment and DC trunking.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post a retail load",
    secondaryHref: "/services/04",
    secondaryLabel: "Warehouse services",
    ctaTitle: "Keep retail moving at shelf speed",
    ctaSubtitle:
      "Post store and DC freight on Alpha Freight — verified UK carriers, live tracking, and professional POD on every delivery.",
  },
  {
    slug: "food",
    path: "/industries/food",
    name: "Food & Beverage",
    tagline: "Chilled, ambient & bulk food haulage",
    iconKey: "utensils",
    accent: "#6B9E7A",
    heroImage: "/images/food-hero.jpg",
    heroHeadlineAccent: "temperature integrity",
    eyebrow: "Food & beverage haulage UK",
    heroTitle: "Food freight with temperature integrity",
    heroSubtitle:
      "Move chilled, frozen, and ambient food and beverage products across the UK with verified refrigerated carriers — hygiene-aware handling, live tracking, and digital POD for audit-ready logistics.",
    seo: {
      title: "Food & Beverage Haulage UK | Chilled & Frozen Freight | Alpha Freight",
      description:
        "UK food and beverage freight on Alpha Freight — refrigerated haulage, ambient grocery, bulk ingredients, and beverage distribution with verified carriers, temperature compliance, and digital POD.",
      keywords: [
        "food haulage UK",
        "refrigerated freight UK",
        "chilled food transport",
        "frozen food haulage",
        "beverage distribution UK",
        "food logistics marketplace",
        "temperature controlled haulage",
      ],
    },
    stats: [
      { label: "Refrigerated", value: "Supported" },
      { label: "POD audit trail", value: "Digital" },
      { label: "Carrier vetting", value: "Verified" },
      { label: "UK lanes", value: "Nationwide" },
    ],
    milestones: {
      eyebrow: "Built for food logistics",
      title: "Cold chain discipline, end to end",
      subtitle:
        "Verified refrigerated carriers, live tracking, and digital POD from collection to DC or store handover.",
      items: [
        { value: "Multi-temp", label: "Chilled, frozen & ambient", iconKey: "truck" },
        { value: "100%", label: "Verified carrier network", iconKey: "shield" },
        { value: "UK-wide", label: "DC & store coverage", iconKey: "map" },
        { value: "Digital", label: "Audit-ready POD", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected loads",
      title: "Haulage shaped by product integrity",
      subtitle:
        "From chilled DC runs and frozen lines to ambient grocery and beverage distribution — verified carriers moving food across UK supply chains.",
      items: [
        {
          title: "Chilled & frozen lines",
          meta: "DC · Birmingham",
          image: "/images/food-showcase-1.jpg",
          size: "large",
        },
        {
          title: "Ambient grocery distribution",
          meta: "Wholesale · Bristol",
          image: "/images/food-showcase-2.jpg",
          size: "large",
        },
        {
          title: "Brewery & beverage runs",
          meta: "Beverage · Yorkshire",
          image: "/images/food-showcase-3.jpg",
          size: "small",
        },
        {
          title: "Bulk ingredients",
          meta: "Manufacturing · Midlands",
          image: "/images/food-showcase-4.jpg",
          size: "small",
        },
        {
          title: "Store & event delivery",
          meta: "Retail · London",
          image: "/images/food-showcase-5.jpg",
          size: "small",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for producers, wholesalers & retailers",
    capabilitiesTitle: "What we move across UK food supply chains",
    requirementsTitle: "Load requirements for food & beverage freight",
    informationIntro:
      "Food and beverage supply chains cannot compromise on temperature, timing, or traceability. Alpha Freight connects producers, wholesalers, and retailers with verified carriers specialising in food haulage — from chilled DC runs to ambient bulk ingredients.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "Food manufacturers, wholesalers, breweries, dairies, meal-kit brands, and grocery suppliers moving product across the UK.",
      },
      {
        title: "Typical loads",
        desc: "Chilled ready meals, dairy, produce, frozen goods, ambient grocery, bulk ingredients, and beverage pallets.",
      },
      {
        title: "Temperature control",
        desc: "Specify chilled, frozen, or ambient requirements. Match carriers with the correct refrigerated or multi-temp capability.",
      },
      {
        title: "Hygiene & handling",
        desc: "Carriers with food specialisation understand clean vehicle standards and careful handover at DC and store.",
      },
      {
        title: "Short shelf-life lanes",
        desc: "Prioritise punctual carriers for time-sensitive product with tight use-by windows.",
      },
      {
        title: "Audit-ready POD",
        desc: "Timestamped digital proof of delivery supports food safety and customer compliance records.",
      },
    ],
    capabilities: [
      {
        title: "Chilled & frozen",
        desc: "Refrigerated trailers and vans for dairy, meat, produce, and frozen lines with clear temp specs in the load brief.",
      },
      {
        title: "Ambient grocery",
        desc: "Dry and ambient food products on curtain-side and box vehicles for wholesale and retail distribution.",
      },
      {
        title: "Bulk & ingredients",
        desc: "Bulk tankers and tipper movements for ingredients and beverage raw materials where applicable.",
      },
      {
        title: "Promotional & event",
        desc: "One-off food service and event deliveries with flexible marketplace capacity.",
      },
    ],
    equipment: ["Refrigerated trailer", "Chilled van", "Multi-temp", "Curtain-side", "Bulk tanker"],
    processTitle: "How food freight works on Alpha Freight",
    processIntro:
      "Protect product integrity from collection to delivery with a workflow built for food logistics teams.",
    processSteps: [
      {
        step: "01",
        title: "Post with temperature specs",
        desc: "State chilled, frozen, or ambient requirements, pallet count, use-by sensitivity, and any hygiene or seal instructions.",
      },
      {
        step: "02",
        title: "Match refrigerated carriers",
        desc: "Carriers with Food specialisation and the right equipment submit bids — compare fit, ETA, and track record.",
      },
      {
        step: "03",
        title: "Track in transit",
        desc: "Monitor the movement live. Share ETA updates with receiving teams at DC or store.",
      },
      {
        step: "04",
        title: "Capture POD & close",
        desc: "Approve digital POD on delivery. Maintain a clear audit trail for each food movement.",
      },
    ],
    requirements: [
      "Temperature range clearly stated (chilled / frozen / ambient)",
      "Pallet count, weight, and stack height",
      "Use-by or production date sensitivity if applicable",
      "Receiving slot or booking reference at DC",
      "Any allergen segregation or co-load restrictions noted in the brief",
    ],
    faqs: [
      {
        q: "Can I book refrigerated carriers for chilled and frozen food?",
        a: "Yes. Mark your load as refrigerated and specify the required temperature band. Carriers with food specialisation and suitable equipment will bid.",
      },
      {
        q: "How does Alpha Freight help with food audit trails?",
        a: "Digital POD records delivery time, location, signature, and optional photos — giving you documentation for customer and compliance reviews.",
      },
      {
        q: "Do you handle brewery and beverage distribution?",
        a: "Food & beverage includes ambient and chilled drinks movements — kegs, bottles, cans, and bulk ingredients across UK lanes.",
      },
      {
        q: "What if a delivery is time-critical for short shelf-life product?",
        a: "Post clear delivery deadlines and prioritise carriers with strong on-time performance scores on similar lanes.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post a food load",
    secondaryHref: "/directory",
    secondaryLabel: "Find food carriers",
    ctaTitle: "Protect every food mile",
    ctaSubtitle:
      "Source verified refrigerated and ambient carriers on Alpha Freight — built for UK food and beverage logistics teams.",
  },
  {
    slug: "pharmaceuticals",
    path: "/industries/pharmaceuticals",
    name: "Pharmaceuticals",
    tagline: "GDP-aware pharma & healthcare logistics",
    iconKey: "pill",
    accent: "#06B6D4",
    heroImage: "/images/pharma-hero.avif",
    heroVideo: "/videos/pharma-hero.mp4",
    heroHeadlineAccent: "compliance in mind",
    eyebrow: "Pharmaceutical logistics UK",
    heroTitle: "Pharmaceutical freight with compliance in mind",
    heroSubtitle:
      "Move pharmaceuticals, healthcare products, and clinical supplies across the UK with verified carriers — temperature-controlled options, careful handling, live tracking, and audit-ready digital POD.",
    seo: {
      title: "Pharmaceutical Logistics UK | Healthcare & Pharma Freight | Alpha Freight",
      description:
        "UK pharmaceutical and healthcare freight on Alpha Freight — GDP-aware haulage, temperature-controlled pharma transport, clinical supplies, and verified carriers with digital POD and live tracking.",
      keywords: [
        "pharmaceutical logistics UK",
        "pharma freight UK",
        "healthcare transport UK",
        "GDP haulage",
        "temperature controlled pharma",
        "clinical supplies delivery",
        "pharmaceutical distribution UK",
      ],
    },
    stats: [
      { label: "Temp control", value: "2–8°C & ambient" },
      { label: "POD records", value: "Timestamped" },
      { label: "Carrier pool", value: "Verified" },
      { label: "Tracking", value: "Live GPS" },
    ],
    milestones: {
      eyebrow: "Built for healthcare logistics",
      title: "Precision from depot to patient",
      subtitle:
        "GDP-aware specifications, verified carriers, live tracking, and timestamped digital POD across UK pharmaceutical supply chains.",
      items: [
        { value: "2–8°C", label: "Chilled pharma bands", iconKey: "truck" },
        { value: "100%", label: "Verified carrier pool", iconKey: "shield" },
        { value: "UK-wide", label: "Hospital & pharmacy lanes", iconKey: "map" },
        { value: "Digital", label: "Audit-ready POD", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected movements",
      title: "Logistics shaped by clinical discipline",
      subtitle:
        "From chilled medicines and vaccines to ambient devices and trial materials — verified carriers moving healthcare freight across the UK.",
      items: [
        {
          title: "Chilled medicines & vaccines",
          meta: "Wholesale · London",
          image: "/images/pharma-showcase-1.avif",
          size: "large",
        },
        {
          title: "Hospital & pharmacy delivery",
          meta: "NHS trust · Midlands",
          image: "/images/pharma-showcase-2.avif",
          size: "large",
        },
        {
          title: "Clinical trial materials",
          meta: "Trial site · Manchester",
          image: "/images/pharma-showcase-3.avif",
          size: "small",
        },
        {
          title: "Medical devices & consumables",
          meta: "Healthcare · Bristol",
          image: "/images/pharma-showcase-4.jpg",
          size: "small",
        },
        {
          title: "Ambient pharmaceutical lines",
          meta: "Distribution · Leeds",
          image: "/images/pharma-showcase-5.jpg",
          size: "small",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for wholesalers, distributors & clinical teams",
    capabilitiesTitle: "What we move across UK healthcare networks",
    requirementsTitle: "Load requirements for pharmaceutical freight",
    informationIntro:
      "Pharmaceutical and healthcare logistics demands precision, documentation, and trustworthy carriers. Alpha Freight helps distributors, wholesalers, and healthcare suppliers source UK haulage with clear specifications, verified partners, and digital delivery records.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "Pharma wholesalers, healthcare distributors, clinical trial logistics teams, and medical device suppliers.",
      },
      {
        title: "Typical loads",
        desc: "Palletised medicines, vaccines, clinical trial materials, medical devices, and healthcare consumables.",
      },
      {
        title: "Temperature bands",
        desc: "Specify controlled ambient, chilled (2–8°C), or other requirements so only suitable refrigerated carriers bid.",
      },
      {
        title: "Chain of custody",
        desc: "Assignment, tracking, and POD create a clear record from collection to authorised receipt.",
      },
      {
        title: "Secure handling",
        desc: "High-value and sensitive healthcare freight — match carriers with Pharmaceuticals specialisation and strong ratings.",
      },
      {
        title: "Dedicated lanes",
        desc: "Build a preferred carrier list for recurring pharmacy and hospital delivery routes.",
      },
    ],
    capabilities: [
      {
        title: "Chilled pharma transport",
        desc: "Refrigerated vehicles for 2–8°C product with clear handling instructions in the load brief.",
      },
      {
        title: "Ambient healthcare",
        desc: "Controlled ambient movements for non-cold-chain pharmaceuticals and medical devices.",
      },
      {
        title: "Hospital & pharmacy delivery",
        desc: "Timed deliveries to NHS trusts, private hospitals, pharmacies, and wholesale depots.",
      },
      {
        title: "Clinical trial support",
        desc: "Flexible capacity for trial site deliveries and investigational product movements.",
      },
    ],
    equipment: ["Refrigerated van", "Refrigerated trailer", "Curtain-side", "Box van", "Tail lift"],
    processTitle: "How pharmaceutical freight works on Alpha Freight",
    processIntro:
      "A controlled workflow for healthcare logistics — from specification to documented delivery.",
    processSteps: [
      {
        step: "01",
        title: "Specify pharma requirements",
        desc: "Document temperature band, security needs, delivery authorisation, and receiving contact at hospital, pharmacy, or depot.",
      },
      {
        step: "02",
        title: "Select verified carriers",
        desc: "Review bids from carriers with Pharmaceuticals specialisation and appropriate refrigerated or ambient equipment.",
      },
      {
        step: "03",
        title: "Monitor the movement",
        desc: "Track in transit and share status with receiving teams. Reduce uncertainty on time-sensitive healthcare deliveries.",
      },
      {
        step: "04",
        title: "Document delivery",
        desc: "Digital POD with signature and timestamp supports your delivery records and customer reporting.",
      },
    ],
    requirements: [
      "Temperature requirement clearly stated",
      "Delivery authorisation or booking reference where required",
      "Named receiving contact at healthcare site",
      "Security or high-value notes for sensitive product",
      "Any segregation or co-load restrictions documented in the load brief",
    ],
    faqs: [
      {
        q: "Does Alpha Freight support GDP-compliant pharmaceutical transport?",
        a: "Alpha Freight provides verified carriers, temperature specifications, tracking, and digital POD. Customers remain responsible for selecting carriers and processes that meet their GDP and regulatory obligations.",
      },
      {
        q: "Can I move 2–8°C vaccines and chilled medicines?",
        a: "Yes. Mark loads as refrigerated with the required temperature band. Carriers with pharma experience and suitable equipment can bid on your lane.",
      },
      {
        q: "How is proof of delivery handled for healthcare freight?",
        a: "Carriers capture digital POD with signature, time, and location. Records sync to your dashboard for audit and customer reporting.",
      },
      {
        q: "Can we use preferred carriers for recurring pharmacy routes?",
        a: "Yes. Build a trusted carrier list and re-post regular lanes to streamline wholesale and pharmacy distribution.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post a pharma load",
    secondaryHref: "/contact",
    secondaryLabel: "Speak to our team",
    ctaTitle: "Healthcare freight you can document",
    ctaSubtitle:
      "Connect with verified UK carriers for pharmaceutical and healthcare logistics on Alpha Freight.",
  },
  {
    slug: "automotive",
    path: "/industries/automotive",
    name: "Automotive",
    tagline: "Parts, components & production freight",
    iconKey: "car",
    accent: "#E8650A",
    heroImage: "/images/automotive-hero.png",
    heroHeadlineAccent: "production lines",
    eyebrow: "Automotive freight UK",
    heroTitle: "Automotive parts freight for production lines",
    heroSubtitle:
      "Keep production and aftermarket supply chains moving with verified UK carriers for automotive parts, components, tyres, and finished vehicle logistics — just-in-time ready with live tracking and digital POD.",
    seo: {
      title: "Automotive Parts Freight UK | Components & JIT Logistics | Alpha Freight",
      description:
        "UK automotive freight on Alpha Freight — parts and components haulage, JIT production deliveries, aftermarket distribution, and tyre logistics with verified carriers and live tracking.",
      keywords: [
        "automotive freight UK",
        "car parts haulage",
        "automotive logistics UK",
        "JIT parts delivery",
        "automotive components transport",
        "tyre haulage UK",
        "aftermarket parts freight",
      ],
    },
    stats: [
      { label: "JIT-ready", value: "Yes" },
      { label: "Parts handling", value: "Specialist" },
      { label: "Tracking", value: "Real-time" },
      { label: "UK network", value: "Nationwide" },
    ],
    milestones: {
      eyebrow: "Built for automotive",
      title: "Precision freight for production and parts",
      subtitle:
        "Verified carriers, live tracking, and digital POD from plant feed to aftermarket depot.",
      items: [
        { value: "JIT", label: "Production window support", iconKey: "truck" },
        { value: "100%", label: "Verified carrier network", iconKey: "shield" },
        { value: "UK-wide", label: "Plant & depot coverage", iconKey: "map" },
        { value: "Digital", label: "POD on every delivery", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected movements",
      title: "Haulage shaped by line-side discipline",
      subtitle:
        "From tier supplier feeds to aftermarket trunking — automotive freight with the right equipment and timing.",
      items: [
        {
          title: "Production line feeds",
          meta: "Plant · JIT",
          image: "/images/automotive-showcase-production.jpg",
          size: "large",
          objectPosition: "center center",
        },
        {
          title: "Aftermarket trunking",
          meta: "DC → Depot",
          image: "/images/automotive-showcase-aftermarket.jpg",
          size: "large",
          objectPosition: "center 45%",
        },
        {
          title: "Tyre & bulk automotive",
          meta: "Curtain-side",
          image: "/images/automotive-showcase-3.png",
          size: "small",
          objectPosition: "center 35%",
        },
        {
          title: "Express parts",
          meta: "Urgent · AOG",
          image: "/images/automotive-showcase-4.jpg",
          size: "small",
          objectPosition: "center center",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for automotive supply chain teams",
    capabilitiesTitle: "What we move for automotive freight",
    requirementsTitle: "Load requirements for automotive parts",
    informationIntro:
      "Automotive supply chains run on precision timing and damage-free handling. Alpha Freight connects OEM suppliers, tier manufacturers, aftermarket distributors, and tyre operators with verified carriers experienced in automotive parts movements across the UK.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "Tier 1–3 suppliers, aftermarket distributors, tyre wholesalers, remanufacturers, and automotive logistics teams.",
      },
      {
        title: "Typical loads",
        desc: "Engine components, body panels, electronics, tyres, batteries, aftermarket parts, and production consumables.",
      },
      {
        title: "Just-in-time delivery",
        desc: "Post tight delivery windows for production line feeds — prioritise punctual carriers on critical lanes.",
      },
      {
        title: "Damage prevention",
        desc: "Specify packaging, stack limits, and handling notes so carriers bid with the right equipment and care.",
      },
      {
        title: "Aftermarket distribution",
        desc: "Hub-to-depot and depot-to-garage movements for fast-moving aftermarket parts networks.",
      },
      {
        title: "Returns & reverse flow",
        desc: "Coordinate warranty returns and core exchanges with the same verified carrier marketplace.",
      },
    ],
    capabilities: [
      {
        title: "Production line feeds",
        desc: "Scheduled and JIT deliveries to manufacturing plants and assembly sites with clear time windows.",
      },
      {
        title: "Aftermarket trunking",
        desc: "Regular lanes between national distribution centres and regional depots.",
      },
      {
        title: "Tyre & bulk automotive",
        desc: "Tyre pallets and heavier automotive product on appropriate curtain-side and box equipment.",
      },
      {
        title: "Express parts",
        desc: "Urgent breakdown and AOG-style parts movements when production or workshop downtime is costly.",
      },
    ],
    equipment: ["Curtain-side", "Box van", "Tail lift", "Flatbed", "Double-deck trailer"],
    processTitle: "How automotive freight works on Alpha Freight",
    processIntro:
      "Source automotive haulage in four steps — built for production planners and parts distributors.",
    processSteps: [
      {
        step: "01",
        title: "Post parts movement details",
        desc: "Include part type, pallet count, JIT window, plant or depot references, and any fragile or stack-limit notes.",
      },
      {
        step: "02",
        title: "Review automotive carrier bids",
        desc: "Carriers with Automotive specialisation submit bids — compare price, equipment, and on-time history.",
      },
      {
        step: "03",
        title: "Track to line-side or depot",
        desc: "Live tracking keeps production control and aftermarket teams informed until handover.",
      },
      {
        step: "04",
        title: "Confirm POD",
        desc: "Digital delivery confirmation closes the loop and supports supplier scorecards and customer SLAs.",
      },
    ],
    requirements: [
      "Accurate pallet count and weight",
      "Delivery window or JIT slot for production feeds",
      "Plant or depot gate reference and contact",
      "Fragile, non-stack, or orientation notes where applicable",
      "Returns documentation for core or warranty movements",
    ],
    faqs: [
      {
        q: "Can Alpha Freight support just-in-time automotive deliveries?",
        a: "Yes. Post clear delivery windows and use carrier reliability scores to select partners suited to JIT production lanes.",
      },
      {
        q: "Do you handle tyre and aftermarket parts distribution?",
        a: "Automotive includes tyre haulage and aftermarket trunking — from national DCs to regional depots and trade customers.",
      },
      {
        q: "What equipment is typically used for automotive parts?",
        a: "Most parts move on curtain-side, box, or tail-lift vehicles. Larger components may require flatbed — specify in your load post.",
      },
      {
        q: "Can we build preferred carriers for recurring plant routes?",
        a: "Yes. Save trusted carriers and re-post regular lanes to simplify scheduling and maintain consistent service levels.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post an automotive load",
    secondaryHref: "/find-loads",
    secondaryLabel: "Browse automotive loads",
    ctaTitle: "Keep automotive supply chains in motion",
    ctaSubtitle:
      "Post parts and components freight on Alpha Freight — verified carriers, live tracking, and professional POD for UK automotive logistics.",
  },
  {
    slug: "general-freight",
    path: "/industries/general-freight",
    name: "General Freight",
    tagline: "Everyday UK haulage & palletised goods",
    iconKey: "package",
    accent: "#334155",
    heroImage: "/images/general-freight-hero.jpg",
    heroHeadlineAccent: "everyday UK haulage",
    eyebrow: "General freight UK",
    heroTitle: "General freight for everyday UK haulage",
    heroSubtitle:
      "Post palletised goods, mixed freight, and standard UK haulage on Alpha Freight's verified carrier marketplace — transparent pricing, live tracking, digital POD, and 7-day carrier payouts.",
    seo: {
      title: "General Freight UK | Pallet Haulage & Everyday Logistics | Alpha Freight",
      description:
        "UK general freight on Alpha Freight — pallet haulage, mixed goods, standard FTL and LTL movements with verified carriers, live tracking, digital POD, and marketplace pricing. Free to post loads.",
      keywords: [
        "general freight UK",
        "pallet haulage UK",
        "general haulage marketplace",
        "UK freight loads",
        "standard haulage UK",
        "pallet delivery UK",
        "general cargo transport",
      ],
    },
    stats: [
      { label: "Load posting", value: "Free" },
      { label: "Service fee", value: "4%" },
      { label: "Carrier payout", value: "7 days" },
      { label: "UK coverage", value: "100%" },
    ],
    milestones: {
      eyebrow: "Built for general freight",
      title: "Everyday haulage, marketplace clarity",
      subtitle:
        "Free to post, verified carriers, live tracking, and digital POD on every standard UK load.",
      items: [
        { value: "Free", label: "Load posting on Alpha Freight", iconKey: "truck" },
        { value: "4%", label: "Transparent supplier fee", iconKey: "shield" },
        { value: "UK-wide", label: "Nationwide haulage coverage", iconKey: "map" },
        { value: "7-day", label: "Carrier payout window", iconKey: "check" },
      ],
    },
    showcase: {
      eyebrow: "Selected movements",
      title: "Haulage for everyday UK freight",
      subtitle:
        "From full loads and pallet runs to tail-lift delivery and recurring lanes — verified carriers on standard UK equipment.",
      items: [
        {
          title: "Full & partial loads",
          meta: "FTL · LTL",
          image: "/images/general-freight-showcase-ftl.jpg",
          size: "large",
          objectPosition: "center center",
        },
        {
          title: "Standard pallet haulage",
          meta: "Pallet · UK",
          image: "/images/general-freight-showcase-pallet.jpg",
          size: "large",
          objectPosition: "center center",
        },
        {
          title: "Tail-lift delivery",
          meta: "Ground level",
          image: "/images/general-freight-showcase-tail-lift.jpg",
          size: "small",
          objectPosition: "center 40%",
        },
        {
          title: "Recurring lanes",
          meta: "Regular routes",
          image: "/images/general-freight-showcase-lanes.jpg",
          size: "small",
          objectPosition: "center center",
        },
      ],
    },
    blackFeature: true,
    overviewTitle: "Built for everyday UK freight teams",
    capabilitiesTitle: "What we move for general freight",
    requirementsTitle: "Load requirements for general freight",
    informationIntro:
      "Not every shipment needs a specialist lane — but every shipment deserves a verified carrier and clear pricing. Alpha Freight is the UK marketplace for general freight: post loads, receive bids, track deliveries, and settle with digital POD.",
    informationPoints: [
      {
        title: "Who we serve",
        desc: "SMEs, manufacturers, wholesalers, and logistics teams moving everyday palletised and general cargo across the UK.",
      },
      {
        title: "Typical loads",
        desc: "Single and multi-pallet movements, boxed goods, machinery, packaging materials, and mixed general cargo.",
      },
      {
        title: "Flexible capacity",
        desc: "One-off loads or recurring lanes — scale up or down without long-term haulage contracts.",
      },
      {
        title: "Verified carriers",
        desc: "Every carrier on the marketplace passes verification before they bid on your freight.",
      },
      {
        title: "Transparent fees",
        desc: "Free to post. Suppliers pay a fixed 4% service fee — shown clearly before payment.",
      },
      {
        title: "Fast settlement",
        desc: "Carriers paid within 7 days of delivery and POD approval — attracting reliable capacity to your loads.",
      },
    ],
    capabilities: [
      {
        title: "Full & partial loads",
        desc: "FTL and LTL options — dedicated vehicles or shared capacity depending on volume and budget.",
      },
      {
        title: "Standard pallet haulage",
        desc: "UK pallet networks and point-to-point movements on curtain-side and box vehicles.",
      },
      {
        title: "Tail-lift delivery",
        desc: "Ground-level delivery where no loading dock is available.",
      },
      {
        title: "Recurring lanes",
        desc: "Re-post regular routes and build a preferred carrier pool for consistent general freight.",
      },
    ],
    equipment: ["Curtain-side", "Box van", "Tail lift", "Flatbed", "Refrigerated"],
    processTitle: "How general freight works on Alpha Freight",
    processIntro:
      "The standard Alpha Freight workflow — simple, transparent, and built for everyday UK haulage.",
    processSteps: [
      {
        step: "01",
        title: "Create a free supplier account",
        desc: "Sign up in minutes. No monthly subscription — pay only when your load goes live.",
      },
      {
        step: "02",
        title: "Post your load",
        desc: "Enter pickup, delivery, pallet count, weight, and any special requirements. Your load appears on the board.",
      },
      {
        step: "03",
        title: "Choose the best bid",
        desc: "Verified carriers submit competitive bids. Compare price, ETA, and carrier ratings before you assign.",
      },
      {
        step: "04",
        title: "Track, deliver, approve POD",
        desc: "Monitor the shipment live. Approve digital POD on delivery and release secure payment.",
      },
    ],
    requirements: [
      "Pickup and delivery postcodes with contact details",
      "Pallet count or dimensions and total weight",
      "Tail-lift or dock requirements if applicable",
      "Any time windows for collection or delivery",
      "Special handling notes for fragile or high-value goods",
    ],
    faqs: [
      {
        q: "How much does it cost to post general freight on Alpha Freight?",
        a: "Account creation and load posting are free. Suppliers pay a fixed 4% Alpha Freight service fee on the load price before delivery goes live.",
      },
      {
        q: "What types of general freight can I move?",
        a: "Palletised goods, boxed cargo, machinery, packaging, and mixed general haulage across standard UK equipment types.",
      },
      {
        q: "How quickly will I receive carrier bids?",
        a: "Popular lanes often receive bids within minutes of posting. Clear load details help carriers price accurately and respond faster.",
      },
      {
        q: "Is tracking included for general freight?",
        a: "Yes. Live tracking is available once a carrier is assigned and the shipment is in transit.",
      },
    ],
    signupHref: "/auth/signup?role=supplier",
    signupLabel: "Post general freight",
    secondaryHref: "/pricing",
    secondaryLabel: "View pricing",
    ctaTitle: "Your everyday haulage marketplace",
    ctaSubtitle:
      "Post general freight on Alpha Freight — verified UK carriers, live tracking, and digital POD on every load.",
  },
];

export function getIndustryBySlug(slug: string): IndustryContent | undefined {
  return industryContents.find((item) => item.slug === slug);
}

export function getAllIndustries(): IndustryContent[] {
  return industryContents;
}

export function getOtherIndustries(slug: IndustrySlug): IndustryContent[] {
  return industryContents.filter((item) => item.slug !== slug);
}
