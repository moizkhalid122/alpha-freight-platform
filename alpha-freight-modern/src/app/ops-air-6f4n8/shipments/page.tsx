"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults } from "@/lib/admin-query";
import { airAdminRoute } from "@/lib/mode-admin-paths";

type AirShipmentRow = {
  id: string;
  awb: string;
  origin: string;
  destination: string;
  weight_kg: number;
  status: string;
  created_at: string;
};

export default function AirAdminShipmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["air-admin-shipments-list"],
    queryFn: () => adminFetch<{ shipments: AirShipmentRow[] }>("/api/admin/air/shipments"),
    ...adminQueryDefaults,
  });

  const shipments = data?.shipments ?? [];

  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={airAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Air shipments (AWBs)</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading shipments…</p>
      ) : shipments.length === 0 ? (
        <div className={ADMIN_CARD + " p-10 text-center text-sm text-gray-500"}>No air shipments yet.</div>
      ) : (
        <div className="space-y-3">
          {shipments.map((row) => (
            <div key={row.id} className={ADMIN_CARD + " p-5"}>
              <p className="font-semibold text-gray-900">{row.awb}</p>
              <p className="text-sm text-gray-500">
                {row.origin} → {row.destination} · {row.weight_kg} kg · {row.status}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Posted {new Date(row.created_at).toLocaleString("en-GB")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
