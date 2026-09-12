import Link from "next/link";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminRoute } from "@/lib/admin-path";
import { hqAdminRoute } from "@/lib/mode-admin-paths";

export default function HqRoadPage() {
  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={hqAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← HQ Overview
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Road freight records</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={adminRoute("/carriers")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>All carriers →</Link>
        <Link href={adminRoute("/suppliers")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>All suppliers →</Link>
        <Link href={adminRoute("/loads")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>All loads →</Link>
        <Link href={adminRoute("/carriers/pending-verifications")} className={ADMIN_CARD + " p-5 font-semibold hover:shadow-md"}>Pending verifications →</Link>
      </div>
    </div>
  );
}
