import {
  BarChart3,
  Banknote,
  BookOpen,
  Bot,
  Building2,
  Calculator,
  Car,
  ClipboardList,
  Code2,
  Factory,
  FileCheck,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Network,
  Package,
  Pill,
  Route,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavMegaItem = { nameKey: string; descKey: string; href: string };
export type NavMegaCategory = { categoryKey: string; items: NavMegaItem[] };
export type NavWhyCard = { titleKey: string; descKey: string; href: string; image: string };
export type NavWhyFeature = {
  titleKey: string;
  descKey: string;
  href: string;
  icon: LucideIcon;
  useAiLottie?: boolean;
};

export type NavItemDef = {
  id: string;
  nameKey: string;
  href: string;
  dropdown?: { nameKey: string; href: string; descKey: string }[];
  megaMenu?: NavMegaCategory[];
  whyMenu?: {
    cards: NavWhyCard[];
    sidebarTitleKey: string;
    features: NavWhyFeature[];
  };
  xlOnly?: boolean;
};

export const whyAlphaMenuDef = {
  cards: [
    {
      titleKey: "why.getStarted",
      descKey: "why.getStartedDesc",
      href: "/auth/signup?role=supplier",
      image: "/images/pricing-card-supplier.png",
    },
    {
      titleKey: "why.switch",
      descKey: "why.switchDesc",
      href: "/solution",
      image: "/images/pricing-card-carrier.jpg",
    },
    {
      titleKey: "why.trusted",
      descKey: "why.trustedDesc",
      href: "/directory",
      image: "/images/pricing-card-enterprise.png",
    },
  ],
  sidebarTitleKey: "why.sidebarTitle",
  features: [
    {
      titleKey: "why.alphaAi",
      descKey: "why.alphaAiDesc",
      href: "/ai",
      icon: Bot,
      useAiLottie: true,
    },
    {
      titleKey: "why.payout",
      descKey: "why.payoutDesc",
      href: "/about",
      icon: Banknote,
    },
  ],
};

export const navLinkDefs: NavItemDef[] = [
  { id: "home", nameKey: "nav.home", href: "/" },
  { id: "whyAlpha", nameKey: "nav.whyAlpha", href: "/about", whyMenu: whyAlphaMenuDef },
  {
    id: "products",
    nameKey: "nav.products",
    href: "#",
    megaMenu: [
      {
        categoryKey: "mega.software",
        items: [
          { nameKey: "mega.supplierPortal", descKey: "mega.supplierPortalDesc", href: "/products/supplier-portal" },
          { nameKey: "mega.mobileApp", descKey: "mega.mobileAppDesc", href: "/products/mobile-app" },
          { nameKey: "mega.whiteLabel", descKey: "mega.whiteLabelDesc", href: "/products/white-label" },
          { nameKey: "mega.apiDocs", descKey: "mega.apiDocsDesc", href: "/products/api" },
        ],
      },
      {
        categoryKey: "mega.fleet",
        items: [
          { nameKey: "mega.tracking", descKey: "mega.trackingDesc", href: "/products/tracking" },
          { nameKey: "mega.optimizer", descKey: "mega.optimizerDesc", href: "/products/optimizer" },
          { nameKey: "mega.pod", descKey: "mega.podDesc", href: "/products/pod" },
        ],
      },
      {
        categoryKey: "mega.intelligence",
        items: [
          { nameKey: "mega.analytics", descKey: "mega.analyticsDesc", href: "/products/analytics" },
          { nameKey: "mega.rates", descKey: "mega.ratesDesc", href: "/products/rates" },
          { nameKey: "mega.predictiveAi", descKey: "mega.predictiveAiDesc", href: "/products/ai" },
          { nameKey: "mega.freeUkAi", descKey: "mega.freeUkAiDesc", href: "/ai" },
        ],
      },
    ],
  },
  {
    id: "solution",
    nameKey: "nav.solution",
    href: "/solution",
    megaMenu: [
      {
        categoryKey: "mega.marketplace",
        items: [
          { nameKey: "mega.overview", descKey: "mega.overviewDesc", href: "/solution" },
          { nameKey: "mega.carrierDirectory", descKey: "mega.carrierDirectoryDesc", href: "/directory" },
          { nameKey: "mega.supplierDirectory", descKey: "mega.supplierDirectoryDesc", href: "/suppliers" },
          { nameKey: "mega.availableLoads", descKey: "mega.availableLoadsDesc", href: "/available-loads" },
          { nameKey: "mega.smartMatching", descKey: "mega.smartMatchingDesc", href: "/products/smart-matching" },
        ],
      },
      {
        categoryKey: "mega.industries",
        items: [
          { nameKey: "mega.allIndustries", descKey: "mega.allIndustriesDesc", href: "/industries" },
          { nameKey: "mega.construction", descKey: "mega.constructionDesc", href: "/industries/construction" },
          { nameKey: "mega.retail", descKey: "mega.retailDesc", href: "/industries/retail" },
          { nameKey: "mega.food", descKey: "mega.foodDesc", href: "/industries/food" },
        ],
      },
      {
        categoryKey: "mega.resources",
        items: [
          { nameKey: "mega.allTools", descKey: "mega.allToolsDesc", href: "/tools" },
          { nameKey: "mega.academy", descKey: "mega.academyDesc", href: "/academy" },
          { nameKey: "mega.learningSeries", descKey: "mega.learningSeriesDesc", href: "/learning-series" },
          { nameKey: "mega.supportCenter", descKey: "mega.supportCenterDesc", href: "/support" },
          { nameKey: "mega.documentation", descKey: "mega.documentationDesc", href: "/docs" },
          { nameKey: "mega.brandKit", descKey: "mega.brandKitDesc", href: "/brand-kit" },
        ],
      },
      {
        categoryKey: "mega.ecosystem",
        items: [
          { nameKey: "mega.network", descKey: "mega.networkDesc", href: "/network" },
          { nameKey: "mega.technology", descKey: "mega.technologyDesc", href: "/ai" },
          { nameKey: "mega.partners", descKey: "mega.partnersDesc", href: "/partners" },
        ],
      },
    ],
  },
  { id: "services", nameKey: "nav.services", href: "/services" },
  { id: "pricing", nameKey: "nav.pricing", href: "/pricing" },
  { id: "alphaAi", nameKey: "nav.alphaAi", href: "/ai" },
  { id: "about", nameKey: "nav.about", href: "/about" },
  { id: "leadership", nameKey: "nav.leadership", href: "/leadership" },
  { id: "blog", nameKey: "nav.blog", href: "/blog" },
  { id: "career", nameKey: "nav.career", href: "/career", xlOnly: true },
];

export const menuItemIcons: Record<string, LucideIcon> = {
  "/products/supplier-portal": LayoutDashboard,
  "/products/mobile-app": Smartphone,
  "/products/white-label": Store,
  "/products/api": Code2,
  "/products/tracking": MapPin,
  "/products/optimizer": Route,
  "/products/pod": FileCheck,
  "/products/analytics": BarChart3,
  "/products/rates": TrendingUp,
  "/products/ai": Sparkles,
  "/ai": Bot,
  "/solution": Package,
  "/directory": Truck,
  "/suppliers": Factory,
  "/available-loads": ClipboardList,
  "/products/smart-matching": Sparkles,
  "/industries": Globe2,
  "/industries/construction": Building2,
  "/industries/retail": ShoppingBag,
  "/industries/food": UtensilsCrossed,
  "/industries/pharmaceuticals": Pill,
  "/industries/automotive": Car,
  "/industries/general-freight": Package,
  "/tools": Calculator,
  "/academy": GraduationCap,
  "/learning-series": BookOpen,
  "/support": Wrench,
  "/docs": BookOpen,
  "/brand-kit": Store,
  "/network": Network,
  "/partners": Users,
};

export function hasFlyoutMenu(link: NavItemDef) {
  return Boolean(link.megaMenu || link.whyMenu);
}
