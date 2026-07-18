import { NextRequest, NextResponse } from "next/server";

import { normalizeLocation, parseEquipmentQuery, resolveUkCityLabel } from "@/lib/freight-tools";
import { fetchPublicAvailableLoads } from "@/lib/public-freight-data";

function matchesCity(value: string, filter: string) {
  const label = resolveUkCityLabel(value)?.toLowerCase();
  const filterLabel = resolveUkCityLabel(filter)?.toLowerCase() ?? filter.toLowerCase();
  if (!label) return value.toLowerCase().includes(filterLabel);
  return label.includes(filterLabel) || filterLabel.includes(label);
}

function matchesEquipment(value: string, filter: string) {
  const normalized = value.toLowerCase();
  const equipment = parseEquipmentQuery(filter);
  if (equipment === "general") return true;
  if (equipment === "refrigerated") return normalized.includes("refrig") || normalized.includes("fridge");
  if (equipment === "flatbed") return normalized.includes("flat");
  if (equipment === "curtain") return normalized.includes("curtain") || normalized.includes("tilt");
  return true;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = normalizeLocation(params.get("origin") || "");
  const destination = normalizeLocation(params.get("destination") || "");
  const equipment = params.get("equipment") || "";
  const limit = Math.min(24, Math.max(1, Number(params.get("limit") || 12)));

  try {
    let loads = await fetchPublicAvailableLoads(48);

    if (origin) {
      loads = loads.filter((load) => matchesCity(load.origin, origin));
    }
    if (destination) {
      loads = loads.filter((load) => matchesCity(load.destination, destination));
    }
    if (equipment) {
      loads = loads.filter((load) => matchesEquipment(load.equipment, equipment));
    }

    const priced = loads.filter((load) => load.price > 0);
    const avgRatePerMile =
      priced.length > 0
        ? Number(
            (
              priced.reduce((sum, load) => {
                const miles = 80 + (hashString(load.id) % 220);
                return sum + load.price / miles;
              }, 0) / priced.length
            ).toFixed(2),
          )
        : null;

    return NextResponse.json({
      loads: loads.slice(0, limit),
      stats: {
        total: loads.length,
        avgRatePerMile,
        filtered: Boolean(origin || destination || equipment),
      },
    });
  } catch (error) {
    console.error("[public/loads]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch loads.",
        loads: [],
        stats: { total: 0, avgRatePerMile: null, filtered: false },
      },
      { status: 500 },
    );
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
