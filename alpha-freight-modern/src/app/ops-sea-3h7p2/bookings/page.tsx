import Link from "next/link";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaBookingsPage() {
  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={seaAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Sea bookings</h1>
      </div>
      <div className={ADMIN_CARD + " p-10 text-center text-sm text-gray-500"}>
        Sea booking records will appear here when the sea marketplace portal launches.
      </div>
    </div>
  );
}
