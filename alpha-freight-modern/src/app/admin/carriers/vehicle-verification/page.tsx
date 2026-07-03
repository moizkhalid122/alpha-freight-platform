"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck,
  FileText,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Truck,
  UserRoundX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  mergeStoredVehicleRows,
  mergeVehicleProfile,
  readAllLocalVehicles,
  readVehicleProfiles,
  type StoredVehicleDocumentKey,
  type StoredVehicleProfile,
  type StoredVehicleRow,
} from "@/lib/carrier-vehicle-storage";
import { readCarrierExtras } from "@/lib/profile-extras";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type CarrierProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  created_at?: string | null;
};

type QueueStatus =
  | "Pending"
  | "In Review"
  | "Verified"
  | "Rejected"
  | "Info Required"
  | "On Hold";

type PriorityLevel = "High" | "Medium" | "Low";
type SortOption = "date_desc" | "date_asc" | "status" | "priority";

type VehicleVerificationRow = {
  id: string;
  carrierId: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  registrationNumber: string;
  vehicleType: string;
  makeModel: string;
  vehicleStatus: string;
  queueStatus: QueueStatus;
  documentsUploaded: number;
  totalDocuments: number;
  serviceAreas: string;
  insuranceExpiryDate: string;
  motExpiryDate: string;
  assignedDriver: string;
  submittedAt: string | null;
  row: StoredVehicleRow;
  profile: Partial<StoredVehicleProfile>;
};

const documentOrder: Array<{
  key: StoredVehicleDocumentKey;
  label: string;
  required: boolean;
}> = [
  { key: "registrationCertificate", label: "Registration Certificate", required: true },
  { key: "insuranceCertificate", label: "Insurance Certificate", required: true },
  { key: "motCertificate", label: "MOT Certificate", required: true },
  { key: "inspectionReport", label: "Vehicle Inspection Report", required: false },
];

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase();
}

function parseDateValue(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDate(value: string | null | undefined) {
  const parsed = parseDateValue(value);
  return parsed ? format(parsed, "dd MMM yyyy") : "Not available";
}

function daysUntil(value: string | null | undefined) {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.ceil((parsed.getTime() - today.getTime()) / 86400000);
}

function isSameDay(value: string | null | undefined, targetDate: Date) {
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return (
    parsed.getFullYear() === targetDate.getFullYear() &&
    parsed.getMonth() === targetDate.getMonth() &&
    parsed.getDate() === targetDate.getDate()
  );
}

function getQueueStatus(profile?: Partial<StoredVehicleProfile>): QueueStatus {
  const status = normalizeStatus(profile?.verificationStatus);
  const uploadedRequiredCount = documentOrder.filter(
    (item) => item.required && Boolean(profile?.documentUrls?.[item.key])
  ).length;
  const requiredCount = documentOrder.filter((item) => item.required).length;

  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  if (status === "needs_info" || status === "info_required") return "Info Required";
  if (status === "on_hold" || status === "hold") return "On Hold";
  if (uploadedRequiredCount === requiredCount) return "In Review";
  return "Pending";
}

function queueBadgeClass(status: QueueStatus) {
  if (status === "Verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Rejected") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Info Required") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "On Hold") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "In Review") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function getExpiryBadgeMeta(value: string | null | undefined) {
  const remainingDays = daysUntil(value);

  if (remainingDays === null) {
    return {
      label: "Not set",
      className: "border-slate-200 bg-slate-50 text-slate-500",
    };
  }

  if (remainingDays < 0) {
    return {
      label: `Expired ${Math.abs(remainingDays)}d ago`,
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (remainingDays <= 30) {
    return {
      label: `${remainingDays}d left`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Valid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getPriority(row: VehicleVerificationRow): PriorityLevel {
  const insuranceDays = daysUntil(row.insuranceExpiryDate);
  const motDays = daysUntil(row.motExpiryDate);
  const missingRequiredDocs = documentOrder.some(
    (item) => item.required && !row.profile.documentUrls?.[item.key]
  );

  if (
    missingRequiredDocs ||
    (insuranceDays !== null && insuranceDays <= 30) ||
    (motDays !== null && motDays <= 30) ||
    row.queueStatus === "Rejected" ||
    row.queueStatus === "Info Required"
  ) {
    return "High";
  }

  if (row.queueStatus === "Pending" || row.queueStatus === "In Review" || row.queueStatus === "On Hold") {
    return "Medium";
  }

  return "Low";
}

function priorityBadgeClass(priority: PriorityLevel) {
  if (priority === "High") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function prioritySortValue(priority: PriorityLevel) {
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  return 1;
}

async function fetchVehicleVerificationOverview(): Promise<VehicleVerificationRow[]> {
  const [profilesResult, vehiclesResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, company_name, role, created_at").eq("role", "carrier"),
    supabase.from("vehicles").select("*"),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as CarrierProfileRecord[];
  const supabaseVehicles = ((vehiclesResult.error ? [] : (vehiclesResult.data ?? [])) as StoredVehicleRow[]).map(
    (vehicle) => ({
      ...vehicle,
      source: "supabase" as const,
    })
  );

  const localVehicles = readAllLocalVehicles();
  const allVehicles = mergeStoredVehicleRows(supabaseVehicles, localVehicles);
  const vehicleProfiles = readVehicleProfiles();
  const profileByCarrierId = new Map(profiles.map((profile) => [profile.id, profile]));

  return allVehicles.map((vehicle) => {
    const carrierProfile = profileByCarrierId.get(vehicle.carrier_id);
    const carrierExtras = readCarrierExtras(vehicle.carrier_id);
    const storedProfile = vehicleProfiles[vehicle.id];
    const queueStatus = getQueueStatus(storedProfile);
    const documentsUploaded = documentOrder.filter((item) => storedProfile?.documentUrls?.[item.key]).length;

    return {
      id: vehicle.id,
      carrierId: vehicle.carrier_id,
      companyName:
        carrierExtras.companyName ||
        carrierProfile?.company_name ||
        carrierProfile?.full_name ||
        `Carrier ${vehicle.carrier_id.slice(0, 8)}`,
      contactEmail: carrierExtras.email || "Email not available",
      contactPhone: carrierExtras.phone || "Phone not available",
      registrationNumber: storedProfile?.registrationNumber || vehicle.name || "Vehicle",
      vehicleType: storedProfile?.vehicleType || "Not provided",
      makeModel:
        [storedProfile?.make, storedProfile?.model].filter(Boolean).join(" ") || "Not provided",
      vehicleStatus: storedProfile?.vehicleStatus || vehicle.status || "Inactive",
      queueStatus,
      documentsUploaded,
      totalDocuments: documentOrder.length,
      serviceAreas: storedProfile?.serviceAreas || "Not provided",
      insuranceExpiryDate: storedProfile?.insuranceExpiryDate || "",
      motExpiryDate: storedProfile?.motExpiryDate || "",
      assignedDriver: storedProfile?.driverName || "Unassigned",
      submittedAt: storedProfile?.savedAt || carrierProfile?.created_at || null,
      row: vehicle,
      profile: storedProfile || {},
    };
  });
}

export default function AdminCarrierVehicleVerificationPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueueStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["admin-carrier-vehicle-verification"],
    queryFn: fetchVehicleVerificationOverview,
  });

  const selectedRow = useMemo(
    () => data.find((row) => row.id === selectedVehicleId) || null,
    [data, selectedVehicleId]
  );

  useEffect(() => {
    if (!selectedRow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRow]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, sortBy, submittedFrom, submittedTo, rowsPerPage]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const fromDate = submittedFrom ? parseDateValue(submittedFrom) : null;
    const toDate = submittedTo ? parseDateValue(submittedTo) : null;

    const nextRows = data.filter((row) => {
      const priority = getPriority(row);
      const submittedDate = parseDateValue(row.submittedAt);

      const matchesSearch =
        query.length === 0 ||
        [
          row.registrationNumber,
          row.companyName,
          row.vehicleType,
          row.id,
          row.id.slice(0, 8),
          row.contactEmail,
          row.contactPhone,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "All" || row.queueStatus === statusFilter;
      const matchesPriority = priorityFilter === "All" || priority === priorityFilter;

      let matchesFrom = true;
      let matchesTo = true;

      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
        matchesFrom = submittedDate ? submittedDate >= fromDate : false;
      }

      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        matchesTo = submittedDate ? submittedDate <= toDate : false;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesFrom && matchesTo;
    });

    return nextRows.sort((left, right) => {
      if (sortBy === "date_asc" || sortBy === "date_desc") {
        const leftTime = parseDateValue(left.submittedAt)?.getTime() ?? 0;
        const rightTime = parseDateValue(right.submittedAt)?.getTime() ?? 0;
        return sortBy === "date_desc" ? rightTime - leftTime : leftTime - rightTime;
      }

      if (sortBy === "priority") {
        return getPriority(right) === getPriority(left)
          ? 0
          : prioritySortValue(getPriority(right)) - prioritySortValue(getPriority(left));
      }

      return left.queueStatus.localeCompare(right.queueStatus);
    });
  }, [data, priorityFilter, searchTerm, sortBy, statusFilter, submittedFrom, submittedTo]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(pageStartIndex, pageStartIndex + rowsPerPage);

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.includes(row.id)),
    [data, selectedIds]
  );

  const stats = useMemo(() => {
    const today = new Date();
    const expiringSoon = data.filter((row) => {
      const insuranceDays = daysUntil(row.insuranceExpiryDate);
      const motDays = daysUntil(row.motExpiryDate);
      return (
        (insuranceDays !== null && insuranceDays >= 0 && insuranceDays <= 30) ||
        (motDays !== null && motDays >= 0 && motDays <= 30)
      );
    }).length;

    const alreadyExpired = data.filter((row) => {
      const insuranceDays = daysUntil(row.insuranceExpiryDate);
      const motDays = daysUntil(row.motExpiryDate);
      return (insuranceDays !== null && insuranceDays < 0) || (motDays !== null && motDays < 0);
    }).length;

    return {
      totalPending: data.filter((row) => row.queueStatus !== "Verified" && row.queueStatus !== "Rejected")
        .length,
      inReview: data.filter((row) => row.queueStatus === "In Review").length,
      verifiedToday: data.filter((row) => isSameDay(row.profile.verifiedAt, today)).length,
      rejected: data.filter((row) => row.queueStatus === "Rejected").length,
      expiringSoon,
      alreadyExpired,
    };
  }, [data]);

  const expiryAlerts = useMemo(() => {
    return {
      insuranceSoon: data.filter((row) => {
        const value = daysUntil(row.insuranceExpiryDate);
        return value !== null && value >= 0 && value <= 30;
      }).length,
      motSoon: data.filter((row) => {
        const value = daysUntil(row.motExpiryDate);
        return value !== null && value >= 0 && value <= 30;
      }).length,
      expired: data.filter((row) => {
        const insurance = daysUntil(row.insuranceExpiryDate);
        const mot = daysUntil(row.motExpiryDate);
        return (insurance !== null && insurance < 0) || (mot !== null && mot < 0);
      }).length,
    };
  }, [data]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-vehicle-verification"] });
    toast.success("Vehicle verification queue refreshed.");
  };

  const updateVehicleVerification = async (
    vehicleId: string,
    patch: Partial<StoredVehicleProfile>,
    successMessage: string
  ) => {
    mergeVehicleProfile(vehicleId, patch);
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-vehicle-verification"] });
    toast.success(successMessage);
  };

  const selectRowForReview = (row: VehicleVerificationRow) => {
    setSelectedVehicleId(row.id);
    setVerificationNotes(row.profile.verificationNotes || "");
    setRejectionReason(row.profile.rejectionReason || "");
  };

  const getNotesForRow = (row: VehicleVerificationRow) =>
    selectedVehicleId === row.id ? verificationNotes : row.profile.verificationNotes || "";

  const getRejectionReasonForRow = (row: VehicleVerificationRow) =>
    selectedVehicleId === row.id ? rejectionReason : row.profile.rejectionReason || "";

  const runVehicleAction = async (
    row: VehicleVerificationRow,
    action: "verify" | "reject" | "request_info" | "hold"
  ) => {
    const rowNotes = getNotesForRow(row);
    const rowRejectionReason = getRejectionReasonForRow(row);

    if (action === "verify") {
      await updateVehicleVerification(
        row.id,
        {
          verificationStatus: "verified",
          verificationNotes: rowNotes,
          rejectionReason: "",
          verifiedBy: "Admin - Khalid",
          verifiedAt: new Date().toISOString(),
          requestedInfoAt: "",
        },
        `${row.registrationNumber} verified.`
      );
      return;
    }

    if (action === "reject") {
      if (!rowRejectionReason.trim()) {
        toast.error("Add a rejection reason before rejecting this vehicle.");
        return;
      }

      await updateVehicleVerification(
        row.id,
        {
          verificationStatus: "rejected",
          verificationNotes: rowNotes,
          rejectionReason: rowRejectionReason,
        },
        `${row.registrationNumber} rejected.`
      );
      return;
    }

    if (action === "request_info") {
      await updateVehicleVerification(
        row.id,
        {
          verificationStatus: "needs_info",
          verificationNotes:
            rowNotes || "Please upload the missing or corrected vehicle documents for verification.",
          requestedInfoAt: new Date().toISOString(),
        },
        `Requested more info for ${row.registrationNumber}.`
      );
      return;
    }

    await updateVehicleVerification(
      row.id,
      {
        verificationStatus: "on_hold",
        verificationNotes: rowNotes || "Vehicle review has been placed on hold by admin.",
      },
      `${row.registrationNumber} moved to hold.`
    );
  };

  const openDocument = (url?: string, label?: string) => {
    if (!url) {
      toast.error(`${label || "Document"} is not available yet.`);
      return;
    }

    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      toast.error(`Unable to open ${label || "document"} right now.`);
    }
  };

  const downloadDocument = (url?: string, filename?: string) => {
    if (!url) {
      toast.error("Document download is not available.");
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "vehicle-document";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportRows = (rows: VehicleVerificationRow[], filename: string) => {
    if (rows.length === 0) {
      toast.error("No vehicles available for export.");
      return;
    }

    const headers = [
      "#",
      "Vehicle ID",
      "Registration Number",
      "Carrier",
      "Vehicle Type",
      "Status",
      "Priority",
      "Insurance Expiry",
      "MOT Expiry",
      "Documents Uploaded",
      "Submission Date",
    ];

    const lines = rows.map((row, index) =>
      [
        index + 1,
        row.id,
        row.registrationNumber,
        row.companyName,
        row.vehicleType,
        row.queueStatus,
        getPriority(row),
        formatDate(row.insuranceExpiryDate),
        formatDate(row.motExpiryDate),
        `${row.documentsUploaded}/${row.totalDocuments}`,
        formatDate(row.submittedAt),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleBulkSelect = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((current) => current.filter((id) => !paginatedRows.some((row) => row.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...paginatedRows.map((row) => row.id)])));
  };

  const handleRowSelect = (vehicleId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((current) => Array.from(new Set([...current, vehicleId])));
      return;
    }

    setSelectedIds((current) => current.filter((id) => id !== vehicleId));
  };

  const isPageFullySelected =
    paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.id));

  const handleBulkAction = async (
    action: "verify" | "reject" | "request_info" | "export"
  ) => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one vehicle first.");
      return;
    }

    if (action === "export") {
      exportRows(selectedRows, "selected-vehicle-verification.csv");
      toast.success("Selected vehicles exported.");
      return;
    }

    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Add a rejection reason before bulk rejecting vehicles.");
      return;
    }

    selectedRows.forEach((row) => {
      if (action === "verify") {
        mergeVehicleProfile(row.id, {
          verificationStatus: "verified",
          verificationNotes: verificationNotes || row.profile.verificationNotes || "",
          rejectionReason: "",
          verifiedBy: "Admin - Khalid",
          verifiedAt: new Date().toISOString(),
          requestedInfoAt: "",
        });
        return;
      }

      if (action === "reject") {
        mergeVehicleProfile(row.id, {
          verificationStatus: "rejected",
          verificationNotes: verificationNotes || row.profile.verificationNotes || "",
          rejectionReason,
        });
        return;
      }

      mergeVehicleProfile(row.id, {
        verificationStatus: "needs_info",
        verificationNotes:
          verificationNotes || "Please upload the missing or corrected vehicle documents.",
        requestedInfoAt: new Date().toISOString(),
      });
    });

    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-vehicle-verification"] });
    setSelectedIds([]);

    if (action === "verify") toast.success("Selected vehicles verified.");
    if (action === "reject") toast.success("Selected vehicles rejected.");
    if (action === "request_info") toast.success("Requested more info for selected vehicles.");
  };

  const checklist = selectedRow
    ? [
        {
          label: "Registration Number Valid",
          passed: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$/.test(selectedRow.registrationNumber.trim()),
          detail: selectedRow.registrationNumber,
        },
        {
          label: "Insurance Valid",
          passed: (daysUntil(selectedRow.insuranceExpiryDate) ?? -1) >= 0,
          detail: formatDate(selectedRow.insuranceExpiryDate),
        },
        {
          label: "MOT Valid",
          passed: (daysUntil(selectedRow.motExpiryDate) ?? -1) >= 0,
          detail: formatDate(selectedRow.motExpiryDate),
        },
        {
          label: "Vehicle Type Matches",
          passed: selectedRow.vehicleType !== "Not provided" && selectedRow.makeModel !== "Not provided",
          detail: `${selectedRow.vehicleType} / ${selectedRow.makeModel}`,
        },
      ]
    : [];

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Vehicle Verification
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Vehicle verification queue with filters, expiry alerts, and review controls
              </h1>
              <p className="max-w-3xl text-sm text-slate-500">
                Search vehicles, manage review priority, verify documents, and handle bulk actions
                from one compact admin surface.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl border-slate-200 px-4"
              onClick={handleRefresh}
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", isFetching ? "animate-spin" : "")} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl border-slate-200 px-4"
              onClick={() => exportRows(filteredRows, "vehicle-verification-queue.csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(160px,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by registration, carrier name, or vehicle ID"
              className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as QueueStatus | "All")}
            className="h-12 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {["All", "Pending", "In Review", "Verified", "Rejected", "Info Required", "On Hold"].map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              )
            )}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as PriorityLevel | "All")}
            className="h-12 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {["All", "High", "Medium", "Low"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={submittedFrom}
            onChange={(event) => setSubmittedFrom(event.target.value)}
            className="h-12 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-12 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            <option value="date_desc">Date: Newest</option>
            <option value="date_asc">Date: Oldest</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(160px,1fr))]">
          <input
            type="date"
            value={submittedTo}
            onChange={(event) => setSubmittedTo(event.target.value)}
            className="h-12 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Pending", value: stats.totalPending, tone: "text-slate-950" },
          { label: "In Review", value: stats.inReview, tone: "text-sky-600" },
          { label: "Verified Today", value: stats.verifiedToday, tone: "text-emerald-600" },
          { label: "Rejected", value: stats.rejected, tone: "text-red-600" },
          { label: "Expiring Soon", value: stats.expiringSoon, tone: "text-amber-600" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              {card.label}
            </p>
            <p className={cn("mt-3 text-3xl font-semibold tracking-tight", card.tone)}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: "Insurance Expiring Soon",
            value: expiryAlerts.insuranceSoon,
            description: "Vehicles with insurance expiring within 30 days.",
            tone: "border-amber-200 bg-amber-50/60 text-amber-800",
          },
          {
            label: "MOT Expiring Soon",
            value: expiryAlerts.motSoon,
            description: "Vehicles with MOT expiring within 30 days.",
            tone: "border-sky-200 bg-sky-50/60 text-sky-800",
          },
          {
            label: "Already Expired",
            value: expiryAlerts.expired,
            description: "Vehicles that need immediate action from admin.",
            tone: "border-red-200 bg-red-50/60 text-red-800",
          },
        ].map((alert) => (
          <div
            key={alert.label}
            className={cn("rounded-[28px] border px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]", alert.tone)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-70">
                  Expiry Alert
                </p>
                <h3 className="mt-2 text-lg font-semibold">{alert.label}</h3>
                <p className="mt-2 text-sm opacity-80">{alert.description}</p>
              </div>
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{alert.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <th className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={isPageFullySelected}
                    onChange={(event) => handleBulkSelect(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Vehicle Reg</th>
                <th className="px-5 py-4">Carrier</th>
                <th className="px-5 py-4">Vehicle Type</th>
                <th className="px-5 py-4">Documents</th>
                <th className="px-5 py-4">Insurance Expiry</th>
                <th className="px-5 py-4">MOT Expiry</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-sm text-slate-500">
                    Loading vehicle verification queue...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-sm text-slate-500">
                    No vehicles match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const priority = getPriority(row);
                  const insuranceMeta = getExpiryBadgeMeta(row.insuranceExpiryDate);
                  const motMeta = getExpiryBadgeMeta(row.motExpiryDate);

                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={(event) => handleRowSelect(row.id, event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                        {pageStartIndex + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => selectRowForReview(row)}
                          className="text-left"
                        >
                          <p className="text-sm font-semibold text-slate-950 transition hover:text-slate-700">
                            {row.registrationNumber}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">ID: {row.id.slice(0, 8).toUpperCase()}</p>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/carriers/${row.carrierId}`}
                          className="text-sm font-semibold text-slate-950 transition hover:text-slate-700"
                        >
                          {row.companyName}
                        </Link>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>{row.contactEmail}</p>
                          <p>{row.contactPhone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.vehicleType}</td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {row.documentsUploaded}/{row.totalDocuments} uploaded
                          </p>
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-900"
                              style={{
                                width: `${Math.max(
                                  8,
                                  (row.documentsUploaded / Math.max(row.totalDocuments, 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{formatDate(row.insuranceExpiryDate)}</p>
                        <span
                          className={cn(
                            "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            insuranceMeta.className
                          )}
                        >
                          {insuranceMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{formatDate(row.motExpiryDate)}</p>
                        <span
                          className={cn(
                            "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            motMeta.className
                          )}
                        >
                          {motMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            queueBadgeClass(row.queueStatus)
                          )}
                        >
                          {row.queueStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            priorityBadgeClass(priority)
                          )}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => selectRowForReview(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void runVehicleAction(row, "verify")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            title="Verify"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void runVehicleAction(row, "reject")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                            title="Reject"
                          >
                            <UserRoundX className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void runVehicleAction(row, "request_info")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                            title="Request Info"
                          >
                            <ShieldQuestion className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500">
            Showing {filteredRows.length === 0 ? 0 : pageStartIndex + 1}-
            {Math.min(pageStartIndex + paginatedRows.length, filteredRows.length)} of {filteredRows.length}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-500">
              Rows:
              <select
                value={rowsPerPage}
                onChange={(event) => setRowsPerPage(Number(event.target.value))}
                className="ml-2 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none"
              >
                {[10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl border-slate-200 px-3"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-600">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl border-slate-200 px-3"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-md">
          <button
            type="button"
            aria-label="Close vehicle review"
            className="absolute inset-0"
            onClick={() => setSelectedVehicleId(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-6 backdrop-blur">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Vehicle Detail - Review Mode
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {selectedRow.registrationNumber} - {selectedRow.companyName}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Review the vehicle, verify documents, save admin notes, and decide the next action.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/admin/carriers/${selectedRow.carrierId}`}>
                    <Button type="button" variant="secondary" className="rounded-2xl border-slate-200">
                      <ChevronRight className="mr-2 h-4 w-4" />
                      View Carrier Profile
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleId(null)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Vehicle Summary</h3>
                    <p className="text-sm text-slate-500">Core vehicle and carrier profile details.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Registration Number", value: selectedRow.registrationNumber },
                    { label: "Carrier", value: selectedRow.companyName },
                    { label: "Vehicle Type", value: selectedRow.vehicleType },
                    { label: "Make / Model", value: selectedRow.makeModel },
                    {
                      label: "Weight Capacity",
                      value: selectedRow.profile.weightCapacityKg
                        ? `${Number(selectedRow.profile.weightCapacityKg).toLocaleString()} kg`
                        : "Not provided",
                    },
                    { label: "Fuel Type", value: selectedRow.profile.fuelType || "Not provided" },
                    { label: "Service Areas", value: selectedRow.serviceAreas },
                    { label: "Assigned Driver", value: selectedRow.assignedDriver },
                    { label: "Submission Date", value: formatDate(selectedRow.submittedAt) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Documents to Verify</h3>
                    <p className="text-sm text-slate-500">
                      Review uploaded documents and download them if needed.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {documentOrder.map((documentField) => {
                    const documentName =
                      selectedRow.profile.documentNames?.[documentField.key] || "Not uploaded";
                    const documentUrl = selectedRow.profile.documentUrls?.[documentField.key];
                    const uploaded = Boolean(documentUrl);

                    return (
                      <div
                        key={documentField.key}
                        className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_160px_auto]"
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            {documentField.label}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{documentName}</p>
                        </div>

                        <div className="flex items-center">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              uploaded
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            )}
                          >
                            {uploaded ? "Uploaded" : "Missing"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl border-slate-200"
                            onClick={() => openDocument(documentUrl, documentField.label)}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl border-slate-200"
                            onClick={() => downloadDocument(documentUrl, documentName)}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Verification Checklist</h3>
                    <p className="text-sm text-slate-500">Quick validation checks for admin review.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full",
                            item.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {item.passed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          item.passed
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {item.passed ? "Verified" : "Needs Check"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Admin Notes</h3>
                    <p className="text-sm text-slate-500">
                      Save verification notes and rejection reason before taking action.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(event) => setVerificationNotes(event.target.value)}
                      rows={4}
                      placeholder="Add admin comments, review summary, or missing document notes..."
                      className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      rows={3}
                      placeholder="Only required when rejecting the vehicle..."
                      className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" className="rounded-2xl" onClick={() => void runVehicleAction(selectedRow, "verify")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify Vehicle
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => void runVehicleAction(selectedRow, "reject")}
                  >
                    <UserRoundX className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => void runVehicleAction(selectedRow, "request_info")}
                  >
                    <ShieldQuestion className="mr-2 h-4 w-4" />
                    Request More Info
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-2xl border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={() => void runVehicleAction(selectedRow, "hold")}
                  >
                    Hold
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Current Status
                    </p>
                    <span
                      className={cn(
                        "mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        queueBadgeClass(selectedRow.queueStatus)
                      )}
                    >
                      {selectedRow.queueStatus}
                    </span>
                  </div>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Last Verified
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedRow.profile.verifiedBy
                        ? `${selectedRow.profile.verifiedBy} on ${formatDate(selectedRow.profile.verifiedAt)}`
                        : "Not verified yet"}
                    </p>
                  </div>
                </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Carrier Contact</h3>
                    <p className="text-sm text-slate-500">
                      Use these details for follow-up if more information is required.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">{selectedRow.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">{selectedRow.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">
                      Submitted {formatDate(selectedRow.submittedAt)}
                    </span>
                  </div>
                </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Bulk Actions
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {selectedRows.length} vehicle{selectedRows.length === 1 ? "" : "s"} selected for bulk review.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" className="rounded-2xl" onClick={() => void handleBulkAction("verify")}>
              Verify Selected
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => void handleBulkAction("reject")}
            >
              Reject Selected
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl border-slate-200"
              onClick={() => void handleBulkAction("export")}
            >
              Export Selected
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => void handleBulkAction("request_info")}
            >
              Request Info Selected
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
