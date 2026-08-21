import AdminDashboardClient from "./AdminDashboardClient";
import { getAdminOverviewServer } from "@/lib/admin-server-data";

export default async function AdminDashboardPage() {
  let initialOverviewRaw = null;

  try {
    initialOverviewRaw = await getAdminOverviewServer();
  } catch (error) {
    console.error("[admin dashboard prefetch]", error);
  }

  return <AdminDashboardClient initialOverviewRaw={initialOverviewRaw} />;
}
