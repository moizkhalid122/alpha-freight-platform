"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  canSupplierTrackShipment,
  getSupplierPaymentStateForLoad,
  type TrackableLoad,
} from "@/lib/supplier-tracking";
import {
  getSupplierPaymentOrdersForUser,
  type SupplierPaymentRecord,
} from "@/lib/supplier-payments";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `£${amount.toLocaleString("en-GB")}`;
}

export default function SupplierTrackPickerPage() {
  const [loads, setLoads] = useState<TrackableLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoads([]);
        setLoading(false);
        return;
      }

      const [loadsResult, payments] = await Promise.all([
        supabase
          .from("loads")
          .select("id, origin, destination, status, carrier_id, pickup_date, price, payment_state")
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: false }),
        getSupplierPaymentOrdersForUser(user.id),
      ]);

      const paymentByLoad = new Map<string, SupplierPaymentRecord>(
        payments.map((record) => [record.loadId, record])
      );

      const trackable = (loadsResult.data ?? [])
        .map((row) => row as TrackableLoad)
        .filter((row) =>
          canSupplierTrackShipment(
            row,
            getSupplierPaymentStateForLoad(row, paymentByLoad.get(row.id)?.paymentState)
          )
        );

      setLoads(trackable);
      setLoading(false);
    };

    void load();
  }, []);

  const sortedLoads = useMemo(() => {
    const priority = (status: string) => {
      if (status === "in-transit") return 0;
      if (status === "loading") return 1;
      if (status === "booked") return 2;
      return 3;
    };
    return [...loads].sort((a, b) => priority(a.status) - priority(b.status));
  }, [loads]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/supplier/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tracking</p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Live shipments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a paid, carrier-assigned load to open the live GPS map.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={`${CARD} flex items-center justify-center gap-2 px-6 py-16 text-sm font-semibold text-slate-600`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading trackable shipments…
        </div>
      ) : sortedLoads.length === 0 ? (
        <div className={`${CARD} px-6 py-16 text-center`}>
          <Navigation className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-900">No trackable loads yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Loads appear here once payment is confirmed and a carrier is assigned or the shipment is moving.
          </p>
          <Link
            href="/supplier/my-posts"
            className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View my posts
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLoads.map((load) => (
            <Link
              key={load.id}
              href={`/supplier/track/${load.id}`}
              className={`${CARD} block px-5 py-4 transition hover:border-blue-200 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                    {load.status.replace("-", " ")}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {load.origin || "Origin"} → {load.destination || "Destination"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {load.pickup_date ? `Pickup ${load.pickup_date}` : "Pickup pending"} ·{" "}
                    {formatMoney(load.price)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  <MapPin className="h-3.5 w-3.5" />
                  Track
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
