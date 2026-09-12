import Link from "next/link";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { airAdminRoute } from "@/lib/mode-admin-paths";
import { hqAdminRoute } from "@/lib/mode-admin-paths";

export default function HqAirPage() {
  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={hqAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← HQ Overview
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Air freight records</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={airAdminRoute("/forwarders")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Forwarders →</Link>
        <Link href={airAdminRoute("/shippers")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Shippers →</Link>
        <Link href={airAdminRoute("/shipments")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>AWB shipments →</Link>
        <Link href={airAdminRoute("/bookings")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Bookings →</Link>
      </div>
    </div>
  );
}
