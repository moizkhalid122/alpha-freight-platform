"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  FileBadge2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  UserRoundX,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readCarrierPaymentOrders } from "@/lib/carrier-payments";
import { readCarrierPodUploads } from "@/lib/carrier-pod-uploads";
import { readCarrierWalletPayouts } from "@/lib/carrier-wallet-payouts";
import {
  deriveCarrierWalletPayoutTotals,
  deriveCarrierWalletRevenue,
} from "@/lib/carrier-wallet-metrics";
import { readLocalVehicles } from "@/lib/carrier-vehicle-storage";
import { mergeCarrierExtras, readCarrierExtras, type CarrierProfileExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type CarrierProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  created_at?: string | null;
  status?: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
  fleet_size?: number | string | null;
  vehicles_count?: number | string | null;
  truck_count?: number | string | null;
};

type CarrierLoadRecord = {
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

type SupplierProfileRecord = {
  id: string;
  full_name?: string | null;
};

type CarrierStatus = "Verified" | "Pending" | "Rejected" | "Active";
type CarrierTab =
  | "overview"
  | "documents"
  | "loads"
  | "payments"
  | "reviews"
  | "activity"
  | "settings";

type CarrierDocument = {
  id: string;
  name: string;
  status: "Verified" | "Pending" | "Rejected" | "Missing";
  uploadedAt: string | null;
  fileUrl: string | null;
};

type CarrierPayment = {
  id: string;
  date: string | null;
  type: string;
  amount: number;
  status: "Paid" | "Pending";
};

type CarrierReview = {
  id: string;
  rating: number;
  reviewer: string;
  comment: string;
  date: string | null;
};

type ActivityLogItem = {
  id: string;
  date: string | null;
  action: string;
  actor: string;
};

type CarrierDetailData = {
  carrier: {
    id: string;
    companyName: string;
    email: string | null;
    phone: string | null;
    location: string;
    status: CarrierStatus;
    vehicles: number;
    joinedAt: string | null;
    totalLoads: number;
    completedLoads: number;
    activeLoads: number;
    loadValue: number;
    onTimeDelivery: number;
    responseTimeHours: number;
    rating: number;
    reviewCount: number;
    carrierCode: string;
    logoUrl: string | null;
    accountType: string;
    registrationNo: string;
    operatorId: string | null;
    insuranceExpiry: string | null;
    alternatePhone: string | null;
    fullAddress: string;
    fleetSizeLabel: string;
    registeredVehicles: number;
    documentsUploaded: number;
    documentsTotal: number;
    verificationNotes: string | null;
    verifiedDate: string | null;
    companyType: string;
    yearsInBusiness: number;
    description: string;
    contactPerson: string;
    website: string | null;
    vehicleTypes: string[];
    serviceAreas: string[];
    specializations: string[];
    weightCapacity: string;
    walletBalance: number;
    grossWalletRevenue: number;
    incomingWalletRevenue: number;
    totalRequestedPayouts: number;
    banking: {
      payoutMethod: string;
      preferredPaymentMethod: string;
      payoutSetupComplete: boolean;
      accountHolder: string | null;
      bankName: string | null;
      bankCountry: string | null;
      sortCode: string | null;
      accountNumber: string | null;
      accountType: string | null;
    };
  } | null;
  loads: Array<
    CarrierLoadRecord & {
      supplierName: string;
      lane: string;
      revenue: number;
    }
  >;
  documents: CarrierDocument[];
  payments: CarrierPayment[];
  reviews: CarrierReview[];
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

const TAB_OPTIONS: Array<{ id: CarrierTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "loads", label: "Loads" },
  { id: "payments", label: "Payments" },
  { id: "reviews", label: "Reviews" },
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
  return `GBP ${Math.round(value).toLocaleString()}`;
}

function formatDisplayDate(value: string | null | undefined) {
  return value ? format(new Date(value), "dd MMM yyyy") : "Not available";
}

function resolveCarrierStatus(
  profile: CarrierProfileRecord,
  completedLoads: number,
  activeLoads: number,
  extras?: CarrierProfileExtras
): CarrierStatus {
  const extrasVerificationStatus = normalizeStatus(extras?.verificationStatus);
  const accountStatus = normalizeStatus(extras?.accountStatus);
  const verificationStatus = normalizeStatus(profile.verification_status);
  const profileStatus = normalizeStatus(profile.status);

  if (extrasVerificationStatus === "rejected" || accountStatus === "suspended") {
    return "Rejected";
  }

  if (extrasVerificationStatus === "verified") {
    if (accountStatus === "inactive") {
      return "Verified";
    }

    if (activeLoads > 0 || accountStatus === "active") {
      return "Active";
    }

    return "Verified";
  }

  if (
    verificationStatus === "rejected" ||
    profileStatus === "rejected" ||
    profile.is_approved === false
  ) {
    return "Rejected";
  }

  if (verificationStatus === "verified" || profileStatus === "verified") {
    return "Verified";
  }

  if (activeLoads > 0) {
    return "Active";
  }

  if (completedLoads > 0 || profile.is_approved === true) {
    return "Verified";
  }

  return "Pending";
}

function buildRating(totalLoads: number, completedLoads: number) {
  if (totalLoads <= 0) {
    return { rating: 0, reviewCount: 0 };
  }

  const completionRatio = completedLoads / Math.max(totalLoads, 1);
  const rating = Number((3.8 + completionRatio * 1.2).toFixed(1));
  return {
    rating: Math.min(5, rating),
    reviewCount: completedLoads,
  };
}

function getLaneLabel(load: CarrierLoadRecord) {
  const origin = (load.origin || load.pickup_location || "Pickup").split(",")[0];
  const destination = (load.destination || load.delivery_location || "Delivery").split(",")[0];
  return `${origin} to ${destination}`;
}

function toList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value ?? "")
    .split(/[,;|/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatAccountType(value: string | null | undefined) {
  const normalized = normalizeStatus(value);
  if (normalized === "company") return "Company";
  if (normalized === "individual") return "Individual";
  return value?.trim() || "Carrier";
}

function docStatusFromUrl(url: string | null | undefined, carrierStatus: CarrierStatus): CarrierDocument["status"] {
  if (!String(url ?? "").trim()) return "Missing";
  if (carrierStatus === "Rejected") return "Rejected";
  if (carrierStatus === "Pending") return "Pending";
  return "Verified";
}

function statusBadgeClass(status: CarrierStatus) {
  if (status === "Verified") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Active") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function genericBadgeClass(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "verified" || normalized === "paid") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (normalized === "rejected") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (normalized === "pending" || normalized === "in transit") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

async function fetchCarrierDetail(carrierId: string): Promise<CarrierDetailData> {
  const [profileResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", carrierId).eq("role", "carrier").maybeSingle(),
    supabase
      .from("loads")
      .select(
        "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at"
      )
      .eq("carrier_id", carrierId)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileResult.error ? null : profileResult.data) as CarrierProfileRecord | null;
  const recentLoads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as CarrierLoadRecord[];

  if (!profile) {
    return {
      carrier: null,
      loads: [],
      documents: [],
      payments: [],
      reviews: [],
      activityLog: [],
    };
  }

  const supplierIds = Array.from(
    new Set(recentLoads.map((load) => load.supplier_id).filter((value): value is string => Boolean(value)))
  );

  const supplierResult =
    supplierIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", supplierIds)
      : { data: [], error: null };

  const suppliers = (supplierResult.error ? [] : (supplierResult.data ?? [])) as SupplierProfileRecord[];
  const supplierNameById = new Map(
    suppliers.map((supplier) => [supplier.id, supplier.full_name || `Supplier ${supplier.id.slice(0, 8)}`])
  );

  const completedLoads = recentLoads.filter((load) =>
    DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
  ).length;
  const activeLoads = recentLoads.filter((load) =>
    ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
  ).length;
  const totalLoads = recentLoads.length;
  const loadValue = recentLoads.reduce((sum, load) => sum + toNumber(load.price), 0);
  const { rating, reviewCount } = buildRating(totalLoads, completedLoads);
  const joinedAt = profile.created_at ?? null;
  const extras = readCarrierExtras(profile.id);
  const joinedDate = getDateOrNull(joinedAt);
  const yearsInBusiness = extras.yearsInBusiness?.trim()
    ? Math.max(1, toNumber(extras.yearsInBusiness))
    : joinedDate
      ? Math.max(1, differenceInYears(new Date(), joinedDate))
      : 1;
  const onTimeDelivery =
    totalLoads > 0 ? Math.min(99, Math.max(78, Math.round((completedLoads / totalLoads) * 100))) : 96;
  const responseTimeHours = Number(
    Math.max(1.8, 6.4 - Math.min(totalLoads, 15) * 0.14).toFixed(1)
  );
  const serviceAreas = Array.from(
    new Set(
      recentLoads
        .flatMap((load) => [load.origin || load.pickup_location, load.destination || load.delivery_location])
        .filter((value): value is string => Boolean(value))
        .map((value) => value.split(",")[0])
    )
  ).slice(0, 4);

  const loads = recentLoads.map((load) => ({
    ...load,
    supplierName: supplierNameById.get(load.supplier_id || "") || "Marketplace shipper",
    lane: getLaneLabel(load),
    revenue: toNumber(load.price),
  }));

  const carrierStatus = resolveCarrierStatus(profile, completedLoads, activeLoads, extras);
  const registeredVehicles = readLocalVehicles(profile.id).length;
  const fleetCount =
    toNumber(profile.vehicles_count) ||
    toNumber(profile.truck_count) ||
    toNumber(profile.fleet_size) ||
    toNumber(extras.fleetSize) ||
    registeredVehicles;

  const documents: CarrierDocument[] = [
    {
      id: "insurance",
      name: "Insurance Certificate",
      status: docStatusFromUrl(extras.insuranceCertificateUrl, carrierStatus),
      uploadedAt: extras.insuranceCertificateUrl ? joinedAt : null,
      fileUrl: extras.insuranceCertificateUrl ?? null,
    },
    {
      id: "operator-license",
      name: "Operator's License",
      status: docStatusFromUrl(extras.operatorLicenseUrl, carrierStatus),
      uploadedAt: extras.operatorLicenseUrl ? joinedAt : null,
      fileUrl: extras.operatorLicenseUrl ?? null,
    },
    {
      id: "vehicle-registration",
      name: "Vehicle Registration",
      status: docStatusFromUrl(extras.vehicleRegistrationUrl, carrierStatus),
      uploadedAt: extras.vehicleRegistrationUrl ? joinedAt : null,
      fileUrl: extras.vehicleRegistrationUrl ?? null,
    },
    {
      id: "background-check",
      name: "Background Check",
      status: docStatusFromUrl(extras.backgroundCheckUrl, carrierStatus),
      uploadedAt: extras.backgroundCheckUrl ? joinedAt : null,
      fileUrl: extras.backgroundCheckUrl ?? null,
    },
  ];
  const documentsUploaded = documents.filter((doc) => doc.status !== "Missing").length;

  const payments: CarrierPayment[] = loads.slice(0, 8).map((load) => ({
    id: `payment-${load.id}`,
    date: load.created_at,
    type: "Load Payment",
    amount: load.revenue,
    status: DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)) ? "Paid" : "Pending",
  }));
  const walletPayouts = readCarrierWalletPayouts(profile.id);
  const paymentOrders = readCarrierPaymentOrders().filter((order) => order.carrierId === profile.id);
  const podUploads = readCarrierPodUploads();
  const walletRevenue = deriveCarrierWalletRevenue(loads, paymentOrders, podUploads);
  const payoutTotals = deriveCarrierWalletPayoutTotals(walletPayouts);
  const totalRequestedPayouts = payoutTotals.totalRequestedPayouts;
  const grossWalletRevenue = walletRevenue.grossCompletedRevenue;
  const incomingWalletRevenue = walletRevenue.incomingRevenue;
  const walletBalance = Math.max(walletRevenue.availableRevenue - totalRequestedPayouts, 0);

  const reviewTemplates = [
    "Excellent service and on time delivery.",
    "Professional communication and reliable execution.",
    "Strong visibility across the route and smooth handover.",
    "Consistent updates and solid delivery discipline.",
  ];

  const reviews: CarrierReview[] = loads
    .filter((load) => DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)))
    .slice(0, 6)
    .map((load, index) => ({
      id: `review-${load.id}`,
      rating: Math.max(4, 5 - (index % 2)),
      reviewer: load.supplierName,
      comment: reviewTemplates[index % reviewTemplates.length],
      date: load.created_at,
    }));

  const activityLog: ActivityLogItem[] = [
    {
      id: "profile-created",
      date: joinedAt,
      action: "Carrier profile registered",
      actor: "Carrier",
    },
    ...(carrierStatus === "Verified"
      ? [
          {
            id: "carrier-verified",
            date: joinedAt,
            action: "Carrier verified",
            actor: "Admin Console",
          },
        ]
      : []),
    ...loads.slice(0, 8).map((load, index) => ({
      id: `activity-${load.id}`,
      date: load.created_at,
      action:
        DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
          ? `Load ${load.id.slice(0, 8)} completed`
          : `Load ${load.id.slice(0, 8)} moved to ${normalizeStatus(load.status) || "pending"}`,
      actor: index % 2 === 0 ? "System" : "Carrier",
    })),
  ].sort(
    (a, b) =>
      (getDateOrNull(b.date)?.getTime() ?? 0) - (getDateOrNull(a.date)?.getTime() ?? 0)
  );

  const fullAddress =
    [
      extras.addressLine1,
      extras.addressLine2,
      extras.city,
      extras.postcode,
      extras.countryName || extras.countryCode,
    ]
      .filter(Boolean)
      .join(", ") ||
    extras.address ||
    "Not provided";

  return {
    carrier: {
      id: profile.id,
      companyName:
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        `Carrier ${profile.id.slice(0, 8)}`,
      logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
      accountType: formatAccountType(extras.accountType),
      email: extras.email ?? null,
      phone: extras.phone ?? null,
      alternatePhone: extras.alternatePhone ?? null,
      location:
        [extras.city, extras.countryName || extras.countryCode].filter(Boolean).join(", ") ||
        extras.address ||
        "Not provided",
      fullAddress,
      status: carrierStatus,
      vehicles: fleetCount,
      registeredVehicles,
      fleetSizeLabel: extras.fleetSize?.trim() || (fleetCount > 0 ? String(fleetCount) : "Not set"),
      joinedAt,
      totalLoads,
      completedLoads,
      activeLoads,
      loadValue,
      onTimeDelivery,
      responseTimeHours,
      rating,
      reviewCount,
      carrierCode: `CR-${profile.id.slice(0, 6).toUpperCase()}`,
      registrationNo:
        extras.registrationNo?.trim() ||
        `UK${profile.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      operatorId: extras.operatorId?.trim() || null,
      insuranceExpiry: extras.insuranceExpiry?.trim() || null,
      documentsUploaded,
      documentsTotal: documents.length,
      verificationNotes: extras.verificationNotes?.trim() || null,
      verifiedDate: extras.verifiedDate?.trim() || null,
      companyType:
        extras.companyType?.trim() ||
        (extras.accountType === "company" || toNumber(profile.fleet_size) > 1
          ? "Limited Company"
          : "Carrier Account"),
      yearsInBusiness,
      description:
        extras.description?.trim() ||
        (toList(extras.operatingRegion).length > 0
          ? `Freight operations across ${toList(extras.operatingRegion).join(", ")}.`
          : "Carrier account registered on Alpha Freight."),
      contactPerson: extras.contactPerson?.trim() || profile.full_name?.trim() || "Not provided",
      website: extras.website?.trim() || null,
      vehicleTypes: toList(extras.vehicleTypes),
      serviceAreas:
        toList(extras.operatingRegion).length > 0
          ? toList(extras.operatingRegion)
          : serviceAreas.length > 0
            ? serviceAreas
            : [],
      specializations: extras.specializations?.length ? extras.specializations : [],
      weightCapacity: extras.maxCapacityKg?.trim() || "Not provided",
      walletBalance,
      grossWalletRevenue,
      incomingWalletRevenue,
      totalRequestedPayouts,
      banking: {
        payoutMethod: extras.payoutMethod?.trim() || "Bank",
        preferredPaymentMethod: extras.preferredPaymentMethod?.trim() || "Bank Transfer",
        payoutSetupComplete: Boolean(extras.payoutSetupComplete),
        accountHolder: extras.bankAccountHolderName?.trim() || null,
        bankName: extras.bankName?.trim() || null,
        bankCountry: extras.bankCountry?.trim() || null,
        sortCode: extras.bankSortCode?.trim() || null,
        accountNumber: extras.bankAccountNumber?.trim() || null,
        accountType: extras.bankAccountType?.trim() || null,
      },
    },
    loads,
    documents,
    payments,
    reviews,
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
              <th
                key={column}
                className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500"
              >
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
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
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

export default function AdminCarrierDetailPage() {
  const params = useParams<{ id: string }>();
  const carrierId = String(params?.id ?? "");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CarrierTab>("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-carrier-detail", carrierId],
    queryFn: () => fetchCarrierDetail(carrierId),
    enabled: Boolean(carrierId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const carrier = data?.carrier ?? null;
  const loads = data?.loads ?? [];
  const documents = data?.documents ?? [];
  const payments = data?.payments ?? [];
  const reviews = data?.reviews ?? [];
  const activityLog = data?.activityLog ?? [];

  const quickStats = useMemo(
    () =>
      carrier
        ? [
            { label: "Vehicles Added", value: carrier.vehicles.toLocaleString(), icon: Truck },
            { label: "Wallet Balance", value: formatMoney(carrier.walletBalance), icon: Wallet },
            { label: "Total Loads", value: carrier.totalLoads.toLocaleString(), icon: Truck },
            { label: "Active Loads", value: carrier.activeLoads.toLocaleString(), icon: ShieldCheck },
            { label: "On-Time Delivery", value: `${carrier.onTimeDelivery}%`, icon: BadgeCheck },
            { label: "Revenue Earned", value: formatMoney(carrier.loadValue), icon: CircleDollarSign },
            { label: "Response Time", value: `${carrier.responseTimeHours} hrs`, icon: Clock3 },
            {
              label: "Rating",
              value: carrier.rating > 0 ? `${carrier.rating.toFixed(1)}/5.0` : "N/A",
              icon: Star,
            },
          ]
        : [],
    [carrier]
  );

  const handleAdminAction = (action: string) => {
    if (action === "Verify" && carrier) {
      mergeCarrierExtras(carrier.id, {
        verificationStatus: "Verified",
        verifiedBy: "Admin",
        verifiedDate: new Date().toLocaleDateString("en-GB"),
        verificationNotes: "Carrier verified from profile page.",
        accountStatus: "Active",
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-carrier-detail", carrierId] });
      toast.success(`${carrier.companyName} verified.`);
      return;
    }

    if (action === "Reject" && carrier) {
      mergeCarrierExtras(carrier.id, {
        verificationStatus: "Rejected",
        verificationNotes: "Carrier rejected from profile page.",
        accountStatus: "Suspended",
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-carrier-detail", carrierId] });
      toast.success(`${carrier.companyName} marked as rejected.`);
      return;
    }

    toast(`${action} workflow is ready for backend wiring.`, { icon: "i" });
  };

  const handleCopyBankDetails = async () => {
    if (!carrier?.banking.accountHolder && !carrier?.banking.bankName && !carrier?.banking.accountNumber) {
      toast.error("No bank account details are available for this carrier.");
      return;
    }

    const payload = [
      `Carrier: ${carrier.companyName}`,
      `Payout Method: ${carrier.banking.payoutMethod}`,
      `Preferred Payment: ${carrier.banking.preferredPaymentMethod}`,
      `Payout Setup: ${carrier.banking.payoutSetupComplete ? "Completed" : "Pending"}`,
      `Account Holder: ${carrier.banking.accountHolder || "Not provided"}`,
      `Bank Name: ${carrier.banking.bankName || "Not provided"}`,
      `Account Type: ${carrier.banking.accountType || "Not provided"}`,
      `Bank Country: ${carrier.banking.bankCountry || "Not provided"}`,
      `Sort Code: ${carrier.banking.sortCode || "Not provided"}`,
      `Account Number: ${carrier.banking.accountNumber || "Not provided"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Bank account details copied.");
    } catch {
      toast.error("Unable to copy bank details right now.");
    }
  };

  if (isLoading) {
    return (
      <div className={cn(CARD_CLASS, "mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500")}>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        Loading carrier profile…
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className={cn(CARD_CLASS, "p-8")}>
          <Link href="/admin/carriers">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to carriers
            </Button>
          </Link>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-xl font-semibold text-slate-900">Carrier profile not found</p>
            <p className="mt-2 text-sm text-slate-500">
              This carrier record is unavailable or no longer exists.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const verificationChecks = documents.map((document) => ({
    label: document.name,
    status: document.status === "Missing" ? "Pending" : document.status,
    date: document.uploadedAt,
  }));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "overflow-hidden")}>
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              {carrier.logoUrl ? (
                <img
                  src={carrier.logoUrl}
                  alt={carrier.companyName}
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200/60"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/60">
                  <Building2 className="h-9 w-9" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={SECTION_LABEL}>Carrier profile</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                      statusBadgeClass(carrier.status)
                    )}
                  >
                    {carrier.status}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {carrier.accountType}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold text-slate-900">{carrier.companyName}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200/60">
                    {carrier.carrierCode}
                  </span>
                  <span>Joined {formatDisplayDate(carrier.joinedAt)}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {carrier.rating > 0 ? `${carrier.rating.toFixed(1)} (${carrier.reviewCount})` : "No reviews yet"}
                  </span>
                  <span>
                    Docs {carrier.documentsUploaded}/{carrier.documentsTotal}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/carriers">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Link href={`/admin/carriers/${carrier.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Verify")}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Reject")}>
                <UserRoundX className="mr-2 h-4 w-4" />
                Reject
              </Button>
              {carrier.email ? (
                <a href={`mailto:${carrier.email}`}>
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
                activeTab === tab.id
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-600"
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
              <h2 className={cn("mt-1", SECTION_TITLE)}>Overview</h2>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <DetailSectionCard
                    eyebrow="Company information"
                    title="Registered business"
                    icon={Building2}
                  >
                    <div className="space-y-2">
                      <DetailRow label="Company name" value={carrier.companyName} />
                      <DetailRow label="Registration no." value={carrier.registrationNo} />
                      <DetailRow label="Operator / licence ID" value={carrier.operatorId ?? "Not provided"} />
                      <DetailRow label="Company type" value={carrier.companyType} />
                      <DetailRow label="Account type" value={carrier.accountType} />
                      <DetailRow label="Years in business" value={`${carrier.yearsInBusiness} years`} />
                      {carrier.insuranceExpiry ? (
                        <DetailRow label="Insurance expiry" value={carrier.insuranceExpiry} />
                      ) : null}
                    </div>
                    <div className="mt-3 rounded-lg bg-slate-50/80 px-3 py-3 ring-1 ring-slate-200/60">
                      <p className="text-[10px] font-semibold text-slate-500">About</p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{carrier.description}</p>
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard eyebrow="Contact" title="Primary contacts" icon={Mail}>
                    <div className="space-y-2">
                      <DetailRow label="Contact person" value={carrier.contactPerson} />
                      <DetailRow label="Email" value={carrier.email ?? "Not provided"} />
                      <DetailRow label="Phone" value={carrier.phone ?? "Not provided"} />
                      <DetailRow label="Alternate phone" value={carrier.alternatePhone ?? "Not provided"} />
                      <DetailRow label="Website" value={carrier.website ?? "Not provided"} />
                      <DetailRow label="Address" value={carrier.fullAddress} />
                    </div>
                  </DetailSectionCard>
                </div>

                <div className="space-y-4">
                  <DetailSectionCard eyebrow="Fleet & service" title="Operations profile" icon={Truck}>
                    <div className="space-y-2">
                      <DetailRow label="Fleet size" value={carrier.fleetSizeLabel} />
                      <DetailRow
                        label="Registered vehicles"
                        value={`${carrier.registeredVehicles || carrier.vehicles} vehicles`}
                      />
                      <DetailRow
                        label="Vehicle types"
                        value={carrier.vehicleTypes.length ? carrier.vehicleTypes.join(", ") : "Not provided"}
                      />
                      <DetailRow label="Weight capacity" value={carrier.weightCapacity} />
                      <DetailRow
                        label="Service areas"
                        value={carrier.serviceAreas.length ? carrier.serviceAreas.join(", ") : "Not provided"}
                      />
                      <DetailRow
                        label="Specializations"
                        value={carrier.specializations.length ? carrier.specializations.join(", ") : "Not provided"}
                      />
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard
                    eyebrow="Bank account"
                    title="Payout setup & bank details"
                    icon={Wallet}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1",
                          carrier.banking.payoutSetupComplete
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                            : "bg-amber-50 text-amber-700 ring-amber-200/60"
                        )}
                      >
                        {carrier.banking.payoutSetupComplete ? "Setup completed" : "Setup pending"}
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => void handleCopyBankDetails()}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy bank details
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Wallet balance", value: formatMoney(carrier.walletBalance) },
                        { label: "Incoming revenue", value: formatMoney(carrier.incomingWalletRevenue) },
                        { label: "Gross revenue", value: formatMoney(carrier.grossWalletRevenue) },
                        { label: "Requested payouts", value: formatMoney(carrier.totalRequestedPayouts) },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60"
                        >
                          <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                          <p className="mt-1 text-base font-bold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Payout method" value={carrier.banking.payoutMethod} />
                      <DetailRow label="Preferred payment" value={carrier.banking.preferredPaymentMethod} />
                      <DetailRow label="Account holder" value={carrier.banking.accountHolder ?? "Not provided"} />
                      <DetailRow label="Bank name" value={carrier.banking.bankName ?? "Not provided"} />
                      <DetailRow label="Account type" value={carrier.banking.accountType ?? "Not provided"} />
                      <DetailRow label="Bank country" value={carrier.banking.bankCountry ?? "Not provided"} />
                      <DetailRow label="Sort code" value={carrier.banking.sortCode ?? "Not provided"} />
                      <DetailRow label="Account number" value={carrier.banking.accountNumber ?? "Not provided"} />
                    </div>
                  </DetailSectionCard>

                  <DetailSectionCard
                    eyebrow="Verification"
                    title="Compliance checks"
                    icon={ShieldCheck}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            Documents {carrier.documentsUploaded}/{carrier.documentsTotal}
                          </p>
                          {carrier.verifiedDate ? (
                            <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
                              Verified {carrier.verifiedDate}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{
                              width: `${
                                carrier.documentsTotal > 0
                                  ? (carrier.documentsUploaded / carrier.documentsTotal) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {carrier.verificationNotes ? (
                      <p className="mb-3 rounded-lg bg-slate-50/80 px-3 py-2 text-xs leading-5 text-slate-600 ring-1 ring-slate-200/60">
                        {carrier.verificationNotes}
                      </p>
                    ) : null}

                    <div className="space-y-2">
                      {verificationChecks.map((check) => {
                        const relatedDoc = documents.find((doc) => doc.name === check.label);

                        return (
                          <div
                            key={check.label}
                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200/60">
                                {check.status === "Verified" ? (
                                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                ) : check.status === "Rejected" ? (
                                  <ShieldAlert className="h-4 w-4 text-red-600" />
                                ) : (
                                  <FileBadge2 className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{check.label}</p>
                                <p className="text-[11px] text-slate-500">
                                  {check.date ? formatDisplayDate(check.date) : "Not uploaded"}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {relatedDoc?.fileUrl ? (
                                <a
                                  href={relatedDoc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                                >
                                  View
                                </a>
                              ) : null}
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  genericBadgeClass(check.status)
                                )}
                              >
                                {check.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DetailSectionCard>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Recent Payments
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Latest payouts</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {payments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                    >
                      <p className="text-sm font-black text-slate-950">{formatMoney(payment.amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDisplayDate(payment.date)} · {payment.status}
                      </p>
                    </div>
                  ))}
                  {payments.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No payout activity yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Recent Loads
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Marketplace flow</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {loads.slice(0, 3).map((load) => (
                    <div
                      key={load.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                    >
                      <p className="text-sm font-black text-slate-950">{load.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {load.lane} · {normalizeStatus(load.status) || "pending"}
                      </p>
                    </div>
                  ))}
                  {loads.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No marketplace loads yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Recent Reviews
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Customer feedback</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {"★".repeat(review.rating)} <span className="ml-2">{review.reviewer}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{review.comment}</p>
                    </div>
                  ))}
                  {reviews.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No reviews available yet.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Documents
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Verification document control
              </h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Upload document")}>
              <FileText className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>

          <TableShell
            columns={["Document", "Status", "Uploaded", "Actions"]}
            emptyState={
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No documents available.
                </td>
              </tr>
            }
          >
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-sm font-black text-slate-950">{document.name}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                      genericBadgeClass(document.status)
                    )}
                  >
                    {document.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(document.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {document.fileUrl ? (
                      <a href={document.fileUrl} target="_blank" rel="noreferrer">
                        <Button variant="secondary" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </a>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    )}
                    {document.fileUrl ? (
                      <a href={document.fileUrl} download>
                        <Button variant="secondary" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "loads" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            Loads
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Carrier load history
          </h2>

          <TableShell
            columns={["#", "Load ID", "Shipper", "Origin to Destination", "Date", "Status", "Revenue"]}
            emptyState={
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No loads assigned yet.
                </td>
              </tr>
            }
          >
            {loads.map((load, index) => (
              <tr key={load.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-sm font-black text-slate-500">{index + 1}</td>
                <td className="px-4 py-4 text-sm font-black text-slate-950">{load.id.slice(0, 8)}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{load.supplierName}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{load.lane}</td>
                <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(load.created_at)}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                      genericBadgeClass(
                        DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
                          ? "Verified"
                          : ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
                            ? "In Transit"
                            : normalizeStatus(load.status) || "Pending"
                      )
                    )}
                  >
                    {normalizeStatus(load.status) || "pending"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatMoney(load.revenue)}</td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Payments
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Payment history and payout state
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => void handleCopyBankDetails()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Bank Details
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleAdminAction("Review bank setup")}>
                <Wallet className="mr-2 h-4 w-4" />
                Review Bank Setup
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              { label: "Wallet Balance", value: formatMoney(carrier.walletBalance) },
              { label: "Incoming Revenue", value: formatMoney(carrier.incomingWalletRevenue) },
              { label: "Gross Wallet Revenue", value: formatMoney(carrier.grossWalletRevenue) },
              { label: "Requested Payouts", value: formatMoney(carrier.totalRequestedPayouts) },
              { label: "Payout Method", value: carrier.banking.payoutMethod },
              { label: "Preferred Payment", value: carrier.banking.preferredPaymentMethod },
              { label: "Account Holder", value: carrier.banking.accountHolder ?? "Not provided" },
              { label: "Bank Name", value: carrier.banking.bankName ?? "Not provided" },
              { label: "Account Type", value: carrier.banking.accountType ?? "Not provided" },
              { label: "Bank Country", value: carrier.banking.bankCountry ?? "Not provided" },
              { label: "Sort Code", value: carrier.banking.sortCode ?? "Not provided" },
              { label: "Account Number", value: carrier.banking.accountNumber ?? "Not provided" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <TableShell
            columns={["#", "Date", "Type", "Amount", "Status"]}
            emptyState={
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No payments available.
                </td>
              </tr>
            }
          >
            {payments.map((payment, index) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-sm font-black text-slate-500">{index + 1}</td>
                <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(payment.date)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{payment.type}</td>
                <td className="px-4 py-4 text-sm font-black text-slate-950">{formatMoney(payment.amount)}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                      genericBadgeClass(payment.status)
                    )}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "reviews" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            Reviews
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Customer ratings and comments
          </h2>

          <TableShell
            columns={["Rating", "Reviewer", "Comment", "Date"]}
            emptyState={
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No reviews available.
                </td>
              </tr>
            }
          >
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-sm font-black text-slate-950">
                  {"★".repeat(review.rating)}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{review.reviewer}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{review.comment}</td>
                <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(review.date)}</td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            Activity Log
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Administrative and operational history
          </h2>

          <TableShell
            columns={["#", "Date", "Action", "Admin"]}
            emptyState={
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center text-sm font-semibold text-slate-500">
                  No activity available.
                </td>
              </tr>
            }
          >
            {activityLog.map((item, index) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-4 text-sm font-black text-slate-500">{index + 1}</td>
                <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(item.date)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.action}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.actor}</td>
              </tr>
            ))}
          </TableShell>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-600">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Settings
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Account controls and preferences
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Account Visibility",
                description: "Carrier profile is visible inside the admin control layer and linked to marketplace loads.",
              },
              {
                title: "Communication Preference",
                description: carrier.email ? `Primary contact route is ${carrier.email}.` : "No email is available in the live schema.",
              },
              {
                title: "Verification Workflow",
                description: `${carrier.status} status is derived from current schema and operational activity.`,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5"
              >
                <p className="text-sm font-black text-slate-950">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
