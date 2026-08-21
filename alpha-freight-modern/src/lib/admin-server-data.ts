import { fetchAdminOverviewBundle } from "@/lib/admin-overview-data";

export async function getAdminOverviewServer() {
  return fetchAdminOverviewBundle();
}
