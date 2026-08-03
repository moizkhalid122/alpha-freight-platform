"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Navigation, MapPin } from "lucide-react";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { formatDistance, formatDuration } from "@/lib/mapbox-routes";
import { buildRouteMetrics } from "@/lib/public-ai-widgets";
import AiMetricPills from "@/components/marketing/ai/AiMetricPills";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

const MapCanvas = dynamic(() => import("@/components/marketing/ai/AiRouteMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[160px] items-center justify-center rounded-xl bg-[#f4f4f4] text-xs text-[#999]">
      Loading map…
    </div>
  ),
});

type AiRouteMiniMapProps = {
  origin: string;
  destination: string;
};

export default function AiRouteMiniMap({ origin, destination }: AiRouteMiniMapProps) {
  const { route, loading } = useLoadRoute(origin, destination, Boolean(MAPBOX_TOKEN));
  const staticMetrics = buildRouteMetrics(origin, destination);

  const liveMetrics =
    route && !loading
      ? [
          { label: "Distance", value: formatDistance(route.distanceMeters), icon: "📍" as const },
          { label: "ETA", value: formatDuration(route.durationSeconds), icon: "⏱️" as const },
          {
            label: "Fuel est.",
            value: `~£${Math.round((route.distanceMeters / 1609) * 0.58 * 1.48)}`,
            icon: "⛽" as const,
            tone: "warning" as const,
          },
          { label: "Traffic", value: "Live route", icon: "🚦" as const },
        ]
      : staticMetrics;

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

      {MAPBOX_TOKEN && route ? (
        <div className="h-[160px] w-full">
          <MapCanvas route={route} origin={origin} destination={destination} />
        </div>
      ) : (
        <div className="relative mx-4 mt-3 h-[120px] overflow-hidden rounded-xl bg-gradient-to-br from-[#eef5e0] via-[#f7f7f8] to-[#e8f0ff]">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 320 120" className="h-full w-full px-6" aria-hidden>
              <path
                d="M 40 80 Q 120 20, 200 50 T 280 40"
                fill="none"
                stroke="#7a9900"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <circle cx="40" cy="80" r="8" fill="#BFFF07" stroke="#7a9900" strokeWidth="2" />
              <circle cx="280" cy="40" r="8" fill="#111" stroke="#666" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] font-medium text-[#666]">
            <MapPin className="h-3 w-3" /> {origin}
          </div>
          <div className="absolute right-3 top-2 flex items-center gap-1 text-[10px] font-medium text-[#666]">
            <MapPin className="h-3 w-3" /> {destination}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <AiMetricPills metrics={liveMetrics} />
      </div>
    </motion.div>
  );
}
