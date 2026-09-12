"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plane, Building2, Package, ShieldCheck } from "lucide-react";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults } from "@/lib/admin-query";
import { airAdminRoute } from "@/lib/mode-admin-paths";

export default function AirAdminDashboardPage() {
  const forwarders = useQuery({
    queryKey: ["air-admin-forwarders"],
    queryFn: () =>
      adminFetch<{ profiles: unknown[] }>("/api/admin/profiles?role=carrier&transport_mode=air").then(
        (r) => r.profiles ?? []
      ),
    ...adminQueryDefaults,
  });

  const shippers = useQuery({
    queryKey: ["air-admin-shippers"],
    queryFn: () =>
      adminFetch<{ profiles: unknown[] }>("/api/admin/profiles?role=supplier&transport_mode=air").then(
        (r) => r.profiles ?? []
      ),
    ...adminQueryDefaults,
  });

  const airOps = useQuery({
    queryKey: ["air-admin-shipments"],
    queryFn: () =>
      adminFetch<{ shipments: unknown[]; bookings: unknown[] }>("/api/admin/air/shipments").then((r) => r),
    ...adminQueryDefaults,
  });

  const cards = [
    { label: "Forwarders", value: forwarders.data?.length ?? 0, href: airAdminRoute("/forwarders"), icon: Plane },
    { label: "Shippers", value: shippers.data?.length ?? 0, href: airAdminRoute("/shippers"), icon: Building2 },
    { label: "AWB Shipments", value: airOps.data?.shipments?.length ?? 0, href: airAdminRoute("/shipments"), icon: Package },
    { label: "Bookings", value: airOps.data?.bookings?.length ?? 0, href: airAdminRoute("/bookings"), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className={`${ADMIN_CARD} border-sky-200 bg-gradient-to-br from-sky-500/10 to-blue-50 p-6 sm:p-8`}>
        <p className={ADMIN_SECTION_LABEL}>Air operations</p>
        <h1 className={ADMIN_SECTION_TITLE}>Air Freight Admin Console</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Separate control centre for air forwarders, shippers, verification queues, and AWB marketplace records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className={`${ADMIN_CARD} p-5 transition hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <Icon className="h-4 w-4 text-sky-600" />
              </div>
              <p className="air-font-display mt-3 text-3xl text-gray-900">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link href={airAdminRoute("/forwarders/pending-verifications")} className={`${ADMIN_CARD} p-5 hover:shadow-md`}>
          <p className="font-semibold text-gray-900">Forwarder verification queue</p>
          <p className="mt-1 text-sm text-gray-500">Review IATA, AOC, and cargo insurance documents.</p>
        </Link>
        <Link href={airAdminRoute("/shippers/pending-verifications")} className={`${ADMIN_CARD} p-5 hover:shadow-md`}>
          <p className="font-semibold text-gray-900">Shipper verification queue</p>
          <p className="mt-1 text-sm text-gray-500">Review business proof and VAT certificates.</p>
        </Link>
      </div>
    </div>
  );
}
