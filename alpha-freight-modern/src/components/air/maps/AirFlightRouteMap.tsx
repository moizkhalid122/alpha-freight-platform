"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Loader2, Plane } from "lucide-react";
import { buildFlightArc, flightDistanceKm, getHubCity, getHubCoords } from "@/lib/air-hubs";
import { LOAD_ROUTE_MAP_STYLE, MAPBOX_TOKEN } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MapComponent = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-300">
      Loading flight map…
    </div>
  ),
});

const MapSource = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Source), { ssr: false });
const MapLayer = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Layer), { ssr: false });
const MapMarker = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.Marker), { ssr: false });
const NavigationControl = dynamic(
  () => import("react-map-gl/mapbox").then((mod) => mod.NavigationControl),
  { ssr: false }
);

type AirFlightRouteMapProps = {
  originHub: string;
  destinationHub: string;
  className?: string;
  minHeight?: number | string;
  overlayTopLeft?: React.ReactNode;
  overlayBottomLeft?: React.ReactNode;
  onDistanceChange?: (distanceKm: number) => void;
};

export default function AirFlightRouteMap({
  originHub,
  destinationHub,
  className = "",
  minHeight = 420,
  overlayTopLeft,
  overlayBottomLeft,
  onDistanceChange,
}: AirFlightRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const lastFitKeyRef = useRef("");

  const origin = getHubCoords(originHub);
  const destination = getHubCoords(destinationHub);
  const distanceKm = flightDistanceKm(originHub, destinationHub);

  useEffect(() => {
    onDistanceChange?.(distanceKm);
  }, [distanceKm, onDistanceChange]);

  const routeGeoJson = useMemo(() => {
    if (!origin || !destination) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: buildFlightArc(origin, destination),
      },
    };
  }, [origin, destination]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !origin || !destination) return;

    const fitKey = `${origin.lng},${origin.lat}|${destination.lng},${destination.lat}`;
    if (lastFitKeyRef.current === fitKey) return;
    lastFitKeyRef.current = fitKey;

    map.fitBounds(
      [
        [Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
        [Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)],
      ],
      { padding: { top: 96, bottom: 56, left: 56, right: 56 }, duration: 900, maxZoom: 5.5 }
    );
  }, [origin, destination]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center rounded-[28px] border border-dashed border-slate-700 bg-slate-950 ${className}`}
        style={{ minHeight }}
      >
        <p className="px-6 text-center text-sm text-slate-400">
          Map unavailable — add NEXT_PUBLIC_MAPBOX_TOKEN to preview the flight lane.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`} style={{ minHeight }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_55%)]" />

      {overlayTopLeft ? (
        <div className="pointer-events-none absolute left-5 right-20 top-5 z-10">{overlayTopLeft}</div>
      ) : null}
      {overlayBottomLeft ? (
        <div className="pointer-events-none absolute bottom-5 left-5 z-10">{overlayBottomLeft}</div>
      ) : null}

      {!origin || !destination ? (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Plane className="h-8 w-8 text-sky-400" />
          <p className="text-sm font-semibold text-white">Select origin and destination hubs</p>
          <p className="text-xs text-slate-400">Your VIP flight lane will appear here.</p>
        </div>
      ) : null}

      <MapComponent
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 10, latitude: 50, zoom: 4 }}
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
          <MapSource id="air-flight-route" type="geojson" data={routeGeoJson}>
            <MapLayer
              id="air-flight-route-glow"
              type="line"
              paint={{
                "line-color": "#38bdf8",
                "line-width": 8,
                "line-opacity": 0.22,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
            <MapLayer
              id="air-flight-route-line"
              type="line"
              paint={{
                "line-color": "#0ea5e9",
                "line-width": 3,
                "line-opacity": 0.95,
                "line-dasharray": [1, 1.5],
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </MapSource>
        ) : null}

        {origin ? (
          <MapMarker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="mb-1 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Origin</p>
                <p className="text-xs font-semibold text-white">
                  {origin.code} · {getHubCity(originHub)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-sky-500 shadow-xl">
                <Plane className="h-4 w-4 rotate-[-45deg] text-white" />
              </div>
            </div>
          </MapMarker>
        ) : null}

        {destination ? (
          <MapMarker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="mb-1 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Destination</p>
                <p className="text-xs font-semibold text-white">
                  {destination.code} · {getHubCity(destinationHub)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 shadow-xl">
                <Plane className="h-4 w-4 rotate-[135deg] text-white" />
              </div>
            </div>
          </MapMarker>
        ) : null}
      </MapComponent>

      {origin && destination ? (
        <div className="absolute bottom-5 right-5 z-10 rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-3 text-right backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flight lane</p>
          <p className="air-font-display text-lg text-white">{distanceKm.toLocaleString()} km</p>
        </div>
      ) : null}

      {origin && destination && !routeGeoJson ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-950/40">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      ) : null}
    </div>
  );
}
