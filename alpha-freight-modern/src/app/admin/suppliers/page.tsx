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
  Factory,
  Filter,
  Grid2X2,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  PoundSterling,
  RefreshCcw,
  Search,
  Table2,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readSupplierExtras, resolveSupplierExtras, type SupplierProfileExtras } from "@/lib/profile-extras";
import { readSupplierPaymentOrders } from "@/lib/supplier-payments";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-data-client";

type DateRangeValue = "all" | "7d" | "30d" | "90d";
type StatusFilterValue = "all" | "active" | "inactive" | "new";
type SortValue = "date" | "name" | "loads_posted" | "spend";
type ViewMode = "table" | "grid";

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
  profile_extras?: unknown;
};

type LoadRecord = {
  id: string;
  supplier_id: string | null;
  status: string | null;
  price: number | string | null;
  created_at: string | null;
};

type SupplierStatus = "Active" | "Inactive" | "New";

type SupplierRow = {
  id: string;
  supplierCode: string;
  companyName: string;
  logoUrl: string | null;
  contactPerson: string;
  accountType: string;
  contactEmail: string | null;
  invoicingEmail: string | null;
  phone: string | null;
  location: string;
  registrationNo: string;
  taxId: string;
  industry: string;
  commodity: string;
  monthlyVolume: string;
  averageWeight: string;
  averageValue: string;
  profileFieldsFilled: number;
  profileFieldsTotal: number;
  status: SupplierStatus;
  loadsPosted: number;
  loadsCompleted: number;
  activeLoads: number;
  totalSpend: number;
  pendingPayments: number;
  joinedAt: string | null;
  lastLoadAt: string | null;
};

type SuppliersOverview = {
  rows: SupplierRow[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    newThisWeek: number;
    totalLoads: number;
    totalSpend: number;
    highVolume: number;
  };
  industries: string[];
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
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "new", label: "New" },
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
  { value: "loads_posted", label: "Loads posted" },
  { value: "spend", label: "Total spend" },
];

const rowsPerPageOptions = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];

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

function formatAccountType(value: string | null | undefined) {
  const normalized = normalizeStatus(value);
  if (normalized === "company") return "Company";
  if (normalized === "individual") return "Individual";
  return value?.trim() || "Supplier";
}

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function buildProfileProgress(extras: SupplierProfileExtras, profile: SupplierProfileRecord) {
  const fields = [
    extras.companyName || profile.company_name,
    extras.contactPerson || profile.full_name,
    extras.email,
    extras.phone,
    extras.address || extras.city,
    extras.registrationNo,
    extras.taxId,
    extras.industry || profile.industry,
    extras.invoicingEmail,
    extras.commodity,
  ];
  const filled = fields.filter((value) => Boolean(String(value ?? "").trim())).length;
  return { filled, total: fields.length };
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

  if (joined && joined >= weekStart && loadsPosted <= 1) {
    return "New";
  }

  if (lastLoad && lastLoad >= monthStart) {
    return "Active";
  }

  if (loadsPosted > 0 && lastLoad && lastLoad >= monthStart) {
    return "Active";
  }

  if (loadsPosted > 0) {
    return "Inactive";
  }

  if (joined && joined >= monthStart) {
    return "New";
  }

  return "Inactive";
}

async function fetchSuppliers(): Promise<SuppliersOverview> {
  const [profilesResponse, loadsResponse] = await Promise.all([
    adminFetch<{ profiles: SupplierProfileRecord[] }>("/api/admin/profiles?role=supplier"),
    adminFetch<{ loads: LoadRecord[] }>("/api/admin/loads"),
  ]);

  const profiles = profilesResponse.profiles ?? [];
  const loads = (loadsResponse.loads ?? []).filter((load) => load.supplier_id);
  const paymentOrders = readSupplierPaymentOrders();

  const loadGroups = new Map<string, LoadRecord[]>();
  loads.forEach((load) => {
    if (!load.supplier_id) return;
    const current = loadGroups.get(load.supplier_id) ?? [];
    current.push(load);
    loadGroups.set(load.supplier_id, current);
  });

  const pendingPaymentsBySupplier = new Map<string, number>();
  paymentOrders.forEach((order) => {
    if (order.paymentState !== "pending") return;
    pendingPaymentsBySupplier.set(
      order.supplierId,
      (pendingPaymentsBySupplier.get(order.supplierId) ?? 0) + 1
    );
  });

  const rows = profiles.map((profile) => {
    const extras = resolveSupplierExtras(profile.id, profile.profile_extras);
    const supplierLoads = loadGroups.get(profile.id) ?? [];
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
    const { filled, total } = buildProfileProgress(extras, profile);

    return {
      id: profile.id,
      supplierCode: `SP-${profile.id.slice(0, 6).toUpperCase()}`,
      companyName:
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        `Supplier ${profile.id.slice(0, 8)}`,
      logoUrl: extras.avatarUrl ?? profile.avatar_url ?? null,
      contactPerson: extras.contactPerson?.trim() || profile.full_name?.trim() || "Not provided",
      accountType: formatAccountType(extras.accountType),
      contactEmail: extras.email ?? null,
      invoicingEmail: extras.invoicingEmail ?? null,
      phone: extras.phone ?? null,
      location: [extras.city, extras.address].filter(Boolean).join(", ") || "Not provided",
      registrationNo: extras.registrationNo?.trim() || "Not provided",
      taxId: extras.taxId?.trim() || "Not provided",
      industry: extras.industry?.trim() || profile.industry?.trim() || "Not set",
      commodity: extras.commodity?.trim() || "Not set",
      monthlyVolume: extras.monthlyVolume?.trim() || "Not set",
      averageWeight: extras.averageWeight?.trim() || "—",
      averageValue: extras.averageValue?.trim() || "—",
      profileFieldsFilled: filled,
      profileFieldsTotal: total,
      status: resolveSupplierStatus(profile.created_at ?? null, lastLoadAt, supplierLoads.length),
      loadsPosted: supplierLoads.length,
      loadsCompleted: completedLoads,
      activeLoads,
      totalSpend,
      pendingPayments: pendingPaymentsBySupplier.get(profile.id) ?? 0,
      joinedAt: profile.created_at ?? null,
      lastLoadAt,
    } satisfies SupplierRow;
  });

  const weekStart = startOfDay(subDays(new Date(), 6));
  const industries = Array.from(
    new Set(rows.map((row) => row.industry).filter((value) => value && value !== "Not set"))
  ).sort();

  return {
    rows,
    industries,
    stats: {
      total: rows.length,
      active: rows.filter((row) => row.status === "Active").length,
      inactive: rows.filter((row) => row.status === "Inactive").length,
      newThisWeek: rows.filter((row) => {
        const joinedAt = getDateOrNull(row.joinedAt);
        return joinedAt && joinedAt >= weekStart;
      }).length,
      totalLoads: rows.reduce((sum, row) => sum + row.loadsPosted, 0),
      totalSpend: rows.reduce((sum, row) => sum + row.totalSpend, 0),
      highVolume: rows.filter((row) => row.loadsPosted >= 5).length,
    },
  };
}

function statusBadgeClass(status: SupplierStatus) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "New") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
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

function SupplierAvatar({ row }: { row: SupplierRow }) {
  if (row.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
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

function SupplierActionButtons({
  row,
  onUnsupportedAction,
  variant = "stacked",
}: {
  row: SupplierRow;
  onUnsupportedAction: (action: string, supplier: SupplierRow) => void;
  variant?: "stacked" | "compact";
}) {
  const iconClass =
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/suppliers/${row.id}`}
          title="View profile"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-semibold text-white hover:bg-slate-800"
        >
          <Eye className="h-3 w-3" />
          View
        </Link>
        {row.contactEmail ? (
          <a
            href={`mailto:${row.contactEmail}`}
            title="Email supplier"
            className={iconClass}
          >
            <Mail className="h-3 w-3" />
          </a>
        ) : null}
        <Link href={`/admin/suppliers/add?edit=${row.id}`} title="Edit" className={iconClass}>
          <Pencil className="h-3 w-3" />
        </Link>
        <button
          type="button"
          title="Delete"
          onClick={() => onUnsupportedAction("delete", row)}
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
        href={`/admin/suppliers/${row.id}`}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2.5 text-[11px] font-semibold text-white hover:bg-slate-800"
      >
        <Eye className="h-3.5 w-3.5" />
        View profile
      </Link>
      <div className="flex gap-1">
        {row.contactEmail ? (
          <a
            href={`mailto:${row.contactEmail}`}
            title="Email"
            className={cn(iconClass, "h-8 w-8")}
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <Link href={`/admin/suppliers/add?edit=${row.id}`} title="Edit" className={cn(iconClass, "h-8 w-8")}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          title="Delete"
          onClick={() => onUnsupportedAction("delete", row)}
          className={cn(iconClass, "h-8 w-8 hover:bg-red-50 hover:text-red-700")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminSuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [industryFilter, setIndustryFilter] = useState({ value: "all", label: "All industries" });
  const [dateRangeFilter, setDateRangeFilter] = useState(dateRangeOptions[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: fetchSuppliers,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    total: 0,
    active: 0,
    inactive: 0,
    newThisWeek: 0,
    totalLoads: 0,
    totalSpend: 0,
    highVolume: 0,
  };

  const industryOptions = useMemo(
    () => [
      { value: "all", label: "All industries" },
      ...(data?.industries ?? []).map((industry) => ({ value: industry, label: industry })),
    ],
    [data?.industries]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    const result = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.companyName.toLowerCase().includes(term) ||
        row.supplierCode.toLowerCase().includes(term) ||
        row.contactPerson.toLowerCase().includes(term) ||
        row.registrationNo.toLowerCase().includes(term) ||
        row.taxId.toLowerCase().includes(term) ||
        row.industry.toLowerCase().includes(term) ||
        row.commodity.toLowerCase().includes(term) ||
        (row.contactEmail ?? "").toLowerCase().includes(term) ||
        (row.invoicingEmail ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term) ||
        row.location.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter.value === "all" ||
        row.status.toLowerCase() === statusFilter.value;

      const matchesIndustry =
        industryFilter.value === "all" || row.industry === industryFilter.value;

      const joinedAt = getDateOrNull(row.joinedAt);
      const matchesDate =
        dateRangeFilter.value === "all" ||
        (joinedAt &&
          joinedAt >=
            startOfDay(
              subDays(
                now,
                dateRangeFilter.value === "7d" ? 6 : dateRangeFilter.value === "30d" ? 29 : 89
              )
            ));

      return Boolean(matchesSearch && matchesStatus && matchesIndustry && matchesDate);
    });

    return [...result].sort((a, b) => {
      if (sortBy.value === "name") {
        return a.companyName.localeCompare(b.companyName);
      }
      if (sortBy.value === "loads_posted") {
        return b.loadsPosted - a.loadsPosted;
      }
      if (sortBy.value === "spend") {
        return b.totalSpend - a.totalSpend;
      }
      return (getDateOrNull(b.joinedAt)?.getTime() ?? 0) - (getDateOrNull(a.joinedAt)?.getTime() ?? 0);
    });
  }, [
    dateRangeFilter.value,
    industryFilter.value,
    rows,
    search,
    sortBy.value,
    statusFilter.value,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage.value));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage.value;
    return filteredRows.slice(start, start + rowsPerPage.value);
  }, [filteredRows, page, rowsPerPage.value]);

  const allVisibleSelected =
    paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !paginatedRows.some((row) => row.id === id))
      );
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...paginatedRows.map((row) => row.id)])]);
  };

  const toggleRowSelection = (supplierId: string) => {
    setSelectedIds((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId]
    );
  };

  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
  };

  const exportRows = (targetRows: SupplierRow[], fileLabel: string) => {
    if (targetRows.length === 0) {
      toast.error("No suppliers selected for export.");
      return;
    }

    const csvRows = [
      [
        "#",
        "Supplier Code",
        "Company Name",
        "Account Type",
        "Contact Person",
        "Email",
        "Invoicing Email",
        "Phone",
        "Location",
        "Registration No",
        "Tax ID",
        "Industry",
        "Commodity",
        "Monthly Volume",
        "Profile Complete",
        "Status",
        "Loads Posted",
        "Loads Completed",
        "Active Loads",
        "Total Spend",
        "Pending Payments",
        "Joined",
        "Last Load",
      ],
      ...targetRows.map((row, index) => [
        String(index + 1),
        row.supplierCode,
        row.companyName,
        row.accountType,
        row.contactPerson,
        row.contactEmail ?? "Not provided",
        row.invoicingEmail ?? "Not provided",
        row.phone ?? "Not provided",
        row.location,
        row.registrationNo,
        row.taxId,
        row.industry,
        row.commodity,
        row.monthlyVolume,
        `${row.profileFieldsFilled}/${row.profileFieldsTotal}`,
        row.status,
        String(row.loadsPosted),
        String(row.loadsCompleted),
        String(row.activeLoads),
        formatMoney(row.totalSpend),
        String(row.pendingPayments),
        row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown",
        row.lastLoadAt ? format(new Date(row.lastLoadAt), "dd MMM yyyy") : "Never",
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

  const handleUnsupportedAction = (action: string, supplier: SupplierRow) => {
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    toast(`${actionLabel} workflow for ${supplier.companyName} is ready for backend wiring.`, {
      icon: "i",
    });
  };

  const handleBulkAction = (action: "delete" | "export") => {
    if (action === "export") {
      exportRows(selectedRows, "admin-suppliers-selected");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Select at least one supplier first.");
      return;
    }

    toast("Delete selected workflow is ready for backend wiring.", { icon: "i" });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>All suppliers</p>
              <h2 className={SECTION_TITLE}>Supplier directory &amp; shipper operations</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Onboarding profile, billing, shipping preferences, load history, and spend — supplier se li gayi har detail yahan dikhti hai.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/suppliers/active">
              <Button variant="secondary" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Active suppliers
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
            <Button variant="secondary" size="sm" onClick={() => exportRows(filteredRows, "admin-suppliers-all")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/admin/suppliers/add">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add supplier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading supplier records…
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { label: "Total suppliers", value: stats.total.toLocaleString(), icon: Users, tone: "text-slate-900" },
          { label: "Active (30d)", value: stats.active.toLocaleString(), icon: TrendingUp, tone: "text-emerald-700" },
          { label: "Inactive", value: stats.inactive.toLocaleString(), icon: CalendarRange, tone: "text-slate-600" },
          { label: "New this week", value: stats.newThisWeek.toLocaleString(), icon: UserRound, tone: "text-blue-700" },
          { label: "Loads posted", value: stats.totalLoads.toLocaleString(), icon: Package, tone: "text-violet-700" },
          { label: "Platform spend", value: formatMoney(stats.totalSpend), icon: PoundSterling, tone: "text-amber-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(CARD_CLASS, "relative overflow-hidden p-4")}>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-slate-300" />
              <div className="rounded-lg bg-slate-50 p-2 text-slate-700 w-fit">
                <Icon className="h-4 w-4" />
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
              placeholder="Search company, contact, industry, commodity, tax ID, or email"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:w-[980px]">
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
              options={industryOptions}
              value={industryFilter}
              onChange={(option) => {
                setIndustryFilter(option ?? industryOptions[0]);
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
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("delete")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected
          </Button>
          <span className="ml-auto rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/60">
            {selectedIds.length} selected · {filteredRows.length} shown · {stats.highVolume} high volume
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
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                  <col className="w-[184px]" />
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
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Supplier</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Contact</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Business</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Shipping profile</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Profile</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Status</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Performance</th>
                    <th className="sticky right-0 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold text-slate-500 shadow-[-4px_0_8px_rgba(15,23,42,0.04)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedRows.map((row, index) => {
                    const profilePct =
                      row.profileFieldsTotal > 0
                        ? Math.round((row.profileFieldsFilled / row.profileFieldsTotal) * 100)
                        : 0;

                    return (
                      <tr key={row.id} className="group border-t border-slate-100 align-top hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 align-top">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-2 py-2.5 align-top text-xs font-medium text-slate-500">
                          {(page - 1) * rowsPerPage.value + index + 1}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex items-start gap-2.5">
                            <SupplierAvatar row={row} />
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/admin/suppliers/${row.id}`}
                                className="block truncate font-semibold text-slate-900 hover:text-blue-700"
                                title={row.companyName}
                              >
                                {row.companyName}
                              </Link>
                              <p className="mt-0.5 text-[11px] text-slate-500">{row.supplierCode}</p>
                              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {row.accountType}
                              </span>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <p className="truncate text-sm font-medium text-slate-800" title={row.contactPerson}>
                            {row.contactPerson}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500" title={row.contactEmail ?? undefined}>
                            {row.contactEmail ?? "—"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.phone ?? "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <p className="truncate text-sm font-medium text-slate-700" title={row.registrationNo}>
                            {row.registrationNo}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">Tax {row.taxId}</p>
                          <p className="mt-1 flex items-start gap-1 text-xs text-slate-500" title={row.location}>
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">{row.location}</span>
                          </p>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <ChipList items={[row.industry]} emptyLabel="Industry not set" />
                          <div className="mt-1.5">
                            <ChipList items={[row.commodity]} emptyLabel="Commodity not set" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">Vol {row.monthlyVolume}</p>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <p className="text-sm font-semibold text-slate-800">
                            {row.profileFieldsFilled}/{row.profileFieldsTotal}
                          </p>
                          <div className="mt-1.5 h-1.5 w-full max-w-[72px] overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${profilePct}%` }}
                            />
                          </div>
                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {row.invoicingEmail ?? "No invoicing email"}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              statusBadgeClass(row.status)
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <p className="text-sm font-semibold text-slate-800">{row.loadsPosted} posted</p>
                          <p className="text-xs text-slate-500">
                            {row.loadsCompleted} done · {row.activeLoads} active
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">{formatMoney(row.totalSpend)}</p>
                          {row.pendingPayments > 0 ? (
                            <p className="text-[11px] text-amber-700">{row.pendingPayments} pending pay</p>
                          ) : null}
                        </td>
                        <td className="sticky right-0 bg-white px-3 py-2.5 align-middle shadow-[-4px_0_8px_rgba(15,23,42,0.04)] group-hover:bg-slate-50/60">
                          <SupplierActionButtons
                            row={row}
                            variant="compact"
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
                            No suppliers match the current filters
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Adjust search, status, industry, or date range to see more rows.
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
            {paginatedRows.map((row, index) => {
              const profilePct =
                row.profileFieldsTotal > 0
                  ? Math.round((row.profileFieldsFilled / row.profileFieldsTotal) * 100)
                  : 0;

              return (
                <div
                  key={row.id}
                  className="relative overflow-hidden rounded-xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-slate-300" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <SupplierAvatar row={row} />
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          #{((page - 1) * rowsPerPage.value + index + 1).toString()} · {row.supplierCode}
                        </p>
                        <Link
                          href={`/admin/suppliers/${row.id}`}
                          className="mt-1 block text-lg font-semibold text-slate-900 hover:text-blue-700"
                        >
                          {row.companyName}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.accountType} · {row.industry}
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
                      <p className={SECTION_LABEL}>Contact</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">{row.contactPerson}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{row.contactEmail ?? "—"}</p>
                      <p className="text-xs text-slate-500">{row.phone ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                      <p className={SECTION_LABEL}>Business</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">{row.registrationNo}</p>
                      <p className="mt-1 text-xs text-slate-500">Tax {row.taxId}</p>
                      <p className="text-xs text-slate-500">{row.location}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                      <p className={SECTION_LABEL}>Shipping</p>
                      <ChipList items={[row.commodity]} emptyLabel="Not set" />
                      <p className="mt-2 text-xs text-slate-500">Volume {row.monthlyVolume}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                      <p className={SECTION_LABEL}>Profile &amp; billing</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {row.profileFieldsFilled}/{row.profileFieldsTotal} fields · {profilePct}%
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">{row.invoicingEmail ?? "No invoicing email"}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 sm:col-span-2">
                      <p className={SECTION_LABEL}>Performance</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                        <span>{row.loadsPosted} posted</span>
                        <span>{row.loadsCompleted} completed</span>
                        <span>{row.activeLoads} active</span>
                        <span className="font-semibold text-emerald-700">{formatMoney(row.totalSpend)}</span>
                        <span className="text-xs text-slate-500">
                          Joined {row.joinedAt ? format(new Date(row.joinedAt), "dd MMM yyyy") : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <SupplierActionButtons row={row} onUnsupportedAction={handleUnsupportedAction} />
                    <Link
                      href={`/admin/suppliers/${row.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                      View profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
            {paginatedRows.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
                <p className="text-lg font-semibold text-slate-900">No suppliers match the current filters</p>
                <p className="mt-2 text-sm text-slate-500">Adjust search, filters, or sort settings to load more cards.</p>
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
