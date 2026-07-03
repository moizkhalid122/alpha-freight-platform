"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  PackagePlus,
  PoundSterling,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-data-client";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";

const EQUIPMENT_OPTIONS = [
  "Curtain-sider",
  "Large Truck",
  "Box Truck",
  "Flatbed",
  "Refrigerated",
  "Tail Lift",
  "General",
];

type SupplierOption = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
};

type PostLoadForm = {
  title: string;
  origin: string;
  destination: string;
  pickup_date: string;
  delivery_date: string;
  price: string;
  weight: string;
  equipment: string;
  commodity: string;
  notes: string;
  supplier_id: string;
};

const initialForm: PostLoadForm = {
  title: "",
  origin: "",
  destination: "",
  pickup_date: "",
  delivery_date: "",
  price: "",
  weight: "",
  equipment: "Large Truck",
  commodity: "",
  notes: "",
  supplier_id: "",
};

export default function AdminPostLoadPage() {
  const router = useRouter();
  const [form, setForm] = useState<PostLoadForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [postedLoadId, setPostedLoadId] = useState<string | null>(null);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["admin-suppliers-for-post-load"],
    queryFn: async () => {
      const response = await adminFetch<{ profiles: SupplierOption[] }>("/api/admin/profiles?role=supplier");
      return response.profiles ?? [];
    },
  });

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.company_name || supplier.full_name || supplier.id.slice(0, 8),
      })),
    [suppliers]
  );

  useEffect(() => {
    if (postedLoadId) return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
    setForm((prev) => ({
      ...prev,
      pickup_date: prev.pickup_date || toDateInput(today),
      delivery_date: prev.delivery_date || toDateInput(tomorrow),
    }));
  }, [postedLoadId]);

  const updateField = (field: keyof PostLoadForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.origin.trim() || !form.destination.trim()) {
      toast.error("Origin and destination are required.");
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid listed rate.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminFetch<{ load: { id: string } }>("/api/admin/loads", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          pickup_date: form.pickup_date || null,
          delivery_date: form.delivery_date || null,
          price,
          weight: form.weight.trim() || null,
          equipment: form.equipment,
          commodity: form.commodity.trim() || null,
          notes: form.notes.trim() || null,
          supplier_id: form.supplier_id || null,
        }),
      });

      setPostedLoadId(response.load.id);
      toast.success("Load published live on the marketplace.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to post load.");
    } finally {
      setSubmitting(false);
    }
  };

  if (postedLoadId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className={cn(CARD_CLASS, "p-8 text-center")}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Load published</h1>
          <p className="mt-2 text-sm text-slate-500">
            This shipment is live with paid status and is visible to carriers immediately.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push(`/admin/loads/${postedLoadId}`)}>View load</Button>
            <Button variant="secondary" onClick={() => router.push("/admin/loads")}>
              All loads
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPostedLoadId(null);
                setForm(initialForm);
              }}
            >
              Post another
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-slate-300" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Admin load posting</p>
              <h1 className="text-xl font-bold text-slate-900">Post load to marketplace</h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
                Publish a paid, live load directly from admin. Carriers will see it on Available Loads instantly.
              </p>
            </div>
          </div>
          <Link href="/admin/loads">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to loads
            </Button>
          </Link>
        </div>
      </section>

      <form onSubmit={handleSubmit} className={cn(CARD_CLASS, "space-y-6 p-6")}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Load title
            </span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. London to Manchester pallet run"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              Pickup location
            </span>
            <input
              required
              value={form.origin}
              onChange={(event) => updateField("origin", event.target.value)}
              placeholder="London, UK"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              Delivery location
            </span>
            <input
              required
              value={form.destination}
              onChange={(event) => updateField("destination", event.target.value)}
              placeholder="Manchester, UK"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Pickup date
            </span>
            <input
              type="date"
              value={form.pickup_date}
              onChange={(event) => updateField("pickup_date", event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 [color-scheme:light]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Delivery date
            </span>
            <input
              type="date"
              value={form.delivery_date}
              onChange={(event) => updateField("delivery_date", event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 [color-scheme:light]"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <PoundSterling className="h-3.5 w-3.5" />
              Listed rate (£)
            </span>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="500"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Weight (kg)
            </span>
            <input
              value={form.weight}
              onChange={(event) => updateField("weight", event.target.value)}
              placeholder="1000"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <Truck className="h-3.5 w-3.5" />
              Equipment
            </span>
            <select
              value={form.equipment}
              onChange={(event) => updateField("equipment", event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200"
            >
              {EQUIPMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Commodity
            </span>
            <input
              value={form.commodity}
              onChange={(event) => updateField("commodity", event.target.value)}
              placeholder="General freight"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              Supplier (optional)
            </span>
            <select
              value={form.supplier_id}
              onChange={(event) => updateField("supplier_id", event.target.value)}
              disabled={suppliersLoading}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 disabled:opacity-60"
            >
              <option value="">Alpha Freight admin post (no supplier)</option>
              {supplierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Notes
            </span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Special instructions for carriers..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-200 focus:bg-white"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-[13px] text-emerald-800">
          Admin posts publish as <strong>active</strong> with <strong>paid</strong> status — no supplier checkout required.
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                Publish load
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/loads")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
