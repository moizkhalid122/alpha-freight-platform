"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
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
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readCarrierExtras, writeCarrierExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type ViewMode = "table" | "grid";
type SortValue = "name" | "rating" | "loads_completed" | "joined_date";
type ActiveState = "Active" | "Inactive";

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

type LoadRecord = {
  id: string;
  carrier_id: string | null;
  status: string | null;
  created_at: string | null;
};

type VerifiedCarrierRow = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  city: string;
  country: string;
  location: string;
  vehicleTypes: string[];
  serviceAreas: string[];
  loadsCompleted: number;
  totalLoads: number;
  rating: number;
  reviewCount: number;
  joinedAt: string | null;
  activeState: ActiveState;
  vehicles: number;
  documentsAvailable: number;
};

type VerifiedCarriersOverview = {
  rows: VerifiedCarrierRow[];
  stats: {
    totalVerified: number;
    activeThisWeek: number;
    topRated: number;
    highVolume: number;
    newThisMonth: number;
  };
  filters: {
    serviceAreas: string[];
    vehicleTypes: string[];
  };
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

const ratingOptions = [
  { value: "all", label: "All ratings" },
  { value: "4.8", label: "4.8+" },
  { value: "4.5", label: "4.5+" },
  { value: "4.0", label: "4.0+" },
];

const loadsOptions = [
  { value: "all", label: "All loads" },
  { value: "500", label: "500+ loads" },
  { value: "250", label: "250+ loads" },
  { value: "100", label: "100+ loads" },
];

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "rating", label: "Rating" },
  { value: "loads_completed", label: "Loads Completed" },
  { value: "joined_date", label: "Joined Date" },
];

const rowsPerPageOptions = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-xl font-bold text-slate-900";

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

function toList(value: string | string[] | null | undefined, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  const parsed = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
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
  if (items.length === 0) return <span className="text-xs text-slate-400">{emptyLabel}</span>;
  const visible = items.slice(0, 2);
  const remaining = items.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <span key={item} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{item}</span>
      ))}
      {remaining > 0 ? <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">+{remaining}</span> : null}
    </div>
  );
}

function activeBadgeClass(status: ActiveState) {
  return status === "Active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

async function fetchVerifiedCarriers(): Promise<VerifiedCarriersOverview> {
  const [profilesResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "carrier").order("created_at", { ascending: false }),
    supabase
      .from("loads")
      .select("id, carrier_id, status, created_at")
      .not("carrier_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as CarrierProfileRecord[];
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as LoadRecord[];

  const loadGroups = new Map<string, LoadRecord[]>();
  loads.forEach((load) => {
    if (!load.carrier_id) return;
    const current = loadGroups.get(load.carrier_id) ?? [];
    current.push(load);
    loadGroups.set(load.carrier_id, current);
  });

  const rows = profiles
    .map((profile) => {
      const extras = readCarrierExtras(profile.id);
      const isVerified =
        normalizeStatus(extras.verificationStatus) === "verified" ||
        normalizeStatus(profile.verification_status) === "verified" ||
        normalizeStatus(profile.status) === "verified" ||
        profile.is_approved === true;

      if (!isVerified) return null;

      const carrierLoads = loadGroups.get(profile.id) ?? [];
      const completedLoads = carrierLoads.filter((load) =>
        DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))
      ).length;
      const activeLoads = carrierLoads.filter((load) =>
        ACTIVE_LOAD_STATUSES.has(normalizeStatus(load.status))
      ).length;
      const { rating, reviewCount } = buildRating(carrierLoads.length, completedLoads);
      const vehicleTypes = toList(extras.vehicleTypes, ["Curtain-sider"]);
      const serviceAreas = toList(extras.operatingRegion, ["London", "Manchester"]);
      const city = extras.city?.trim() || "Unknown";
      const country = extras.countryName?.trim() || extras.countryCode?.trim() || "GB";
      const documentsAvailable = [
        extras.insuranceCertificateUrl,
        extras.operatorLicenseUrl,
        extras.vehicleRegistrationUrl,
        extras.backgroundCheckUrl,
      ].filter(Boolean).length;

      return {
        id: profile.id,
        companyName:
          extras.companyName?.trim() ||
          profile.company_name?.trim() ||
          profile.full_name?.trim() ||
          `Carrier ${profile.id.slice(0, 8)}`,
        logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
        contactEmail: extras.email ?? null,
        phone: extras.phone ?? null,
        city,
        country,
        location: `${city}, ${country}`,
        vehicleTypes,
        serviceAreas,
        loadsCompleted: completedLoads,
        totalLoads: carrierLoads.length,
        rating,
        reviewCount,
        joinedAt: profile.created_at ?? null,
        activeState:
          normalizeStatus(extras.accountStatus) === "inactive" ||
          normalizeStatus(extras.accountStatus) === "suspended"
            ? "Inactive"
            : activeLoads > 0
              ? "Active"
              : "Inactive",
        vehicles:
          toNumber(profile.vehicles_count) ||
          toNumber(profile.truck_count) ||
          toNumber(profile.fleet_size) ||
          toNumber(extras.fleetSize),
        documentsAvailable,
      } satisfies VerifiedCarrierRow;
    })
    .filter(Boolean) as VerifiedCarrierRow[];

  const weekStart = startOfDay(subDays(new Date(), 6));
  const monthStart = startOfDay(subDays(new Date(), 29));

  return {
    rows,
    stats: {
      totalVerified: rows.length,
      activeThisWeek: rows.filter((row) => {
        const joinedAt = getDateOrNull(row.joinedAt);
        return joinedAt && joinedAt >= weekStart;
      }).length,
      topRated: rows.filter((row) => row.rating >= 4.8).length,
      highVolume: rows.filter((row) => row.loadsCompleted >= 500).length,
      newThisMonth: rows.filter((row) => {
        const joinedAt = getDateOrNull(row.joinedAt);
        return joinedAt && joinedAt >= monthStart;
      }).length,
    },
    filters: {
      serviceAreas: Array.from(new Set(rows.flatMap((row) => row.serviceAreas))).sort(),
      vehicleTypes: Array.from(new Set(rows.flatMap((row) => row.vehicleTypes))).sort(),
    },
  };
}

function exportRows(targetRows: VerifiedCarrierRow[], fileLabel: string) {
  if (targetRows.length === 0) {
    toast.error("No carriers selected for export.");
    return;
  }

  const csvRows = [
    [
      "#",
      "Company Name",
      "Email",
      "Phone",
      "Location",
      "Services",
      "Loads Completed",
      "Rating",
      "Joined",
      "Status",
    ],
    ...targetRows.map((row, index) => [
      String(index + 1),
      row.companyName,
      row.contactEmail ?? "Not provided",
      row.phone ?? "Not provided",
      row.location,
      `${row.vehicleTypes.join(" / ")} | ${row.serviceAreas.join(" / ")}`,
      String(row.loadsCompleted),
      row.rating > 0 ? `${row.rating} (${row.reviewCount})` : "N/A",
      row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown",
      row.activeState,
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
}

function persistCarrierStatus(carrierId: string, nextState: ActiveState) {
  const extras = readCarrierExtras(carrierId);
  writeCarrierExtras(carrierId, {
    ...extras,
    accountStatus: nextState === "Active" ? "Active" : "Inactive",
  });
}

function VerifiedCarrierActionButtons({
  row,
  onStatusChange,
  onDelete,
  onDownloadDocuments,
  variant = "stacked",
}: {
  row: VerifiedCarrierRow;
  onStatusChange: (row: VerifiedCarrierRow) => void;
  onDelete: (row: VerifiedCarrierRow) => void;
  onDownloadDocuments: (row: VerifiedCarrierRow) => void;
  variant?: "stacked" | "compact";
}) {
  const iconClass =
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/carriers/${row.id}`}
          title="View profile"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-semibold text-white hover:bg-slate-800"
        >
          <Eye className="h-3 w-3" />
          View
        </Link>
        <Link href={`/admin/carriers/${row.id}/edit`} title="Edit" className={iconClass}>
          <Pencil className="h-3 w-3" />
        </Link>
        <button
          type="button"
          title={row.activeState === "Active" ? "Suspend" : "Unsuspend"}
          onClick={() => onStatusChange(row)}
          className={cn(iconClass, "hover:bg-amber-50 hover:text-amber-700")}
        >
          {row.activeState === "Active" ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        </button>
        <button type="button" title="Download docs" onClick={() => onDownloadDocuments(row)} className={iconClass}>
          <Download className="h-3 w-3" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(row)}
          className={cn(iconClass, "hover:bg-red-50 hover:text-red-700")}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Link
        href={`/admin/carriers/${row.id}`}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2.5 text-[11px] font-semibold text-white hover:bg-slate-800"
      >
        <Eye className="h-3.5 w-3.5" />
        View profile
      </Link>
      <div className="flex gap-1">
        <Link href={`/admin/carriers/${row.id}/edit`} title="Edit" className={cn(iconClass, "h-8 w-8")}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          title={row.activeState === "Active" ? "Suspend" : "Unsuspend"}
          onClick={() => onStatusChange(row)}
          className={cn(iconClass, "h-8 w-8 hover:bg-amber-50 hover:text-amber-700")}
        >
          {row.activeState === "Active" ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        </button>
        <button type="button" title="Download docs" onClick={() => onDownloadDocuments(row)} className={cn(iconClass, "h-8 w-8")}>
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(row)}
          className={cn(iconClass, "h-8 w-8 hover:bg-red-50 hover:text-red-700")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminVerifiedCarriersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [serviceAreaFilter, setServiceAreaFilter] = useState({ value: "all", label: "All service areas" });
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState({ value: "all", label: "All vehicle types" });
  const [ratingFilter, setRatingFilter] = useState(ratingOptions[0]);
  const [loadsFilter, setLoadsFilter] = useState(loadsOptions[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["admin-carriers-verified"],
    queryFn: fetchVerifiedCarriers,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    totalVerified: 0,
    activeThisWeek: 0,
    topRated: 0,
    highVolume: 0,
    newThisMonth: 0,
  };

  const serviceAreaOptions = useMemo(
    () => [
      { value: "all", label: "All service areas" },
      ...(data?.filters.serviceAreas ?? []).map((value) => ({ value, label: value })),
    ],
    [data?.filters.serviceAreas]
  );

  const vehicleTypeOptions = useMemo(
    () => [
      { value: "all", label: "All vehicle types" },
      ...(data?.filters.vehicleTypes ?? []).map((value) => ({ value, label: value })),
    ],
    [data?.filters.vehicleTypes]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.companyName.toLowerCase().includes(term) ||
        (row.contactEmail ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term) ||
        row.city.toLowerCase().includes(term);

      const matchesServiceArea =
        serviceAreaFilter.value === "all" || row.serviceAreas.includes(serviceAreaFilter.value);
      const matchesVehicleType =
        vehicleTypeFilter.value === "all" || row.vehicleTypes.includes(vehicleTypeFilter.value);
      const matchesRating =
        ratingFilter.value === "all" || row.rating >= Number(ratingFilter.value);
      const matchesLoads =
        loadsFilter.value === "all" || row.loadsCompleted >= Number(loadsFilter.value);

      return Boolean(
        matchesSearch && matchesServiceArea && matchesVehicleType && matchesRating && matchesLoads
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy.value === "name") {
        return a.companyName.localeCompare(b.companyName);
      }

      if (sortBy.value === "rating") {
        return b.rating - a.rating;
      }

      if (sortBy.value === "loads_completed") {
        return b.loadsCompleted - a.loadsCompleted;
      }

      return (getDateOrNull(b.joinedAt)?.getTime() ?? 0) - (getDateOrNull(a.joinedAt)?.getTime() ?? 0);
    });
  }, [
    loadsFilter.value,
    ratingFilter.value,
    rows,
    search,
    serviceAreaFilter.value,
    sortBy.value,
    vehicleTypeFilter.value,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage.value));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage.value;
    return filteredRows.slice(start, start + rowsPerPage.value);
  }, [filteredRows, page, rowsPerPage.value]);

  const allVisibleSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedIds.includes(row.id));

  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !paginatedRows.some((row) => row.id === id))
      );
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...paginatedRows.map((row) => row.id)])]);
  };

  const toggleRowSelection = (carrierId: string) => {
    setSelectedIds((current) =>
      current.includes(carrierId)
        ? current.filter((id) => id !== carrierId)
        : [...current, carrierId]
    );
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carriers-verified"] });
  };

  const handleStatusChange = async (row: VerifiedCarrierRow) => {
    const nextState: ActiveState = row.activeState === "Active" ? "Inactive" : "Active";

    try {
      persistCarrierStatus(row.id, nextState);
      toast.success(
        nextState === "Active"
          ? `${row.companyName} reactivated successfully.`
          : `${row.companyName} suspended successfully.`
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-carriers-verified"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update carrier status.");
    }
  };

  const handleDelete = (row: VerifiedCarrierRow) => {
    toast(`Delete workflow for ${row.companyName} is ready for backend wiring.`, { icon: "i" });
  };

  const handleDownloadDocuments = (row: VerifiedCarrierRow) => {
    const extras = readCarrierExtras(row.id);
    const documentCount = [
      extras.insuranceCertificateUrl,
      extras.operatorLicenseUrl,
      extras.vehicleRegistrationUrl,
      extras.backgroundCheckUrl,
    ].filter(Boolean).length;

    if (documentCount === 0) {
      toast.error("No verified documents are available for download.");
      return;
    }

    toast.success(`${documentCount} verified document references prepared for ${row.companyName}.`);
  };

  const handleBulkAction = (action: "export" | "suspend" | "delete") => {
    if (action === "export") {
      exportRows(selectedRows, "verified-carriers-selected");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Select at least one verified carrier first.");
      return;
    }

    if (action === "delete") {
      toast("Bulk delete workflow is ready for backend wiring.", { icon: "i" });
      return;
    }

    selectedRows.forEach((row) => persistCarrierStatus(row.id, "Inactive"));
    void queryClient.invalidateQueries({ queryKey: ["admin-carriers-verified"] });
    toast.success("Selected carriers suspended successfully.");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>Verified carriers</p>
              <h2 className={SECTION_TITLE}>Approved carrier directory</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Verified fleets with service coverage, load history, and active status management.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/carriers/pending-verifications">
              <Button variant="secondary" size="sm">Pending queue</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportRows(filteredRows, "verified-carriers-all")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/admin/carriers/add">
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add carrier</Button>
            </Link>
          </div>
        </div>
      </section>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading verified carriers…
        </div>
      ) : null}

      <section className={cn(CARD_CLASS, "p-6")}>
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search company, email, phone, or city"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:w-[860px]">
            <Select
              options={serviceAreaOptions}
              value={serviceAreaFilter}
              onChange={(option) => {
                setServiceAreaFilter(option ?? serviceAreaOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <Select
              options={vehicleTypeOptions}
              value={vehicleTypeFilter}
              onChange={(option) => {
                setVehicleTypeFilter(option ?? vehicleTypeOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <Select
              options={ratingOptions}
              value={ratingFilter}
              onChange={(option) => {
                setRatingFilter(option ?? ratingOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
            <Select
              options={loadsOptions}
              value={loadsFilter}
              onChange={(option) => {
                setLoadsFilter(option ?? loadsOptions[0]);
                setPage(1);
              }}
              unstyled
              classNames={selectStyles()}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="w-full xl:max-w-[360px]">
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
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-1 ring-1 ring-slate-200/60 xl:w-[260px]">
            <button type="button" onClick={() => setViewMode("table")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all", viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <Table2 className="h-4 w-4" />Table
            </button>
            <button type="button" onClick={() => setViewMode("grid")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all", viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <Grid2X2 className="h-4 w-4" />Grid
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total verified", value: stats.totalVerified.toLocaleString(), icon: ShieldCheck, tone: "text-slate-900" },
          { label: "Active this week", value: stats.activeThisWeek.toLocaleString(), icon: CalendarRange, tone: "text-blue-700" },
          { label: "Top rated", value: stats.topRated.toLocaleString(), icon: Star, tone: "text-emerald-700" },
          { label: "High volume", value: stats.highVolume.toLocaleString(), icon: Truck, tone: "text-amber-700" },
          { label: "New this month", value: stats.newThisMonth.toLocaleString(), icon: Building2, tone: "text-violet-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(CARD_CLASS, "relative overflow-hidden p-4")}>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
              <div className="rounded-lg bg-slate-50 p-2 text-slate-700 w-fit"><Icon className="h-4 w-4" /></div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">{item.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tracking-tight", item.tone)}>{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className={cn(CARD_CLASS, "p-6")}>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
          <button type="button" onClick={toggleSelectAllVisible} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/60">
            <CheckCircle2 className="h-4 w-4" />
            {allVisibleSelected ? "Clear visible" : "Select all visible"}
          </button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("suspend")}>
            <UserMinus className="mr-2 h-4 w-4" />
            Suspend Selected
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
              <table className="w-full min-w-[1020px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-8" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[18%]" />
                  <col className="w-[11%]" />
                  <col className="w-[9%]" />
                  <col className="w-[184px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-slate-300" />
                    </th>
                    <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-slate-500">#</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">Company</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">Contact</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">Fleet &amp; regions</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">Performance</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">Status</th>
                    <th className="sticky right-0 bg-slate-50 px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 shadow-[-4px_0_8px_rgba(15,23,42,0.04)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedRows.map((row, index) => (
                    <tr key={row.id} className="group border-t border-slate-100 align-top hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 align-top">
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleRowSelection(row.id)} className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-2 py-2.5 align-top text-xs font-medium text-slate-500">{(page - 1) * rowsPerPage.value + index + 1}</td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/60">
                            {row.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.logoUrl} alt={row.companyName} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/admin/carriers/${row.id}`}
                              className="block truncate font-semibold text-slate-900 hover:text-emerald-700"
                              title={row.companyName}
                            >
                              {row.companyName}
                            </Link>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700">
                              <ShieldCheck className="h-3 w-3 shrink-0" />
                              Verified
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="truncate text-xs text-slate-600" title={row.contactEmail ?? undefined}>
                          {row.contactEmail ?? "—"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{row.phone ?? "—"}</p>
                        <p className="mt-1 flex items-start gap-1 text-xs text-slate-500" title={row.location}>
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{row.location}</span>
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="space-y-1.5">
                          <ChipList items={row.vehicleTypes} emptyLabel="Types not set" />
                          <ChipList items={row.serviceAreas} emptyLabel="Regions not set" />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="text-sm font-semibold text-slate-800">
                          {row.loadsCompleted}
                          <span className="font-normal text-slate-500"> / {row.totalLoads}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{row.vehicles.toLocaleString()} trucks</p>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {row.rating > 0 ? row.rating.toFixed(1) : "No rating"}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", activeBadgeClass(row.activeState))}>
                          {row.activeState}
                        </span>
                      </td>
                      <td className="sticky right-0 bg-white px-3 py-2.5 align-middle shadow-[-4px_0_8px_rgba(15,23,42,0.04)] group-hover:bg-slate-50/60">
                        <VerifiedCarrierActionButtons
                          row={row}
                          variant="compact"
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          onDownloadDocuments={handleDownloadDocuments}
                        />
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-14 text-center"><p className="text-lg font-semibold text-slate-900">No verified carriers match filters</p></td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {paginatedRows.map((row) => (
              <div key={row.id} className="relative overflow-hidden rounded-xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white text-slate-600 shadow-sm">
                      {row.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.logoUrl} alt={row.companyName} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/carriers/${row.id}`} className="text-lg font-semibold text-slate-900 hover:text-emerald-700">
                        {row.companyName}
                      </Link>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    </div>
                  </div>
                  <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", activeBadgeClass(row.activeState))}>
                    {row.activeState}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Rating</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {row.rating > 0 ? `${row.rating.toFixed(1)} (${row.reviewCount})` : "No rating yet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Location</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{row.location}</p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Fleet</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{row.vehicles.toLocaleString()} trucks</p>
                    <p className="mt-1 text-sm text-slate-500">{row.loadsCompleted.toLocaleString()} completed loads</p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Services</p>
                    <ChipList items={row.vehicleTypes} emptyLabel="—" />
                    <div className="mt-1"><ChipList items={row.serviceAreas} emptyLabel="—" /></div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{row.contactEmail ?? "Email not available"}</span>
                </div>

                <div className="mt-5">
                  <VerifiedCarrierActionButtons
                    row={row}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onDownloadDocuments={handleDownloadDocuments}
                  />
                </div>
              </div>
            ))}
            {paginatedRows.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
                <p className="text-lg font-semibold text-slate-900">No verified carriers match filters</p>
                <p className="mt-2 text-sm text-slate-500">
                  Adjust search, service filters, rating, or load thresholds to load more cards.
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50/80 px-4 py-4 ring-1 ring-slate-200/60 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredRows.length === 0 ? 0 : (page - 1) * rowsPerPage.value + 1}-{Math.min(page * rowsPerPage.value, filteredRows.length)}</span> of <span className="font-semibold text-slate-900">{filteredRows.length}</span>
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
                  className={cn("h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-all", page === pageNumber ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200/60")}
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
