import { resolveSupplierPaymentState, type SupplierPaymentState } from "@/lib/supplier-payments";

export type TrackableLoad = {
  id: string;
  origin: string | null;
  destination: string | null;
  status: string;
  carrier_id: string | null;
  pickup_date?: string | null;
  price?: number | string | null;
  payment_state?: string | null;
};

export function getSupplierPaymentStateForLoad(
  load: TrackableLoad,
  recordPaymentState?: string | null
): SupplierPaymentState {
  return resolveSupplierPaymentState(load.payment_state, recordPaymentState);
}

export function canSupplierTrackShipment(
  load: TrackableLoad,
  paymentState?: SupplierPaymentState
) {
  const paid = (paymentState ?? getSupplierPaymentStateForLoad(load)) === "paid";
  if (!paid) return false;
  if (!load.carrier_id) return false;
  if (["completed", "delivered"].includes(load.status)) return false;
  return ["booked", "in-transit", "loading"].includes(load.status);
}

export function getSupplierTrackingProgress(status: string) {
  switch (status) {
    case "booked":
      return 15;
    case "loading":
      return 25;
    case "in-transit":
      return 55;
    case "completed":
    case "delivered":
      return 100;
    default:
      return 5;
  }
}
