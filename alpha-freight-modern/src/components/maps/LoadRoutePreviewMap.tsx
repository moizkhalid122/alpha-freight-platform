"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Loader2, MapPin } from "lucide-react";
import { useLoadRoutePreview } from "@/hooks/useLoadRoutePreview";
import { LOAD_ROUTE_MAP_STYLE, MAPBOX_TOKEN } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MapComponent = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[12px] font-medium text-slate-500">
      Loading map…
    </div>
  ),
});

const MapSource = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Source), {
  ssr: false,
});
const MapLayer = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Layer), {
  ssr: false,
});
const MapMarker = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Marker), {
  ssr: false,
});
const NavigationControl = dynamic(
  () => import("react-map-gl/mapbox").then((mod) => mod.NavigationControl),
  { ssr: false }
);

function getCity(value?: string | null) {
  if (!value) return "—";
  return value.split(",")[0].replace(/\s*\([A-Z0-9 ]+\)\s*$/i, "").trim();
}

export type LoadRoutePreviewMapProps = {
  origin?: string | null;
  destination?: string | null;
  notes?: string | null;
  pickupPostcode?: string | null;
  deliveryPostcode?: string | null;
  enabled?: boolean;
  className?: string;
  minHeight?: number | string;
  children?: React.ReactNode;
  overlayTopLeft?: React.ReactNode;
  overlayBottomLeft?: React.ReactNode;
  onMetrics?: (metrics: { distanceMeters: number; durationSeconds: number } | null) => void;
};

export default function LoadRoutePreviewMap({
  origin,
  destination,
  notes,
  pickupPostcode,
  deliveryPostcode,
  enabled = true,
  className = "",
  minHeight = 320,
  children,
  overlayTopLeft,
  overlayBottomLeft,
  onMetrics,
}: LoadRoutePreviewMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const lastFitKeyRef = useRef("");

  const { originCoords, destCoords, route, metrics, loading } = useLoadRoutePreview({
    origin,
    destination,
    notes,
    pickupPostcode,
    deliveryPostcode,
    enabled,
  });

  useEffect(() => {
    onMetrics?.(metrics);
  }, [metrics, onMetrics]);

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

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !originCoords || !destCoords) return;

    const fitKey = `${originCoords.lng},${originCoords.lat}|${destCoords.lng},${destCoords.lat}`;
    if (lastFitKeyRef.current === fitKey) return;
    lastFitKeyRef.current = fitKey;

    const bounds: [number, number, number, number] = [
      Math.min(originCoords.lng, destCoords.lng),
      Math.min(originCoords.lat, destCoords.lat),
      Math.max(originCoords.lng, destCoords.lng),
      Math.max(originCoords.lat, destCoords.lat),
    ];

    map.fitBounds(bounds, {
      padding: { top: 88, bottom: 48, left: 48, right: 48 },
      duration: 900,
      maxZoom: 13,
    });
  }, [originCoords, destCoords]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 ${className}`}
        style={{ minHeight }}
      >
        <p className="px-6 text-center text-[12px] text-slate-500">Map token missing — add NEXT_PUBLIC_MAPBOX_TOKEN.</p>
      </div>
    );
  }

  const hasPoints = Boolean(originCoords && destCoords);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={{ minHeight }}
    >
      {overlayTopLeft ? <div className="pointer-events-none absolute left-4 right-16 top-4 z-10">{overlayTopLeft}</div> : null}
      {overlayBottomLeft ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10">{overlayBottomLeft}</div>
      ) : null}

      {loading && !hasPoints ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-100/90">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Loading route map…
          </div>
        </div>
      ) : null}

      {!loading && !hasPoints ? (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center">
          <MapPin className="h-7 w-7 text-slate-300" />
          <p className="text-[13px] font-semibold text-slate-800">Enter pickup and delivery</p>
          <p className="text-[12px] text-slate-500">Add cities and postcodes to preview the lane on the map.</p>
        </div>
      ) : null}

      <MapComponent
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: -2.5,
          latitude: 54.5,
          zoom: 5.5,
        }}
        style={{ width: "100%", height: "100%", minHeight }}
        mapStyle={LOAD_ROUTE_MAP_STYLE}
        attributionControl={false}
        scrollZoom
        dragPan
        doubleClickZoom
        touchZoomRotate
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} visualizePitch={false} />

        {routeGeoJson ? (
          <MapSource id="load-route-preview" type="geojson" data={routeGeoJson}>
            <MapLayer
              id="load-route-preview-outline"
              type="line"
              paint={{
                "line-color": "#1d4ed8",
                "line-width": 9,
                "line-opacity": 0.28,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
            <MapLayer
              id="load-route-preview-line"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 5.5,
                "line-opacity": 1,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </MapSource>
        ) : null}

        {originCoords ? (
          <MapMarker longitude={originCoords.lng} latitude={originCoords.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="mb-1 max-w-[150px] rounded-lg border-2 border-white bg-blue-600 px-2.5 py-1 shadow-lg">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-white">Pickup</span>
                <span className="block truncate text-[9px] font-medium text-blue-100">{getCity(origin)}</span>
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-35" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-blue-600 shadow-xl">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </MapMarker>
        ) : null}

        {destCoords ? (
          <MapMarker longitude={destCoords.lng} latitude={destCoords.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="mb-1 max-w-[150px] rounded-lg border-2 border-white bg-emerald-600 px-2.5 py-1 shadow-lg">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-white">
                  Delivery
                </span>
                <span className="block truncate text-[9px] font-medium text-emerald-100">{getCity(destination)}</span>
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-emerald-600 shadow-xl">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </MapMarker>
        ) : null}

        {children}
      </MapComponent>
    </div>
  );
}
