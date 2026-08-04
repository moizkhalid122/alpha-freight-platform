import {
  BarChart3,
  Boxes,
  Calculator,
  Clock3,
  Fuel,
  Gauge,
  MapPinned,
  PackageSearch,
  Route,
  ScanSearch,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ToolHubItem = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  category: "marketplace" | "calculator" | "tracking";
};

export const TOOL_HUB_ITEMS: ToolHubItem[] = [
  {
    href: "/tools/lane-rates",
    icon: BarChart3,
    title: "Live Lane Rate Index",
    description: "UK corridor £/mile benchmarks from marketplace activity.",
    category: "marketplace",
  },
  {
    href: "/tools/freight-quote",
    icon: Calculator,
    title: "Instant Freight Quote",
    description: "Estimate haulage pricing by route, equipment, and weight.",
    category: "marketplace",
  },
  {
    href: "/tools/live-loads",
    icon: PackageSearch,
    title: "Live Loads Preview",
    description: "Browse open UK freight loads by route and equipment.",
    category: "marketplace",
  },
  {
    href: "/tools/rate-check",
    icon: Gauge,
    title: "Rate vs Market Check",
    description: "Compare your rate to corridor benchmarks.",
    category: "marketplace",
  },
  {
    href: "/tools/backhaul",
    icon: Route,
    title: "Backhaul Lane Finder",
    description: "Find return lanes from your current location.",
    category: "marketplace",
  },
  {
    href: "/tools/distance",
    icon: MapPinned,
    title: "UK Distance Calculator",
    description: "Road miles and drive time between UK cities.",
    category: "calculator",
  },
  {
    href: "/tools/pallet-fit",
    icon: Boxes,
    title: "Pallet & Vehicle Fit",
    description: "Pallets + weight → curtain, fridge, or flatbed suggestion.",
    category: "calculator",
  },
  {
    href: "/tools/carrier-margin",
    icon: Wallet,
    title: "Carrier Earnings Calculator",
    description: "Bid − fuel − empty miles = estimated profit.",
    category: "calculator",
  },
  {
    href: "/tools/fuel-surcharge",
    icon: Fuel,
    title: "Fuel Surcharge Calculator",
    description: "Base rate + FSC % for suppliers and carriers.",
    category: "calculator",
  },
  {
    href: "/tools/delivery-eta",
    icon: Clock3,
    title: "Delivery ETA Estimator",
    description: "Pickup time + miles → UK delivery window.",
    category: "calculator",
  },
  {
    href: "/track",
    icon: ScanSearch,
    title: "Track Shipment",
    description: "Check status using your AF- reference number.",
    category: "tracking",
  },
];

export const TOOL_NAV_HIGHLIGHTS = [
  { name: "All Free Tools", href: "/tools", desc: "11 UK freight utilities on Alpha Freight" },
  { name: "Lane Rate Index", href: "/tools/lane-rates", desc: "Live £/mile UK corridor benchmarks" },
  { name: "Live Loads", href: "/tools/live-loads", desc: "Browse open marketplace freight" },
  { name: "Freight Quote", href: "/tools/freight-quote", desc: "Instant haulage price estimate" },
  { name: "Track Shipment", href: "/track", desc: "Public tracking by AF- reference" },
];

export const TOOL_FOOTER_LINKS = [
  { name: "All Free Tools", href: "/tools" },
  { name: "Lane Rate Index", href: "/tools/lane-rates" },
  { name: "Live Loads", href: "/tools/live-loads" },
  { name: "Freight Quote", href: "/tools/freight-quote" },
  { name: "Rate vs Market", href: "/tools/rate-check" },
  { name: "Backhaul Finder", href: "/tools/backhaul" },
  { name: "Distance Calculator", href: "/tools/distance" },
  { name: "Carrier Margin", href: "/tools/carrier-margin" },
  { name: "Track Shipment", href: "/track" },
];

export const TOOL_CATEGORY_LABELS: Record<ToolHubItem["category"], string> = {
  marketplace: "Marketplace intelligence",
  calculator: "Planning calculators",
  tracking: "Shipment tracking",
};
