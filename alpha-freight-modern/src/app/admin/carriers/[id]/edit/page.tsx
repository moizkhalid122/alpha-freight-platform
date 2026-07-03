"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { differenceInYears, format } from "date-fns";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  FileBadge2,
  Globe,
  ImagePlus,
  Info,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  ShieldX,
  Star,
  Trash2,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeCarrierExtras, readCarrierExtras } from "@/lib/profile-extras";
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
type EditTab = "business" | "contact" | "verification" | "performance" | "activity";

type ActivityLogItem = {
  id: string;
  date: string | null;
  action: string;
  actor: string;
};

type CarrierEditData = {
  id: string;
  carrierCode: string;
  status: CarrierStatus;
  companyName: string;
  registrationNo: string;
  companyType: string;
  yearsInBusiness: string;
  description: string;
  servicesOffered: string[];
  fleetSize: string;
  vehicleTypes: string[];
  weightCapacity: string;
  serviceAreas: string[];
  specializations: string[];
  logoUrl: string | null;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  verificationStatus: "Verified" | "Pending" | "Rejected";
  verifiedBy: string;
  verifiedDate: string;
  verificationNotes: string;
  insuranceCertificateUrl: string | null;
  operatorLicenseUrl: string | null;
  vehicleRegistrationUrl: string | null;
  backgroundCheckUrl: string | null;
  totalLoads: number;
  onTimeDelivery: number;
  revenueEarned: number;
  rating: number;
  accountStatus: "Active" | "Inactive" | "Suspended";
  preferredPaymentMethod: string;
  paymentTerms: string;
  internalNotes: string;
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

const SERVICE_OPTIONS = ["FTL", "LTL", "Refrigerated", "Express", "Cross-Dock", "Dedicated Fleet"];
const VEHICLE_TYPE_OPTIONS = ["Curtain-sider", "Refrigerated", "Box Truck", "Flatbed", "Tanker", "Tail Lift"];
const SERVICE_AREA_OPTIONS = ["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Glasgow"];
const SPECIALIZATION_OPTIONS = ["Food", "Pharmaceuticals", "Retail", "Automotive", "General Freight", "High Value"];
const COMPANY_TYPE_OPTIONS = ["Limited Company", "Sole Trader", "Partnership", "Carrier Account"];
const COUNTRY_OPTIONS = ["United Kingdom", "Ireland", "Germany", "France", "Netherlands"];
const PAYMENT_METHOD_OPTIONS = ["Bank Transfer", "Direct Debit", "Wallet Credit"];
const PAYMENT_TERMS_OPTIONS = ["7 days", "14 days", "30 days"];
const ACCOUNT_STATUS_OPTIONS = ["Active", "Inactive", "Suspended"] as const;
const VERIFICATION_STATUS_OPTIONS = ["Verified", "Pending", "Rejected"] as const;

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

function toStringList(value: string | string[] | null | undefined, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  const parsed = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string | null | undefined) {
  return value ? format(new Date(value), "dd/MM/yyyy") : "Not available";
}

function formatMoney(value: number) {
  return `GBP ${Math.round(value).toLocaleString()}`;
}

function resolveCarrierStatus(
  profile: CarrierProfileRecord,
  completedLoads: number,
  activeLoads: number
): CarrierStatus {
  const verificationStatus = normalizeStatus(profile.verification_status);
  const profileStatus = normalizeStatus(profile.status);

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

function statusBadgeClass(status: CarrierStatus | "Inactive" | "Suspended") {
  if (status === "Verified") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Rejected" || status === "Suspended") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Active") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Inactive") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Selected file could not be processed."));
    reader.readAsDataURL(file);
  });
}

async function fetchCarrierEditData(carrierId: string): Promise<CarrierEditData | null> {
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
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as CarrierLoadRecord[];

  if (!profile) {
    return null;
  }

  const supplierIds = Array.from(
    new Set(loads.map((load) => load.supplier_id).filter((value): value is string => Boolean(value)))
  );
  const supplierResult =
    supplierIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", supplierIds)
      : { data: [], error: null };
  const suppliers = (supplierResult.error ? [] : (supplierResult.data ?? [])) as SupplierProfileRecord[];
  const supplierNameById = new Map(suppliers.map((item) => [item.id, item.full_name || "Marketplace shipper"]));

  const extras = readCarrierExtras(carrierId);
  const totalLoads = loads.length;
  const completedLoads = loads.filter((load) => DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))).length;
  const activeLoads = loads.filter((load) => ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))).length;
  const revenueEarned = loads.reduce((sum, load) => sum + toNumber(load.price), 0);
  const onTimeDelivery =
    totalLoads > 0 ? Math.min(99, Math.max(78, Math.round((completedLoads / totalLoads) * 100))) : 96;
  const rating = totalLoads > 0 ? Math.min(5, Number((3.8 + (completedLoads / Math.max(totalLoads, 1)) * 1.2).toFixed(1))) : 4.8;
  const joinedDate = getDateOrNull(profile.created_at);
  const yearsInBusiness = extras.yearsInBusiness?.trim()
    ? extras.yearsInBusiness
    : String(joinedDate ? Math.max(1, differenceInYears(new Date(), joinedDate)) : 8);
  const derivedStatus = resolveCarrierStatus(profile, completedLoads, activeLoads);
  const recentActivity: ActivityLogItem[] = [
    ...loads.slice(0, 4).map((load, index) => ({
      id: `load-${load.id}`,
      date: load.created_at,
      action:
        DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
          ? `Load ${load.id.slice(0, 8)} completed`
          : `${supplierNameById.get(load.supplier_id || "") || "Marketplace shipper"} shipment updated`,
      actor: index === 0 ? "System" : "Carrier",
    })),
    {
      id: "verified",
      date: extras.verifiedDate ?? profile.created_at ?? null,
      action: derivedStatus === "Verified" ? "Carrier verified" : "Carrier verification pending",
      actor: extras.verifiedBy ?? "Admin - Khalid",
    },
  ].sort((a, b) => (getDateOrNull(b.date)?.getTime() ?? 0) - (getDateOrNull(a.date)?.getTime() ?? 0));

  return {
    id: profile.id,
    carrierCode: `CR-${profile.id.slice(0, 4).toUpperCase()}`,
    status: derivedStatus,
    companyName:
      extras.companyName?.trim() || profile.company_name?.trim() || profile.full_name?.trim() || "Carrier Account",
    registrationNo:
      extras.registrationNo?.trim() ||
      `UK${profile.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    companyType:
      extras.companyType?.trim() ||
      (extras.accountType === "company" || toNumber(profile.fleet_size) > 1 ? "Limited Company" : "Carrier Account"),
    yearsInBusiness,
    description:
      extras.description?.trim() ||
      "Specializing in temperature-controlled and scheduled freight movements across key UK lanes.",
    servicesOffered: extras.servicesOffered?.length ? extras.servicesOffered : ["FTL", "LTL", "Refrigerated"],
    fleetSize:
      extras.fleetSize?.trim() ||
      String(
        toNumber(profile.vehicles_count) || toNumber(profile.truck_count) || toNumber(profile.fleet_size) || 12
      ),
    vehicleTypes: toStringList(extras.vehicleTypes, ["Curtain-sider", "Refrigerated"]),
    weightCapacity: extras.maxCapacityKg?.trim() || "18,000 kg",
    serviceAreas: toStringList(extras.operatingRegion, ["London", "Manchester", "Birmingham"]),
    specializations: extras.specializations?.length ? extras.specializations : ["Food", "Pharmaceuticals", "Retail"],
    logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
    contactPerson: extras.contactPerson?.trim() || profile.full_name?.trim() || "John Smith",
    email: extras.email?.trim() || "john@swifthaulage.com",
    phone: extras.phone?.trim() || "+44 161 987 6543",
    alternatePhone: extras.alternatePhone?.trim() || "+44 161 987 6544",
    website: extras.website?.trim() || "www.swifthaulage.com",
    addressLine1: extras.addressLine1?.trim() || "45 Industrial Park",
    addressLine2: extras.addressLine2?.trim() || "Unit 3",
    city: extras.city?.trim() || "Manchester",
    postcode: extras.postcode?.trim() || "M1 1ET",
    country: extras.countryName?.trim() || "United Kingdom",
    verificationStatus:
      (extras.verificationStatus as "Verified" | "Pending" | "Rejected" | undefined) ||
      (derivedStatus === "Active" ? "Pending" : derivedStatus),
    verifiedBy: extras.verifiedBy?.trim() || "Admin - Khalid",
    verifiedDate: extras.verifiedDate?.trim() || formatDisplayDate(profile.created_at),
    verificationNotes: extras.verificationNotes?.trim() || "All documents verified",
    insuranceCertificateUrl: extras.insuranceCertificateUrl ?? null,
    operatorLicenseUrl: extras.operatorLicenseUrl ?? null,
    vehicleRegistrationUrl: extras.vehicleRegistrationUrl ?? null,
    backgroundCheckUrl: extras.backgroundCheckUrl ?? null,
    totalLoads,
    onTimeDelivery,
    revenueEarned,
    rating,
    accountStatus:
      (extras.accountStatus as "Active" | "Inactive" | "Suspended" | undefined) || "Active",
    preferredPaymentMethod: extras.preferredPaymentMethod?.trim() || "Bank Transfer",
    paymentTerms: extras.paymentTerms?.trim() || "7 days",
    internalNotes: extras.internalNotes?.trim() || "",
    activityLog: recentActivity,
  };
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-bold transition-all",
        active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"
      )}
    >
      {label}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none transition-all",
          readOnly
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-200 focus:bg-white"
        )}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectChips({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              )}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadTile({
  label,
  value,
  onUpload,
}: {
  label: string;
  value: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {value ? "Current file attached" : "No file uploaded yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
        >
          <Upload className="h-4 w-4" />
          {value ? "Replace" : "Upload"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}

export default function AdminCarrierEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const carrierId = String(params?.id ?? "");
  const [activeTab, setActiveTab] = useState<EditTab>("business");
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<CarrierEditData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-carrier-edit", carrierId],
    queryFn: () => fetchCarrierEditData(carrierId),
    enabled: Boolean(carrierId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const current = formState ?? data ?? null;

  if (data && !formState) {
    queueMicrotask(() => setFormState(data));
  }

  const updateField = <K extends keyof CarrierEditData>(key: K, value: CarrierEditData[K]) => {
    setFormState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleArrayValue = (
    key: "servicesOffered" | "vehicleTypes" | "serviceAreas" | "specializations",
    value: string
  ) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const nextValues = prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value];
      return { ...prev, [key]: nextValues };
    });
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field:
      | "logoUrl"
      | "insuranceCertificateUrl"
      | "operatorLicenseUrl"
      | "vehicleRegistrationUrl"
      | "backgroundCheckUrl"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const value = file.type.startsWith("image/")
        ? await readFileAsDataUrl(file)
        : `uploaded:${file.name}`;
      updateField(field, value as CarrierEditData[typeof field]);
      toast.success(`${file.name} attached successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to attach selected file.");
    }
  };

  const handleSave = async () => {
    if (!current) return;

    try {
      setIsSaving(true);

      const updatePayload = {
        full_name: current.contactPerson.trim() || null,
        company_name: current.companyName.trim() || null,
        fleet_size: current.fleetSize.trim() || null,
        status: current.accountStatus.toLowerCase(),
        verification_status: current.verificationStatus.toLowerCase(),
        is_approved:
          current.verificationStatus === "Verified"
            ? true
            : current.verificationStatus === "Rejected"
              ? false
              : null,
      };

      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", current.id);
      if (error) throw error;

      mergeCarrierExtras(current.id, {
        companyName: current.companyName,
        registrationNo: current.registrationNo,
        companyType: current.companyType,
        yearsInBusiness: current.yearsInBusiness,
        description: current.description,
        servicesOffered: current.servicesOffered,
        fleetSize: current.fleetSize,
        vehicleTypes: current.vehicleTypes,
        maxCapacityKg: current.weightCapacity,
        operatingRegion: current.serviceAreas,
        specializations: current.specializations,
        logoUrl: current.logoUrl,
        contactPerson: current.contactPerson,
        email: current.email,
        phone: current.phone,
        alternatePhone: current.alternatePhone,
        website: current.website,
        addressLine1: current.addressLine1,
        addressLine2: current.addressLine2,
        address: [current.addressLine1, current.addressLine2, current.city, current.postcode, current.country]
          .filter(Boolean)
          .join(", "),
        city: current.city,
        postcode: current.postcode,
        countryName: current.country,
        countryCode: current.country === "United Kingdom" ? "GB" : current.country,
        verificationStatus: current.verificationStatus,
        verifiedBy: current.verifiedBy,
        verifiedDate: current.verifiedDate,
        verificationNotes: current.verificationNotes,
        insuranceCertificateUrl: current.insuranceCertificateUrl,
        operatorLicenseUrl: current.operatorLicenseUrl,
        vehicleRegistrationUrl: current.vehicleRegistrationUrl,
        backgroundCheckUrl: current.backgroundCheckUrl,
        accountStatus: current.accountStatus,
        preferredPaymentMethod: current.preferredPaymentMethod,
        paymentTerms: current.paymentTerms,
        internalNotes: current.internalNotes,
      });

      toast.success("Carrier updates saved successfully.");
      router.push(`/admin/carriers/${current.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save carrier updates.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/carriers/${carrierId}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1660px] rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <p className="text-sm font-semibold text-slate-500">Loading edit carrier page...</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-[1660px] rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <p className="text-2xl font-black tracking-tight text-slate-950">Carrier not found</p>
        <p className="mt-3 text-sm text-slate-500">This carrier record is unavailable in the current dataset.</p>
      </div>
    );
  }

  const tabItems: Array<{ id: EditTab; label: string }> = [
    { id: "business", label: "Business Info" },
    { id: "contact", label: "Contact" },
    { id: "verification", label: "Verification" },
    { id: "performance", label: "Performance" },
    { id: "activity", label: "Log" },
  ];

  return (
    <div className="mx-auto max-w-[1660px] space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(191,255,7,0.16),_transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] bg-slate-100 text-slate-700 shadow-sm">
                {current.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.logoUrl} alt={current.companyName} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-9 w-9" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Edit Carrier</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                      statusBadgeClass(current.status)
                    )}
                  >
                    {current.status}
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Edit Carrier - {current.companyName}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600 shadow-sm">
                    {current.carrierCode}
                  </span>
                  <span>Verified Date {current.verifiedDate}</span>
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
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Link href={`/admin/carriers/${current.id}`}>
                <Button variant="secondary" size="sm">
                  View Profile
                </Button>
              </Link>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-6 py-4">
          {tabItems.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </section>

      {activeTab === "business" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Business Information</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Company details, services, and fleet setup</h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <InputField label="Company Name *" value={current.companyName} onChange={(value) => updateField("companyName", value)} />
                <InputField label="Company Registration No. *" value={current.registrationNo} onChange={(value) => updateField("registrationNo", value)} />
                <SelectField label="Company Type" value={current.companyType} options={COMPANY_TYPE_OPTIONS} onChange={(value) => updateField("companyType", value)} />
                <InputField label="Years in Business" value={current.yearsInBusiness} onChange={(value) => updateField("yearsInBusiness", value)} />
                <InputField label="Fleet Size *" value={current.fleetSize} onChange={(value) => updateField("fleetSize", value)} />
                <InputField label="Weight Capacity *" value={current.weightCapacity} onChange={(value) => updateField("weightCapacity", value)} />
                <div className="lg:col-span-2">
                  <TextAreaField
                    label="Description"
                    value={current.description}
                    onChange={(value) => updateField("description", value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <UploadTile label="Company Logo" value={current.logoUrl} onUpload={(event) => void handleFileUpload(event, "logoUrl")} />
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 space-y-5">
                <MultiSelectChips
                  label="Services Offered"
                  options={SERVICE_OPTIONS}
                  values={current.servicesOffered}
                  onToggle={(value) => toggleArrayValue("servicesOffered", value)}
                />
                <MultiSelectChips
                  label="Vehicle Types"
                  options={VEHICLE_TYPE_OPTIONS}
                  values={current.vehicleTypes}
                  onToggle={(value) => toggleArrayValue("vehicleTypes", value)}
                />
                <MultiSelectChips
                  label="Service Areas"
                  options={SERVICE_AREA_OPTIONS}
                  values={current.serviceAreas}
                  onToggle={(value) => toggleArrayValue("serviceAreas", value)}
                />
                <MultiSelectChips
                  label="Specializations"
                  options={SPECIALIZATION_OPTIONS}
                  values={current.specializations}
                  onToggle={(value) => toggleArrayValue("specializations", value)}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "contact" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Contact and Location</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Contact person, communication, and location details</h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Contact Person *" value={current.contactPerson} onChange={(value) => updateField("contactPerson", value)} />
                <InputField label="Email *" value={current.email} onChange={(value) => updateField("email", value)} />
                <InputField label="Phone *" value={current.phone} onChange={(value) => updateField("phone", value)} />
                <InputField label="Alternative Phone" value={current.alternatePhone} onChange={(value) => updateField("alternatePhone", value)} />
                <div className="md:col-span-2">
                  <InputField label="Website" value={current.website} onChange={(value) => updateField("website", value)} />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Address Line 1 *" value={current.addressLine1} onChange={(value) => updateField("addressLine1", value)} />
                <InputField label="Address Line 2" value={current.addressLine2} onChange={(value) => updateField("addressLine2", value)} />
                <InputField label="City *" value={current.city} onChange={(value) => updateField("city", value)} />
                <InputField label="Postcode *" value={current.postcode} onChange={(value) => updateField("postcode", value)} />
                <div className="md:col-span-2">
                  <SelectField label="Country *" value={current.country} options={COUNTRY_OPTIONS} onChange={(value) => updateField("country", value)} />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "verification" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Verification and Documents</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Verification state, documents, and admin notes</h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4">
                <SelectField
                  label="Verification Status"
                  value={current.verificationStatus}
                  options={VERIFICATION_STATUS_OPTIONS}
                  onChange={(value) => updateField("verificationStatus", value as CarrierEditData["verificationStatus"])}
                />
                <InputField label="Verified By" value={current.verifiedBy} readOnly />
                <InputField label="Verified Date" value={current.verifiedDate} readOnly />
                <TextAreaField
                  label="Verification Notes"
                  value={current.verificationNotes}
                  onChange={(value) => updateField("verificationNotes", value)}
                  rows={5}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <UploadTile
                label="Insurance Certificate"
                value={current.insuranceCertificateUrl}
                onUpload={(event) => void handleFileUpload(event, "insuranceCertificateUrl")}
              />
              <UploadTile
                label="Operator's License"
                value={current.operatorLicenseUrl}
                onUpload={(event) => void handleFileUpload(event, "operatorLicenseUrl")}
              />
              <UploadTile
                label="Vehicle Registration"
                value={current.vehicleRegistrationUrl}
                onUpload={(event) => void handleFileUpload(event, "vehicleRegistrationUrl")}
              />
              <UploadTile
                label="Background Check"
                value={current.backgroundCheckUrl}
                onUpload={(event) => void handleFileUpload(event, "backgroundCheckUrl")}
              />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "performance" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Performance and Settings</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Operational metrics, account controls, and internal notes</h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {[
                { label: "Total Loads", value: current.totalLoads.toLocaleString(), icon: Truck },
                { label: "On-Time Delivery", value: `${current.onTimeDelivery}%`, icon: Check },
                { label: "Revenue Earned", value: formatMoney(current.revenueEarned), icon: Wallet },
                { label: "Rating", value: `${current.rating.toFixed(1)}/5.0`, icon: Star },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Account Status"
                  value={current.accountStatus}
                  options={ACCOUNT_STATUS_OPTIONS}
                  onChange={(value) => updateField("accountStatus", value as CarrierEditData["accountStatus"])}
                />
                <SelectField
                  label="Preferred Payment Method"
                  value={current.preferredPaymentMethod}
                  options={PAYMENT_METHOD_OPTIONS}
                  onChange={(value) => updateField("preferredPaymentMethod", value)}
                />
                <div className="md:col-span-2">
                  <SelectField
                    label="Payment Terms"
                    value={current.paymentTerms}
                    options={PAYMENT_TERMS_OPTIONS}
                    onChange={(value) => updateField("paymentTerms", value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextAreaField
                    label="Internal Notes"
                    value={current.internalNotes}
                    onChange={(value) => updateField("internalNotes", value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Activity Log</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Recent actions made to this carrier account</h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  {["#", "Date", "Action", "Admin"].map((column) => (
                    <th key={column} className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {current.activityLog.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 text-sm font-black text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDisplayDate(item.date)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.action}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{item.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-slate-950">Save, cancel, or continue reviewing this carrier account</p>
              <p className="mt-1 text-sm text-slate-500">
                `View Profile` opens the live carrier detail page. `Delete Carrier` stays in placeholder mode until backend workflow is approved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Link href={`/admin/carriers/${current.id}`}>
              <Button variant="secondary">
                View Profile
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => toast("Delete workflow is ready for backend wiring.", { icon: "i" })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Carrier
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
