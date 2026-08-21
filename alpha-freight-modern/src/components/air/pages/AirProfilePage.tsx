"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { AIR_HUBS, AIR_SHIPMENT_TYPES, airOnboardingStorageKey, type AirOnboardingData, type AirRole } from "@/lib/air-portal";

export default function AirProfilePage({ role }: { role: AirRole }) {
  const backHref = role === "carrier" ? "/air/forwarder/dashboard" : "/air/shipper/dashboard";
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AirOnboardingData>({
    companyName: "",
    iataCode: "",
    primaryAirport: AIR_HUBS[0],
    shipmentTypes: [],
    phone: "",
  });

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const stored = localStorage.getItem(airOnboardingStorageKey(user.id));
      if (stored) setForm(JSON.parse(stored) as AirOnboardingData);
    })();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    localStorage.setItem(
      airOnboardingStorageKey(user.id),
      JSON.stringify({ ...form, completedAt: form.completedAt ?? new Date().toISOString() })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleType = (value: string) => {
    setForm((prev) => ({
      ...prev,
      shipmentTypes: prev.shipmentTypes.includes(value)
        ? prev.shipmentTypes.filter((t) => t !== value)
        : [...prev.shipmentTypes, value],
    }));
  };

  return (
    <AirPageShell title="Profile" description="Your company and air freight preferences." backHref={backHref}>
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Company name</label>
          <input
            className="air-input"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">IATA code</label>
          <input
            className="air-input"
            value={form.iataCode}
            onChange={(e) => setForm({ ...form, iataCode: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Primary hub</label>
          <select
            className="air-input"
            value={form.primaryAirport}
            onChange={(e) => setForm({ ...form, primaryAirport: e.target.value })}
          >
            {AIR_HUBS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
          <input
            className="air-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Shipment types</label>
          <div className="flex flex-wrap gap-2">
            {AIR_SHIPMENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  form.shipmentTypes.includes(t.value)
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="air-btn-primary max-w-xs">
          {saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>
    </AirPageShell>
  );
}
