"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import {
  getClosestRouteProgress,
  hasDisplayableCarrierTracking,
  type LoadLiveTracking,
} from "@/lib/load-gps-tracking";
import { MAPBOX_TOKEN } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MapComponent = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
      Loading map…
    </div>
  ),
});

const Source = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Source), {
  ssr: false,
});
const Layer = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Layer), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Marker), { ssr: false });
const NavigationControl = dynamic(
  () => import("react-map-gl/mapbox").then((mod) => mod.NavigationControl),
  { ssr: false }
);

type LoadLiveTrackingMapProps = {
  origin: string;
  destination: string;
  liveTracking?: LoadLiveTracking | null;
  loadStatus?: string | null;
};

export default function LoadLiveTrackingMap({
  origin,
  destination,
  liveTracking = null,
  loadStatus = null,
}: LoadLiveTrackingMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const token = MAPBOX_TOKEN;
  const { originCoords, destCoords, route, loading } = useLoadRoute(origin, destination, !!token);
  const showCarrier = hasDisplayableCarrierTracking(liveTracking, loadStatus);

  const routeGeoJson = useMemo(() => {
    if (!route?.coordinates?.length) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: route.coordinates.map((point) => [point.longitude, point.latitude]),
      },
    };
  }, [route]);

  const progress = useMemo(() => {
    if (!showCarrier || !liveTracking || !route?.coordinates?.length) return null;
    return getClosestRouteProgress(route.coordinates, liveTracking.latitude, liveTracking.longitude);
  }, [liveTracking, route, showCarrier]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !originCoords || !destCoords) return;

    const bounds: [number, number, number, number] = [
      Math.min(originCoords.lng, destCoords.lng),
      Math.min(originCoords.lat, destCoords.lat),
      Math.max(originCoords.lng, destCoords.lng),
      Math.max(originCoords.lat, destCoords.lat),
    ];

    if (showCarrier && liveTracking) {
      bounds[0] = Math.min(bounds[0], liveTracking.longitude);
      bounds[1] = Math.min(bounds[1], liveTracking.latitude);
      bounds[2] = Math.max(bounds[2], liveTracking.longitude);
      bounds[3] = Math.max(bounds[3], liveTracking.latitude);
    }

    map.fitBounds(bounds, { padding: 72, duration: 900, maxZoom: 11 });
  }, [originCoords, destCoords, liveTracking, showCarrier]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <MapPin className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">Map unavailable</p>
        <p className="text-xs text-slate-500">Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable live tracking maps.</p>
      </div>
    );
  }

  if (loading || !originCoords || !destCoords || !routeGeoJson) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live route…
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <MapComponent
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: originCoords.lng,
          latitude: originCoords.lat,
          zoom: 6,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="route-line" type="geojson" data={routeGeoJson}>
          <Layer
            id="route-line-layer"
            type="line"
            paint={{
              "line-color": "#2563eb",
              "line-width": 4,
              "line-opacity": 0.85,
            }}
          />
        </Source>

        <Marker longitude={originCoords.lng} latitude={originCoords.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              Pickup
            </div>
            <div className="mt-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow" />
          </div>
        </Marker>

        <Marker longitude={destCoords.lng} latitude={destCoords.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              Delivery
            </div>
            <div className="mt-1 h-3 w-3 rounded-full border-2 border-white bg-rose-600 shadow" />
          </div>
        </Marker>

        {showCarrier && liveTracking ? (
          <Marker
            longitude={liveTracking.longitude}
            latitude={liveTracking.latitude}
            anchor="center"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg"
              style={{
                transform: liveTracking.heading
                  ? `rotate(${liveTracking.heading}deg)`
                  : undefined,
              }}
            >
              <Navigation className="h-5 w-5" />
            </div>
          </Marker>
        ) : null}
      </MapComponent>

      {progress != null ? (
        <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow">
          Route progress: {Math.round(progress)}%
        </div>
      ) : null}
    </div>
  );
}
