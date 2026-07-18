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

const UK_CITY_LABELS: Record<string, string> = {
  london: "London",
  manchester: "Manchester",
  birmingham: "Birmingham",
  leeds: "Leeds",
  glasgow: "Glasgow",
  liverpool: "Liverpool",
  bristol: "Bristol",
  sheffield: "Sheffield",
  edinburgh: "Edinburgh",
  cardiff: "Cardiff",
  newcastle: "Newcastle",
  nottingham: "Nottingham",
  southampton: "Southampton",
  leicester: "Leicester",
  coventry: "Coventry",
  hull: "Hull",
  plymouth: "Plymouth",
  aberdeen: "Aberdeen",
  belfast: "Belfast",
  felixstowe: "Felixstowe",
  dover: "Dover",
  cambridge: "Cambridge",
  exeter: "Exeter",
  newport: "Newport",
};

/** Common misspellings mapped to a known UK city key. */
const UK_CITY_ALIASES: Record<string, keyof typeof UK_CITY_LABELS> = {
  manchestr: "manchester",
  manchestet: "manchester",
  manchest: "manchester",
  manhester: "manchester",
  birmigham: "birmingham",
  birminghm: "birmingham",
  liverpol: "liverpool",
  edingburgh: "edinburgh",
  glasgo: "glasgow",
};

const NON_UK_TERMS =
  /\b(usa|u\.?s\.?a|america|pakistan|india|china|france|germany|spain|italy|dubai|uae|canada|australia|europe|international|worldwide)\b/i;

const ADDRESS_TERMS =
  /\b(house\s*no|street\s*no|block\s+[a-z0-9]|flat\s+\d|apt\s+\d|postcode|postal|setlight|township)\b/i;

const MIN_LANE_RATE_GBP = 75;
const MAX_LANE_RATE_GBP = 2500;
const MIN_RPM = 0.85;
const MAX_RPM = 4.5;
const CITY_COORDS: Record<keyof typeof UK_CITY_LABELS, { lat: number; lng: number }> = {
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

function matchUkCityKey(value: string): keyof typeof UK_CITY_LABELS | null {
  const normalized = normalizeLocation(value).toLowerCase();
  if (!normalized || normalized.length > 48) return null;
  if (NON_UK_TERMS.test(normalized) || ADDRESS_TERMS.test(normalized)) return null;

  for (const [alias, cityKey] of Object.entries(UK_CITY_ALIASES)) {
    if (normalized.includes(alias)) return cityKey;
  }

  const cityKeys = Object.keys(UK_CITY_LABELS) as (keyof typeof UK_CITY_LABELS)[];
  const sortedKeys = [...cityKeys].sort((a, b) => b.length - a.length);

  for (const cityKey of sortedKeys) {
    const pattern = new RegExp(`\\b${cityKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(normalized)) return cityKey;
  }

  return null;
}

export function resolveUkCityLabel(value: string): string | null {
  const key = matchUkCityKey(value);
  return key ? UK_CITY_LABELS[key] : null;
}

export function isValidUkLane(origin: string, destination: string) {
  const originKey = matchUkCityKey(origin);
  const destinationKey = matchUkCityKey(destination);
  return Boolean(originKey && destinationKey && originKey !== destinationKey);
}

function extractCityKey(value: string) {
  return matchUkCityKey(value) ?? "";
}

function formatLaneLabelFromKeys(originKey: string, destinationKey: string) {
  const origin = UK_CITY_LABELS[originKey as keyof typeof UK_CITY_LABELS] ?? originKey;
  const destination = UK_CITY_LABELS[destinationKey as keyof typeof UK_CITY_LABELS] ?? destinationKey;
  return `${origin} → ${destination}`;
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
  const originKey = matchUkCityKey(origin);
  const destKey = matchUkCityKey(destination);
  const a = originKey ? CITY_COORDS[originKey] : undefined;
  const b = destKey ? CITY_COORDS[destKey] : undefined;

  if (a && b) {
    const straight = haversineMiles(a.lat, a.lng, b.lat, b.lng);
    return Math.max(35, Math.round(straight * 1.22));
  }

  const seed = hashString(`${originKey || origin}|${destKey || destination}`);
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
  const originKey = matchUkCityKey(origin);
  const destinationKey = matchUkCityKey(destination);
  if (!originKey || !destinationKey) return "";
  return `${originKey}→${destinationKey}`;
}

function formatLaneLabel(origin: string, destination: string) {
  const originKey = matchUkCityKey(origin);
  const destinationKey = matchUkCityKey(destination);
  if (originKey && destinationKey) return formatLaneLabelFromKeys(originKey, destinationKey);
  return `${normalizeLocation(origin)} → ${normalizeLocation(destination)}`;
}

function isReasonableLaneRate(rate: number, miles: number) {
  if (rate < MIN_LANE_RATE_GBP || rate > MAX_LANE_RATE_GBP) return false;
  const rpm = rate / Math.max(miles, 1);
  return rpm >= MIN_RPM && rpm <= MAX_RPM;
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
    {
      originKey: string;
      destinationKey: string;
      samples: { price: number; createdAt?: string | null }[];
    }
  >();

  for (const load of loads) {
    const price = Number(load.price) || 0;
    if (price <= 0) continue;

    const originRaw = load.origin || load.pickup_location || "";
    const destinationRaw = load.destination || load.delivery_location || "";
    if (!originRaw || !destinationRaw) continue;
    if (!isValidUkLane(originRaw, destinationRaw)) continue;
    if (mapEquipmentType(load.equipment) !== equipment) continue;

    const originKey = matchUkCityKey(originRaw);
    const destinationKey = matchUkCityKey(destinationRaw);
    if (!originKey || !destinationKey) continue;

    const key = `${originKey}→${destinationKey}`;
    const entry = grouped.get(key) ?? { originKey, destinationKey, samples: [] };
    entry.samples.push({ price, createdAt: load.created_at });
    grouped.set(key, entry);
  }

  const rows: LaneRateRow[] = [];

  grouped.forEach((entry) => {
    const originLabel = UK_CITY_LABELS[entry.originKey as keyof typeof UK_CITY_LABELS];
    const destinationLabel = UK_CITY_LABELS[entry.destinationKey as keyof typeof UK_CITY_LABELS];
    const miles = estimateDistanceMiles(originLabel, destinationLabel);
    const avgRate = entry.samples.reduce((sum, item) => sum + item.price, 0) / entry.samples.length;
    if (!isReasonableLaneRate(avgRate, miles)) return;

    rows.push({
      lane: formatLaneLabelFromKeys(entry.originKey, entry.destinationKey),
      origin: originLabel,
      destination: destinationLabel,
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
  const validUkLoadCount = loads.filter((load) => {
    const price = Number(load.price) || 0;
    if (price <= 0) return false;
    const origin = load.origin || load.pickup_location || "";
    const destination = load.destination || load.delivery_location || "";
    return isValidUkLane(origin, destination);
  }).length;

  const lanes = marketplaceRows.length >= 3 ? marketplaceRows.slice(0, 8) : baselineLaneRows(equipment);
  const indexRpm = lanes.reduce((sum, lane) => sum + lane.rpm, 0) / Math.max(lanes.length, 1);
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
    liveLoadCount: validUkLoadCount,
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
  const originLabel = resolveUkCityLabel(origin);
  const destinationLabel = resolveUkCityLabel(destination);
  const quoteOrigin = originLabel ?? origin;
  const quoteDestination = destinationLabel ?? destination;
  const distanceMiles = estimateDistanceMiles(quoteOrigin, quoteDestination);
  const equipment = input.equipment;

  let ratePerMile = 2.12 * getEquipmentMultiplier(equipment);
  let source: FreightQuoteResult["source"] = "model";
  let matchedLane: string | null = null;

  const marketRows = input.loads ? aggregateMarketLaneRates(input.loads, equipment) : [];
  const key = laneKey(quoteOrigin, quoteDestination);
  const reverseKey = laneKey(quoteDestination, quoteOrigin);

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
    origin: quoteOrigin,
    destination: quoteDestination,
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

export type DistanceResult = {
  origin: string;
  destination: string;
  distanceMiles: number;
  drivingHoursMin: number;
  drivingHoursMax: number;
  method: "coordinates" | "estimate";
};

export type RateVerdict = "below" | "at" | "above";

export type RateComparisonResult = {
  origin: string;
  destination: string;
  equipment: EquipmentType;
  userRate: number;
  marketRate: number;
  marketRpm: number;
  userRpm: number;
  distanceMiles: number;
  verdict: RateVerdict;
  deltaPct: number;
  deltaLabel: string;
  source: "marketplace" | "model";
  matchedLane: string | null;
  guidance: string;
};

export type BackhaulLaneRow = {
  lane: string;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  rpm: number;
  type: "return" | "corridor";
  sampleSize: number;
};

export type BackhaulResult = {
  fromCity: string;
  equipment: EquipmentType;
  lanes: BackhaulLaneRow[];
  source: "marketplace" | "baseline";
};

export function calculateUkDistance(origin: string, destination: string): DistanceResult {
  const originLabel = resolveUkCityLabel(origin) ?? normalizeLocation(origin);
  const destinationLabel = resolveUkCityLabel(destination) ?? normalizeLocation(destination);
  const originKey = matchUkCityKey(origin);
  const destKey = matchUkCityKey(destination);
  const distanceMiles = estimateDistanceMiles(originLabel, destinationLabel);
  const method = originKey && destKey ? "coordinates" : "estimate";

  return {
    origin: originLabel,
    destination: destinationLabel,
    distanceMiles,
    drivingHoursMin: Number((distanceMiles / 52).toFixed(1)),
    drivingHoursMax: Number((distanceMiles / 42).toFixed(1)),
    method,
  };
}

export function compareRateToMarket(input: {
  origin: string;
  destination: string;
  equipment: EquipmentType;
  userRate: number;
  loads?: RateLoadRow[];
}): RateComparisonResult {
  const origin = normalizeLocation(input.origin);
  const destination = normalizeLocation(input.destination);
  const originLabel = resolveUkCityLabel(origin) ?? origin;
  const destinationLabel = resolveUkCityLabel(destination) ?? destination;
  const distanceMiles = estimateDistanceMiles(originLabel, destinationLabel);
  const userRpm = Number((input.userRate / Math.max(distanceMiles, 1)).toFixed(2));

  const quote = calculateFreightQuote({
    origin,
    destination,
    equipment: input.equipment,
    loads: input.loads,
  });

  const marketRate = quote.estimateMid;
  const marketRpm = quote.ratePerMile;
  const deltaPct = Number((((userRpm - marketRpm) / Math.max(marketRpm, 0.01)) * 100).toFixed(1));

  let verdict: RateVerdict = "at";
  if (deltaPct < -5) verdict = "below";
  else if (deltaPct > 5) verdict = "above";

  const deltaLabel =
    verdict === "at"
      ? "In line with market"
      : `${Math.abs(deltaPct).toFixed(1)}% ${verdict === "below" ? "below" : "above"} market £/mile`;

  const guidance =
    verdict === "below"
      ? "Your rate is below typical marketplace levels — you may attract bids quickly but leave margin on the table."
      : verdict === "above"
        ? "Your rate is above current corridor benchmarks — consider adjusting if bid volume is low."
        : "Your rate aligns with Alpha Freight corridor benchmarks for this lane and equipment.";

  return {
    origin: originLabel,
    destination: destinationLabel,
    equipment: input.equipment,
    userRate: Math.round(input.userRate),
    marketRate,
    marketRpm,
    userRpm,
    distanceMiles,
    verdict,
    deltaPct,
    deltaLabel,
    source: quote.source,
    matchedLane: quote.matchedLane,
    guidance,
  };
}

export function findBackhaulLanes(input: {
  fromCity: string;
  equipment: EquipmentType;
  loads?: RateLoadRow[];
  limit?: number;
}): BackhaulResult {
  const fromLabel = resolveUkCityLabel(input.fromCity) ?? normalizeLocation(input.fromCity);
  const fromKey = matchUkCityKey(input.fromCity);
  const limit = input.limit ?? 6;
  const equipment = input.equipment;

  const marketRows = input.loads ? aggregateMarketLaneRates(input.loads, equipment) : [];
  const baselineRows = baselineLaneRows(equipment);
  const source = marketRows.length >= 2 ? "marketplace" : "baseline";
  const pool = source === "marketplace" ? marketRows : baselineRows;

  const lanes: BackhaulLaneRow[] = [];

  for (const row of pool) {
    const rowOriginKey = matchUkCityKey(row.origin);
    const rowDestKey = matchUkCityKey(row.destination);
    if (!rowOriginKey) continue;

    if (fromKey && rowOriginKey === fromKey) {
      lanes.push({
        lane: row.lane,
        origin: row.origin,
        destination: row.destination,
        miles: row.miles,
        rate: row.rate,
        rpm: row.rpm,
        type: "return",
        sampleSize: row.sampleSize,
      });
    } else if (fromKey && rowDestKey === fromKey) {
      lanes.push({
        lane: row.lane,
        origin: row.origin,
        destination: row.destination,
        miles: row.miles,
        rate: row.rate,
        rpm: row.rpm,
        type: "corridor",
        sampleSize: row.sampleSize,
      });
    }
  }

  const deduped = lanes.filter(
    (lane, index, array) => array.findIndex((item) => item.lane === lane.lane) === index,
  );

  const sorted = deduped.sort((a, b) => {
    if (a.type !== b.type) return a.type === "return" ? -1 : 1;
    return b.rpm - a.rpm;
  });

  if (sorted.length === 0 && fromKey) {
    for (const row of baselineRows) {
      if (matchUkCityKey(row.origin) === fromKey) {
        sorted.push({
          lane: row.lane,
          origin: row.origin,
          destination: row.destination,
          miles: row.miles,
          rate: row.rate,
          rpm: row.rpm,
          type: "return",
          sampleSize: 0,
        });
      }
    }
  }

  return {
    fromCity: fromLabel,
    equipment,
    lanes: sorted.slice(0, limit),
    source: sorted.length > 0 && marketRows.length >= 2 ? "marketplace" : "baseline",
  };
}
