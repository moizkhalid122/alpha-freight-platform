/**
 * Shared logic for public freight tools: lane rates, quotes, and tracking.
 */

export type EquipmentType = "general" | "refrigerated" | "flatbed" | "curtain";

export type LaneTrend = "up" | "down" | "flat";

export type LaneRateRow = {
  lane: string;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  rpm: number;
  trend: LaneTrend;
  sampleSize: number;
  equipment: EquipmentType;
};

export type LaneRatesResponse = {
  equipment: EquipmentType;
  indexRpm: number;
  deltaLabel: string;
  deltaPositive: boolean;
  lanes: LaneRateRow[];
  updatedAt: string;
  source: "marketplace" | "baseline";
  liveLoadCount: number;
};

export type FreightQuoteResult = {
  origin: string;
  destination: string;
  equipment: EquipmentType;
  distanceMiles: number;
  ratePerMile: number;
  estimateLow: number;
  estimateHigh: number;
  estimateMid: number;
  fuelNote: string;
  source: "marketplace" | "model";
  matchedLane: string | null;
};

export type PublicTrackingTimelineStep = {
  key: string;
  label: string;
  complete: boolean;
  current: boolean;
};

export type PublicTrackingResult = {
  reference: string;
  origin: string;
  destination: string;
  status: string;
  statusLabel: string;
  progress: number;
  equipment: string | null;
  pickupDate: string | null;
  timeline: PublicTrackingTimelineStep[];
  liveTrackingActive: boolean;
  lastUpdate: string | null;
};

export const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string; multiplier: number }[] = [
  { value: "general", label: "General haulage", multiplier: 1 },
  { value: "refrigerated", label: "Refrigerated", multiplier: 1.16 },
  { value: "flatbed", label: "Flatbed", multiplier: 1.08 },
  { value: "curtain", label: "Curtain-side", multiplier: 1.02 },
];

export const UK_CITY_SUGGESTIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Glasgow",
  "Liverpool",
  "Bristol",
  "Sheffield",
  "Edinburgh",
  "Cardiff",
  "Newcastle",
  "Nottingham",
  "Southampton",
  "Leicester",
  "Coventry",
  "Hull",
  "Plymouth",
  "Aberdeen",
  "Belfast",
  "Felixstowe",
  "Dover",
  "Cambridge",
  "Exeter",
  "Newport",
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  birmingham: { lat: 52.4862, lng: -1.8904 },
  leeds: { lat: 53.8008, lng: -1.5491 },
  glasgow: { lat: 55.8642, lng: -4.2518 },
  liverpool: { lat: 53.4084, lng: -2.9916 },
  bristol: { lat: 51.4545, lng: -2.5879 },
  sheffield: { lat: 53.3811, lng: -1.4701 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  cardiff: { lat: 51.4816, lng: -3.1791 },
  newcastle: { lat: 54.9783, lng: -1.6178 },
  nottingham: { lat: 52.9548, lng: -1.1581 },
  southampton: { lat: 50.9097, lng: -1.4044 },
  leicester: { lat: 52.6369, lng: -1.1398 },
  coventry: { lat: 52.4068, lng: -1.5197 },
  hull: { lat: 53.7457, lng: -0.3367 },
  plymouth: { lat: 50.3755, lng: -4.1427 },
  aberdeen: { lat: 57.1497, lng: -2.0943 },
  belfast: { lat: 54.5973, lng: -5.9301 },
  felixstowe: { lat: 51.9617, lng: 1.351 },
  dover: { lat: 51.1279, lng: 1.3134 },
  cambridge: { lat: 52.2053, lng: 0.1218 },
  exeter: { lat: 50.7184, lng: -3.5339 },
  newport: { lat: 51.5842, lng: -2.9977 },
};

const BASELINE_LANES: Record<
  EquipmentType,
  { origin: string; destination: string; miles: number; rate: number; trend: LaneTrend }[]
> = {
  general: [
    { origin: "London", destination: "Manchester", miles: 204, rate: 445, trend: "up" },
    { origin: "Birmingham", destination: "Leeds", miles: 118, rate: 248, trend: "flat" },
    { origin: "Bristol", destination: "Glasgow", miles: 386, rate: 812, trend: "down" },
    { origin: "Southampton", destination: "Edinburgh", miles: 462, rate: 998, trend: "up" },
    { origin: "London", destination: "Birmingham", miles: 118, rate: 252, trend: "up" },
    { origin: "Leeds", destination: "London", miles: 196, rate: 418, trend: "flat" },
  ],
  refrigerated: [
    { origin: "Felixstowe", destination: "Coventry", miles: 156, rate: 412, trend: "up" },
    { origin: "London", destination: "Cardiff", miles: 151, rate: 378, trend: "up" },
    { origin: "Manchester", destination: "Aberdeen", miles: 340, rate: 864, trend: "flat" },
    { origin: "Dover", destination: "Nottingham", miles: 198, rate: 502, trend: "down" },
  ],
  flatbed: [
    { origin: "Sheffield", destination: "Hull", miles: 82, rate: 198, trend: "down" },
    { origin: "Newport", destination: "Newcastle", miles: 310, rate: 702, trend: "flat" },
    { origin: "Liverpool", destination: "Plymouth", miles: 286, rate: 648, trend: "up" },
    { origin: "Leicester", destination: "Exeter", miles: 196, rate: 452, trend: "down" },
  ],
  curtain: [
    { origin: "London", destination: "Birmingham", miles: 118, rate: 252, trend: "up" },
    { origin: "Leeds", destination: "London", miles: 196, rate: 418, trend: "flat" },
    { origin: "Glasgow", destination: "Manchester", miles: 215, rate: 448, trend: "down" },
    { origin: "Cambridge", destination: "Belfast", miles: 418, rate: 892, trend: "up" },
  ],
};

export type RateLoadRow = {
  id: string;
  origin?: string | null;
  destination?: string | null;
  pickup_location?: string | null;
  delivery_location?: string | null;
  price?: number | string | null;
  equipment?: string | null;
  created_at?: string | null;
  status?: string | null;
  carrier_id?: string | null;
  pickup_date?: string | null;
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function normalizeLocation(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,\s*uk$/i, "")
    .replace(/,\s*united kingdom$/i, "");
}

function extractCityKey(value: string) {
  const normalized = normalizeLocation(value).toLowerCase();
  for (const city of Object.keys(CITY_COORDS)) {
    if (normalized.includes(city)) return city;
  }
  return normalized.split(/[,\-→/|]/)[0]?.trim() || normalized;
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDistanceMiles(origin: string, destination: string) {
  const originKey = extractCityKey(origin);
  const destKey = extractCityKey(destination);
  const a = CITY_COORDS[originKey];
  const b = CITY_COORDS[destKey];

  if (a && b) {
    const straight = haversineMiles(a.lat, a.lng, b.lat, b.lng);
    return Math.max(35, Math.round(straight * 1.22));
  }

  const seed = hashString(`${originKey}|${destKey}`);
  return 80 + (seed % 320);
}

export function toLoadReference(id: string) {
  return `AF-${String(id).slice(0, 8).toUpperCase()}`;
}

export function parseLoadReference(input: string) {
  const trimmed = input.trim().toUpperCase();
  const match = trimmed.match(/^AF-?([A-F0-9]{8})$/i);
  if (match) return match[1].toUpperCase();
  if (/^[A-F0-9]{8}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export function matchLoadByReference(loads: RateLoadRow[], reference: string) {
  const prefix = parseLoadReference(reference);
  if (!prefix) return null;

  return (
    loads.find((load) => {
      const compact = load.id.replace(/-/g, "").toUpperCase();
      return compact.startsWith(prefix) || toLoadReference(load.id) === `AF-${prefix}`;
    }) ?? null
  );
}

function mapEquipmentType(value?: string | null): EquipmentType {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("refrig") || normalized.includes("fridge") || normalized.includes("temp")) {
    return "refrigerated";
  }
  if (normalized.includes("flat")) return "flatbed";
  if (normalized.includes("curtain") || normalized.includes("tilt")) return "curtain";
  return "general";
}

function getEquipmentMultiplier(equipment: EquipmentType) {
  return EQUIPMENT_OPTIONS.find((item) => item.value === equipment)?.multiplier ?? 1;
}

function laneKey(origin: string, destination: string) {
  return `${extractCityKey(origin)}→${extractCityKey(destination)}`;
}

function formatLaneLabel(origin: string, destination: string) {
  const o = normalizeLocation(origin);
  const d = normalizeLocation(destination);
  const oCity = o.split(",")[0]?.trim() || o;
  const dCity = d.split(",")[0]?.trim() || d;
  return `${oCity} → ${dCity}`;
}

function computeTrend(samples: { price: number; createdAt?: string | null }[]): LaneTrend {
  if (samples.length < 2) return "flat";
  const sorted = [...samples].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
  const mid = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, mid);
  const newer = sorted.slice(mid);
  if (!older.length || !newer.length) return "flat";
  const olderAvg = older.reduce((sum, item) => sum + item.price, 0) / older.length;
  const newerAvg = newer.reduce((sum, item) => sum + item.price, 0) / newer.length;
  const delta = (newerAvg - olderAvg) / Math.max(olderAvg, 1);
  if (delta > 0.04) return "up";
  if (delta < -0.04) return "down";
  return "flat";
}

export function aggregateMarketLaneRates(loads: RateLoadRow[], equipment: EquipmentType): LaneRateRow[] {
  const grouped = new Map<
    string,
    { origin: string; destination: string; samples: { price: number; createdAt?: string | null }[] }
  >();

  for (const load of loads) {
    const price = Number(load.price) || 0;
    if (price <= 0) continue;

    const origin = load.origin || load.pickup_location || "";
    const destination = load.destination || load.delivery_location || "";
    if (!origin || !destination) continue;
    if (mapEquipmentType(load.equipment) !== equipment) continue;

    const key = laneKey(origin, destination);
    const entry = grouped.get(key) ?? { origin, destination, samples: [] };
    entry.samples.push({ price, createdAt: load.created_at });
    grouped.set(key, entry);
  }

  const rows: LaneRateRow[] = [];

  grouped.forEach((entry) => {
    const miles = estimateDistanceMiles(entry.origin, entry.destination);
    const avgRate = entry.samples.reduce((sum, item) => sum + item.price, 0) / entry.samples.length;
    rows.push({
      lane: formatLaneLabel(entry.origin, entry.destination),
      origin: entry.origin,
      destination: entry.destination,
      miles,
      rate: Math.round(avgRate),
      rpm: Number((avgRate / miles).toFixed(2)),
      trend: computeTrend(entry.samples),
      sampleSize: entry.samples.length,
      equipment,
    });
  });

  return rows.sort((a, b) => b.sampleSize - a.sampleSize || b.rate - a.rate);
}

function baselineLaneRows(equipment: EquipmentType): LaneRateRow[] {
  return BASELINE_LANES[equipment].map((lane) => ({
    lane: `${lane.origin} → ${lane.destination}`,
    origin: lane.origin,
    destination: lane.destination,
    miles: lane.miles,
    rate: lane.rate,
    rpm: Number((lane.rate / lane.miles).toFixed(2)),
    trend: lane.trend,
    sampleSize: 0,
    equipment,
  }));
}

export function buildLaneRatesResponse(loads: RateLoadRow[], equipment: EquipmentType): LaneRatesResponse {
  const marketplaceRows = aggregateMarketLaneRates(loads, equipment);
  const lanes = marketplaceRows.length >= 3 ? marketplaceRows.slice(0, 8) : baselineLaneRows(equipment);
  const indexRpm =
    lanes.reduce((sum, lane) => sum + lane.rpm, 0) / Math.max(lanes.length, 1);
  const upCount = lanes.filter((lane) => lane.trend === "up").length;
  const downCount = lanes.filter((lane) => lane.trend === "down").length;
  const deltaPositive = upCount >= downCount;
  const deltaPct = Math.min(8.5, Math.max(0.8, Math.abs(upCount - downCount) * 1.4 + 1.2));

  return {
    equipment,
    indexRpm: Number(indexRpm.toFixed(2)),
    deltaLabel: `${deltaPositive ? "+" : "-"}${deltaPct.toFixed(1)}%`,
    deltaPositive,
    lanes,
    updatedAt: new Date().toISOString(),
    source: marketplaceRows.length >= 3 ? "marketplace" : "baseline",
    liveLoadCount: loads.filter((load) => Number(load.price) > 0).length,
  };
}

export function calculateFreightQuote(input: {
  origin: string;
  destination: string;
  equipment: EquipmentType;
  weightKg?: number;
  loads?: RateLoadRow[];
}): FreightQuoteResult {
  const origin = normalizeLocation(input.origin);
  const destination = normalizeLocation(input.destination);
  const distanceMiles = estimateDistanceMiles(origin, destination);
  const equipment = input.equipment;

  let ratePerMile = 2.12 * getEquipmentMultiplier(equipment);
  let source: FreightQuoteResult["source"] = "model";
  let matchedLane: string | null = null;

  const marketRows = input.loads ? aggregateMarketLaneRates(input.loads, equipment) : [];
  const key = laneKey(origin, destination);
  const reverseKey = laneKey(destination, origin);

  const direct =
    marketRows.find((row) => laneKey(row.origin, row.destination) === key) ??
    marketRows.find((row) => laneKey(row.origin, row.destination) === reverseKey);

  if (direct) {
    ratePerMile = direct.rpm;
    source = "marketplace";
    matchedLane = direct.lane;
  } else if (marketRows.length > 0) {
    const avgRpm = marketRows.reduce((sum, row) => sum + row.rpm, 0) / marketRows.length;
    ratePerMile = avgRpm * getEquipmentMultiplier(equipment);
    source = "marketplace";
  }

  const weightFactor =
    input.weightKg && input.weightKg > 12000 ? 1.08 : input.weightKg && input.weightKg > 8000 ? 1.04 : 1;
  const mid = Math.round(distanceMiles * ratePerMile * weightFactor);
  const spread = Math.max(35, Math.round(mid * 0.12));

  return {
    origin,
    destination,
    equipment,
    distanceMiles,
    ratePerMile: Number(ratePerMile.toFixed(2)),
    estimateLow: mid - spread,
    estimateHigh: mid + spread,
    estimateMid: mid,
    fuelNote: "Includes typical UK diesel movement. Final carrier bids may vary by urgency and capacity.",
    source,
    matchedLane,
  };
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
    case "available":
    case "pending":
      return "Awaiting carrier";
    case "booked":
      return "Booked with carrier";
    case "loading":
      return "Loading at pickup";
    case "in-transit":
      return "In transit";
    case "completed":
    case "delivered":
      return "Delivered";
    default:
      return status.replace(/-/g, " ");
  }
}

export function buildPublicTrackingResult(
  load: RateLoadRow,
  options?: { liveTrackingActive?: boolean; lastUpdate?: string | null },
): PublicTrackingResult {
  const status = String(load.status || "unknown").toLowerCase();
  const origin = load.origin || load.pickup_location || "Origin pending";
  const destination = load.destination || load.delivery_location || "Destination pending";

  const steps: PublicTrackingTimelineStep[] = [
    {
      key: "posted",
      label: "Load posted",
      complete: true,
      current: ["active", "available", "pending"].includes(status),
    },
    {
      key: "booked",
      label: "Carrier booked",
      complete: Boolean(load.carrier_id) || ["booked", "loading", "in-transit", "completed", "delivered"].includes(status),
      current: status === "booked",
    },
    {
      key: "loading",
      label: "Pickup / loading",
      complete: ["loading", "in-transit", "completed", "delivered"].includes(status),
      current: status === "loading",
    },
    {
      key: "transit",
      label: "In transit",
      complete: ["in-transit", "completed", "delivered"].includes(status),
      current: status === "in-transit",
    },
    {
      key: "delivered",
      label: "Delivered",
      complete: ["completed", "delivered"].includes(status),
      current: ["completed", "delivered"].includes(status),
    },
  ];

  let progress = 10;
  if (status === "booked") progress = 25;
  if (status === "loading") progress = 40;
  if (status === "in-transit") progress = 65;
  if (status === "completed" || status === "delivered") progress = 100;
  if (Boolean(load.carrier_id) && progress < 25) progress = 25;

  return {
    reference: toLoadReference(load.id),
    origin,
    destination,
    status,
    statusLabel: statusLabel(status),
    progress,
    equipment: load.equipment ?? null,
    pickupDate: load.pickup_date ?? null,
    timeline: steps,
    liveTrackingActive: Boolean(options?.liveTrackingActive),
    lastUpdate: options?.lastUpdate ?? load.created_at ?? null,
  };
}

export function isPublicTrackableLoad(load: RateLoadRow) {
  if (!load.carrier_id) return false;
  const status = String(load.status || "").toLowerCase();
  return ["booked", "loading", "in-transit", "completed", "delivered"].includes(status);
}

export function parseEquipmentQuery(value: string | null): EquipmentType {
  const normalized = String(value || "general").toLowerCase();
  if (normalized === "refrigerated" || normalized === "fridge") return "refrigerated";
  if (normalized === "flatbed") return "flatbed";
  if (normalized === "curtain" || normalized === "curtain-side") return "curtain";
  return "general";
}
