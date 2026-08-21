import type { AirRole } from "@/lib/air-portal";
import {
  DEMO_AWBS,
  getAirBookings,
  getAirLanes,
  getAirShipments,
  getForwarderSidebar,
  getShipperSidebar,
  type AirBooking,
  type AirShipment,
} from "@/lib/air-storage";

export function parseAirRate(rate: string): number {
  return parseFloat(rate.replace(/[£,]/g, "")) || 0;
}

export function computeShipperInvoiceAmount(weightKg: number): number {
  return Math.round(weightKg * 6.8 + 120);
}

export type ForwarderDashboardStats = {
  activeAwbs: number;
  bookingCount: number;
  revenue: number;
  revenueFormatted: string;
  inTransit: number;
  pendingSettlement: number;
  pendingFormatted: string;
  winRate: number;
  laneCount: number;
};

export type ShipperDashboardStats = {
  shipmentCount: number;
  inTransit: number;
  spend: number;
  spendFormatted: string;
  onTimeRate: number;
  outstanding: number;
  outstandingFormatted: string;
  pendingCount: number;
};

export function getForwarderDashboardStats(userId: string): ForwarderDashboardStats {
  const bookings = getAirBookings(userId);
  const lanes = getAirLanes(userId);
  const revenue = bookings.reduce((acc, booking) => acc + parseAirRate(booking.rate), 0);
  const inTransit = bookings.filter((booking) => booking.status === "in_transit").length;
  const pendingSettlement = bookings.filter((booking) => booking.status === "confirmed").length;
  const bookedAwbs = new Set(bookings.map((booking) => booking.awb));
  const openAwbs = DEMO_AWBS.filter((row) => !bookedAwbs.has(row.awb)).length;
  const winRate =
    bookings.length + openAwbs > 0
      ? Math.round((bookings.length / (bookings.length + openAwbs)) * 100)
      : 0;

  return {
    activeAwbs: DEMO_AWBS.length,
    bookingCount: bookings.length,
    revenue,
    revenueFormatted: `£${revenue.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
    inTransit,
    pendingSettlement,
    pendingFormatted: `£${bookings
      .filter((booking) => booking.status === "confirmed")
      .reduce((acc, booking) => acc + parseAirRate(booking.rate), 0)
      .toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
    winRate: winRate || 0,
    laneCount: lanes.length,
  };
}

export function getShipperDashboardStats(userId: string): ShipperDashboardStats {
  const shipments = getAirShipments(userId);
  const inTransit = shipments.filter(
    (shipment) => shipment.status === "in_transit" || shipment.status === "booked"
  ).length;
  const spend = shipments.reduce((acc, shipment) => acc + computeShipperInvoiceAmount(shipment.weightKg), 0);
  const delivered = shipments.filter((shipment) => shipment.status === "delivered").length;
  const onTimeRate =
    shipments.length > 0 ? Math.min(99, Math.max(82, Math.round((delivered / shipments.length) * 100 + 78))) : 96;
  const outstanding =
    shipments.length > 0 ? computeShipperInvoiceAmount(shipments[0].weightKg) : 0;

  return {
    shipmentCount: shipments.length,
    inTransit,
    spend,
    spendFormatted: `£${spend.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
    onTimeRate: shipments.length > 0 ? onTimeRate : 96,
    outstanding,
    outstandingFormatted: `£${outstanding.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
    pendingCount: shipments.filter((shipment) => shipment.status === "pending").length,
  };
}

export type ChartPoint = {
  name: string;
  value: number;
};

export function buildMonthlyChartData(
  items: { date: string; amount: number }[],
  months = 6
): ChartPoint[] {
  const now = new Date();
  const points: ChartPoint[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const label = monthDate.toLocaleDateString("en-GB", { month: "short" });
    const value = items
      .filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === monthDate.getFullYear() &&
          itemDate.getMonth() === monthDate.getMonth()
        );
      })
      .reduce((acc, item) => acc + item.amount, 0);

    points.push({ name: label, value });
  }

  return points;
}

export function getForwarderChartData(userId: string): ChartPoint[] {
  const bookings = getAirBookings(userId);
  return buildMonthlyChartData(
    bookings.map((booking) => ({
      date: booking.bookedAt,
      amount: parseAirRate(booking.rate),
    }))
  );
}

export function getShipperChartData(userId: string): ChartPoint[] {
  const shipments = getAirShipments(userId);
  return buildMonthlyChartData(
    shipments.map((shipment) => ({
      date: shipment.createdAt,
      amount: computeShipperInvoiceAmount(shipment.weightKg),
    }))
  );
}

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  status: string;
};

export function getForwarderActivity(userId: string): ActivityItem[] {
  return getAirBookings(userId).slice(0, 6).map((booking) => ({
    id: booking.id,
    title: `AWB ${booking.awb}`,
    description: `${booking.route} · ${booking.rate}`,
    time: new Date(booking.bookedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    status: booking.status,
  }));
}

export function getShipperActivity(userId: string): ActivityItem[] {
  return getAirShipments(userId).slice(0, 6).map((shipment) => ({
    id: shipment.id,
    title: shipment.awb,
    description: `${shipment.origin} → ${shipment.destination} · ${shipment.weightKg} kg`,
    time: new Date(shipment.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    status: shipment.status,
  }));
}

export const DEFAULT_FORWARDER_LANES = ["LHR ↔ DXB", "MAN ↔ AMS", "STN ↔ FRA"];

export function getForwarderLanePreview(userId: string): string[] {
  const custom = getAirLanes(userId).map((lane) => lane.route);
  if (custom.length > 0) return custom.slice(0, 4);
  return DEFAULT_FORWARDER_LANES;
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  "/air/forwarder/awbs": "Browse live AWBs and accept matching capacity.",
  "/air/forwarder/bookings": "Manage confirmed AWB bookings and status.",
  "/air/forwarder/lanes": "Publish lane rates and service frequency.",
  "/air/forwarder/documents": "Generate AWB and customs documentation.",
  "/air/forwarder/settlement": "Track payouts and request settlement.",
  "/air/forwarder/profile": "Update hub, IATA code, and specialisms.",
  "/air/forwarder/support": "Contact air freight support team.",
  "/air/shipper/post": "Create a new air shipment request.",
  "/air/shipper/shipments": "View all posted shipments and statuses.",
  "/air/shipper/track": "Search AWB milestones and flight updates.",
  "/air/shipper/billing": "Pay invoices and download billing history.",
  "/air/shipper/profile": "Manage shipper profile and preferences.",
  "/air/shipper/support": "Get help with bookings and tracking.",
};

export type DashboardTool = {
  name: string;
  path: string;
  icon: string;
  badge?: string;
  description: string;
  category: string;
};

export function getDashboardTools(role: AirRole): DashboardTool[] {
  const categories = role === "carrier" ? getForwarderSidebar() : getShipperSidebar();

  return categories.flatMap((category) =>
    category.items
      .filter((item) => !item.path.endsWith("/dashboard"))
      .map((item) => ({
        name: item.name,
        path: item.path,
        icon: item.icon,
        badge: item.badge,
        description: TOOL_DESCRIPTIONS[item.path] ?? "Open tool",
        category: category.name,
      }))
  );
}

export function shipmentStatusLabel(status: AirShipment["status"] | AirBooking["status"]): string {
  return status.replace(/_/g, " ");
}
