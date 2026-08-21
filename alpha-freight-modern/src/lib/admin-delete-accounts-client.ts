"use client";

import toast from "react-hot-toast";
import type { QueryClient } from "@tanstack/react-query";
import { deleteAdminProfiles } from "@/lib/admin-data-client";
import {
  adminLoadsQueryKey,
  adminProfilesQueryKey,
  adminOverviewQueryKey,
} from "@/lib/admin-query";
import { getCarrierExtrasKey, getSupplierExtrasKey } from "@/lib/profile-extras-types";

const DELETE_BATCH_SIZE = 5;

function clearDeletedProfileLocalData(ids: string[]) {
  if (typeof window === "undefined") return;
  ids.forEach((id) => {
    window.localStorage.removeItem(getCarrierExtrasKey(id));
    window.localStorage.removeItem(getSupplierExtrasKey(id));
  });
}

async function invalidateMarketplaceQueries(queryClient: QueryClient, role: "carrier" | "supplier") {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminProfilesQueryKey(role) }),
    queryClient.invalidateQueries({ queryKey: adminProfilesQueryKey("all") }),
    queryClient.invalidateQueries({ queryKey: adminLoadsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: adminOverviewQueryKey() }),
    queryClient.invalidateQueries({ queryKey: ["admin-quick-stats"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  ]);
}

export async function deleteMarketplaceAccounts(options: {
  ids: string[];
  label: string;
  queryClient: QueryClient;
  role: "carrier" | "supplier";
}) {
  const { ids, label, queryClient, role } = options;

  if (ids.length === 0) {
    toast.error(`Select at least one ${label} first.`);
    return;
  }

  const confirmed = window.confirm(
    `Delete ${ids.length} ${label} account${ids.length === 1 ? "" : "s"}?\n\nThis removes the login, profile, and related marketplace data. Employee accounts are never deleted from here.`
  );

  if (!confirmed) return;

  const toastId = toast.loading(`Deleting ${ids.length} ${label} account${ids.length === 1 ? "" : "s"}...`);

  const deletedAll: string[] = [];
  const failedAll: Array<{ id: string; error: string }> = [];

  try {
    for (let start = 0; start < ids.length; start += DELETE_BATCH_SIZE) {
      const batch = ids.slice(start, start + DELETE_BATCH_SIZE);
      if (ids.length > DELETE_BATCH_SIZE) {
        toast.loading(
          `Deleting ${label} accounts ${Math.min(start + batch.length, ids.length)} / ${ids.length}...`,
          { id: toastId }
        );
      }

      const result = await deleteAdminProfiles(batch);
      deletedAll.push(...result.deleted);
      failedAll.push(...result.failed);
      clearDeletedProfileLocalData(result.deleted);
    }

    await invalidateMarketplaceQueries(queryClient, role);

    if (deletedAll.length > 0) {
      toast.success(`Deleted ${deletedAll.length} ${label} account${deletedAll.length === 1 ? "" : "s"}.`, {
        id: toastId,
      });
    } else {
      toast.dismiss(toastId);
    }

    if (failedAll.length > 0) {
      toast.error(
        `${failedAll.length} account${failedAll.length === 1 ? "" : "s"} could not be deleted: ${failedAll[0]?.error ?? "Unknown error"}`
      );
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : `Unable to delete ${label} accounts.`, {
      id: toastId,
    });
  }
}
