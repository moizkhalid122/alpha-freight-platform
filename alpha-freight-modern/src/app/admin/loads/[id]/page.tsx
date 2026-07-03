"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Gavel,
  Loader2,
  MapPin,
  Package,
  PoundSterling,
  Receipt,
  Route,
  Truck,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-data-client";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";

type LoadTab = "overview" | "bids" | "payment" | "pod";

type RawLoad = {
  id: string;
  supplier_id: string | null;
  carrier_id: string | null;
  origin: string | null;
  destination: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  title: string | null;
  commodity: string | null;
  equipment: string | null;
  weight: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  payment_route: string | null;
  payment_state: string | null;
  notes: string | null;
  pod_url: string | null;
  pod_name: string | null;
  pod_uploaded_at: string | null;
  pod_verification_status: string | null;
  pod_review_note: string | null;
  pod_verified_at: string | null;
};

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  verification_status?: string | null;
};

type BidRecord = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount: number | string | null;
  status: string | null;
  created_at: string | null;
};

type PaymentRecord = {
  id: string;
  load_id: string;
  supplier_id: string;
  payment_route: string;
  payment_state: string;
  amount: number | string | null;
  currency?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  payment_method?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
};

type LoadDetailApiResponse = {
  load: RawLoad;
  profiles: ProfileRecord[];
  bids: BidRecord[];
  payments: PaymentRecord[];
};

type LoadStage = "Available" | "Matched" | "In Transit" | "Completed" | "Pending Payment" | "Other";

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-xl font-bold text-slate-900";

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const IN_TRANSIT_LOAD_STATUSES = new Set(["loading", "in-transit", "assigned", "booked"]);
const AVAILABLE_LOAD_STATUSES = new Set(["active", "available", "pending"]);
const MATCHED_LOAD_STATUSES = new Set(["booked", "assigned", "loading", "in-transit"]);

const tabs: { id: LoadTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "bids", label: "Bids", icon: Gavel },
  { id: "payment", label: "Payment", icon: Receipt },
  { id: "pod", label: "POD", icon: FileCheck2 },
];

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  const parsed = Number(match?.[0] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveLoadStage(load: RawLoad): LoadStage {
  const status = normalizeStatus(load.status);
  if (status === "pending-payment") return "Pending Payment";
  if (DELIVERED_LOAD_STATUSES.has(status)) return "Completed";
  if (IN_TRANSIT_LOAD_STATUSES.has(status)) return "In Transit";
  if (load.carrier_id || MATCHED_LOAD_STATUSES.has(status)) return "Matched";
  if (AVAILABLE_LOAD_STATUSES.has(status)) return "Available";
  return "Other";
}

function stageBadgeClass(stage: LoadStage) {
  if (stage === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (stage === "In Transit") return "bg-blue-50 text-blue-700 border-blue-200";
  if (stage === "Matched") return "bg-violet-50 text-violet-700 border-violet-200";
  if (stage === "Available") return "bg-amber-50 text-amber-700 border-amber-200";
  if (stage === "Pending Payment") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function paymentBadgeClass(state: string) {
  const normalized = normalizeStatus(state);
  if (normalized === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "failed" || normalized === "refunded") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function podBadgeClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  if (normalized === "verified") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "rejected") return "bg-red-50 text-red-700 border-red-200";
  if (normalized === "info_required") return "bg-amber-50 text-amber-700 border-amber-200";
  if (normalized === "pending" || normalized === "uploaded") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function resolveProfileName(profile: ProfileRecord | undefined, extrasName?: string | null) {
  return (
    extrasName?.trim() ||
    profile?.company_name?.trim() ||
    profile?.full_name?.trim() ||
    "Unknown account"
  );
}

async function fetchLoadDetail(loadId: string) {
  return adminFetch<LoadDetailApiResponse>(`/api/admin/loads/${loadId}`);
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <span className="text-[12px] font-medium text-slate-500">{label}</span>
      <span
        className={cn(
          "text-[13px] font-semibold leading-5 text-slate-900 sm:max-w-[58%] sm:text-right",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  icon: Icon,
  children,
  accent = "violet",
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  accent?: "violet" | "blue" | "emerald";
}) {
  const accentClass =
    accent === "blue"
      ? "from-blue-500 to-slate-300"
      : accent === "emerald"
        ? "from-emerald-500 to-slate-300"
        : "from-violet-500 to-slate-300";

  return (
    <div className={cn(CARD_CLASS, "relative overflow-hidden p-5")}>
      <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", accentClass)} />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200/60">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={SECTION_LABEL}>{eyebrow}</p>
          <h3 className={cn("mt-1", SECTION_TITLE)}>{title}</h3>
        </div>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

export default function AdminLoadDetailPage() {
  const params = useParams<{ id: string }>();
  const loadId = String(params?.id ?? "");
  const [activeTab, setActiveTab] = useState<LoadTab>("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-load-detail", loadId],
    queryFn: () => fetchLoadDetail(loadId),
    enabled: Boolean(loadId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const viewModel = useMemo(() => {
    if (!data?.load) return null;

    const load = data.load;
    const profileById = new Map(data.profiles.map((profile) => [profile.id, profile]));
    const supplierProfile = load.supplier_id ? profileById.get(load.supplier_id) : undefined;
    const carrierProfile = load.carrier_id ? profileById.get(load.carrier_id) : undefined;
    const supplierExtras = load.supplier_id ? readSupplierExtras(load.supplier_id) : null;
    const carrierExtras = load.carrier_id ? readCarrierExtras(load.carrier_id) : null;

    const origin = (load.origin || load.pickup_location || "Pickup").trim();
    const destination = (load.destination || load.delivery_location || "Delivery").trim();
    const routeShort = `${origin.split(",")[0]} → ${destination.split(",")[0]}`;

    const bids = data.bids.map((bid) => {
      const bidCarrier = profileById.get(bid.carrier_id);
      const bidExtras = readCarrierExtras(bid.carrier_id);
      return {
        ...bid,
        carrierName: resolveProfileName(bidCarrier, bidExtras?.companyName),
      };
    });

    return {
      load,
      loadCode: `LD-${load.id.slice(0, 6).toUpperCase()}`,
      title: load.title?.trim() || `${load.commodity || "Freight"} load`,
      route: routeShort,
      origin,
      destination,
      stage: resolveLoadStage(load),
      price: toNumber(load.price),
      supplierId: load.supplier_id,
      supplierName: resolveProfileName(supplierProfile, supplierExtras?.companyName),
      carrierId: load.carrier_id,
      carrierName: load.carrier_id
        ? resolveProfileName(carrierProfile, carrierExtras?.companyName)
        : "Unassigned",
      bids,
      payments: data.payments,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !viewModel) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/loads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to loads
        </Link>
        <div className={cn(CARD_CLASS, "mt-6 p-8 text-center")}>
          <p className="text-lg font-semibold text-slate-900">Load not found</p>
          <p className="mt-2 text-sm text-slate-500">
            {error instanceof Error ? error.message : "This load may have been removed or is unavailable."}
          </p>
        </div>
      </div>
    );
  }

  const { load, loadCode, title, route, stage, price, supplierId, supplierName, carrierId, carrierName, bids, payments } =
    viewModel;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/loads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All loads
        </Link>
        <div className="flex flex-wrap gap-2">
          {supplierId ? (
            <Link
              href={`/admin/suppliers/${supplierId}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/60 hover:bg-slate-50"
            >
              <Building2 className="h-3.5 w-3.5" />
              Supplier
            </Link>
          ) : null}
          {carrierId ? (
            <Link
              href={`/admin/carriers/${carrierId}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/60 hover:bg-slate-50"
            >
              <Truck className="h-3.5 w-3.5" />
              Carrier
            </Link>
          ) : null}
        </div>
      </div>

      <div className={cn(CARD_CLASS, "overflow-hidden")}>
        <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-slate-900 px-6 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                Load detail
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-violet-100">
                <span className="font-mono">{loadCode}</span>
                <span>·</span>
                <Route className="h-3.5 w-3.5" />
                {route}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                Load value
              </p>
              <p className="mt-1 text-3xl font-bold">{formatMoney(price)}</p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  stageBadgeClass(stage)
                )}
              >
                {stage}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200/60 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Status", value: normalizeStatus(load.status) || "unknown" },
            { label: "Bids", value: String(bids.length) },
            {
              label: "Payment",
              value: `${load.payment_route?.replace("-", " ") || "pay later"} · ${load.payment_state || "pending"}`,
            },
            {
              label: "Posted",
              value: load.created_at
                ? format(new Date(load.created_at), "dd MMM yyyy")
                : "—",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200/60">
              <p className={SECTION_LABEL}>{item.label}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "bids" && bids.length ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    isActive ? "bg-white/20" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {bids.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {activeTab === "overview" ? (
            <>
              <SectionCard eyebrow="Route" title="Pickup & delivery" icon={MapPin}>
                <DetailRow label="Origin" value={viewModel.origin} />
                <DetailRow label="Destination" value={viewModel.destination} />
                <DetailRow
                  label="Pickup date"
                  value={
                    load.pickup_date
                      ? format(new Date(load.pickup_date), "dd MMM yyyy")
                      : "Not set"
                  }
                />
                <DetailRow
                  label="Delivery date"
                  value={
                    load.delivery_date
                      ? format(new Date(load.delivery_date), "dd MMM yyyy")
                      : "Not set"
                  }
                />
              </SectionCard>

              <SectionCard eyebrow="Cargo" title="Load specifications" icon={Package} accent="blue">
                <DetailRow label="Commodity" value={load.commodity?.trim() || "General freight"} />
                <DetailRow label="Equipment" value={load.equipment?.trim() || "Not set"} />
                <DetailRow label="Weight" value={load.weight?.trim() || "—"} />
                <DetailRow label="Notes" value={load.notes?.trim() || "No notes"} />
              </SectionCard>

              <SectionCard eyebrow="Accounts" title="Supplier & carrier" icon={Building2} accent="emerald">
                <DetailRow
                  label="Supplier"
                  value={
                    supplierId ? (
                      <Link href={`/admin/suppliers/${supplierId}`} className="text-violet-700 hover:underline">
                        {supplierName}
                      </Link>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailRow
                  label="Assigned carrier"
                  value={
                    carrierId ? (
                      <Link href={`/admin/carriers/${carrierId}`} className="text-violet-700 hover:underline">
                        {carrierName}
                      </Link>
                    ) : (
                      "Unassigned"
                    )
                  }
                />
                <DetailRow
                  label="Last updated"
                  value={
                    load.updated_at
                      ? formatDistanceToNow(new Date(load.updated_at), { addSuffix: true })
                      : "—"
                  }
                />
              </SectionCard>
            </>
          ) : null}

          {activeTab === "bids" ? (
            <div className={cn(CARD_CLASS, "overflow-hidden")}>
              <div className="border-b border-slate-200/60 px-5 py-4">
                <p className={SECTION_LABEL}>Marketplace</p>
                <h3 className={SECTION_TITLE}>Carrier bids</h3>
              </div>
              {bids.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Carrier", "Amount", "Status", "Submitted", "Action"].map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {bid.carrierName}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {formatMoney(toNumber(bid.amount))}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-700">
                              {normalizeStatus(bid.status) || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {bid.created_at
                              ? format(new Date(bid.created_at), "dd MMM yyyy HH:mm")
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/carriers/${bid.carrier_id}`}
                              className="text-[12px] font-semibold text-violet-700 hover:underline"
                            >
                              View carrier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <Gavel className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No bids yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Carriers have not submitted bids on this load.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "payment" ? (
            <SectionCard eyebrow="Billing" title="Payment records" icon={PoundSterling}>
              <DetailRow
                label="Route on load"
                value={load.payment_route?.replace("-", " ") || "pay later"}
              />
              <DetailRow label="State on load" value={load.payment_state || "pending"} />
              {payments.length ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="mt-3 space-y-2 rounded-xl bg-white p-3 ring-1 ring-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatMoney(toNumber(payment.amount))}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                          paymentBadgeClass(payment.payment_state)
                        )}
                      >
                        {payment.payment_state}
                      </span>
                    </div>
                    <DetailRow label="Method" value={payment.payment_method || "—"} />
                    {payment.card_last4 ? (
                      <DetailRow
                        label="Card"
                        value={`${payment.card_brand || "Card"} ···· ${payment.card_last4}`}
                      />
                    ) : null}
                    <DetailRow
                      label="Paid at"
                      value={
                        payment.paid_at
                          ? format(new Date(payment.paid_at), "dd MMM yyyy HH:mm")
                          : "Not paid"
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No supplier payment records in Supabase for this load.</p>
              )}
            </SectionCard>
          ) : null}

          {activeTab === "pod" ? (
            <SectionCard eyebrow="Delivery proof" title="POD verification" icon={FileCheck2} accent="emerald">
              <DetailRow
                label="Status"
                value={
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                      podBadgeClass(load.pod_verification_status)
                    )}
                  >
                    {load.pod_verification_status?.replace("_", " ") || "Not uploaded"}
                  </span>
                }
              />
              <DetailRow label="File name" value={load.pod_name || "—"} />
              <DetailRow
                label="Uploaded"
                value={
                  load.pod_uploaded_at
                    ? format(new Date(load.pod_uploaded_at), "dd MMM yyyy HH:mm")
                    : "—"
                }
              />
              <DetailRow
                label="Verified"
                value={
                  load.pod_verified_at
                    ? format(new Date(load.pod_verified_at), "dd MMM yyyy HH:mm")
                    : "—"
                }
              />
              <DetailRow label="Review note" value={load.pod_review_note?.trim() || "—"} />
              {load.pod_url ? (
                <a
                  href={load.pod_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline"
                >
                  Open POD file
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </SectionCard>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className={cn(CARD_CLASS, "p-5")}>
            <p className={SECTION_LABEL}>Quick links</p>
            <h3 className={cn("mt-1", SECTION_TITLE)}>Related accounts</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                <p className="text-[11px] font-semibold text-slate-500">Supplier</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{supplierName}</p>
                {supplierId ? (
                  <Link
                    href={`/admin/suppliers/${supplierId}`}
                    className="mt-2 inline-block text-[12px] font-semibold text-violet-700 hover:underline"
                  >
                    Open profile
                  </Link>
                ) : null}
              </div>
              <div className="rounded-lg bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                <p className="text-[11px] font-semibold text-slate-500">Carrier</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{carrierName}</p>
                {carrierId ? (
                  <Link
                    href={`/admin/carriers/${carrierId}`}
                    className="mt-2 inline-block text-[12px] font-semibold text-violet-700 hover:underline"
                  >
                    Open profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className={cn(CARD_CLASS, "p-5")}>
            <p className={SECTION_LABEL}>Timeline</p>
            <h3 className={cn("mt-1", SECTION_TITLE)}>Key dates</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Posted", date: load.created_at, icon: CalendarDays },
                { label: "Pickup", date: load.pickup_date, icon: MapPin },
                { label: "Delivery", date: load.delivery_date, icon: Route },
                { label: "POD uploaded", date: load.pod_uploaded_at, icon: FileCheck2 },
              ].map((item) => {
                const Icon = item.icon;
                const parsed = getDateOrNull(item.date);
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {parsed ? format(parsed, "dd MMM yyyy") : "Not set"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
