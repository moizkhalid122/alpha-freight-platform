"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCarrierLoadGeocodeQueries } from "@/components/carrier/CarrierLoadDetailsPanel";
import {
  fetchDrivingRoute,
  geocodePlace,
  type MapCoords,
  type RouteResult,
} from "@/lib/mapbox-routes";

export type LoadRoutePreviewMetrics = {
  distanceMeters: number;
  durationSeconds: number;
};

export function useLoadRoutePreview(options: {
  origin?: string | null;
  destination?: string | null;
  notes?: string | null;
  pickupPostcode?: string | null;
  deliveryPostcode?: string | null;
  enabled?: boolean;
}) {
  const {
    origin = "",
    destination = "",
    notes,
    pickupPostcode,
    deliveryPostcode,
    enabled = true,
  } = options;

  const queries = useMemo(
    () =>
      buildCarrierLoadGeocodeQueries({
        origin,
        destination,
        notes,
        pickupPostcode,
        deliveryPostcode,
      }),
    [origin, destination, notes, pickupPostcode, deliveryPostcode]
  );

  const [originCoords, setOriginCoords] = useState<MapCoords | null>(null);
  const [destCoords, setDestCoords] = useState<MapCoords | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || (!queries.originQuery && !queries.destinationQuery)) {
      setLoading(false);
      setOriginCoords(null);
      setDestCoords(null);
      setRoute(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setOriginCoords(null);
      setDestCoords(null);
      setRoute(null);

      const [originPoint, destPoint] = await Promise.all([
        queries.originQuery ? geocodePlace(queries.originQuery) : Promise.resolve(null),
        queries.destinationQuery ? geocodePlace(queries.destinationQuery) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      setOriginCoords(originPoint);
      setDestCoords(destPoint);

      if (!originPoint || !destPoint) {
        setLoading(false);
        return;
      }

      const routeResult = await fetchDrivingRoute(
        queries.originQuery,
        queries.destinationQuery,
        originPoint,
        destPoint
      );

      if (cancelled) return;

      setRoute(routeResult);
      setLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, queries.originQuery, queries.destinationQuery]);

  const metrics: LoadRoutePreviewMetrics | null = route
    ? {
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      }
    : null;

  return {
    originCoords,
    destCoords,
    route,
    metrics,
    loading,
    originQuery: queries.originQuery,
    destinationQuery: queries.destinationQuery,
  };
}
