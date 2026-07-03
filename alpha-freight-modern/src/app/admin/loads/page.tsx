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
  ClipboardList,
  Download,
  Eye,
  Filter,
  Gavel,
  Grid2X2,
  Loader2,
  MapPin,
  Package,
  PackagePlus,
  PoundSterling,
  RefreshCcw,
  Route,
  Search,
  Table2,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-data-client";
import { readCarrierExtras, readSupplierExtras, resolveCarrierExtras, resolveSupplierExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";
type StageFilterValue = "all" | "available" | "matched" | "in-transit" | "completed" | "pending-payment";
type SortValue = "date" | "price" | "route" | "status";
type DateRangeValue = "all" | "7d" | "30d" | "90d";

type RawLoadRecord = {
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
  title: string | null;
  commodity: string | null;
  equipment: string | null;
  weight: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  payment_route: string | null;
  payment_state: string | null;
};

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  profile_extras?: unknown;
};

type LoadStage = "Available" | "Matched" | "In Transit" | "Completed" | "Pending Payment" | "Other";

type LoadRow = {
  id: string;
  loadCode: string;
  title: string;
  route: string;
  origin: string;
  destination: string;
  supplierId: string | null;
  supplierName: string;
  carrierId: string | null;
  carrierName: string;
  equipment: string;
  commodity: string;
  weight: string;
  price: number;
  paymentRoute: string;
  paymentState: string;
  status: string;
  stage: LoadStage;
  bidCount: number;
  pickupDate: string | null;
  deliveryDate: string | null;
  postedAt: string | null;
};

type LoadsOverview = {
  rows: LoadRow[];
  stats: {
    total: number;
    active: number;
    available: number;
    matched: number;
    inTransit: number;
    completed: number;
    totalValue: number;
    newThisWeek: number;
  };
};

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-xl font-bold text-slate-900";

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const IN_TRANSIT_LOAD_STATUSES = new Set(["loading", "in-transit", "assigned", "booked"]);
const AVAILABLE_LOAD_STATUSES = new Set(["active", "available", "pending"]);
const MATCHED_LOAD_STATUSES = new Set(["booked", "assigned", "loading", "in-transit"]);

const stageOptions = [
  { value: "all", label: "All stages" },
  { value: "available", label: "Available" },
  { value: "matched", label: "Matched" },
  { value: "in-transit", label: "In transit" },
  { value: "completed", label: "Completed" },
  { value: "pending-payment", label: "Pending payment" },
];

const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const sortOptions = [
  { value: "date", label: "Newest first" },
  { value: "price", label: "Highest value" },
  { value: "route", label: "Route A–Z" },
  { value: "status", label: "Status" },
];

const rowsPerPageOptions = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];

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

function getRouteLabel(load: RawLoadRecord) {
  const origin = (load.origin || load.pickup_location || "Pickup").split(",")[0].trim();
  const destination = (load.destination || load.delivery_location || "Delivery").split(",")[0].trim();
  return `${origin} → ${destination}`;
}

function resolveLoadStage(load: RawLoadRecord): LoadStage {
  const status = normalizeStatus(load.status);

  if (status === "pending-payment") return "Pending Payment";
  if (DELIVERED_LOAD_STATUSES.has(status)) return "Completed";
  if (IN_TRANSIT_LOAD_STATUSES.has(status)) return "In Transit";
  if (load.carrier_id || MATCHED_LOAD_STATUSES.has(status)) return "Matched";
  if (AVAILABLE_LOAD_STATUSES.has(status)) return "Available";
  return "Other";
}

function resolveProfileName(profile: ProfileRecord | undefined, extrasName?: string | null) {
  return (
    extrasName?.trim() ||
    profile?.company_name?.trim() ||
    profile?.full_name?.trim() ||
    "Unknown account"
  );
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

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {label}
    </span>
  );
}

type AdminLoadsApiResponse = {
  loads: RawLoadRecord[];
  profiles: ProfileRecord[];
  bids: { load_id?: string | null }[];
};

async function fetchLoadsOverview(): Promise<LoadsOverview> {
  const { loads: rawLoads, profiles, bids } = await adminFetch<AdminLoadsApiResponse>(
    "/api/admin/loads"
  );

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const bidCountByLoad = new Map<string, number>();
  bids.forEach((bid: { load_id?: string | null }) => {
    if (!bid.load_id) return;
    bidCountByLoad.set(bid.load_id, (bidCountByLoad.get(bid.load_id) ?? 0) + 1);
  });

  const rows = rawLoads.map((load) => {
    const supplierProfile = load.supplier_id ? profileById.get(load.supplier_id) : undefined;
    const carrierProfile = load.carrier_id ? profileById.get(load.carrier_id) : undefined;
    const supplierExtras = load.supplier_id
      ? resolveSupplierExtras(load.supplier_id, supplierProfile?.profile_extras)
      : null;
    const carrierExtras = load.carrier_id
      ? resolveCarrierExtras(load.carrier_id, carrierProfile?.profile_extras)
      : null;
    const stage = resolveLoadStage(load);
    const origin = (load.origin || load.pickup_location || "Pickup").split(",")[0].trim();
    const destination = (load.destination || load.delivery_location || "Delivery").split(",")[0].trim();

    return {
      id: load.id,
      loadCode: `LD-${load.id.slice(0, 6).toUpperCase()}`,
      title: load.title?.trim() || `${load.commodity || "Freight"} load`,
      route: getRouteLabel(load),
      origin,
      destination,
      supplierId: load.supplier_id,
      supplierName: resolveProfileName(supplierProfile, supplierExtras?.companyName),
      carrierId: load.carrier_id,
      carrierName: load.carrier_id
        ? resolveProfileName(carrierProfile, carrierExtras?.companyName)
        : "Unassigned",
      equipment: load.equipment?.trim() || "Not set",
      commodity: load.commodity?.trim() || "General freight",
      weight: load.weight?.trim() || "—",
      price: toNumber(load.price),
      paymentRoute: load.payment_route?.replace("-", " ") || "pay later",
      paymentState: load.payment_state || "pending",
      status: normalizeStatus(load.status) || "unknown",
      stage,
      bidCount: bidCountByLoad.get(load.id) ?? 0,
      pickupDate: load.pickup_date ?? null,
      deliveryDate: load.delivery_date ?? null,
      postedAt: load.created_at ?? null,
    } satisfies LoadRow;
  });

  const weekStart = startOfDay(subDays(new Date(), 6));

  return {
    rows,
    stats: {
      total: rows.length,
      active: rows.filter((row) => !DELIVERED_LOAD_STATUSES.has(row.status)).length,
      available: rows.filter((row) => row.stage === "Available").length,
      matched: rows.filter((row) => row.stage === "Matched").length,
      inTransit: rows.filter((row) => row.stage === "In Transit").length,
      completed: rows.filter((row) => row.stage === "Completed").length,
      totalValue: rows.reduce((sum, row) => sum + row.price, 0),
      newThisWeek: rows.filter((row) => {
        const posted = getDateOrNull(row.postedAt);
        return posted && posted >= weekStart;
      }).length,
    },
  };
}

function LoadActionButtons({
  row,
  onUnsupportedAction,
  variant = "stacked",
}: {
  row: LoadRow;
  onUnsupportedAction: (action: string, load: LoadRow) => void;
  variant?: "stacked" | "compact";
}) {
  const iconClass =
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/loads/${row.id}`}
          title="View load"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-semibold text-white hover:bg-slate-800"
        >
          <Eye className="h-3 w-3" />
          View
        </Link>
        {row.supplierId ? (
          <Link
            href={`/admin/suppliers/${row.supplierId}`}
            title="View supplier"
            className={iconClass}
          >
            <Building2 className="h-3 w-3" />
          </Link>
        ) : null}
        {row.carrierId ? (
          <Link href={`/admin/carriers/${row.carrierId}`} title="View carrier" className={iconClass}>
            <Truck className="h-3 w-3" />
          </Link>
        ) : null}
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
        href={`/admin/loads/${row.id}`}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2.5 text-[11px] font-semibold text-white hover:bg-slate-800"
      >
        <Eye className="h-3.5 w-3.5" />
        View load
      </Link>
      <div className="flex gap-1">
        {row.supplierId ? (
          <Link
            href={`/admin/suppliers/${row.supplierId}`}
            title="Supplier"
            className={cn(iconClass, "h-8 w-8")}
          >
            <Building2 className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {row.carrierId ? (
          <Link href={`/admin/carriers/${row.carrierId}`} title="Carrier" className={cn(iconClass, "h-8 w-8")}>
            <Truck className="h-3.5 w-3.5" />
          </Link>
        ) : null}
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

export default function AdminLoadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(stageOptions[0]);
  const [dateRangeFilter, setDateRangeFilter] = useState(dateRangeOptions[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["admin-loads"],
    queryFn: fetchLoadsOverview,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    total: 0,
    active: 0,
    available: 0,
    matched: 0,
    inTransit: 0,
    completed: 0,
    totalValue: 0,
    newThisWeek: 0,
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    const result = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.loadCode.toLowerCase().includes(term) ||
        row.title.toLowerCase().includes(term) ||
        row.route.toLowerCase().includes(term) ||
        row.origin.toLowerCase().includes(term) ||
        row.destination.toLowerCase().includes(term) ||
        row.supplierName.toLowerCase().includes(term) ||
        row.carrierName.toLowerCase().includes(term) ||
        row.equipment.toLowerCase().includes(term) ||
        row.commodity.toLowerCase().includes(term) ||
        row.status.includes(term);

      const matchesStage =
        stageFilter.value === "all" ||
        (stageFilter.value === "available" && row.stage === "Available") ||
        (stageFilter.value === "matched" && row.stage === "Matched") ||
        (stageFilter.value === "in-transit" && row.stage === "In Transit") ||
        (stageFilter.value === "completed" && row.stage === "Completed") ||
        (stageFilter.value === "pending-payment" && row.stage === "Pending Payment");

      const postedAt = getDateOrNull(row.postedAt);
      const matchesDate =
        dateRangeFilter.value === "all" ||
        (postedAt &&
          postedAt >=
            startOfDay(
              subDays(
                now,
                dateRangeFilter.value === "7d" ? 6 : dateRangeFilter.value === "30d" ? 29 : 89
              )
            ));

      return Boolean(matchesSearch && matchesStage && matchesDate);
    });

    return [...result].sort((a, b) => {
      if (sortBy.value === "price") return b.price - a.price;
      if (sortBy.value === "route") return a.route.localeCompare(b.route);
      if (sortBy.value === "status") return a.stage.localeCompare(b.stage);
      return (getDateOrNull(b.postedAt)?.getTime() ?? 0) - (getDateOrNull(a.postedAt)?.getTime() ?? 0);
    });
  }, [dateRangeFilter.value, rows, search, sortBy.value, stageFilter.value]);

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

  const toggleRowSelection = (loadId: string) => {
    setSelectedIds((current) =>
      current.includes(loadId) ? current.filter((id) => id !== loadId) : [...current, loadId]
    );
  };

  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-loads"] });
  };

  const exportRows = (targetRows: LoadRow[], fileLabel: string) => {
    if (targetRows.length === 0) {
      toast.error("No loads selected for export.");
      return;
    }

    const csvRows = [
      [
        "#",
        "Load Code",
        "Title",
        "Route",
        "Supplier",
        "Carrier",
        "Equipment",
        "Commodity",
        "Weight",
        "Price",
        "Stage",
        "Status",
        "Payment Route",
        "Payment State",
        "Bids",
        "Pickup",
        "Delivery",
        "Posted",
      ],
      ...targetRows.map((row, index) => [
        String(index + 1),
        row.loadCode,
        row.title,
        row.route,
        row.supplierName,
        row.carrierName,
        row.equipment,
        row.commodity,
        row.weight,
        formatMoney(row.price),
        row.stage,
        row.status,
        row.paymentRoute,
        row.paymentState,
        String(row.bidCount),
        row.pickupDate ? format(new Date(row.pickupDate), "dd MMM yyyy") : "—",
        row.deliveryDate ? format(new Date(row.deliveryDate), "dd MMM yyyy") : "—",
        row.postedAt ? format(new Date(row.postedAt), "dd MMM yyyy") : "Unknown",
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

  const handleUnsupportedAction = (action: string, load: LoadRow) => {
    toast(`${action} workflow for ${load.loadCode} is ready for backend wiring.`, { icon: "i" });
  };

  const handleBulkAction = (action: "delete" | "export") => {
    if (action === "export") {
      exportRows(selectedRows, "admin-loads-selected");
      return;
    }
    if (selectedRows.length === 0) {
      toast.error("Select at least one load first.");
      return;
    }
    toast("Delete selected workflow is ready for backend wiring.", { icon: "i" });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>All loads</p>
              <h2 className={SECTION_TITLE}>Marketplace load operations</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Real loads from Supabase — routes, suppliers, carriers, bids, payment state, and shipment stage in one control surface.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/post-load">
              <Button size="sm">
                <PackagePlus className="mr-2 h-4 w-4" />
                Post load
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
            <Button variant="secondary" size="sm" onClick={() => exportRows(filteredRows, "admin-loads-all")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          Loading marketplace loads…
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {[
          { label: "Total loads", value: stats.total.toLocaleString(), icon: Package },
          { label: "Active", value: stats.active.toLocaleString(), icon: ClipboardList },
          { label: "Available", value: stats.available.toLocaleString(), icon: MapPin },
          { label: "Matched", value: stats.matched.toLocaleString(), icon: Truck },
          { label: "In transit", value: stats.inTransit.toLocaleString(), icon: Route },
          { label: "Completed", value: stats.completed.toLocaleString(), icon: CheckCircle2 },
          { label: "Total value", value: formatMoney(stats.totalValue), icon: PoundSterling },
          { label: "New this week", value: stats.newThisWeek.toLocaleString(), icon: CalendarRange },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(CARD_CLASS, "relative overflow-hidden p-4")}>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-slate-300" />
              <div className="rounded-lg bg-slate-50 p-2 text-slate-700 w-fit">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{item.value}</p>
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
              placeholder="Search load ID, route, supplier, carrier, equipment, or commodity"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:w-[860px]">
            <Select
              options={stageOptions}
              value={stageFilter}
              onChange={(option) => {
                setStageFilter(option ?? stageOptions[0]);
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
            {selectedIds.length} selected · {filteredRows.length} shown
          </span>
        </div>

        {viewMode === "table" ? (
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-8" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
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
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Load</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Route</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Supplier</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Carrier</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Cargo</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Value</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Stage</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Payment</th>
                    <th className="sticky right-0 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold text-slate-500 shadow-[-4px_0_8px_rgba(15,23,42,0.04)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedRows.map((row, index) => (
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
                        <p className="truncate font-semibold text-slate-900" title={row.title}>
                          {row.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{row.loadCode}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {row.postedAt ? format(new Date(row.postedAt), "dd MMM yyyy") : "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="flex items-start gap-1 text-sm font-medium text-slate-800" title={row.route}>
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          <span className="line-clamp-2">{row.route}</span>
                        </p>
                        {row.pickupDate ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Pickup {format(new Date(row.pickupDate), "dd MMM")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {row.supplierId ? (
                          <Link
                            href={`/admin/suppliers/${row.supplierId}`}
                            className="truncate text-sm font-medium text-slate-800 hover:text-violet-700"
                            title={row.supplierName}
                          >
                            {row.supplierName}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {row.carrierId ? (
                          <Link
                            href={`/admin/carriers/${row.carrierId}`}
                            className="truncate text-sm font-medium text-slate-800 hover:text-emerald-700"
                            title={row.carrierName}
                          >
                            {row.carrierName}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-amber-700">Unassigned</span>
                        )}
                        {row.bidCount > 0 ? (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                            <Gavel className="h-3 w-3" />
                            {row.bidCount} bid{row.bidCount === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <Chip label={row.equipment} />
                        <div className="mt-1">
                          <Chip label={row.commodity} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{row.weight}</p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="text-sm font-semibold text-slate-900">{formatMoney(row.price)}</p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            stageBadgeClass(row.stage)
                          )}
                        >
                          {row.stage}
                        </span>
                        <p className="mt-1 text-[10px] capitalize text-slate-400">{row.status}</p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                            paymentBadgeClass(row.paymentState)
                          )}
                        >
                          {row.paymentState}
                        </span>
                        <p className="mt-1 text-[10px] capitalize text-slate-400">{row.paymentRoute}</p>
                      </td>
                      <td className="sticky right-0 bg-white px-3 py-2.5 align-middle shadow-[-4px_0_8px_rgba(15,23,42,0.04)] group-hover:bg-slate-50/60">
                        <LoadActionButtons
                          row={row}
                          variant="compact"
                          onUnsupportedAction={handleUnsupportedAction}
                        />
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-14 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <Filter className="h-6 w-6" />
                          </div>
                          <p className="mt-4 text-lg font-semibold text-slate-900">No loads match the current filters</p>
                          <p className="mt-2 text-sm text-slate-500">Adjust search, stage, or date range to see more rows.</p>
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
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-slate-300" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        #{((page - 1) * rowsPerPage.value + index + 1).toString()} · {row.loadCode}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{row.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {row.route}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      stageBadgeClass(row.stage)
                    )}
                  >
                    {row.stage}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Parties</p>
                    <p className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      {row.supplierName}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <Truck className="h-3.5 w-3.5" />
                      {row.carrierName}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60">
                    <p className={SECTION_LABEL}>Value &amp; payment</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-700">{formatMoney(row.price)}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {row.paymentState} · {row.paymentRoute}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 sm:col-span-2">
                    <p className={SECTION_LABEL}>Cargo details</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Chip label={row.equipment} />
                      <Chip label={row.commodity} />
                      {row.bidCount > 0 ? <Chip label={`${row.bidCount} bids`} /> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <LoadActionButtons row={row} onUnsupportedAction={handleUnsupportedAction} />
                  {row.supplierId ? (
                    <Link
                      href={`/admin/suppliers/${row.supplierId}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-800"
                    >
                      View supplier
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
            {paginatedRows.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
                <p className="text-lg font-semibold text-slate-900">No loads match the current filters</p>
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
