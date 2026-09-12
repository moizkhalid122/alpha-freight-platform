import Link from "next/link";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { hqAdminRoute, seaAdminRoute } from "@/lib/mode-admin-paths";

export default function HqSeaPage() {
  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={hqAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← HQ Overview
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Sea freight records</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={seaAdminRoute("/forwarders")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Sea forwarders →</Link>
        <Link href={seaAdminRoute("/shippers")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Sea shippers →</Link>
        <Link href={seaAdminRoute("/bookings")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Sea bookings →</Link>
        <Link href={seaAdminRoute("/forwarders/pending-verifications")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Pending verification →</Link>
      </div>
    </div>
  );
}
