"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { getAirShipments } from "@/lib/air-storage";

export default function AirShipperBillingPage() {
  const [invoices, setInvoices] = useState<{ awb: string; amount: string; date: string; status: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const shipments = getAirShipments(user.id);
      setInvoices(
        shipments.map((s, i) => ({
          awb: s.awb,
          amount: `£${(s.weightKg * 6.8 + 120).toFixed(0)}`,
          date: new Date(s.createdAt).toLocaleDateString("en-GB"),
          status: i === 0 ? "Due" : "Paid",
        }))
      );
    })();
  }, []);

  const totalDue = invoices.filter((i) => i.status === "Due").reduce((acc, i) => acc + parseFloat(i.amount.replace("£", "")), 0);

  return (
    <AirPageShell
      title="Billing"
      description="Invoices and payment history for your air shipments."
      backHref="/air/shipper/dashboard"
    >
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Outstanding balance</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">£{totalDue.toFixed(0)}</p>
        {totalDue > 0 ? (
          <button type="button" className="air-btn-primary mt-4 max-w-xs">
            Pay invoice
          </button>
        ) : null}
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices yet — post a shipment to generate billing.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.awb} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{inv.awb}</p>
                <p className="text-sm text-gray-500">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-gray-900">{inv.amount}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    inv.status === "Due" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {inv.status}
                </span>
                <button type="button" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AirPageShell>
  );
}
