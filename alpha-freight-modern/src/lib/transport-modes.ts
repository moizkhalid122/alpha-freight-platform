import type { LucideIcon } from "lucide-react";
import { Plane, Ship, Truck } from "lucide-react";

export type TransportMode = "road" | "air" | "ship";

export type TransportModeConfig = {
  id: TransportMode;
  label: string;
  title: string;
  description: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
  gradient: string;
  heroVideo?: string;
  heroImage: string;
  loginPath: string;
  signupPath: string;
  selectPath: string;
};

export const TRANSPORT_MODES: TransportModeConfig[] = [
  {
    id: "road",
    label: "Road",
    title: "UK Road Freight",
    description: "Haulage, pallets, and full-load trucking across the UK network.",
    tagline: "Move freight on the road.",
    icon: Truck,
    accent: "#FFD666",
    accentSoft: "bg-[#FFD666]/15 text-amber-900",
    gradient: "from-amber-400/20 via-yellow-50 to-white",
    heroImage: "/alpha freight truck.jpg",
    loginPath: "/auth/login?mode=road",
    signupPath: "/auth/select?mode=road",
    selectPath: "/auth/select?mode=road",
  },
  {
    id: "air",
    label: "Air",
    title: "Air Freight",
    description: "Time-critical cargo, express lanes, and global airport-to-door delivery.",
    tagline: "Fly freight forward.",
    icon: Plane,
    accent: "#0EA5E9",
    accentSoft: "bg-sky-50 text-sky-800",
    gradient: "from-sky-400/15 via-slate-50 to-white",
    heroVideo: "/air-freight-hero.mp4",
    heroImage: "/alpha-box.jpg",
    loginPath: "/auth/air/login",
    signupPath: "/auth/air/signup",
    selectPath: "/auth/air/signup",
  },
  {
    id: "ship",
    label: "Sea",
    title: "Sea Freight",
    description: "Container shipping, port logistics, and international ocean corridors.",
    tagline: "Ship smarter across oceans.",
    icon: Ship,
    accent: "#1E3A5F",
    accentSoft: "bg-slate-100 text-slate-800",
    gradient: "from-slate-400/15 via-slate-50 to-white",
    heroImage: "/alpha-box.jpg",
    loginPath: "/auth/login?mode=ship",
    signupPath: "/auth/select?mode=ship",
    selectPath: "/auth/select?mode=ship",
  },
];

export function getTransportMode(mode: string | null | undefined): TransportModeConfig | null {
  return TRANSPORT_MODES.find((item) => item.id === mode) ?? null;
}
