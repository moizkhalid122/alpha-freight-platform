"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Crown, Plane, Ship, Truck, Users, ShieldCheck, Package } from "lucide-react";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_LABEL, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults, adminLoadsQueryFn, adminLoadsQueryKey } from "@/lib/admin-query";
import { airAdminRoute, hqAdminRoute, seaAdminRoute } from "@/lib/mode-admin-paths";
import { adminRoute } from "@/lib/admin-path";

function useProfileCount(role: string, mode?: string) {
  const url = mode
    ? `/api/admin/profiles?role=${role}&transport_mode=${mode}`
    : `/api/admin/profiles?role=${role}`;
  return useQuery({
    queryKey: ["hq-profiles", role, mode ?? "all"],
    queryFn: () => adminFetch<{ profiles: unknown[] }>(url).then((r) => r.profiles?.length ?? 0),
    ...adminQueryDefaults,
  });
}

export default function HqMasterDashboardPage() {
  const roadCarriers = useProfileCount("carrier", "road");
  const roadSuppliers = useProfileCount("supplier", "road");
  const airForwarders = useProfileCount("carrier", "air");
  const airShippers = useProfileCount("supplier", "air");
  const seaForwarders = useProfileCount("carrier", "ship");
  const seaShippers = useProfileCount("supplier", "ship");
  const allUsers = useQuery({
    queryKey: ["hq-all-users-count"],
    queryFn: () => adminFetch<{ profiles: unknown[] }>("/api/admin/profiles").then((r) => r.profiles?.length ?? 0),
    ...adminQueryDefaults,
  });

  const loads = useQuery({
    queryKey: adminLoadsQueryKey(),
    queryFn: adminLoadsQueryFn(),
    ...adminQueryDefaults,
  });

  const airOps = useQuery({
    queryKey: ["hq-air-ops"],
    queryFn: () =>
      adminFetch<{ shipments: unknown[]; bookings: unknown[] }>("/api/admin/air/shipments"),
    ...adminQueryDefaults,
  });

  const panels = [
    { name: "Road Admin", href: adminRoute(), icon: Truck, stat: `${roadCarriers.data ?? 0} carriers` },
    { name: "Air Admin", href: airAdminRoute(), icon: Plane, stat: `${airForwarders.data ?? 0} forwarders` },
    { name: "Sea Admin", href: seaAdminRoute(), icon: Ship, stat: `${seaForwarders.data ?? 0} forwarders` },
  ];

  const totals = [
    { label: "Total platform users", value: allUsers.data ?? 0, icon: Users },
    { label: "Road loads", value: loads.data?.loads?.length ?? 0, icon: Package },
    { label: "Air AWBs", value: airOps.data?.shipments?.length ?? 0, icon: Plane },
    { label: "Pending verifications", value: "—", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8">
      <div className={`${ADMIN_CARD} border-violet-200 bg-gradient-to-br from-violet-500/10 to-purple-50 p-6 sm:p-10`}>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-violet-600 p-3 text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className={ADMIN_SECTION_LABEL}>Master command</p>
            <h1 className="air-font-display text-3xl font-medium text-gray-900 sm:text-4xl">
              Alpha HQ Console
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Heaviest control layer — road, air, and sea records in one place. Use sub-panels for deep operations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totals.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${ADMIN_CARD} p-5`}>
              <Icon className="h-4 w-4 text-violet-600" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
              <p className="air-font-display mt-1 text-3xl text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Mode breakdown</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`${ADMIN_CARD} p-5`}>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Road</p>
            <p className="mt-2 text-sm text-gray-600">{roadCarriers.data ?? 0} carriers · {roadSuppliers.data ?? 0} suppliers</p>
            <Link href={hqAdminRoute("/road")} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
              View road records →
            </Link>
          </div>
          <div className={`${ADMIN_CARD} p-5`}>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Air</p>
            <p className="mt-2 text-sm text-gray-600">{airForwarders.data ?? 0} forwarders · {airShippers.data ?? 0} shippers</p>
            <Link href={hqAdminRoute("/air")} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
              View air records →
            </Link>
          </div>
          <div className={`${ADMIN_CARD} p-5`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Sea</p>
            <p className="mt-2 text-sm text-gray-600">{seaForwarders.data ?? 0} forwarders · {seaShippers.data ?? 0} shippers</p>
            <Link href={hqAdminRoute("/sea")} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
              View sea records →
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Sub-panels</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <Link key={panel.name} href={panel.href} className={`${ADMIN_CARD} p-5 transition hover:shadow-lg`}>
                <Icon className="h-5 w-5 text-gray-700" />
                <p className="mt-3 font-semibold text-gray-900">{panel.name}</p>
                <p className="text-sm text-gray-500">{panel.stat}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
