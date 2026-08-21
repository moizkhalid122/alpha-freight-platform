import AdminDashboardClient, { type AdminOverviewRaw } from "./AdminDashboardClient";
import { getAdminOverviewServer } from "@/lib/admin-server-data";

export default async function AdminDashboardPage() {
  let initialOverviewRaw: AdminOverviewRaw | null = null;

  try {
    initialOverviewRaw = (await getAdminOverviewServer()) as AdminOverviewRaw;
  } catch (error) {
    console.error("[admin dashboard prefetch]", error);
  }

  return <AdminDashboardClient initialOverviewRaw={initialOverviewRaw} />;
}
