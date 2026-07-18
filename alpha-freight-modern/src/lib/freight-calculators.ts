import {
  calculateUkDistance,
  estimateDistanceMiles,
  isValidUkLane,
  normalizeLocation,
  type EquipmentType,
} from "@/lib/freight-tools";

const CURTAIN_PALLET_MAX = 26;
const GENERAL_PALLET_SOFT_MAX = 14;
const MAX_PAYLOAD_KG = 24_000;
const DEFAULT_LITRES_PER_MILE = 0.58;
const DEFAULT_FUEL_PRICE_GBP = 1.48;
const HGV_PLANNING_MPH = 45;
const UK_DAILY_DRIVE_HOURS = 9;
const BREAK_EVERY_HOURS = 4.5;
const BREAK_DURATION_HOURS = 0.75;

export type PalletFitResult = {
  recommended: EquipmentType;
  recommendedLabel: string;
  alternatives: { type: EquipmentType; label: string; reason: string }[];
  palletCount: number;
  weightKg: number;
  palletUtilisationPct: number;
  weightUtilisationPct: number;
  notes: string[];
};

export type CarrierMarginResult = {
  bidAmount: number;
  loadedMiles: number;
  emptyMiles: number;
  totalMiles: number;
  fuelCost: number;
  otherCosts: number;
  grossProfit: number;
  marginPct: number;
  profitPerLoadedMile: number;
  litresPerMile: number;
  fuelPricePerLitre: number;
  payoutNote: string;
};

export type FuelSurchargeResult = {
  baseRate: number;
  fscPercent: number;
  fuelSurcharge: number;
  totalRate: number;
  miles: number | null;
  totalRpm: number | null;
  formulaNote: string;
};

export type DeliveryEtaResult = {
  origin: string | null;
  destination: string | null;
  distanceMiles: number;
  pickupAt: string;
  deliveryEarliest: string;
  deliveryLatest: string;
  driveHours: number;
  breakHours: number;
  restHours: number;
  loadingBufferHours: number;
  assumptions: string[];
};

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  general: "General haulage",
  refrigerated: "Refrigerated",
  flatbed: "Flatbed",
  curtain: "Curtain-side",
};

export function calculatePalletFit(input: {
  palletCount: number;
  weightKg: number;
  temperatureControlled?: boolean;
  oversized?: boolean;
}): PalletFitResult {
  const palletCount = Math.max(1, Math.round(input.palletCount));
  const weightKg = Math.max(1, Math.round(input.weightKg));
  const notes: string[] = [];
  const alternatives: PalletFitResult["alternatives"] = [];

  const palletUtilisationPct = Math.min(100, Math.round((palletCount / CURTAIN_PALLET_MAX) * 100));
  const weightUtilisationPct = Math.min(100, Math.round((weightKg / MAX_PAYLOAD_KG) * 100));

  if (palletCount > CURTAIN_PALLET_MAX) {
    notes.push(`Load exceeds a standard full trailer (${CURTAIN_PALLET_MAX} pallets) — consider multi-drop or additional vehicle.`);
  }
  if (weightKg > MAX_PAYLOAD_KG) {
    notes.push(`Weight exceeds typical UK artic payload (~${MAX_PAYLOAD_KG.toLocaleString()} kg) — verify GVW and axle limits.`);
  }

  let recommended: EquipmentType = "curtain";

  if (input.temperatureControlled) {
    recommended = "refrigerated";
    notes.push("Temperature-controlled cargo requires a refrigerated trailer.");
    alternatives.push({
      type: "curtain",
      label: EQUIPMENT_LABELS.curtain,
      reason: "Only suitable if temperature control is not required.",
    });
  } else if (input.oversized) {
    recommended = "flatbed";
    notes.push("Oversized or non-standard dimensions suit an flatbed or specialist trailer.");
    alternatives.push({
      type: "general",
      label: EQUIPMENT_LABELS.general,
      reason: "Possible for smaller out-of-gauge items with correct securing.",
    });
  } else if (palletCount <= 6 && weightKg <= 6_000) {
    recommended = "general";
    notes.push("Smaller pallet count — general haulage or 7.5t may be sufficient.");
    alternatives.push({
      type: "curtain",
      label: EQUIPMENT_LABELS.curtain,
      reason: "Curtain-side if you want full artic capacity and flexibility.",
    });
  } else {
    recommended = "curtain";
    notes.push("Standard UK pallet load — curtain-side is the most common equipment match.");
    if (palletCount <= GENERAL_PALLET_SOFT_MAX) {
      alternatives.push({
        type: "general",
        label: EQUIPMENT_LABELS.general,
        reason: "General haulage for lighter partial loads.",
      });
    }
    alternatives.push({
      type: "flatbed",
      label: EQUIPMENT_LABELS.flatbed,
      reason: "If pallets are not standard or side-loading is needed.",
    });
  }

  return {
    recommended,
    recommendedLabel: EQUIPMENT_LABELS[recommended],
    alternatives,
    palletCount,
    weightKg,
    palletUtilisationPct,
    weightUtilisationPct,
    notes,
  };
}

export function calculateCarrierMargin(input: {
  bidAmount: number;
  loadedMiles: number;
  emptyMiles?: number;
  fuelPricePerLitre?: number;
  litresPerMile?: number;
  otherCosts?: number;
}): CarrierMarginResult {
  const bidAmount = Math.max(0, input.bidAmount);
  const loadedMiles = Math.max(0, input.loadedMiles);
  const emptyMiles = Math.max(0, input.emptyMiles ?? 0);
  const totalMiles = loadedMiles + emptyMiles;
  const litresPerMile = input.litresPerMile ?? DEFAULT_LITRES_PER_MILE;
  const fuelPricePerLitre = input.fuelPricePerLitre ?? DEFAULT_FUEL_PRICE_GBP;
  const otherCosts = Math.max(0, input.otherCosts ?? 0);

  const fuelCost = Math.round(totalMiles * litresPerMile * fuelPricePerLitre);
  const grossProfit = Math.round(bidAmount - fuelCost - otherCosts);
  const marginPct = bidAmount > 0 ? Number(((grossProfit / bidAmount) * 100).toFixed(1)) : 0;
  const profitPerLoadedMile = loadedMiles > 0 ? Number((grossProfit / loadedMiles).toFixed(2)) : 0;

  return {
    bidAmount: Math.round(bidAmount),
    loadedMiles,
    emptyMiles,
    totalMiles,
    fuelCost,
    otherCosts: Math.round(otherCosts),
    grossProfit,
    marginPct,
    profitPerLoadedMile,
    litresPerMile,
    fuelPricePerLitre,
    payoutNote:
      "Alpha Freight carrier payouts are released within 7 days of verified POD — factor cash flow into your margin.",
  };
}

export function calculateFuelSurcharge(input: {
  baseRate: number;
  fscPercent: number;
  miles?: number;
}): FuelSurchargeResult {
  const baseRate = Math.max(0, input.baseRate);
  const fscPercent = Math.max(0, input.fscPercent);
  const fuelSurcharge = Math.round(baseRate * (fscPercent / 100));
  const totalRate = Math.round(baseRate + fuelSurcharge);
  const miles = input.miles && input.miles > 0 ? Math.round(input.miles) : null;
  const totalRpm = miles ? Number((totalRate / miles).toFixed(2)) : null;

  return {
    baseRate: Math.round(baseRate),
    fscPercent,
    fuelSurcharge,
    totalRate,
    miles,
    totalRpm,
    formulaNote: `Total = base rate + (${fscPercent}% fuel surcharge on linehaul).`,
  };
}

function planHaulHours(miles: number) {
  let remaining = miles;
  let driveHours = 0;
  let breakHours = 0;
  let sessionDrive = 0;

  while (remaining > 0) {
    const milesThisChunk = Math.min(remaining, BREAK_EVERY_HOURS * HGV_PLANNING_MPH);
    const chunkHours = milesThisChunk / HGV_PLANNING_MPH;
    driveHours += chunkHours;
    sessionDrive += chunkHours;
    remaining -= milesThisChunk;

    if (remaining > 0) {
      breakHours += BREAK_DURATION_HOURS;
      sessionDrive = 0;
    }
  }

  const restHours = driveHours > UK_DAILY_DRIVE_HOURS ? Math.ceil(driveHours / UK_DAILY_DRIVE_HOURS - 1) * 11 : 0;

  return {
    driveHours: Number(driveHours.toFixed(1)),
    breakHours: Number(breakHours.toFixed(1)),
    restHours,
  };
}

export function calculateDeliveryEta(input: {
  origin?: string;
  destination?: string;
  distanceMiles?: number;
  pickupAt: string;
}): DeliveryEtaResult {
  const pickupDate = new Date(input.pickupAt);
  if (Number.isNaN(pickupDate.getTime())) {
    throw new Error("Enter a valid pickup date and time.");
  }

  let origin: string | null = null;
  let destination: string | null = null;
  let distanceMiles = input.distanceMiles ?? 0;

  if (input.origin && input.destination) {
    const o = normalizeLocation(input.origin);
    const d = normalizeLocation(input.destination);
    if (!isValidUkLane(o, d)) {
      throw new Error("Enter recognised UK cities for origin and destination.");
    }
    const distance = calculateUkDistance(o, d);
    origin = distance.origin;
    destination = distance.destination;
    distanceMiles = distance.distanceMiles;
  }

  if (!distanceMiles || distanceMiles <= 0) {
    throw new Error("Distance is required — enter UK cities or a valid mileage.");
  }

  const loadingBufferHours = 0.75;
  const { driveHours, breakHours, restHours } = planHaulHours(distanceMiles);
  const totalHours = driveHours + breakHours + restHours + loadingBufferHours + 0.5;

  const earliest = new Date(pickupDate.getTime() + totalHours * 60 * 60 * 1000);
  const latest = new Date(pickupDate.getTime() + (totalHours + 1.5) * 60 * 60 * 1000);

  return {
    origin,
    destination,
    distanceMiles,
    pickupAt: pickupDate.toISOString(),
    deliveryEarliest: earliest.toISOString(),
    deliveryLatest: latest.toISOString(),
    driveHours,
    breakHours,
    restHours,
    loadingBufferHours,
    assumptions: [
      `Planning speed ${HGV_PLANNING_MPH} mph for UK HGV corridors.`,
      `${BREAK_DURATION_HOURS * 60}-minute break every ${BREAK_EVERY_HOURS} hours driving.`,
      `${UK_DAILY_DRIVE_HOURS}-hour daily driving limit with rest periods on multi-day legs.`,
      "Includes pickup loading buffer — not a guaranteed delivery appointment.",
    ],
  };
}

export function resolveDistanceForEta(origin: string, destination: string) {
  return estimateDistanceMiles(origin, destination);
}
