import type { MapPoint } from "@/lib/mapbox-static";

export function buildOsmEmbedUrl(origin: MapPoint, destination: MapPoint): string {
  const minLat = Math.min(origin.lat, destination.lat) - 0.35;
  const maxLat = Math.max(origin.lat, destination.lat) + 0.35;
  const minLng = Math.min(origin.lng, destination.lng) - 0.45;
  const maxLng = Math.max(origin.lng, destination.lng) + 0.45;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${origin.lat}%2C${origin.lng}&marker=${destination.lat}%2C${destination.lng}`;
}
