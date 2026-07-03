"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileBadge2,
  Filter,
  Grid2X2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  Table2,
  Trash2,
  Truck,
  UserRound,
  UserRoundX,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeCarrierExtras, readCarrierExtras, resolveCarrierExtras, type CarrierProfileExtras } from "@/lib/profile-extras";
import { readLocalVehicles } from "@/lib/carrier-vehicle-storage";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-data-client";

type DateRangeValue = "all" | "7d" | "30d" | "90d";
type StatusFilterValue = "all" | "verified" | "pending" | "rejected" | "active";
type SortValue = "name" | "date" | "status" | "loads_completed";
type ViewMode = "table" | "grid";

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
  profile_extras?: unknown;
};

type LoadRecord = {
  id: string;
  carrier_id: string | null;
  status: string | null;
  created_at: string | null;
};

type CarrierStatus = "Verified" | "Pending" | "Rejected" | "Active";

type CarrierRow = {
  id: string;
  carrierCode: string;
  companyName: string;
  logoUrl: string | null;
  contactPerson: string;
  accountType: string;
  contactEmail: string | null;
  phone: string | null;
  location: string;
  registrationNo: string;
  companyType: string;
  fleetSize: string;
  vehicleTypes: string[];
  serviceAreas: string[];
  yearsInBusiness: string;
  registeredVehicles: number;
  documentsUploaded: number;
  documentsTotal: number;
  status: CarrierStatus;
  vehicles: number;
  loadsCompleted: number;
  totalLoads: number;
  activeLoads: number;
  rating: number;
  reviewCount: number;
  joinedAt: string | null;
};

type CarriersOverview = {
  rows: CarrierRow[];
  stats: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    active: number;
    newThisWeek: number;
  };
};

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-xl font-bold text-slate-900";

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

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "active", label: "Active" },
];

const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const sortOptions = [
  { value: "date", label: "Newest first" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "loads_completed", label: "Loads completed" },
];

const rowsPerPageOptions = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];

function toList(value: string | string[] | null | undefined, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  const parsed = String(value ?? "")
    .split(/[,;|/]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

function isLikelyRegionOrVehicleLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length < 2) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^[A-Z]{1,2}\d[\dA-Z]?\s?\d[\dA-Z]{2}$/i.test(trimmed)) return false;
  return true;
}

function toDisplayList(value: string | string[] | null | undefined) {
  return toList(value, []).filter(isLikelyRegionOrVehicleLabel);
}

function formatYearsLabel(value: string) {
  if (!value || value === "—" || value === "-") return null;
  const years = toNumber(value);
  if (years <= 0) return null;
  return `${years} yrs in business`;
}

function buildDocumentProgress(extras: CarrierProfileExtras) {
  const documents = [
    extras.insuranceCertificateUrl,
    extras.operatorLicenseUrl,
    extras.vehicleRegistrationUrl,
    extras.backgroundCheckUrl,
  ];

  const uploaded = documents.filter((url) => Boolean(String(url ?? "").trim())).length;
  return { uploaded, total: documents.length };
}

function formatAccountType(value: string | null | undefined) {
  const normalized = normalizeStatus(value);
  if (normalized === "company") return "Company";
  if (normalized === "individual") return "Individual";
  return value?.trim() || "Carrier";
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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

async function fetchCarriers(): Promise<CarriersOverview> {
  const [profilesResponse, loadsResponse] = await Promise.all([
    adminFetch<{ profiles: CarrierProfileRecord[] }>("/api/admin/profiles?role=carrier"),
    adminFetch<{ loads: LoadRecord[] }>("/api/admin/loads"),
  ]);

  const profiles = profilesResponse.profiles ?? [];
  const loads = (loadsResponse.loads ?? []).filter((load) => load.carrier_id);

  const loadGroups = new Map<string, LoadRecord[]>();
  loads.forEach((load) => {
    if (!load.carrier_id) return;
    const current = loadGroups.get(load.carrier_id) ?? [];
    current.push(load);
    loadGroups.set(load.carrier_id, current);
  });

  const rows = profiles.map((profile) => {
    const extras = resolveCarrierExtras(profile.id, profile.profile_extras);
    const carrierLoads = loadGroups.get(profile.id) ?? [];
    const completedLoads = carrierLoads.filter((load) =>
      DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
    ).length;
    const activeLoads = carrierLoads.filter((load) =>
      ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
    ).length;
    const status = resolveCarrierStatus(profile, completedLoads, activeLoads, extras);
    const { rating, reviewCount } = buildRating(carrierLoads.length, completedLoads);
    const { uploaded, total } = buildDocumentProgress(extras);
    const registeredVehicles = readLocalVehicles(profile.id).length;
    const fleetFromExtras = toNumber(extras.fleetSize);
    const fleetFromProfile =
      toNumber(profile.vehicles_count) ||
      toNumber(profile.truck_count) ||
      toNumber(profile.fleet_size);
    const vehicleCount = fleetFromProfile || fleetFromExtras || registeredVehicles;

    return {
      id: profile.id,
      carrierCode: `CR-${profile.id.slice(0, 6).toUpperCase()}`,
      companyName:
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        `Carrier ${profile.id.slice(0, 8)}`,
      logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
      contactPerson:
        extras.contactPerson?.trim() || profile.full_name?.trim() || "Not provided",
      accountType: formatAccountType(extras.accountType),
      contactEmail: extras.email ?? null,
      phone: extras.phone ?? null,
      location:
        [extras.city, extras.postcode, extras.countryName || extras.countryCode]
          .filter(Boolean)
          .join(", ") ||
        extras.address ||
        "Not provided",
      registrationNo:
        extras.registrationNo?.trim() ||
        extras.operatorId?.trim() ||
        "Not provided",
      companyType: extras.companyType?.trim() || formatAccountType(extras.accountType),
      fleetSize:
        extras.fleetSize?.trim() ||
        (vehicleCount > 0 ? String(vehicleCount) : "Not set"),
      vehicleTypes: toDisplayList(extras.vehicleTypes),
      serviceAreas: toDisplayList(extras.operatingRegion),
      yearsInBusiness: extras.yearsInBusiness?.trim() || "—",
      registeredVehicles,
      documentsUploaded: uploaded,
      documentsTotal: total,
      status,
      vehicles: vehicleCount,
      loadsCompleted: completedLoads,
      totalLoads: carrierLoads.length,
      activeLoads,
      rating,
      reviewCount,
      joinedAt: profile.created_at ?? null,
    } satisfies CarrierRow;
  });

  const weekStart = startOfDay(subDays(new Date(), 6));

  return {
    rows,
    stats: {
      total: rows.length,
      verified: rows.filter((row) => row.status === "Verified").length,
      pending: rows.filter((row) => row.status === "Pending").length,
      rejected: rows.filter((row) => row.status === "Rejected").length,
      active: rows.filter((row) => row.status === "Active").length,
      newThisWeek: rows.filter((row) => {
        const joinedAt = getDateOrNull(row.joinedAt);
        return joinedAt && joinedAt >= weekStart;
      }).length,
    },
  };
}

function statusBadgeClass(status: CarrierStatus) {
  if (status === "Verified") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Active") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function selectStyles() {
  return {
    control: () =>
      "flex min-h-10 items-center rounded-xl bg-slate-50/80 px-3 ring-1 ring-slate-200/60",
    menu: () => "mt-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200/60",
    option: ({ isFocused }: { isFocused: boolean }) =>
      `cursor-pointer rounded-lg px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
    placeholder: () => "text-sm text-slate-400",
    singleValue: () => "text-sm font-semibold text-slate-900",
  };
}

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <span className="text-xs text-slate-400">{emptyLabel}</span>;
  }

  const visible = items.slice(0, 2);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <span
          key={item}
          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
        >
          {item}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}

function CarrierAvatar({ row }: { row: CarrierRow }) {
  if (row.logoUrl) {
    return (
      <img
        src={row.logoUrl}
        alt={row.companyName}
        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/60"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/60">
      <Building2 className="h-5 w-5" />
    </div>
  );
}

function CarrierActionButtons({
  row,
  onVerify,
  onUnsupportedAction,
}: {
  row: CarrierRow;
  onVerify: (carrier: CarrierRow) => void;
  onUnsupportedAction: (action: string, carrier: CarrierRow) => void;
}) {
  const actions = [
    { key: "verify", label: "Verify Carrier", icon: ShieldCheck },
    { key: "reject", label: "Reject Carrier", icon: UserRoundX },
    { key: "delete", label: "Delete Carrier", icon: Trash2 },
  ] as const;

  return (
    <div className="flex flex-col gap-1.5">
      <Link
        href={`/admin/carriers/${row.id}`}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <Eye className="h-3.5 w-3.5" />
        View profile
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/carriers/${row.id}/edit`}
          title="Edit"
          aria-label="Edit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 transition-all hover:bg-slate-50 hover:text-slate-900"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.key}
              type="button"
              title={action.label}
              aria-label={action.label}
              onClick={() =>
                action.key === "verify" ? onVerify(row) : onUnsupportedAction(action.key, row)
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminCarriersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [dateRangeFilter, setDateRangeFilter] = useState(dateRangeOptions[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["admin-carriers"],
    queryFn: fetchCarriers,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    active: 0,
    newThisWeek: 0,
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    const result = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.companyName.toLowerCase().includes(term) ||
        row.carrierCode.toLowerCase().includes(term) ||
        row.contactPerson.toLowerCase().includes(term) ||
        row.registrationNo.toLowerCase().includes(term) ||
        (row.contactEmail ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term) ||
        row.location.toLowerCase().includes(term) ||
        row.vehicleTypes.some((item) => item.toLowerCase().includes(term)) ||
        row.serviceAreas.some((item) => item.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter.value === "all" ||
        row.status.toLowerCase() === statusFilter.value;

      const joinedAt = getDateOrNull(row.joinedAt);
      const matchesDate =
        dateRangeFilter.value === "all" ||
        (joinedAt &&
          joinedAt >=
            startOfDay(
              subDays(
                now,
                dateRangeFilter.value === "7d"
                  ? 6
                  : dateRangeFilter.value === "30d"
                    ? 29
                    : 89
              )
            ));

      return Boolean(matchesSearch && matchesStatus && matchesDate);
    });

    return [...result].sort((a, b) => {
      if (sortBy.value === "name") {
        return a.companyName.localeCompare(b.companyName);
      }

      if (sortBy.value === "status") {
        return a.status.localeCompare(b.status);
      }

      if (sortBy.value === "loads_completed") {
        return b.loadsCompleted - a.loadsCompleted;
      }

      return (getDateOrNull(b.joinedAt)?.getTime() ?? 0) - (getDateOrNull(a.joinedAt)?.getTime() ?? 0);
    });
  }, [dateRangeFilter.value, rows, search, sortBy.value, statusFilter.value]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage.value));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage.value;
    return filteredRows.slice(start, start + rowsPerPage.value);
  }, [filteredRows, page, rowsPerPage.value]);

  const allVisibleSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !paginatedRows.some((row) => row.id === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...paginatedRows.map((row) => row.id)]),
    ]);
  };

  const toggleRowSelection = (carrierId: string) => {
    setSelectedIds((current) =>
      current.includes(carrierId)
        ? current.filter((id) => id !== carrierId)
        : [...current, carrierId]
    );
  };

  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carriers"] });
  };

  const exportRows = (targetRows: CarrierRow[], fileLabel: string) => {
    if (targetRows.length === 0) {
      toast.error("No carriers selected for export.");
      return;
    }

    const csvRows = [
      [
        "#",
        "Carrier Code",
        "Company Name",
        "Account Type",
        "Contact Person",
        "Email",
        "Phone",
        "Location",
        "Registration No",
        "Company Type",
        "Fleet Size",
        "Vehicle Types",
        "Service Areas",
        "Years In Business",
        "Registered Vehicles",
        "Documents",
        "Status",
        "Loads Completed",
        "Active Loads",
        "Rating",
        "Joined",
      ],
      ...targetRows.map((row, index) => [
        String(index + 1),
        row.carrierCode,
        row.companyName,
        row.accountType,
        row.contactPerson,
        row.contactEmail ?? "Not provided",
        row.phone ?? "Not provided",
        row.location,
        row.registrationNo,
        row.companyType,
        row.fleetSize,
        row.vehicleTypes.join("; ") || "Not set",
        row.serviceAreas.join("; ") || "Not set",
        row.yearsInBusiness,
        String(row.registeredVehicles),
        `${row.documentsUploaded}/${row.documentsTotal}`,
        row.status,
        String(row.loadsCompleted),
        String(row.activeLoads),
        row.rating > 0 ? `${row.rating} (${row.reviewCount})` : "N/A",
        row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown",
      ]),
    ];

    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUnsupportedAction = (action: string, carrier: CarrierRow) => {
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    toast(`${actionLabel} workflow for ${carrier.companyName} is ready for backend wiring.`, {
      icon: "i",
    });
  };

  const verifyCarrier = async (carrier: CarrierRow) => {
    mergeCarrierExtras(carrier.id, {
      verificationStatus: "Verified",
      verifiedBy: "Admin - Khalid",
      verifiedDate: new Date().toLocaleDateString("en-GB"),
      verificationNotes: "Carrier verified from the all carriers control page.",
      accountStatus: "Active",
    });
  };

  const handleVerifyCarrier = async (carrier: CarrierRow) => {
    try {
      await verifyCarrier(carrier);
      toast.success(`${carrier.companyName} verified successfully.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-carriers"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify carrier.");
    }
  };

  const handleBulkAction = (action: "verify" | "delete" | "export") => {
    if (action === "export") {
      exportRows(selectedRows, "admin-carriers-selected");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Select at least one carrier first.");
      return;
    }

    if (action === "delete") {
      toast("Delete selected workflow is ready for backend wiring.", {
        icon: "i",
      });
      return;
    }

    void (async () => {
      try {
        await Promise.all(selectedRows.map((carrier) => verifyCarrier(carrier)));
        toast.success("Selected carriers verified successfully.");
        await queryClient.invalidateQueries({ queryKey: ["admin-carriers"] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to verify selected carriers.");
      }
    })();
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>All carriers</p>
              <h2 className={SECTION_TITLE}>Carrier directory &amp; operations control</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Onboarding profile, fleet, documents, and load performance — sab carrier se li gayi details yahan dikhti hain.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/carriers/pending-verifications">
              <Button variant="secondary" size="sm">
                <FileBadge2 className="mr-2 h-4 w-4" />
                Pending queue
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportRows(filteredRows, "admin-carriers-all")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/admin/carriers/add">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add carrier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading carrier records…
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { label: "Total carriers", value: stats.total.toLocaleString(), icon: Users, tone: "text-slate-900" },
          { label: "Verified", value: stats.verified.toLocaleString(), icon: ShieldCheck, tone: "text-emerald-700" },
          { label: "Active now", value: stats.active.toLocaleString(), icon: Truck, tone: "text-blue-700" },
          { label: "Pending", value: stats.pending.toLocaleString(), icon: CalendarRange, tone: "text-amber-700" },
          { label: "Rejected", value: stats.rejected.toLocaleString(), icon: UserRoundX, tone: "text-red-700" },
          { label: "New this week", value: stats.newThisWeek.toLocaleString(), icon: UserRound, tone: "text-violet-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(CARD_CLASS, "relative overflow-hidden p-4")}>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">{item.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tracking-tight", item.tone)}>{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className={cn(CARD_CLASS, "p-6")}>
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search company, contact, reg no, vehicle type, or region"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:w-[860px]">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(option) => {
                setStatusFilter(option ?? statusOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <Select
              options={dateRangeOptions}
              value={dateRangeFilter}
              onChange={(option) => {
                setDateRangeFilter(option ?? dateRangeOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(option) => {
                setSortBy(option ?? sortOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-1 ring-1 ring-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                  viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
              >
                <Table2 className="h-4 w-4" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
              >
                <Grid2X2 className="h-4 w-4" />
                Grid
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {allVisibleSelected ? "Clear visible" : "Select all visible"}
          </button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("verify")}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("delete")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
          <span className="ml-auto rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/60">
            {selectedIds.length} selected · {filteredRows.length} shown
          </span>
        </div>

        {viewMode === "table" ? (
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-8" />
                  <col className="w-[19%]" />
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>
                    <th className="px-2 py-2.5 text-[11px] font-semibold text-slate-500">#</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Carrier</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Contact</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Business</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Fleet &amp; regions</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Docs</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Status</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Performance</th>
                    <th className="sticky right-0 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold text-slate-500 shadow-[-4px_0_8px_rgba(15,23,42,0.04)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedRows.map((row, index) => {
                    const yearsLabel = formatYearsLabel(row.yearsInBusiness);

                    return (
                    <tr key={row.id} className="group border-t border-slate-100 align-top hover:bg-slate-50/60">
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-2 py-3 align-top text-xs font-medium text-slate-500">
                        {(page - 1) * rowsPerPage.value + index + 1}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <CarrierAvatar row={row} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/carriers/${row.id}`}
                              className="block truncate font-semibold text-slate-900 hover:text-emerald-700"
                              title={row.companyName}
                            >
                              {row.companyName}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-slate-500">{row.carrierCode}</p>
                            <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {row.accountType}
                            </span>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="truncate text-sm font-medium text-slate-800" title={row.contactPerson}>
                          {row.contactPerson}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500" title={row.contactEmail ?? undefined}>
                          {row.contactEmail ?? "—"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{row.phone ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="truncate text-sm font-medium text-slate-700" title={row.registrationNo}>
                          {row.registrationNo}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{row.companyType}</p>
                        <p className="mt-1 flex items-start gap-1 text-xs text-slate-500" title={row.location}>
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{row.location}</span>
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-sm font-semibold text-slate-800">
                          Fleet {row.fleetSize}
                          {row.registeredVehicles > 0 ? (
                            <span className="font-normal text-slate-500"> · {row.registeredVehicles} reg.</span>
                          ) : null}
                        </p>
                        <div className="mt-1.5">
                          <ChipList items={row.vehicleTypes} emptyLabel="Types not set" />
                        </div>
                        <div className="mt-1.5">
                          <ChipList items={row.serviceAreas} emptyLabel="Regions not set" />
                        </div>
                        {yearsLabel ? <p className="mt-1 text-[11px] text-slate-500">{yearsLabel}</p> : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-sm font-semibold text-slate-800">
                          {row.documentsUploaded}/{row.documentsTotal}
                        </p>
                        <div className="mt-1.5 h-1.5 w-full max-w-[72px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${row.documentsTotal > 0 ? (row.documentsUploaded / row.documentsTotal) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            statusBadgeClass(row.status)
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-sm font-semibold text-slate-800">{row.loadsCompleted} done</p>
                        <p className="text-xs text-slate-500">{row.activeLoads} active</p>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {row.rating > 0 ? row.rating.toFixed(1) : "No rating"}
                        </div>
                      </td>
                      <td className="sticky right-0 bg-white px-3 py-3 align-top shadow-[-4px_0_8px_rgba(15,23,42,0.04)] group-hover:bg-slate-50/60">
                        <CarrierActionButtons
                          row={row}
                          onVerify={(carrier) => void handleVerifyCarrier(carrier)}
                          onUnsupportedAction={handleUnsupportedAction}
                        />
                      </td>
                    </tr>
                  );
                  })}
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <Filter className="h-6 w-6" />
                          </div>
                          <p className="mt-4 text-lg font-semibold text-slate-900">
                            No carriers match the current filters
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Adjust search, status, date range, or sort to see more rows.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {paginatedRows.map((row, index) => (
              <div
                key={row.id}
                className="relative overflow-hidden rounded-xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <CarrierAvatar row={row} />
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        #{((page - 1) * rowsPerPage.value + index + 1).toString()} · {row.carrierCode}
                      </p>
                      <Link
                        href={`/admin/carriers/${row.id}`}
                        className="mt-1 block text-lg font-semibold text-slate-900 hover:text-emerald-700"
                      >
                        {row.companyName}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.accountType} · {row.companyType}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      statusBadgeClass(row.status)
                    )}
                  >
                    {row.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-[10px] font-semibold text-slate-500">Contact</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">{row.contactPerson}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{row.contactEmail ?? "—"}</p>
                    <p className="text-xs text-slate-500">{row.phone ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-[10px] font-semibold text-slate-500">Business</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">{row.registrationNo}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.location}</p>
                    {formatYearsLabel(row.yearsInBusiness) ? (
                      <p className="text-xs text-slate-500">{formatYearsLabel(row.yearsInBusiness)}</p>
                    ) : null}
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-[10px] font-semibold text-slate-500">Fleet</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      Size {row.fleetSize}
                      {row.registeredVehicles > 0 ? ` · ${row.registeredVehicles} registered` : ""}
                    </p>
                    <div className="mt-2">
                      <ChipList items={row.vehicleTypes} emptyLabel="Not set" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className="text-[10px] font-semibold text-slate-500">Coverage &amp; docs</p>
                    <div className="mt-2">
                      <ChipList items={row.serviceAreas} emptyLabel="Regions not set" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Documents {row.documentsUploaded}/{row.documentsTotal}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 sm:col-span-2">
                    <p className="text-[10px] font-semibold text-slate-500">Performance</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                      <span>{row.loadsCompleted} completed</span>
                      <span>{row.activeLoads} active</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {row.rating > 0 ? row.rating.toFixed(1) : "No rating"}
                      </span>
                      <span className="text-xs text-slate-500">
                        Joined {row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <CarrierActionButtons
                    row={row}
                    onVerify={(carrier) => void handleVerifyCarrier(carrier)}
                    onUnsupportedAction={handleUnsupportedAction}
                  />
                  <Link
                    href={`/admin/carriers/${row.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
            {paginatedRows.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
                <p className="text-lg font-semibold text-slate-900">No carriers match the current filters</p>
                <p className="mt-2 text-sm text-slate-500">
                  Adjust search, filters, or sort settings to load more cards.
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50/80 px-4 py-4 ring-1 ring-slate-200/60 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredRows.length === 0 ? 0 : (page - 1) * rowsPerPage.value + 1}-
                {Math.min(page * rowsPerPage.value, filteredRows.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-900">{filteredRows.length}</span>
            </p>
            <Select
              options={rowsPerPageOptions}
              value={rowsPerPage}
              onChange={(option) => {
                setRowsPerPage(option ?? rowsPerPageOptions[1]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              const visibleStart = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNumber = visibleStart + index;
              if (pageNumber > totalPages) return null;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={cn(
                    "h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-all",
                    page === pageNumber
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200/60"
                  )}
                >
                  {pageNumber}
                </button>
              );
            })}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
