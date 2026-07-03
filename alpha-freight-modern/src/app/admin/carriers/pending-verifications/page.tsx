"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileBadge2,
  Filter,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  UserRoundX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeCarrierExtras, readCarrierExtras, type CarrierProfileExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type DateRangeValue = "all" | "7d" | "30d" | "90d";
type QueueStatusValue = "all" | "pending" | "in_review" | "ready_for_review";
type PriorityValue = "all" | "high" | "medium" | "low";
type SortValue = "date" | "name" | "priority";

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

type VerificationDocumentStatus = "Uploaded" | "Missing" | "In Review";
type QueueStatus = "Pending" | "In Review" | "Ready for Review";
type Priority = "High" | "Medium" | "Low";

type VerificationDocument = {
  key: "insurance" | "operator" | "vehicle" | "background";
  name: string;
  status: VerificationDocumentStatus;
  fileUrl: string | null;
};

type VerificationRow = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  applicationDate: string | null;
  uploadedDocuments: number;
  totalDocuments: number;
  queueStatus: QueueStatus;
  priority: Priority;
  progressPercentage: number;
  registrationNo: string;
  fleetSize: string;
  vehicleTypes: string[];
  serviceAreas: string[];
  yearsInBusiness: string;
  verificationNotes: string;
  riskScore: "Low" | "Medium" | "High";
  riskFactors: string[];
  documents: VerificationDocument[];
  extras: CarrierProfileExtras;
};

type VerificationOverview = {
  rows: VerificationRow[];
  stats: {
    totalPending: number;
    awaitingDocuments: number;
    inReview: number;
    readyForApproval: number;
    actionRequired: number;
  };
};

const queueStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "ready_for_review", label: "Ready for Review" },
];

const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const priorityOptions = [
  { value: "all", label: "All priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const sortOptions = [
  { value: "date", label: "Date applied" },
  { value: "name", label: "Company name" },
  { value: "priority", label: "Priority" },
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

function statusBadgeClass(status: QueueStatus) {
  if (status === "Ready for Review") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "In Review") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function priorityBadgeClass(priority: Priority) {
  if (priority === "High") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function documentStatusClass(status: VerificationDocumentStatus) {
  if (status === "Uploaded") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "In Review") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-red-50 text-red-700 border-red-200";
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

function priorityWeight(priority: Priority) {
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  return 1;
}

function buildDocuments(extras: CarrierProfileExtras): VerificationDocument[] {
  return [
    {
      key: "insurance",
      name: "Insurance Certificate",
      status: extras.insuranceCertificateUrl ? "Uploaded" : "Missing",
      fileUrl: extras.insuranceCertificateUrl ?? null,
    },
    {
      key: "operator",
      name: "Operator's License",
      status: extras.operatorLicenseUrl ? "Uploaded" : "Missing",
      fileUrl: extras.operatorLicenseUrl ?? null,
    },
    {
      key: "vehicle",
      name: "Vehicle Registration",
      status: extras.vehicleRegistrationUrl ? "Uploaded" : "Missing",
      fileUrl: extras.vehicleRegistrationUrl ?? null,
    },
    {
      key: "background",
      name: "Background Check",
      status:
        extras.backgroundCheckUrl
          ? normalizeStatus(extras.verificationStatus) === "pending"
            ? "In Review"
            : "Uploaded"
          : "Missing",
      fileUrl: extras.backgroundCheckUrl ?? null,
    },
  ];
}

function deriveQueueStatus(documents: VerificationDocument[], extras: CarrierProfileExtras): QueueStatus {
  const uploadedCount = documents.filter((doc) => doc.status === "Uploaded" || doc.status === "In Review").length;
  const missingCount = documents.filter((doc) => doc.status === "Missing").length;
  const savedStatus = normalizeStatus(extras.verificationStatus);

  if (savedStatus === "verified") return "Ready for Review";
  if (missingCount === 0) return "Ready for Review";
  if (uploadedCount >= 2) return "In Review";
  return "Pending";
}

function derivePriority(documents: VerificationDocument[], extras: CarrierProfileExtras): Priority {
  const uploadedCount = documents.filter((doc) => doc.status === "Uploaded" || doc.status === "In Review").length;
  const missingCoreInfo = [
    extras.companyName,
    extras.email,
    extras.phone,
    extras.registrationNo,
    extras.address,
  ].filter((value) => !String(value ?? "").trim()).length;

  if (uploadedCount <= 1 || missingCoreInfo >= 2) return "High";
  if (uploadedCount === 2 || uploadedCount === 3) return "Medium";
  return "Low";
}

function deriveRisk(documents: VerificationDocument[], extras: CarrierProfileExtras) {
  const missingCount = documents.filter((doc) => doc.status === "Missing").length;
  const factors: string[] = [];

  if (missingCount === 0) {
    factors.push("Documents complete");
  } else {
    factors.push(`${missingCount} document${missingCount > 1 ? "s" : ""} missing`);
  }

  if (extras.insuranceExpiry) {
    factors.push(`Insurance valid until ${extras.insuranceExpiry}`);
  } else {
    factors.push("Insurance validity not provided");
  }

  if (extras.verificationNotes?.trim()) {
    factors.push("Admin notes attached");
  }

  if (missingCount >= 2) {
    return { riskScore: "High" as const, riskFactors: factors };
  }
  if (missingCount === 1) {
    return { riskScore: "Medium" as const, riskFactors: factors };
  }
  return { riskScore: "Low" as const, riskFactors: factors };
}

async function fetchPendingVerifications(): Promise<VerificationOverview> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "carrier")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const profiles = (data ?? []) as CarrierProfileRecord[];

  const rows = profiles
    .map((profile) => {
      const extras = readCarrierExtras(profile.id);
      const documents = buildDocuments(extras);
      const uploadedDocuments = documents.filter(
        (doc) => doc.status === "Uploaded" || doc.status === "In Review"
      ).length;
      const queueStatus = deriveQueueStatus(documents, extras);
      const priority = derivePriority(documents, extras);
      const { riskScore, riskFactors } = deriveRisk(documents, extras);

      const row: VerificationRow = {
        id: profile.id,
        companyName:
          extras.companyName?.trim() ||
          profile.company_name?.trim() ||
          profile.full_name?.trim() ||
          `Carrier ${profile.id.slice(0, 8)}`,
        logoUrl: extras.logoUrl ?? extras.avatarUrl ?? null,
        contactEmail: extras.email ?? null,
        phone: extras.phone ?? null,
        applicationDate: profile.created_at ?? null,
        uploadedDocuments,
        totalDocuments: documents.length,
        queueStatus,
        priority,
        progressPercentage: Math.round((uploadedDocuments / documents.length) * 100),
        registrationNo:
          extras.registrationNo?.trim() ||
          `UK${profile.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
        fleetSize:
          extras.fleetSize?.trim() ||
          String(
            toNumber(profile.vehicles_count) || toNumber(profile.truck_count) || toNumber(profile.fleet_size) || 0
          ),
        vehicleTypes: toList(extras.vehicleTypes),
        serviceAreas: toList(extras.operatingRegion),
        yearsInBusiness: extras.yearsInBusiness?.trim() || "—",
        verificationNotes: extras.verificationNotes?.trim() || "Awaiting compliance review.",
        riskScore,
        riskFactors,
        documents,
        extras,
      };

      return row;
    })
    .filter((row) => row.queueStatus !== "Ready for Review" || normalizeStatus(row.extras.verificationStatus) !== "verified");

  return {
    rows,
    stats: {
      totalPending: rows.length,
      awaitingDocuments: rows.filter((row) => row.documents.some((doc) => doc.status === "Missing")).length,
      inReview: rows.filter((row) => row.queueStatus === "In Review").length,
      readyForApproval: rows.filter((row) => row.queueStatus === "Ready for Review").length,
      actionRequired: rows.filter(
        (row) =>
          row.documents.filter((doc) => doc.status === "Missing").length >= 2 ||
          !row.contactEmail ||
          !row.phone
      ).length,
    },
  };
}

function exportRows(targetRows: VerificationRow[], fileLabel: string) {
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
      "Documents",
      "Application Date",
      "Priority",
      "Status",
    ],
    ...targetRows.map((row, index) => [
      String(index + 1),
      row.companyName,
      row.contactEmail ?? "Not provided",
      row.phone ?? "Not provided",
      `${row.uploadedDocuments}/${row.totalDocuments}`,
      row.applicationDate ? format(new Date(row.applicationDate), "dd MMM yyyy") : "Unknown",
      row.priority,
      row.queueStatus,
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

export default function AdminPendingVerificationPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(queueStatusOptions[0]);
  const [dateRangeFilter, setDateRangeFilter] = useState(dateRangeOptions[0]);
  const [priorityFilter, setPriorityFilter] = useState(priorityOptions[0]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["admin-carriers-pending-verifications"],
    queryFn: fetchPendingVerifications,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    totalPending: 0,
    awaitingDocuments: 0,
    inReview: 0,
    readyForApproval: 0,
    actionRequired: 0,
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    const result = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.companyName.toLowerCase().includes(term) ||
        (row.contactEmail ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term);

      const statusValue =
        row.queueStatus === "Ready for Review"
          ? "ready_for_review"
          : row.queueStatus === "In Review"
            ? "in_review"
            : "pending";

      const matchesStatus = statusFilter.value === "all" || statusValue === statusFilter.value;
      const matchesPriority =
        priorityFilter.value === "all" || row.priority.toLowerCase() === priorityFilter.value;

      const appliedAt = getDateOrNull(row.applicationDate);
      const matchesDate =
        dateRangeFilter.value === "all" ||
        (appliedAt &&
          appliedAt >=
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

      return Boolean(matchesSearch && matchesStatus && matchesPriority && matchesDate);
    });

    return [...result].sort((a, b) => {
      if (sortBy.value === "name") {
        return a.companyName.localeCompare(b.companyName);
      }

      if (sortBy.value === "priority") {
        return priorityWeight(b.priority) - priorityWeight(a.priority);
      }

      return (getDateOrNull(b.applicationDate)?.getTime() ?? 0) - (getDateOrNull(a.applicationDate)?.getTime() ?? 0);
    });
  }, [dateRangeFilter.value, priorityFilter.value, rows, search, sortBy.value, statusFilter.value]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage.value));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage.value;
    return filteredRows.slice(start, start + rowsPerPage.value);
  }, [filteredRows, page, rowsPerPage.value]);

  const allVisibleSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedIds.includes(row.id));

  const expandedRow = filteredRows.find((row) => row.id === expandedId) ?? null;
  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !paginatedRows.some((row) => row.id === id)));
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
    await queryClient.invalidateQueries({ queryKey: ["admin-carriers-pending-verifications"] });
  };

  const updateCarrierVerification = async (
    row: VerificationRow,
    nextStatus: "verified" | "rejected" | "pending",
    note?: string
  ) => {
    mergeCarrierExtras(row.id, {
      verificationStatus:
        nextStatus === "verified" ? "Verified" : nextStatus === "rejected" ? "Rejected" : "Pending",
      verificationNotes: note ?? row.verificationNotes,
      verifiedBy: nextStatus === "verified" ? "Admin - Khalid" : row.extras.verifiedBy ?? null,
      verifiedDate:
        nextStatus === "verified" ? new Date().toLocaleDateString("en-GB") : row.extras.verifiedDate ?? null,
      accountStatus:
        nextStatus === "verified" ? "Active" : nextStatus === "rejected" ? "Suspended" : row.extras.accountStatus ?? null,
    });
  };

  const handleSingleAction = async (
    action: "verify" | "reject" | "request_info",
    row: VerificationRow
  ) => {
    try {
      if (action === "verify") {
        await updateCarrierVerification(row, "verified", "All documents verified and approved.");
        toast.success(`${row.companyName} verified successfully.`);
      } else if (action === "reject") {
        await updateCarrierVerification(row, "rejected", "Carrier verification rejected after review.");
        toast.success(`${row.companyName} rejected.`);
      } else {
        await updateCarrierVerification(
          row,
          "pending",
          "Additional information requested for missing or incomplete documents."
        );
        toast.success(`Requested more information from ${row.companyName}.`);
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-carriers-pending-verifications"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update verification status.");
    }
  };

  const handleBulkAction = async (
    action: "verify" | "reject" | "export" | "request_info"
  ) => {
    if (action === "export") {
      exportRows(selectedRows, "pending-verifications-selected");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Select at least one carrier first.");
      return;
    }

    try {
      await Promise.all(
        selectedRows.map((row) =>
          action === "verify"
            ? updateCarrierVerification(row, "verified", "Bulk approved by admin review queue.")
            : action === "reject"
              ? updateCarrierVerification(row, "rejected", "Bulk rejected by admin review queue.")
              : updateCarrierVerification(
                  row,
                  "pending",
                  "Bulk request sent for more information and missing documents."
                )
        )
      );

      toast.success(
        action === "verify"
          ? "Selected carriers verified."
          : action === "reject"
            ? "Selected carriers rejected."
            : "Requested more info for selected carriers."
      );

      await queryClient.invalidateQueries({ queryKey: ["admin-carriers-pending-verifications"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete bulk action.");
    }
  };

  const handleDocumentAction = (verificationDocument: VerificationDocument, action: "view" | "download" | "request") => {
    if (action === "request") {
      toast.success(`Request sent for ${verificationDocument.name}.`);
      return;
    }

    if (!verificationDocument.fileUrl) {
      toast.error(`${verificationDocument.name} is not available yet.`);
      return;
    }

    if (verificationDocument.fileUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = verificationDocument.fileUrl;
      link.download = `${verificationDocument.name.replace(/\s+/g, "-").toLowerCase()}.file`;
      link.click();
      return;
    }

    toast(`Stored reference found for ${verificationDocument.name}.`, { icon: "i" });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldQuestion className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>Pending verification</p>
              <h2 className={SECTION_TITLE}>Carrier compliance review queue</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Documents, identity, and approval readiness — verify, reject, or request info from one queue.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/carriers">
              <Button variant="secondary" size="sm">All carriers</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportRows(filteredRows, "pending-verifications-all")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      {isLoading && !data ? (
        <div className={cn(CARD_CLASS, "flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading verification queue…
        </div>
      ) : null}

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
              placeholder="Search company, email, or phone"
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:w-[860px]">
            <Select
              options={queueStatusOptions}
              value={statusFilter}
              onChange={(option) => {
                setStatusFilter(option ?? queueStatusOptions[0]);
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
              options={priorityOptions}
              value={priorityFilter}
              onChange={(option) => {
                setPriorityFilter(option ?? priorityOptions[0]);
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
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total pending", value: stats.totalPending, icon: ShieldQuestion, tone: "text-slate-900" },
          { label: "Awaiting docs", value: stats.awaitingDocuments, icon: FileBadge2, tone: "text-amber-700" },
          { label: "In review", value: stats.inReview, icon: Search, tone: "text-blue-700" },
          { label: "Ready to approve", value: stats.readyForApproval, icon: ShieldCheck, tone: "text-emerald-700" },
          { label: "Action required", value: stats.actionRequired, icon: AlertTriangle, tone: "text-red-700" },
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
              <p className={cn("mt-1 text-2xl font-bold tracking-tight", item.tone)}>
                {item.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </section>

      <section className={cn(CARD_CLASS, "p-6")}>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {allVisibleSelected ? "Clear visible" : "Select all visible"}
          </button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleBulkAction("verify")}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleBulkAction("reject")}>
            <UserRoundX className="mr-2 h-4 w-4" />
            Reject Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleBulkAction("request_info")}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Request Info Selected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
          <span className="ml-auto rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/60">
            {selectedIds.length} selected · {filteredRows.length} shown
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse">
              <colgroup>
                <col className="w-10" />
                <col className="w-8" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-slate-300" />
                  </th>
                  <th className="px-2 py-2.5 text-[11px] font-semibold text-slate-500">#</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Company</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Contact</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Documents</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Applied</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Priority</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">Status</th>
                  <th className="sticky right-0 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold text-slate-500 shadow-[-4px_0_8px_rgba(15,23,42,0.04)]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedRows.map((row, index) => (
                  <tr key={row.id} className="group border-t border-slate-100 align-top hover:bg-slate-50/60">
                    <td className="px-3 py-3 align-top">
                      <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleRowSelection(row.id)} className="h-4 w-4 rounded border-slate-300" />
                    </td>
                    <td className="px-2 py-3 text-xs font-medium text-slate-500">{(page - 1) * rowsPerPage.value + index + 1}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/60">
                          {row.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.logoUrl} alt={row.companyName} className="h-full w-full object-cover" />
                          ) : (
                            <FileBadge2 className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/carriers/${row.id}`} className="block truncate font-semibold text-slate-900 hover:text-emerald-700" title={row.companyName}>
                            {row.companyName}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-slate-500">Reg {row.registrationNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="truncate text-xs text-slate-600">{row.contactEmail ?? "—"}</p>
                      <p className="truncate text-xs text-slate-500">{row.phone ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-xs font-semibold text-slate-700">{row.uploadedDocuments}/{row.totalDocuments} · {row.progressPercentage}%</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.progressPercentage}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {row.applicationDate ? format(new Date(row.applicationDate), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", priorityBadgeClass(row.priority))}>{row.priority}</span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusBadgeClass(row.queueStatus))}>{row.queueStatus}</span>
                    </td>
                    <td className="sticky right-0 bg-white px-3 py-3 align-top shadow-[-4px_0_8px_rgba(15,23,42,0.04)] group-hover:bg-slate-50/60">
                      <div className="flex flex-col gap-1.5">
                        <button type="button" onClick={() => setExpandedId((c) => (c === row.id ? null : row.id))} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-slate-900 px-2 text-[11px] font-semibold text-white hover:bg-slate-800">
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                        <div className="flex gap-1">
                          <button type="button" title="Verify" onClick={() => void handleSingleAction("verify", row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 hover:bg-emerald-50 hover:text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /></button>
                          <button type="button" title="Reject" onClick={() => void handleSingleAction("reject", row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 hover:bg-red-50 hover:text-red-700"><UserRoundX className="h-3.5 w-3.5" /></button>
                          <button type="button" title="Request info" onClick={() => void handleSingleAction("request_info", row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60 hover:bg-amber-50 hover:text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Filter className="h-6 w-6" /></div>
                        <p className="mt-4 text-lg font-semibold text-slate-900">No pending carriers match filters</p>
                        <p className="mt-2 text-sm text-slate-500">Adjust search, status, date, or priority.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {expandedRow ? (
          <div className="mt-6 rounded-xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className={SECTION_LABEL}>Review panel</p>
                <h3 className="text-lg font-bold text-slate-900">{expandedRow.companyName}</h3>
                <p className="mt-1 text-sm text-slate-500">Documents, company details, and risk before approval.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/carriers/${expandedRow.id}`}><Button size="sm">View profile</Button></Link>
                {expandedRow.contactEmail ? (
                  <a href={`mailto:${expandedRow.contactEmail}`}><Button variant="secondary" size="sm">Contact</Button></a>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60">
                <p className="text-sm font-semibold text-slate-800">Documents</p>
                <div className="mt-3 space-y-2">
                  {expandedRow.documents.map((document) => (
                    <div key={document.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{document.name}</p>
                        <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", documentStatusClass(document.status))}>{document.status}</span>
                      </div>
                      <div className="flex gap-2">
                        {document.status !== "Missing" ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleDocumentAction(document, "view")}>View</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDocumentAction(document, "download")}>Download</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleDocumentAction(document, "request")}>Request</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60">
                  <p className="text-sm font-semibold text-slate-800">Company details</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                    <div><p className="text-[11px] text-slate-500">Fleet size</p><p className="font-medium text-slate-900">{expandedRow.fleetSize}</p></div>
                    <div><p className="text-[11px] text-slate-500">Years in business</p><p className="font-medium text-slate-900">{expandedRow.yearsInBusiness}</p></div>
                    <div className="sm:col-span-2"><p className="text-[11px] text-slate-500">Vehicle types</p><p className="font-medium text-slate-900">{expandedRow.vehicleTypes.length ? expandedRow.vehicleTypes.join(", ") : "Not set"}</p></div>
                    <div className="sm:col-span-2"><p className="text-[11px] text-slate-500">Service areas</p><p className="font-medium text-slate-900">{expandedRow.serviceAreas.length ? expandedRow.serviceAreas.join(", ") : "Not set"}</p></div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60">
                  <p className="text-sm font-semibold text-slate-800">Risk assessment</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", priorityBadgeClass(expandedRow.riskScore === "High" ? "High" : expandedRow.riskScore === "Medium" ? "Medium" : "Low"))}>{expandedRow.riskScore}</span>
                    <p className="text-xs text-slate-600">{expandedRow.riskFactors.join(" · ")}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void handleSingleAction("verify", expandedRow)}>Verify & approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => void handleSingleAction("reject", expandedRow)}>Reject</Button>
                  <Button size="sm" variant="secondary" onClick={() => void handleSingleAction("request_info", expandedRow)}>Request info</Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
                  className={cn(
                    "h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-all",
                    page === pageNumber ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200/60"
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
