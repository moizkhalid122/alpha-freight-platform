"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { getAirBookings, type AirBooking } from "@/lib/air-storage";

export default function AirForwarderBookingsPage() {
  const [bookings, setBookings] = useState<AirBooking[]>([]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setBookings(getAirBookings(user.id));
    })();
  }, []);

  return (
    <AirPageShell
      title="My bookings"
      description="AWBs you have accepted and are managing."
      backHref="/air/forwarder/dashboard"
      actions={
        <Link
          href="/air/forwarder/awbs"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Browse AWBs
        </Link>
      }
    >
      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No bookings yet.</p>
          <Link
            href="/air/forwarder/awbs"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Find available AWBs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{b.awb}</p>
                  <p className="text-sm text-gray-500">
                    {b.route} · {b.weight}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{b.rate}</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AirPageShell>
  );
}
