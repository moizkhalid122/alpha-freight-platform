"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { getAirShipments, type AirShipment } from "@/lib/air-storage";

export default function AirShipperShipmentsPage() {
  const [shipments, setShipments] = useState<AirShipment[]>([]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setShipments(getAirShipments(user.id));
    })();
  }, []);

  return (
    <AirPageShell
      title="My shipments"
      description="All air cargo you have posted on Alpha Freight."
      backHref="/air/shipper/dashboard"
      actions={
        <Link
          href="/air/shipper/post"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Post shipment
        </Link>
      }
    >
      {shipments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No shipments yet.</p>
          <Link
            href="/air/shipper/post"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Post your first shipment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{s.awb}</p>
                  <p className="text-sm text-gray-500">
                    {s.origin} → {s.destination} · {s.weightKg} kg · {s.cargoType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    {s.status}
                  </span>
                  <Link
                    href={`/air/shipper/track?q=${encodeURIComponent(s.awb)}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Track
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AirPageShell>
  );
}
