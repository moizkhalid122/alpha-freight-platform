import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Building2,
  Crown,
  LayoutDashboard,
  Plane,
  ShieldCheck,
  Ship,
  Truck,
  Users,
  Package,
  Globe2,
} from "lucide-react";
import {
  AIR_ADMIN_PATH,
  HQ_ADMIN_PATH,
  ROAD_ADMIN_PATH,
  SEA_ADMIN_PATH,
  airAdminRoute,
  hqAdminRoute,
  seaAdminRoute,
} from "@/lib/mode-admin-paths";
import { adminRoute } from "@/lib/admin-path";

export type ModeAdminNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

export type ModeAdminNavSection = {
  label: string;
  items: ModeAdminNavItem[];
};

export type ModeAdminPanelConfig = {
  id: "air" | "sea" | "hq" | "road";
  title: string;
  subtitle: string;
  homePath: string;
  accentClass: string;
  badge: string;
  sections: ModeAdminNavSection[];
};

export const AIR_ADMIN_NAV: ModeAdminPanelConfig = {
  id: "air",
  title: "Air Freight Admin",
  subtitle: "Forwarders, shippers, AWBs & air verification",
  homePath: AIR_ADMIN_PATH,
  accentClass: "from-sky-500/10 to-blue-50 border-sky-200",
  badge: "AIR",
  sections: [
    {
      label: "OVERVIEW",
      items: [{ name: "Dashboard", path: airAdminRoute(), icon: LayoutDashboard }],
    },
    {
      label: "FORWARDERS",
      items: [
        { name: "All Forwarders", path: airAdminRoute("/forwarders"), icon: Plane },
        {
          name: "Pending Verification",
          path: airAdminRoute("/forwarders/pending-verifications"),
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "SHIPPERS",
      items: [
        { name: "All Shippers", path: airAdminRoute("/shippers"), icon: Building2 },
        {
          name: "Pending Verification",
          path: airAdminRoute("/shippers/pending-verifications"),
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { name: "Air Shipments", path: airAdminRoute("/shipments"), icon: Package },
        { name: "Bookings", path: airAdminRoute("/bookings"), icon: Globe2 },
      ],
    },
    {
      label: "OTHER PANELS",
      items: [
        { name: "Road Admin", path: adminRoute(), icon: Truck },
        { name: "Sea Admin", path: seaAdminRoute(), icon: Ship },
        { name: "HQ Master", path: hqAdminRoute(), icon: Crown },
      ],
    },
  ],
};

export const SEA_ADMIN_NAV: ModeAdminPanelConfig = {
  id: "sea",
  title: "Sea Freight Admin",
  subtitle: "Ocean forwarders, shippers & container bookings",
  homePath: SEA_ADMIN_PATH,
  accentClass: "from-slate-500/10 to-slate-50 border-slate-300",
  badge: "SEA",
  sections: [
    {
      label: "OVERVIEW",
      items: [{ name: "Dashboard", path: seaAdminRoute(), icon: LayoutDashboard }],
    },
    {
      label: "FORWARDERS",
      items: [
        { name: "All Forwarders", path: seaAdminRoute("/forwarders"), icon: Anchor },
        {
          name: "Pending Verification",
          path: seaAdminRoute("/forwarders/pending-verifications"),
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "SHIPPERS",
      items: [
        { name: "All Shippers", path: seaAdminRoute("/shippers"), icon: Building2 },
        {
          name: "Pending Verification",
          path: seaAdminRoute("/shippers/pending-verifications"),
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "OPERATIONS",
      items: [{ name: "Sea Bookings", path: seaAdminRoute("/bookings"), icon: Package }],
    },
    {
      label: "OTHER PANELS",
      items: [
        { name: "Road Admin", path: adminRoute(), icon: Truck },
        { name: "Air Admin", path: airAdminRoute(), icon: Plane },
        { name: "HQ Master", path: hqAdminRoute(), icon: Crown },
      ],
    },
  ],
};

export const HQ_ADMIN_NAV: ModeAdminPanelConfig = {
  id: "hq",
  title: "Alpha HQ Master Console",
  subtitle: "Unified control — road, air, sea & all platform records",
  homePath: HQ_ADMIN_PATH,
  accentClass: "from-violet-500/10 to-purple-50 border-violet-200",
  badge: "HQ",
  sections: [
    {
      label: "COMMAND",
      items: [
        { name: "Master Overview", path: hqAdminRoute(), icon: Crown },
        { name: "All Users", path: hqAdminRoute("/users"), icon: Users },
        { name: "All Verifications", path: hqAdminRoute("/verifications"), icon: ShieldCheck },
      ],
    },
    {
      label: "BY MODE",
      items: [
        { name: "Road Records", path: hqAdminRoute("/road"), icon: Truck },
        { name: "Air Records", path: hqAdminRoute("/air"), icon: Plane },
        { name: "Sea Records", path: hqAdminRoute("/sea"), icon: Ship },
      ],
    },
    {
      label: "SUB-PANELS",
      items: [
        { name: "Road Admin", path: adminRoute(), icon: Truck },
        { name: "Air Admin", path: airAdminRoute(), icon: Plane },
        { name: "Sea Admin", path: seaAdminRoute(), icon: Ship },
      ],
    },
  ],
};
