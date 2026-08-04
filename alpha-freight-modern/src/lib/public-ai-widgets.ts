import type { CopilotMetric, CopilotPlatformLoad, CopilotPlatformResult, CopilotRoutePreview } from "@/lib/chat-types";

const UK_CITIES =
  "London|Birmingham|Manchester|Leeds|Glasgow|Bristol|Liverpool|Sheffield|Edinburgh|Cardiff|Newcastle|Nottingham|Leicester|Southampton|Portsmouth|Brighton|Oxford|Cambridge|Coventry|Hull|Bradford|Stoke|Wolverhampton|Derby|Swansea|Aberdeen|Dundee|York|Reading|Norwich|Plymouth|Belfast";

const CITY_PATTERN = new RegExp(`\\b(${UK_CITIES})\\b`, "i");

export type PublicChartType = "rpm" | "profit" | "fuel";

export type PublicRouteQuery = {
  origin: string;
  destination: string;
};

const ROUTE_ESTIMATES: Record<string, { miles: number; hours: number; fuelGbp: number; traffic: string }> = {
  "london|birmingham": { miles: 126, hours: 2.4, fuelGbp: 108, traffic: "Moderate" },
  "manchester|london": { miles: 204, hours: 3.8, fuelGbp: 175, traffic: "Busy M6/M1" },
  "leeds|london": { miles: 196, hours: 3.6, fuelGbp: 168, traffic: "Moderate" },
  "glasgow|london": { miles: 403, hours: 6.5, fuelGbp: 345, traffic: "M6 corridor" },
  "birmingham|manchester": { miles: 87, hours: 1.7, fuelGbp: 74, traffic: "Light" },
  "london|manchester": { miles: 204, hours: 3.8, fuelGbp: 175, traffic: "Busy M6/M1" },
  "bristol|london": { miles: 118, hours: 2.2, fuelGbp: 101, traffic: "Moderate" },
  "liverpool|london": { miles: 212, hours: 3.9, fuelGbp: 182, traffic: "Moderate" },
};

function routeKey(a: string, b: string): string {
  return `${a.toLowerCase().trim()}|${b.toLowerCase().trim()}`;
}

export function parseLoadSearchQuery(message: string): string | null {
  const text = message.trim();
  if (!/\b(find|search|show|get|need|looking for|loads?|load board|freight)\b/i.test(text)) return null;
  if (!/\b(loads?|load board|freight jobs?|haulage jobs?)\b/i.test(text)) return null;

  const explicit = text.match(
    new RegExp(`\\b(?:loads?|freight)\\s*(?:in|near|to|around|for|from)?\\s*(${UK_CITIES})\\b`, "i")
  );
  if (explicit?.[1]) return titleCase(explicit[1]);

  const afterLoads = text.match(new RegExp(`\\bloads?\\s+(${UK_CITIES})\\b`, "i"));
  if (afterLoads?.[1]) return titleCase(afterLoads[1]);

  const inNear = text.match(new RegExp(`\\b(?:in|near|to|around|for)\\s+(${UK_CITIES})\\b`, "i"));
  if (inNear?.[1]) return titleCase(inNear[1]);

  const anyCity = text.match(CITY_PATTERN);
  if (anyCity?.[1]) return titleCase(anyCity[1]);

  return "UK";
}

export function parseRouteQuery(message: string): PublicRouteQuery | null {
  const text = message.trim();
  if (!/\b(to|from|→|route|distance|how far|drive|miles|eta|map)\b/i.test(text)) return null;

  const fromTo = text.match(
    new RegExp(`\\bfrom\\s+(${UK_CITIES})\\s+(?:to|→|-)\\s+(${UK_CITIES})\\b`, "i")
  );
  if (fromTo) return { origin: titleCase(fromTo[1]), destination: titleCase(fromTo[2]) };

  const aToB = text.match(
    new RegExp(`\\b(${UK_CITIES})\\s+(?:to|→|-)\\s+(${UK_CITIES})\\b`, "i")
  );
  if (aToB) return { origin: titleCase(aToB[1]), destination: titleCase(aToB[2]) };

  return null;
}

export function parseComparisonChartType(message: string): PublicChartType | null {
  const text = message.toLowerCase();
  if (!/\b(compare|comparison|vs|versus|graph|chart|which is better|side by side)\b/i.test(text)) {
    return null;
  }
  if (/\b(fuel|diesel|petrol)\b/i.test(text)) return "fuel";
  if (/\b(profit|margin|earnings)\b/i.test(text)) return "profit";
  if (/\b(rpm|rate per mile|revenue per mile)\b/i.test(text)) return "rpm";
  return "rpm";
}

function titleCase(city: string): string {
  return city.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function calcRpm(rate: number, miles: number): string {
  return `£${(rate / miles).toFixed(2)}/mi`;
}

function demoLoad(
  id: string,
  origin: string,
  dest: string,
  rate: number,
  miles: number,
  equipment: string,
  score: number
): CopilotPlatformLoad {
  return {
    id,
    title: `${origin} → ${dest}`,
    subtitle: `${equipment} · Pickup within 48h`,
    score,
    metrics: [
      { label: "Rate", value: `£${rate}`, icon: "💰" },
      { label: "Miles", value: `${miles} mi`, icon: "📍" },
      { label: "RPM", value: calcRpm(rate, miles), icon: "📈", tone: "positive" },
    ],
    primaryAction: {
      label: "Book",
      href: "/auth/select",
      action: "Sign up to book this load",
      variant: "primary",
    },
    secondaryActions: [
      { label: "Details", href: "/find-loads", action: "View load details", variant: "secondary" },
    ],
  };
}

export function buildDemoLoadCards(location: string): CopilotPlatformResult {
  const dest = location === "UK" ? "London" : location;
  const hubs = ["Manchester", "Birmingham", "Leeds", "Bristol", "Liverpool"].filter(
    (c) => c.toLowerCase() !== dest.toLowerCase()
  );

  const loads: CopilotPlatformLoad[] = [
    demoLoad("pub-1", hubs[0] || "Manchester", dest, 820, 320, "General haulage · 7.5t", 92),
    demoLoad("pub-2", hubs[1] || "Birmingham", dest, 640, 126, "Curtain side · 18t", 88),
    demoLoad("pub-3", hubs[2] || "Leeds", dest, 950, 196, "Palletised · Artic", 85),
  ];

  return {
    title: `Loads near ${dest}`,
    subtitle: "Live-style matches on Alpha Freight — sign up free to bid and book",
    totalCount: 12,
    loads,
  };
}

export function buildRoutePreview(origin: string, destination: string): CopilotRoutePreview {
  const key = routeKey(origin, destination);
  const reverseKey = routeKey(destination, origin);
  const est = ROUTE_ESTIMATES[key] || ROUTE_ESTIMATES[reverseKey];

  if (est) {
    return {
      pickup: origin,
      transit: `${est.miles} mi · ~${est.hours}h drive · Fuel ~£${est.fuelGbp} · Traffic: ${est.traffic}`,
      delivery: destination,
    };
  }

  return {
    pickup: origin,
    transit: "Calculating route…",
    delivery: destination,
  };
}

export function buildRouteMetrics(origin: string, destination: string): CopilotMetric[] {
  const key = routeKey(origin, destination);
  const reverseKey = routeKey(destination, origin);
  const est = ROUTE_ESTIMATES[key] || ROUTE_ESTIMATES[reverseKey];

  if (!est) {
    return [
      { label: "Route", value: `${origin} → ${destination}`, icon: "🗺️" },
      { label: "Status", value: "Fetching live data…", icon: "⏳" },
    ];
  }

  return [
    { label: "Distance", value: `${est.miles} mi`, icon: "📍" },
    { label: "ETA", value: `~${est.hours}h`, icon: "⏱️" },
    { label: "Fuel est.", value: `~£${est.fuelGbp}`, icon: "⛽", tone: "warning" },
    { label: "Traffic", value: est.traffic, icon: "🚦" },
  ];
}

export type ChartDataPoint = { label: string; value: number; color?: string };

export function buildComparisonChartData(type: PublicChartType): ChartDataPoint[] {
  if (type === "fuel") {
    return [
      { label: "Jan", value: 1.47 },
      { label: "Feb", value: 1.49 },
      { label: "Mar", value: 1.52 },
      { label: "Apr", value: 1.5 },
      { label: "May", value: 1.53 },
      { label: "Jun", value: 1.51 },
    ];
  }
  if (type === "profit") {
    return [
      { label: "Load A", value: 420 },
      { label: "Load B", value: 310 },
      { label: "Load C", value: 540 },
      { label: "Load D", value: 280 },
    ];
  }
  return [
    { label: "Short haul", value: 2.1 },
    { label: "General", value: 1.85 },
    { label: "Long haul", value: 1.55 },
    { label: "Backhaul", value: 1.35 },
  ];
}

export function chartTitle(type: PublicChartType): string {
  if (type === "fuel") return "UK diesel trend (£/litre)";
  if (type === "profit") return "Estimated profit by load";
  return "RPM comparison (£/mile)";
}

export function chartUnit(type: PublicChartType): string {
  if (type === "fuel") return "£/L";
  if (type === "profit") return "£";
  return "£/mi";
}
