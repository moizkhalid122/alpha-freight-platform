"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Copy,
  Edit3,
  Factory,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  PoundSterling,
  Receipt,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readSupplierExtras, type SupplierProfileExtras } from "@/lib/profile-extras";
import { readSupplierPaymentOrders, type SupplierPaymentRecord } from "@/lib/supplier-payments";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type SupplierProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  created_at?: string | null;
  industry?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  referral_code?: string | null;
  referred_by_code?: string | null;
};

type SupplierLoadRecord = {
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
};

type CarrierProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
};

type SupplierStatus = "Active" | "Inactive" | "New";
type SupplierTab = "overview" | "loads" | "payments" | "billing" | "activity" | "settings";

type ProfileFieldCheck = {
  id: string;
  label: string;
  value: string | null;
  complete: boolean;
};

type ActivityLogItem = {
  id: string;
  date: string | null;
  action: string;
  actor: string;
};

type SupplierDetailData = {
  supplier: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    accountType: string;
    email: string | null;
    invoicingEmail: string | null;
    phone: string | null;
    location: string;
    fullAddress: string;
    status: SupplierStatus;
    joinedAt: string | null;
    lastLoadAt: string | null;
    supplierCode: string;
    contactPerson: string;
    registrationNo: string;
    taxId: string;
    industry: string;
    commodity: string;
    monthlyVolume: string;
    averageWeight: string;
    averageValue: string;
    profileFieldsFilled: number;
    profileFieldsTotal: number;
    referralCode: string | null;
    referredByCode: string | null;
    totalLoads: number;
    completedLoads: number;
    activeLoads: number;
    totalSpend: number;
    paidPayments: number;
    pendingPayments: number;
    completionRate: number;
  } | null;
  loads: Array<
    SupplierLoadRecord & {
      carrierName: string;
      lane: string;
      spend: number;
    }
  >;
  payments: SupplierPaymentRecord[];
  profileChecks: ProfileFieldCheck[];
  activityLog: ActivityLogItem[];
};

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const ACTIVE_LOAD_STATUSES = new Set([
  "active",
  "available",
  "booked",
  "assigned",
  "pending",
  "loading",
  "in-transit",
]);

const TAB_OPTIONS: Array<{ id: SupplierTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "loads", label: "Loads" },
  { id: "payments", label: "Payments" },
  { id: "billing", label: "Billing" },
  { id: "activity", label: "Activity Log" },
  { id: "settings", label: "Settings" },
];

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-[15px] font-bold text-slate-900";

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  const parsed = Number(match?.[0] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatDisplayDate(value: string | null | undefined) {
  return value ? format(new Date(value), "dd MMM yyyy") : "Not available";
}

function formatAccountType(value: string | null | undefined) {
  const normalized = normalizeStatus(value);
  if (normalized === "company") return "Company";
  if (normalized === "individual") return "Individual";
  return value?.trim() || "Supplier";
}

function getLaneLabel(load: SupplierLoadRecord) {
  const origin = (load.origin || load.pickup_location || "Pickup").split(",")[0];
  const destination = (load.destination || load.delivery_location || "Delivery").split(",")[0];
  return `${origin} → ${destination}`;
}

function resolveSupplierStatus(
  joinedAt: string | null,
  lastLoadAt: string | null,
  loadsPosted: number
): SupplierStatus {
  const now = new Date();
  const weekStart = startOfDay(subDays(now, 6));
  const monthStart = startOfDay(subDays(now, 29));
  const joined = getDateOrNull(joinedAt);
  const lastLoad = getDateOrNull(lastLoadAt);

  if (joined && joined >= weekStart && loadsPosted <= 1) return "New";
  if (lastLoad && lastLoad >= monthStart) return "Active";
  if (loadsPosted > 0 && joined && joined >= monthStart) return "New";
  if (loadsPosted > 0) return "Inactive";
  if (joined && joined >= monthStart) return "New";
  return "Inactive";
}

function buildProfileChecks(
  extras: SupplierProfileExtras,
  profile: SupplierProfileRecord
): ProfileFieldCheck[] {
  return [
    { id: "company", label: "Company name", value: extras.companyName || profile.company_name || null, complete: Boolean(extras.companyName || profile.company_name) },
    { id: "contact", label: "Contact person", value: extras.contactPerson || profile.full_name || null, complete: Boolean(extras.contactPerson || profile.full_name) },
    { id: "email", label: "Primary email", value: extras.email ?? null, complete: Boolean(extras.email?.trim()) },
    { id: "phone", label: "Phone number", value: extras.phone ?? null, complete: Boolean(extras.phone?.trim()) },
    { id: "address", label: "Business address", value: extras.address || extras.city || null, complete: Boolean(extras.address?.trim() || extras.city?.trim()) },
    { id: "registration", label: "Registration no.", value: extras.registrationNo ?? null, complete: Boolean(extras.registrationNo?.trim()) },
    { id: "tax", label: "Tax ID / VAT", value: extras.taxId ?? null, complete: Boolean(extras.taxId?.trim()) },
    { id: "industry", label: "Industry", value: extras.industry || profile.industry || null, complete: Boolean(extras.industry?.trim() || profile.industry?.trim()) },
    { id: "invoicing", label: "Invoicing email", value: extras.invoicingEmail ?? null, complete: Boolean(extras.invoicingEmail?.trim()) },
    { id: "commodity", label: "Primary commodity", value: extras.commodity ?? null, complete: Boolean(extras.commodity?.trim()) },
  ];
}

function statusBadgeClass(status: SupplierStatus) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "New") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function genericBadgeClass(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "paid" || normalized === "completed" || normalized === "delivered") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (normalized === "failed" || normalized === "rejected") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

async function fetchSupplierDetail(supplierId: string): Promise<SupplierDetailData> {
  const [profileResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", supplierId).eq("role", "supplier").maybeSingle(),
    supabase
      .from("loads")
      .select(
        "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at"
      )
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileResult.error ? null : profileResult.data) as SupplierProfileRecord | null;
  const supplierLoads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as SupplierLoadRecord[];

  if (!profile) {
    return { supplier: null, loads: [], payments: [], profileChecks: [], activityLog: [] };
  }

  const carrierIds = Array.from(
    new Set(supplierLoads.map((load) => load.carrier_id).filter((value): value is string => Boolean(value)))
  );

  const carrierResult =
    carrierIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, company_name").in("id", carrierIds)
      : { data: [], error: null };

  const carriers = (carrierResult.error ? [] : (carrierResult.data ?? [])) as CarrierProfileRecord[];
  const carrierNameById = new Map(
    carriers.map((carrier) => [
      carrier.id,
      carrier.company_name?.trim() || carrier.full_name?.trim() || `Carrier ${carrier.id.slice(0, 8)}`,
    ])
  );

  const extras = readSupplierExtras(profile.id);
  const paymentOrders = readSupplierPaymentOrders().filter((order) => order.supplierId === profile.id);
  const completedLoads = supplierLoads.filter((load) =>
    DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
  ).length;
  const activeLoads = supplierLoads.filter((load) =>
    ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
  ).length;
  const totalSpend = supplierLoads.reduce((sum, load) => sum + toNumber(load.price), 0);
  const lastLoadAt =
    supplierLoads.length > 0
      ? supplierLoads.reduce<string | null>((latest, load) => {
          if (!load.created_at) return latest;
          if (!latest) return load.created_at;
          return new Date(load.created_at) > new Date(latest) ? load.created_at : latest;
        }, null)
      : null;

  const profileChecks = buildProfileChecks(extras, profile);
  const profileFieldsFilled = profileChecks.filter((check) => check.complete).length;
  const completionRate =
    profileChecks.length > 0 ? Math.round((profileFieldsFilled / profileChecks.length) * 100) : 0;

  const loads = supplierLoads.map((load) => ({
    ...load,
    carrierName: carrierNameById.get(load.carrier_id || "") || "Unassigned",
    lane: getLaneLabel(load),
    spend: toNumber(load.price),
  }));

  const activityLog: ActivityLogItem[] = [
    {
      id: "profile-created",
      date: profile.created_at ?? null,
      action: "Supplier profile registered",
      actor: "Supplier",
    },
    ...loads.slice(0, 10).map((load) => ({
      id: `load-${load.id}`,
      date: load.created_at,
      action: DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
        ? `Load ${load.id.slice(0, 8)} completed · ${load.lane}`
        : `Load ${load.id.slice(0, 8)} posted · ${normalizeStatus(load.status) || "pending"}`,
      actor: "Marketplace",
    })),
    ...paymentOrders.slice(0, 5).map((payment) => ({
      id: `payment-${payment.loadId}`,
      date: payment.paidAt || payment.createdAt,
      action: `Payment ${payment.paymentState} · ${formatMoney(payment.amount)} (${payment.paymentRoute})`,
      actor: "Billing",
    })),
  ].sort(
    (a, b) => (getDateOrNull(b.date)?.getTime() ?? 0) - (getDateOrNull(a.date)?.getTime() ?? 0)
  );

  const fullAddress =
    [extras.address, extras.city].filter(Boolean).join(", ") || extras.address || "Not provided";

  return {
    supplier: {
      id: profile.id,
      companyName:
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        `Supplier ${profile.id.slice(0, 8)}`,
      logoUrl: extras.avatarUrl ?? profile.avatar_url ?? null,
      bannerUrl: extras.bannerUrl ?? profile.banner_url ?? null,
      accountType: formatAccountType(extras.accountType),
      email: extras.email ?? null,
      invoicingEmail: extras.invoicingEmail ?? null,
      phone: extras.phone ?? null,
      location: extras.city?.trim() || extras.address?.trim() || "Not provided",
      fullAddress,
      status: resolveSupplierStatus(profile.created_at ?? null, lastLoadAt, supplierLoads.length),
      joinedAt: profile.created_at ?? null,
      lastLoadAt,
      supplierCode: `SP-${profile.id.slice(0, 6).toUpperCase()}`,
      contactPerson: extras.contactPerson?.trim() || profile.full_name?.trim() || "Not provided",
      registrationNo: extras.registrationNo?.trim() || "Not provided",
      taxId: extras.taxId?.trim() || "Not provided",
      industry: extras.industry?.trim() || profile.industry?.trim() || "Not set",
      commodity: extras.commodity?.trim() || "Not set",
      monthlyVolume: extras.monthlyVolume?.trim() || "Not set",
      averageWeight: extras.averageWeight?.trim() || "Not set",
      averageValue: extras.averageValue?.trim() || "Not set",
      profileFieldsFilled,
      profileFieldsTotal: profileChecks.length,
      referralCode: profile.referral_code ?? null,
      referredByCode: profile.referred_by_code ?? null,
      totalLoads: supplierLoads.length,
      completedLoads,
      activeLoads,
      totalSpend,
      paidPayments: paymentOrders.filter((order) => order.paymentState === "paid").length,
      pendingPayments: paymentOrders.filter((order) => order.paymentState === "pending").length,
      completionRate,
    },
    loads,
    payments: paymentOrders,
    profileChecks,
    activityLog,
  };
}

function TableShell({
  columns,
  children,
  emptyState,
}: {
  columns: string[];
  children: React.ReactNode;
  emptyState: React.ReactNode;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200/60">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children || emptyState}</tbody>
      </table>
    </div>
  );
}

function DetailSectionCard({
  eyebrow,
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(CARD_CLASS, "relative overflow-hidden p-5", className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-slate-300" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200/60">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={SECTION_LABEL}>{eyebrow}</p>
            <h3 className={cn("mt-1", SECTION_TITLE)}>{title}</h3>
          </div>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
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

function SidePanel({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(CARD_CLASS, "relative overflow-hidden p-5")}>
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-slate-300" />
      <div className="flex items-center justify-between">
        <div>
          <p className={SECTION_LABEL}>{eyebrow}</p>
          <h3 className={cn("mt-1", SECTION_TITLE)}>{title}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200/60">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

export default function AdminSupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const supplierId = String(params?.id ?? "");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SupplierTab>("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-supplier-detail", supplierId],
    queryFn: () => fetchSupplierDetail(supplierId),
    enabled: Boolean(supplierId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const supplier = data?.supplier ?? null;
  const loads = data?.loads ?? [];
  const payments = data?.payments ?? [];
  const profileChecks = data?.profileChecks ?? [];
  const activityLog = data?.activityLog ?? [];

  const quickStats = useMemo(
    () =>
      supplier
        ? [
            { label: "Loads posted", value: supplier.totalLoads.toLocaleString(), icon: Package },
            { label: "Active loads", value: supplier.activeLoads.toLocaleString(), icon: Truck },
            { label: "Completed", value: supplier.completedLoads.toLocaleString(), icon: BadgeCheck },
            { label: "Total spend", value: formatMoney(supplier.totalSpend), icon: PoundSterling },
            { label: "Profile complete", value: `${supplier.completionRate}%`, icon: ShieldCheck },
            { label: "Paid payments", value: supplier.paidPayments.toLocaleString(), icon: Receipt },
            { label: "Pending pay", value: supplier.pendingPayments.toLocaleString(), icon: Clock3 },
            {
              label: "Completion rate",
              value: supplier.totalLoads > 0 ? `${Math.round((supplier.completedLoads / supplier.totalLoads) * 100)}%` : "—",
              icon: TrendingUp,
            },
          ]
        : [],
    [supplier]
  );

  const handleAdminAction = (action: string) => {
    toast(`${action} workflow is ready for backend wiring.`, { icon: "i" });
  };

  const handleCopyBillingDetails = async () => {
    if (!supplier) return;

    const payload = [
      `Supplier: ${supplier.companyName}`,
      `Code: ${supplier.supplierCode}`,
      `Registration: ${supplier.registrationNo}`,
      `Tax ID: ${supplier.taxId}`,
      `Invoicing Email: ${supplier.invoicingEmail || "Not provided"}`,
      `Primary Email: ${supplier.email || "Not provided"}`,
      `Phone: ${supplier.phone || "Not provided"}`,
      `Address: ${supplier.fullAddress}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Billing details copied.");
    } catch {
      toast.error("Unable to copy billing details.");
    }
  };

  if (isLoading) {
    return (
      <div className={cn(CARD_CLASS, "mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500")}>
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading supplier profile…
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className={cn(CARD_CLASS, "p-8")}>
          <Link href="/admin/suppliers">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to suppliers
            </Button>
          </Link>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-xl font-semibold text-slate-900">Supplier profile not found</p>
            <p className="mt-2 text-sm text-slate-500">This supplier record is unavailable or no longer exists.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "overflow-hidden")}>
        {supplier.bannerUrl ? (
          <div className="h-28 overflow-hidden border-b border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={supplier.bannerUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              {supplier.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={supplier.logoUrl}
                  alt={supplier.companyName}
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200/60"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/60">
                  <Factory className="h-9 w-9" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={SECTION_LABEL}>Supplier profile</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                      statusBadgeClass(supplier.status)
                    )}
                  >
                    {supplier.status}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {supplier.accountType}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold text-slate-900">{supplier.companyName}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200/60">
                    {supplier.supplierCode}
                  </span>
                  <span>Joined {formatDisplayDate(supplier.joinedAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {supplier.location}
                  </span>
                  <span>
                    Profile {supplier.profileFieldsFilled}/{supplier.profileFieldsTotal}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/suppliers">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Link href={`/admin/suppliers/add?edit=${supplier.id}`}>
                <Button variant="secondary" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => void handleCopyBillingDetails()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy billing
              </Button>
              {supplier.email ? (
                <a href={`mailto:${supplier.email}`}>
                  <Button size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {quickStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-3 ring-1 ring-slate-200/60">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-1.5 text-lg font-bold text-slate-900">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ring-1 ring-slate-200/60",
                activeTab === tab.id ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <div className={cn(CARD_CLASS, "p-6")}>
              <p className={SECTION_LABEL}>Company details</p>
              <h2 className={cn("mt-1 text-xl font-bold text-slate-900")}>Overview</h2>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <DetailSectionCard eyebrow="Company information" title="Registered business" icon={Building2}>
                    <div className="space-y-2">
                      <DetailRow label="Company name" value={supplier.companyName} />
                      <DetailRow label="Registration no." value={supplier.registrationNo} />
                      <DetailRow label="Tax ID / VAT" value={supplier.taxId} />
                      <DetailRow label="Account type" value={supplier.accountType} />
                      <DetailRow label="Industry" value={supplier.industry} />
                      {supplier.referralCode ? (
                        <DetailRow label="Referral code" value={supplier.referralCode} />
                      ) : null}
                      {supplier.referredByCode ? (
                        <DetailRow label="Referred by" value={supplier.referredByCode} />
                      ) : null}
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard eyebrow="Contact" title="Primary contacts" icon={Mail}>
                    <div className="space-y-2">
                      <DetailRow label="Contact person" value={supplier.contactPerson} />
                      <DetailRow label="Email" value={supplier.email ?? "Not provided"} />
                      <DetailRow label="Phone" value={supplier.phone ?? "Not provided"} />
                      <DetailRow label="Address" value={supplier.fullAddress} />
                    </div>
                  </DetailSectionCard>
                </div>

                <div className="space-y-4">
                  <DetailSectionCard eyebrow="Shipping profile" title="Load preferences" icon={Package}>
                    <div className="space-y-2">
                      <DetailRow label="Primary commodity" value={supplier.commodity} />
                      <DetailRow label="Monthly volume" value={supplier.monthlyVolume} />
                      <DetailRow label="Average weight" value={supplier.averageWeight} />
                      <DetailRow label="Average load value" value={supplier.averageValue} />
                      <DetailRow
                        label="Last load posted"
                        value={
                          supplier.lastLoadAt
                            ? formatDistanceToNow(new Date(supplier.lastLoadAt), { addSuffix: true })
                            : "Never"
                        }
                      />
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard
                    eyebrow="Billing"
                    title="Invoicing & tax setup"
                    icon={Receipt}
                    action={
                      <Button variant="secondary" size="sm" onClick={() => void handleCopyBillingDetails()}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    }
                  >
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {[
                        { label: "Total spend", value: formatMoney(supplier.totalSpend) },
                        { label: "Paid payments", value: String(supplier.paidPayments) },
                        { label: "Pending payments", value: String(supplier.pendingPayments) },
                        { label: "Completion rate", value: `${supplier.completionRate}% profile` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60">
                          <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                          <p className="mt-1 text-base font-bold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <DetailRow label="Invoicing email" value={supplier.invoicingEmail ?? "Not provided"} />
                      <DetailRow label="Tax ID" value={supplier.taxId} />
                      <DetailRow label="Registration no." value={supplier.registrationNo} />
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard eyebrow="Profile completeness" title="Onboarding checklist" icon={ShieldCheck}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {supplier.profileFieldsFilled}/{supplier.profileFieldsTotal} fields complete
                        </p>
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200/60">
                          {supplier.completionRate}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${supplier.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {profileChecks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{check.label}</p>
                            <p className="truncate text-[11px] text-slate-500">{check.value || "Not provided"}</p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              check.complete
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {check.complete ? "Complete" : "Missing"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DetailSectionCard>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-1">
              <SidePanel eyebrow="Recent payments" title="Billing activity" icon={PoundSterling}>
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.loadId} className="rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(payment.amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {payment.title || payment.loadId.slice(0, 8)} · {payment.paymentState}
                    </p>
                    <p className="text-[11px] text-slate-400">{payment.paymentRoute.replace("-", " ")}</p>
                  </div>
                ))}
                {payments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No payment activity yet.
                  </div>
                ) : null}
              </SidePanel>

              <SidePanel eyebrow="Recent loads" title="Posted loads" icon={Truck}>
                {loads.slice(0, 3).map((load) => (
                  <div key={load.id} className="rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-sm font-semibold text-slate-900">{load.id.slice(0, 8)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {load.lane} · {normalizeStatus(load.status) || "pending"}
                    </p>
                    <p className="text-[11px] text-slate-400">{load.carrierName} · {formatMoney(load.spend)}</p>
                  </div>
                ))}
                {loads.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No loads posted yet.
                  </div>
                ) : null}
              </SidePanel>

              <SidePanel eyebrow="Performance" title="Platform metrics" icon={TrendingUp}>
                <div className="rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <p className="text-sm font-semibold text-slate-900">{supplier.totalLoads} loads posted</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {supplier.completedLoads} completed · {supplier.activeLoads} active
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <p className="text-sm font-semibold text-emerald-700">{formatMoney(supplier.totalSpend)} total spend</p>
                  <p className="mt-1 text-xs text-slate-500">Across all marketplace loads</p>
                </div>
              </SidePanel>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "loads" ? (
        <section className={cn(CARD_CLASS, "p-6")}>
          <p className={SECTION_LABEL}>Loads</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Posted load history</h2>
          <TableShell
            columns={["#", "Load ID", "Carrier", "Route", "Date", "Status", "Spend"]}
            emptyState={
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No loads posted yet.
                </td>
              </tr>
            }
          >
            {loads.map((load, index) => (
              <tr key={load.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs font-medium text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{load.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{load.carrierName}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{load.lane}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatDisplayDate(load.created_at)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      genericBadgeClass(normalizeStatus(load.status) || "pending")
                    )}
                  >
                    {normalizeStatus(load.status) || "pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatMoney(load.spend)}</td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className={cn(CARD_CLASS, "p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={SECTION_LABEL}>Payments</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Payment history &amp; billing state</h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void handleCopyBillingDetails()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy billing details
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total spend", value: formatMoney(supplier.totalSpend) },
              { label: "Paid", value: supplier.paidPayments.toLocaleString() },
              { label: "Pending", value: supplier.pendingPayments.toLocaleString() },
              { label: "Invoicing email", value: supplier.invoicingEmail ?? "Not set" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
                <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <TableShell
            columns={["Load", "Route", "Amount", "Route type", "Method", "Status", "Date"]}
            emptyState={
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No payment records yet.
                </td>
              </tr>
            }
          >
            {payments.map((payment) => (
              <tr key={`${payment.loadId}-${payment.createdAt}`} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{payment.loadId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {payment.origin} → {payment.destination}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatMoney(payment.amount)}</td>
                <td className="px-4 py-3 text-sm capitalize text-slate-600">{payment.paymentRoute.replace("-", " ")}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{payment.paymentMethod}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                      genericBadgeClass(payment.paymentState)
                    )}
                  >
                    {payment.paymentState}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatDisplayDate(payment.paidAt || payment.createdAt)}
                </td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "billing" ? (
        <section className={cn(CARD_CLASS, "p-6")}>
          <p className={SECTION_LABEL}>Billing</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Tax, invoicing &amp; registration</h2>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <DetailSectionCard eyebrow="Registration" title="Business identifiers" icon={FileText}>
              <div className="space-y-2">
                <DetailRow label="Company registration" value={supplier.registrationNo} />
                <DetailRow label="Tax ID / VAT number" value={supplier.taxId} />
                <DetailRow label="Account type" value={supplier.accountType} />
                <DetailRow label="Supplier code" value={supplier.supplierCode} />
              </div>
            </DetailSectionCard>

            <DetailSectionCard eyebrow="Invoicing" title="Billing contacts" icon={Receipt}>
              <div className="space-y-2">
                <DetailRow label="Invoicing email" value={supplier.invoicingEmail ?? "Not provided"} />
                <DetailRow label="Primary email" value={supplier.email ?? "Not provided"} />
                <DetailRow label="Contact person" value={supplier.contactPerson} />
                <DetailRow label="Phone" value={supplier.phone ?? "Not provided"} />
                <DetailRow label="Billing address" value={supplier.fullAddress} />
              </div>
            </DetailSectionCard>
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className={cn(CARD_CLASS, "p-6")}>
          <p className={SECTION_LABEL}>Activity log</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Supplier timeline</h2>
          <div className="mt-6 space-y-3">
            {activityLog.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.actor}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : "Unknown"}
                </p>
              </div>
            ))}
            {activityLog.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center text-sm text-slate-500">
                No activity recorded yet.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className={cn(CARD_CLASS, "p-6")}>
          <p className={SECTION_LABEL}>Settings</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Account controls</h2>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <DetailSectionCard eyebrow="Account" title="Supplier account" icon={UserRound}>
              <div className="space-y-2">
                <DetailRow label="Supplier ID" value={supplier.id} />
                <DetailRow label="Status" value={supplier.status} />
                <DetailRow label="Joined" value={formatDisplayDate(supplier.joinedAt)} />
                <DetailRow label="Industry" value={supplier.industry} />
              </div>
            </DetailSectionCard>

            <DetailSectionCard eyebrow="Admin actions" title="Management" icon={Settings2}>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Suspend supplier")}>
                  Suspend account
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Reset password")}>
                  Reset password
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Send onboarding reminder")}>
                  Send reminder
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Delete supplier")}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Admin actions update supplier access and billing workflows once backend wiring is connected.
              </p>
            </DetailSectionCard>
          </div>
        </section>
      ) : null}
    </div>
  );
}
