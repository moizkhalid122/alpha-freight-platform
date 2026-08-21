import type { CommercialProfileRow } from "@/lib/commercial-director-profiles-query";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import {
  fetchCommercialEmployeesRest,
  fetchCommercialLoadsRest,
  fetchCommercialMetricsRest,
  fetchCommercialProfilesByRoleRest,
  type CommercialLoadRow,
} from "@/lib/commercial-director-rest";

export async function getCommercialDirectorProfiles(
  role: "supplier" | "carrier" | "employee"
): Promise<CommercialProfileRow[]> {
  if (role === "employee") {
    return fetchCommercialEmployeesRest();
  }
  return fetchCommercialProfilesByRoleRest(role);
}

export async function getCommercialDirectorLoads(): Promise<CommercialLoadRow[]> {
  return fetchCommercialLoadsRest();
}

export async function getCommercialDirectorMetrics(): Promise<CommercialMetricsPayload> {
  return fetchCommercialMetricsRest();
}

export type { CommercialLoadRow };