import { NextRequest, NextResponse } from "next/server";
import { fetchDrivingRoute, geocodePlace, formatDistance, formatDuration } from "@/lib/mapbox-routes";
import { buildMapboxStaticMapUrl, getMapboxServerToken } from "@/lib/mapbox-static";
import { getUkCityCoordinates } from "@/lib/freight-tools";
import { buildRouteMetrics } from "@/lib/public-ai-widgets";

export const runtime = "nodejs";

async function resolveCoords(city: string) {
  const known = getUkCityCoordinates(city);
  if (known) return { lng: known.lng, lat: known.lat };
  const geocoded = await geocodePlace(city);
  if (geocoded) return geocoded;
  return null;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.searchParams.get("origin")?.trim() || "";
  const destination = request.nextUrl.searchParams.get("destination")?.trim() || "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination required" }, { status: 400 });
  }

  try {
    const [originCoords, destCoords] = await Promise.all([resolveCoords(origin), resolveCoords(destination)]);

    if (!originCoords || !destCoords) {
      return NextResponse.json({
        originCoords: null,
        destCoords: null,
        staticMapUrl: null,
        route: null,
        metrics: buildRouteMetrics(origin, destination),
      });
    }

    const token = getMapboxServerToken();
    let route = null;

    if (token) {
      route = await fetchDrivingRoute(origin, destination, originCoords, destCoords);
    }

    const staticMapUrl =
      token && originCoords && destCoords
        ? buildMapboxStaticMapUrl({
            origin: originCoords,
            destination: destCoords,
            route,
            token,
          })
        : null;

    const metrics =
      route && route.distanceMeters
        ? [
            { label: "Distance", value: formatDistance(route.distanceMeters), icon: "📍" },
            { label: "ETA", value: formatDuration(route.durationSeconds), icon: "⏱️" },
            {
              label: "Fuel est.",
              value: `~£${Math.round((route.distanceMeters / 1609) * 0.58 * 1.48)}`,
              icon: "⛽",
              tone: "warning" as const,
            },
            { label: "Traffic", value: "Live route", icon: "🚦" },
          ]
        : buildRouteMetrics(origin, destination);

    return NextResponse.json({
      originCoords,
      destCoords,
      staticMapUrl,
      route: route
        ? {
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
            coordinates: route.coordinates,
          }
        : null,
      metrics,
    });
  } catch (error) {
    console.error("[api/ai/route-map]", error);
    return NextResponse.json(
      {
        originCoords: getUkCityCoordinates(origin)
          ? { lng: getUkCityCoordinates(origin)!.lng, lat: getUkCityCoordinates(origin)!.lat }
          : null,
        destCoords: getUkCityCoordinates(destination)
          ? { lng: getUkCityCoordinates(destination)!.lng, lat: getUkCityCoordinates(destination)!.lat }
          : null,
        staticMapUrl: null,
        route: null,
        metrics: buildRouteMetrics(origin, destination),
      },
      { status: 200 }
    );
  }
}
