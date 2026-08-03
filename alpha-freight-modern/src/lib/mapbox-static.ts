import type { RouteResult } from "@/lib/mapbox-routes";

export type MapPoint = { lng: number; lat: number };

function simplifyPath(points: Array<{ longitude: number; latitude: number }>, maxPoints = 40): string {
  if (!points.length) return "";
  const step = Math.max(1, Math.floor(points.length / maxPoints));
  return points
    .filter((_, index) => index % step === 0 || index === points.length - 1)
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");
}

export function buildMapboxStaticMapUrl(options: {
  origin: MapPoint;
  destination: MapPoint;
  route?: RouteResult | null;
  token: string;
  width?: number;
  height?: number;
}): string {
  const { origin, destination, route, token, width = 640, height = 220 } = options;
  const pathCoords = route?.coordinates?.length
    ? simplifyPath(route.coordinates)
    : `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

  const overlay = [
    `path-5+7a9900-0.9(${pathCoords})`,
    `pin-s-a+7a9900(${origin.lng},${origin.lat})`,
    `pin-s-b+111111(${destination.lng},${destination.lat})`,
  ].join(",");

  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${encodeURIComponent(overlay)}/auto/${width}x${height}@2x?padding=48&access_token=${token}`;
}

export function getMapboxServerToken(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    ""
  );
}
