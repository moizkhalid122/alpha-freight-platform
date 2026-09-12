import { supabase } from "@/lib/supabase";
import type { AirBooking, AirLane, AirShipment } from "@/lib/air-storage";

type AirShipmentRow = {
  id: string;
  shipper_id: string;
  forwarder_id: string | null;
  awb: string;
  origin: string;
  destination: string;
  weight_kg: number;
  cargo_type: string;
  status: AirShipment["status"];
  rate: string | null;
  estimated_quote: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type AirBookingRow = {
  id: string;
  shipment_id: string;
  forwarder_id: string;
  awb: string;
  route: string;
  weight: string | null;
  rate: string;
  status: AirBooking["status"];
  booked_at: string;
};

type AirLaneRow = {
  id: string;
  forwarder_id: string;
  route: string;
  rate_per_kg: string;
  frequency: string;
  created_at: string;
};

export type AirDbResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const TABLE_SETUP_HINT =
  "Run air-freight-setup.sql in Supabase SQL Editor, then try again.";

function dbErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error?.message) return "Database request failed.";
  if (
    error.message.includes("air_shipments") ||
    error.message.includes("air_bookings") ||
    error.message.includes("air_lanes") ||
    error.code === "42P01"
  ) {
    return TABLE_SETUP_HINT;
  }
  return error.message;
}

function shipmentPayloadExtras(shipment: AirShipment): Record<string, unknown> {
  const {
    id: _id,
    awb: _awb,
    origin: _origin,
    destination: _destination,
    weightKg: _weightKg,
    cargoType: _cargoType,
    status: _status,
    rate: _rate,
    estimatedQuote: _estimatedQuote,
    createdAt: _createdAt,
    ...rest
  } = shipment;
  return rest;
}

export function rowToAirShipment(row: AirShipmentRow): AirShipment {
  const payload = (row.payload ?? {}) as Partial<AirShipment>;
  return {
    id: row.id,
    awb: row.awb,
    origin: row.origin,
    destination: row.destination,
    weightKg: Number(row.weight_kg),
    cargoType: row.cargo_type,
    status: row.status,
    rate: row.rate ?? undefined,
    estimatedQuote: row.estimated_quote ?? undefined,
    createdAt: row.created_at,
    ...payload,
  };
}

function rowToAirBooking(row: AirBookingRow): AirBooking {
  return {
    id: row.id,
    awb: row.awb,
    route: row.route,
    weight: row.weight ?? "",
    rate: row.rate,
    status: row.status,
    bookedAt: row.booked_at,
  };
}

function rowToAirLane(row: AirLaneRow): AirLane {
  return {
    id: row.id,
    route: row.route,
    ratePerKg: row.rate_per_kg,
    frequency: row.frequency,
  };
}

export async function fetchShipperAirShipments(
  shipperId: string
): Promise<AirDbResult<AirShipment[]>> {
  const { data, error } = await supabase
    .from("air_shipments")
    .select("*")
    .eq("shipper_id", shipperId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: ((data ?? []) as AirShipmentRow[]).map(rowToAirShipment) };
}

export async function fetchAvailableAirShipments(): Promise<AirDbResult<AirShipment[]>> {
  const { data, error } = await supabase
    .from("air_shipments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: ((data ?? []) as AirShipmentRow[]).map(rowToAirShipment) };
}

export async function fetchAirShipmentByAwb(awb: string): Promise<AirDbResult<AirShipment | null>> {
  const { data, error } = await supabase
    .from("air_shipments")
    .select("*")
    .eq("awb", awb)
    .maybeSingle();

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data) return { ok: true, data: null };
  return { ok: true, data: rowToAirShipment(data as AirShipmentRow) };
}

export async function createAirShipment(
  shipperId: string,
  shipment: AirShipment
): Promise<AirDbResult<AirShipment>> {
  const { data, error } = await supabase
    .from("air_shipments")
    .insert([
      {
        id: shipment.id,
        shipper_id: shipperId,
        awb: shipment.awb,
        origin: shipment.origin,
        destination: shipment.destination,
        weight_kg: shipment.weightKg,
        cargo_type: shipment.cargoType,
        status: shipment.status,
        rate: shipment.rate ?? null,
        estimated_quote: shipment.estimatedQuote ?? null,
        payload: shipmentPayloadExtras(shipment),
      },
    ])
    .select("*")
    .single();

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: rowToAirShipment(data as AirShipmentRow) };
}

export async function fetchForwarderAirBookings(
  forwarderId: string
): Promise<AirDbResult<AirBooking[]>> {
  const { data, error } = await supabase
    .from("air_bookings")
    .select("*")
    .eq("forwarder_id", forwarderId)
    .order("booked_at", { ascending: false });

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: ((data ?? []) as AirBookingRow[]).map(rowToAirBooking) };
}

export async function acceptAirShipment(
  forwarderId: string,
  shipment: AirShipment
): Promise<AirDbResult<AirBooking>> {
  const route = `${shipment.origin} → ${shipment.destination}`;
  const rate = shipment.estimatedQuote ?? shipment.rate ?? "£0";
  const weight = `${shipment.weightKg} kg`;

  const { data: bookingRow, error: bookingError } = await supabase
    .from("air_bookings")
    .insert([
      {
        shipment_id: shipment.id,
        forwarder_id: forwarderId,
        awb: shipment.awb,
        route,
        weight,
        rate,
        status: "confirmed",
      },
    ])
    .select("*")
    .single();

  if (bookingError) return { ok: false, error: dbErrorMessage(bookingError) };

  const { error: shipmentError } = await supabase
    .from("air_shipments")
    .update({
      status: "booked",
      forwarder_id: forwarderId,
      rate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipment.id)
    .eq("status", "pending");

  if (shipmentError) {
    await supabase.from("air_bookings").delete().eq("id", (bookingRow as AirBookingRow).id);
    return { ok: false, error: dbErrorMessage(shipmentError) };
  }

  return { ok: true, data: rowToAirBooking(bookingRow as AirBookingRow) };
}

export async function fetchForwarderAirLanes(forwarderId: string): Promise<AirDbResult<AirLane[]>> {
  const { data, error } = await supabase
    .from("air_lanes")
    .select("*")
    .eq("forwarder_id", forwarderId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: ((data ?? []) as AirLaneRow[]).map(rowToAirLane) };
}

export async function createAirLane(
  forwarderId: string,
  lane: AirLane
): Promise<AirDbResult<AirLane>> {
  const { data, error } = await supabase
    .from("air_lanes")
    .insert([
      {
        id: lane.id,
        forwarder_id: forwarderId,
        route: lane.route,
        rate_per_kg: lane.ratePerKg,
        frequency: lane.frequency,
      },
    ])
    .select("*")
    .single();

  if (error) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, data: rowToAirLane(data as AirLaneRow) };
}

export function formatAirRoute(origin: string, destination: string): string {
  return `${origin} → ${destination}`;
}

export function shipmentToAvailableAwb(shipment: AirShipment) {
  return {
    id: shipment.id,
    awb: shipment.awb,
    route: formatAirRoute(shipment.origin, shipment.destination),
    weight: `${shipment.weightKg} kg`,
    weightKg: shipment.weightKg,
    rate: shipment.estimatedQuote ?? shipment.rate ?? "Quote on request",
    shipment,
  };
}
