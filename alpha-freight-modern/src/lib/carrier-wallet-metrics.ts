"use client";

import type { CarrierPaymentRecord } from "@/lib/carrier-payments";
import type { CarrierPodUploadRecord } from "@/lib/carrier-pod-uploads";
import type { CarrierWalletPayoutRecord } from "@/lib/carrier-wallet-payouts";

type WalletLoadLike = {
  id: string;
  price: number | string | null;
  status: string | null;
};

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isDeliveredLoadStatus(status: string | null | undefined) {
  return DELIVERED_LOAD_STATUSES.has(normalizeStatus(status));
}

export function deriveCarrierWalletRevenue(
  loads: WalletLoadLike[],
  paymentOrders: CarrierPaymentRecord[],
  podUploads: Record<string, CarrierPodUploadRecord>
) {
  const paymentOrderByLoadId = new Map(paymentOrders.map((order) => [order.loadId, order]));

  return loads.reduce(
    (summary, load) => {
      if (!isDeliveredLoadStatus(load.status)) return summary;

      const amount = toNumber(load.price);
      const paymentOrder = paymentOrderByLoadId.get(load.id);
      const paymentStatus = normalizeStatus(paymentOrder?.status);
      const podStatus = normalizeStatus(podUploads[load.id]?.verificationStatus);
      const isReleased = paymentStatus === "verified" || paymentStatus === "paid" || podStatus === "verified";
      const isBlocked = paymentStatus === "failed" || podStatus === "rejected";

      summary.grossCompletedRevenue += amount;
      summary.completedLoadsCount += 1;

      if (isReleased) {
        summary.availableRevenue += amount;
        summary.availableLoadsCount += 1;
        return summary;
      }

      if (!isBlocked) {
        summary.incomingRevenue += amount;
        summary.incomingLoadsCount += 1;
        return summary;
      }

      summary.blockedRevenue += amount;
      return summary;
    },
    {
      grossCompletedRevenue: 0,
      availableRevenue: 0,
      incomingRevenue: 0,
      blockedRevenue: 0,
      completedLoadsCount: 0,
      availableLoadsCount: 0,
      incomingLoadsCount: 0,
    }
  );
}

export function deriveCarrierWalletPayoutTotals(payouts: CarrierWalletPayoutRecord[]) {
  return payouts.reduce(
    (summary, payout) => {
      const status = normalizeStatus(payout.status);
      if (status === "failed") return summary;

      summary.totalRequestedPayouts += payout.amount || 0;
      if (status === "processing" || status === "on_hold") {
        summary.pendingPayoutsTotal += payout.amount || 0;
      }
      if (status === "completed") {
        summary.completedPayoutsTotal += payout.amount || 0;
      }

      return summary;
    },
    {
      totalRequestedPayouts: 0,
      pendingPayoutsTotal: 0,
      completedPayoutsTotal: 0,
    }
  );
}
