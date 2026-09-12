"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-data-client";
import { ADMIN_CARD, ADMIN_SECTION_TITLE } from "@/lib/admin-ui";
import { adminQueryDefaults } from "@/lib/admin-query";
import { airAdminRoute } from "@/lib/mode-admin-paths";

type AirBookingRow = {
  id: string;
  awb: string;
  route: string;
  rate: string;
  status: string;
  booked_at: string;
};

export default function AirAdminBookingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["air-admin-bookings-list"],
    queryFn: () => adminFetch<{ bookings: AirBookingRow[] }>("/api/admin/air/shipments"),
    ...adminQueryDefaults,
  });

  const bookings = data?.bookings ?? [];

  return (
    <div className="space-y-6">
      <div className={ADMIN_CARD + " p-6"}>
        <Link href={airAdminRoute()} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <h1 className={ADMIN_SECTION_TITLE + " mt-2"}>Forwarder bookings</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div className={ADMIN_CARD + " p-10 text-center text-sm text-gray-500"}>No bookings yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((row) => (
            <div key={row.id} className={ADMIN_CARD + " p-5"}>
              <p className="font-semibold text-gray-900">{row.awb}</p>
              <p className="text-sm text-gray-500">
                {row.route} · {row.rate} · {row.status}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Booked {new Date(row.booked_at).toLocaleString("en-GB")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
