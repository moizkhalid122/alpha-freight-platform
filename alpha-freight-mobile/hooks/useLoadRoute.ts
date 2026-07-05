import { useEffect, useState } from "react";
import {
  fetchDrivingRoute,
  geocodePlace,
  MapCoords,
  RouteResult,
} from "@/lib/mapbox";

type LoadRouteState = {
  originCoords: MapCoords | null;
  destCoords: MapCoords | null;
  route: RouteResult | null;
  loading: boolean;
};

export function useLoadRoute(
  origin: string,
  destination: string,
  enabled = true
): LoadRouteState {
  const [originCoords, setOriginCoords] = useState<MapCoords | null>(null);
  const [destCoords, setDestCoords] = useState<MapCoords | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setOriginCoords(null);
      setDestCoords(null);
      setRoute(null);

      const [originPoint, destPoint] = await Promise.all([
        geocodePlace(origin),
        geocodePlace(destination),
      ]);

      if (cancelled) return;

      setOriginCoords(originPoint);
      setDestCoords(destPoint);

      if (!originPoint || !destPoint) {
        setLoading(false);
        return;
      }

      const routeResult = await fetchDrivingRoute(origin, destination, originPoint, destPoint);
      if (cancelled) return;

      setRoute(routeResult);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, enabled]);

  return { originCoords, destCoords, route, loading };
}
