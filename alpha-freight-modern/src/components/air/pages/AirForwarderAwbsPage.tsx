"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { DEMO_AWBS, getAirBookings, saveAirBooking, type AirBooking } from "@/lib/air-storage";

export default function AirForwarderAwbsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [booked, setBooked] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setBooked(getAirBookings(user.id).map((b) => b.awb));
    })();
  }, []);

  const acceptAwb = (row: (typeof DEMO_AWBS)[0]) => {
    if (!userId || booked.includes(row.awb)) return;
    const booking: AirBooking = {
      id: crypto.randomUUID(),
      awb: row.awb,
      route: row.route,
      weight: row.weight,
      rate: row.rate,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
    };
    saveAirBooking(userId, booking);
    setBooked((prev) => [...prev, row.awb]);
  };

  return (
    <AirPageShell
      title="Available AWBs"
      description="Browse live air waybills and accept capacity that matches your lanes."
      backHref="/air/forwarder/dashboard"
      actions={
        <Link
          href="/air/forwarder/bookings"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          My bookings
        </Link>
      }
    >
      <div className="space-y-3">
        {DEMO_AWBS.map((row) => {
          const taken = booked.includes(row.awb);
          return (
            <div
              key={row.awb}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{row.awb}</p>
                <p className="text-sm text-gray-500">
                  {row.route} · {row.weight}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-gray-900">{row.rate}</p>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => acceptAwb(row)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {taken ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Booked
                    </span>
                  ) : (
                    "Accept AWB"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AirPageShell>
  );
}
