"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navigation } from "lucide-react";
import { buildRouteMetrics } from "@/lib/public-ai-widgets";
import { buildOsmEmbedUrl } from "@/lib/osm-embed";
import AiMetricPills from "@/components/marketing/ai/AiMetricPills";
import type { CopilotMetric } from "@/lib/chat-types";

type RouteMapPayload = {
  originCoords: { lat: number; lng: number } | null;
  destCoords: { lat: number; lng: number } | null;
  staticMapUrl: string | null;
  route: {
    distanceMeters: number;
    durationSeconds: number;
    coordinates: Array<{ latitude: number; longitude: number }>;
  } | null;
  metrics: CopilotMetric[];
};

type AiRouteMiniMapProps = {
  origin: string;
  destination: string;
};

export default function AiRouteMiniMap({ origin, destination }: AiRouteMiniMapProps) {
  const [payload, setPayload] = useState<RouteMapPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ai/route-map?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
        );
        const data = (await res.json()) as RouteMapPayload;
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) {
          setPayload({
            originCoords: null,
            destCoords: null,
            staticMapUrl: null,
            route: null,
            metrics: buildRouteMetrics(origin, destination),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  const metrics = payload?.metrics?.length ? payload.metrics : buildRouteMetrics(origin, destination);
  const osmEmbedUrl =
    payload?.originCoords && payload?.destCoords
      ? buildOsmEmbedUrl(
          { lat: payload.originCoords.lat, lng: payload.originCoords.lng },
          { lat: payload.destCoords.lat, lng: payload.destCoords.lng }
        )
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white/90 shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-4 py-3">
        <Navigation className="h-4 w-4 text-[#7a9900]" />
        <span className="text-sm font-semibold text-[#0d0d0d]">
          {origin} → {destination}
        </span>
      </div>

      <div className="relative h-[200px] w-full bg-[#eef2ea]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-[#999]">Loading map…</div>
        ) : payload?.staticMapUrl ? (
          <Image
            src={payload.staticMapUrl}
            alt={`Route map ${origin} to ${destination}`}
            fill
            unoptimized
            className="object-cover"
            sizes="640px"
          />
        ) : osmEmbedUrl ? (
          <iframe
            title={`Route ${origin} to ${destination}`}
            src={osmEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[#888]">
            Map unavailable — distance stats below are still accurate.
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <AiMetricPills metrics={metrics} />
      </div>
    </motion.div>
  );
}
