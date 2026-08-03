"use client";

import { useMemo } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import type { RouteResult } from "@/lib/mapbox-routes";
import { MAPBOX_TOKEN } from "@/lib/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type AiRouteMapCanvasProps = {
  route: RouteResult;
  origin: string;
  destination: string;
};

export default function AiRouteMapCanvas({ route, origin, destination }: AiRouteMapCanvasProps) {
  const geojson = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: route.coordinates.map((c) => [c.longitude, c.latitude]),
      },
    }),
    [route.coordinates]
  );

  const start = route.coordinates[0];
  const end = route.coordinates[route.coordinates.length - 1];
  const mid = route.coordinates[Math.floor(route.coordinates.length / 2)];

  if (!start || !end || !mid) return null;

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: mid.longitude,
        latitude: mid.latitude,
        zoom: 6,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      attributionControl={false}
      scrollZoom={false}
      dragPan={false}
      doubleClickZoom={false}
    >
      <Source id="route" type="geojson" data={geojson}>
        <Layer
          id="route-line"
          type="line"
          paint={{ "line-color": "#7a9900", "line-width": 4, "line-opacity": 0.85 }}
        />
      </Source>
      <Marker longitude={start.longitude} latitude={start.latitude} anchor="bottom">
        <div className="rounded-full bg-[#BFFF07] px-1.5 py-0.5 text-[9px] font-bold text-[#333] shadow">
          {origin.slice(0, 3)}
        </div>
      </Marker>
      <Marker longitude={end.longitude} latitude={end.latitude} anchor="bottom">
        <div className="rounded-full bg-[#111] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
          {destination.slice(0, 3)}
        </div>
      </Marker>
    </Map>
  );
}
