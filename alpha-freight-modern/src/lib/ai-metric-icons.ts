import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Clock,
  Fuel,
  TrafficCone,
  PoundSterling,
  TrendingUp,
  Truck,
  Package,
  Zap,
  Globe,
  CloudSun,
  CircleDot,
} from "lucide-react";

const LABEL_ICONS: Record<string, LucideIcon> = {
  distance: MapPin,
  miles: MapPin,
  eta: Clock,
  fuel: Fuel,
  traffic: TrafficCone,
  rate: PoundSterling,
  rpm: TrendingUp,
  profit: TrendingUp,
  route: Truck,
  load: Package,
};

const EMOJI_ICON_MAP: Record<string, LucideIcon> = {
  "📍": MapPin,
  "⏱️": Clock,
  "⏱": Clock,
  "⛽": Fuel,
  "🚦": TrafficCone,
  "💰": PoundSterling,
  "📈": TrendingUp,
  "🚛": Truck,
  "📦": Package,
  "⚡": Zap,
  "🗺️": Globe,
  "🗺": Globe,
  "🌤️": CloudSun,
  "🌤": CloudSun,
};

export function resolveMetricIcon(label: string, emoji?: string): LucideIcon {
  if (emoji && EMOJI_ICON_MAP[emoji.trim()]) {
    return EMOJI_ICON_MAP[emoji.trim()];
  }
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  for (const [needle, icon] of Object.entries(LABEL_ICONS)) {
    if (key.includes(needle)) return icon;
  }
  return CircleDot;
}
