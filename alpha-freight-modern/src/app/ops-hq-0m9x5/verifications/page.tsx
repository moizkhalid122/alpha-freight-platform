import Link from "next/link";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { airAdminRoute, hqAdminRoute, seaAdminRoute } from "@/lib/mode-admin-paths";
import { adminRoute } from "@/lib/admin-path";

export default function HqVerificationsPage() {
  const queues = [
    { label: "Road carriers", href: adminRoute("/carriers/pending-verifications") },
    { label: "Air forwarders", href: airAdminRoute("/forwarders/pending-verifications") },
    { label: "Air shippers", href: airAdminRoute("/shippers/pending-verifications") },
    { label: "Sea forwarders", href: seaAdminRoute("/forwarders/pending-verifications") },
    { label: "Sea shippers", href: seaAdminRoute("/shippers/pending-verifications") },
  ];

  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={hqAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← HQ Overview
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>All verification queues</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className={ADMIN_CARD + " p-5 font-semibold text-gray-900 hover:shadow-md"}>
            {q.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
