"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { getAirBookings } from "@/lib/air-storage";

export default function AirForwarderSettlementPage() {
  const [total, setTotal] = useState("£0");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const bookings = getAirBookings(user.id);
      const sum = bookings.reduce((acc, b) => {
        const num = parseFloat(b.rate.replace(/[£,]/g, "")) || 0;
        return acc + num;
      }, 0);
      setTotal(`£${sum.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`);
      setPending(bookings.filter((b) => b.status === "confirmed").length);
    })();
  }, []);

  return (
    <AirPageShell
      title="Settlement"
      description="Track payouts for completed AWB bookings."
      backHref="/air/forwarder/dashboard"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">This month</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending release</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{pending}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Next payout</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">7 days</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Request payout</p>
        <p className="mb-4 text-sm text-gray-500">
          Settlements are released 7 days after AWB delivery confirmation.
        </p>
        <button type="button" className="air-btn-primary max-w-xs">
          Request settlement
        </button>
      </div>
    </AirPageShell>
  );
}
