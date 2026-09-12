"use client";

import Link from "next/link";
import { Anchor, Building2, Package, ShieldCheck } from "lucide-react";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { seaAdminRoute } from "@/lib/mode-admin-paths";

export default function SeaAdminDashboardPage() {
  const cards = [
    { label: "Sea forwarders", href: seaAdminRoute("/forwarders"), icon: Anchor },
    { label: "Sea shippers", href: seaAdminRoute("/shippers"), icon: Building2 },
    { label: "Pending verification", href: seaAdminRoute("/forwarders/pending-verifications"), icon: ShieldCheck },
    { label: "Sea bookings", href: seaAdminRoute("/bookings"), icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className={`${ADMIN_CARD} border-slate-300 bg-gradient-to-br from-slate-500/10 to-slate-50 p-6 sm:p-8`}>
        <p className={ADMIN_SECTION_LABEL}>Sea operations</p>
        <h1 className={ADMIN_SECTION_TITLE}>Sea Freight Admin Console</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Separate panel for ocean freight. Verification queues are ready — sea marketplace portal ships next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className={`${ADMIN_CARD} p-5 transition hover:shadow-md`}>
              <Icon className="h-4 w-4 text-slate-700" />
              <p className="mt-3 font-semibold text-gray-900">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className={`${ADMIN_CARD} border-dashed border-slate-300 p-8 text-center`}>
        <p className="font-semibold text-gray-900">Sea user portal — coming soon</p>
        <p className="mt-2 text-sm text-gray-500">
          Admin verification structure is live. Shipper/forwarder sea dashboards will connect here.
        </p>
      </div>
    </div>
  );
}
