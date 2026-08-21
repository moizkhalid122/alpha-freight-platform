"use client";

import toast from "react-hot-toast";
import type { QueryClient } from "@tanstack/react-query";
import { deleteAdminLoads } from "@/lib/admin-data-client";
import {
  adminLoadsQueryKey,
  adminOverviewQueryKey,
  adminProfilesQueryKey,
} from "@/lib/admin-query";
import {
  readCarrierPaymentOrders,
  saveCarrierPaymentOrders,
} from "@/lib/carrier-payments";
import {
  readCarrierPodUploads,
  writeCarrierPodUploads,
} from "@/lib/carrier-pod-uploads";

const DELETE_TOAST_ID = "admin-delete-loads";
let deleteInFlight = false;

function clearLocalLoadArtifacts(loadIds: string[]) {
  if (typeof window === "undefined" || loadIds.length === 0) return;

  const idSet = new Set(loadIds);
  saveCarrierPaymentOrders(readCarrierPaymentOrders().filter((record) => !idSet.has(record.loadId)));

  const pods = readCarrierPodUploads();
  const nextPods = { ...pods };
  loadIds.forEach((loadId) => {
    delete nextPods[loadId];
  });
  writeCarrierPodUploads(nextPods);
}

async function invalidateLoadQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminLoadsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: adminOverviewQueryKey() }),
    queryClient.invalidateQueries({ queryKey: adminProfilesQueryKey("carrier") }),
    queryClient.invalidateQueries({ queryKey: adminProfilesQueryKey("supplier") }),
    queryClient.invalidateQueries({ queryKey: ["admin-quick-stats"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-carrier-pod-verification"] }),
  ]);
}

export function isLoadDeleteInFlight() {
  return deleteInFlight;
}

export async function deleteMarketplaceLoads(options: {
  ids: string[];
  queryClient: QueryClient;
  assignedCount?: number;
}): Promise<boolean> {
  if (deleteInFlight) {
    toast.error("A delete is already running. Please wait.", { id: DELETE_TOAST_ID });
    return false;
  }

  const { ids, queryClient, assignedCount = 0 } = options;
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (uniqueIds.length === 0) {
    toast.error("Select at least one load first.");
    return false;
  }

  const assignedNote =
    assignedCount > 0
      ? `\n\n${assignedCount} selected load${assignedCount === 1 ? "" : "s"} already ${assignedCount === 1 ? "has" : "have"} an assigned carrier — they will still be deleted.`
      : "";

  const confirmed = window.confirm(
    `Delete ${uniqueIds.length} load${uniqueIds.length === 1 ? "" : "s"}?\n\nThis permanently removes the load, bids, and payment records from Supabase.${assignedNote}`
  );

  if (!confirmed) return false;

  deleteInFlight = true;
  toast.loading(`Deleting ${uniqueIds.length} load${uniqueIds.length === 1 ? "" : "s"}...`, {
    id: DELETE_TOAST_ID,
  });

  const deletedAll: string[] = [];
  const failedAll: Array<{ id: string; error: string }> = [];

  try {
    const result = await deleteAdminLoads(uniqueIds);
    deletedAll.push(...result.deleted);
    failedAll.push(...result.failed);
    clearLocalLoadArtifacts(result.deleted);

    await invalidateLoadQueries(queryClient);

    if (deletedAll.length > 0) {
      toast.success(`Deleted ${deletedAll.length} load${deletedAll.length === 1 ? "" : "s"}.`, {
        id: DELETE_TOAST_ID,
      });
    } else {
      toast.dismiss(DELETE_TOAST_ID);
    }

    if (failedAll.length > 0) {
      toast.error(
        `${failedAll.length} load${failedAll.length === 1 ? "" : "s"} could not be deleted: ${failedAll[0]?.error ?? "Unknown error"}`
      );
    }

    return deletedAll.length > 0;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Unable to delete loads.", { id: DELETE_TOAST_ID });
    return false;
  } finally {
    deleteInFlight = false;
  }
}
