"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Mail,
  PauseCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readCarrierExtras, readSupplierExtras } from "@/lib/profile-extras";
import {
  mergeCarrierPaymentOrder,
  readCarrierPaymentOrders,
  type CarrierPaymentPriority,
  type CarrierPaymentRecord,
  type CarrierPaymentStatus,
  upsertCarrierPaymentOrder,
} from "@/lib/carrier-payments";
import {
  mergeCarrierWalletPayout,
  readCarrierWalletPayouts,
} from "@/lib/carrier-wallet-payouts";
import {
  mergeCarrierPodUpload,
  readCarrierPodUploads,
} from "@/lib/carrier-pod-uploads";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type DateRangeValue = "today" | "7d" | "30d" | "custom";
type StatusFilterValue = "all" | CarrierPaymentStatus;
type PriorityFilterValue = "all" | CarrierPaymentPriority;
type SortValue = "date" | "amount" | "status" | "due_date";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  role?: string | null;
};

type LoadRecord = {
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

type PaymentRow = CarrierPaymentRecord & {
  sourceType: "load_payment" | "wallet_payout";
  walletPayoutId?: string | null;
  carrierName: string;
  shipperName: string;
  loadReference: string;
  route: string;
  loadStatus: string;
  priorityLabel: string;
  statusLabel: string;
  overdueDays: number;
  documents: Array<{
    label: string;
    status: "uploaded" | "missing";
    actionLabel: string;
  }>;
  checklist: Array<{
    label: string;
    checked: boolean;
  }>;
};

type CarrierPaymentsData = {
  rows: PaymentRow[];
};

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);
const DATE_RANGE_OPTIONS: Array<{ label: string; value: DateRangeValue }> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Custom", value: "custom" },
];
const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Verified", value: "verified" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "On Hold", value: "on_hold" },
];
const PRIORITY_OPTIONS = [
  { label: "All priorities", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];
const SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Amount", value: "amount" },
  { label: "Status", value: "status" },
  { label: "Due Date", value: "due_date" },
];
const ROWS_PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildSelectStyles() {
  return {
    control: () =>
      "flex min-h-12 items-center rounded-[20px] border border-slate-200 bg-slate-50 px-3",
    menu: () => "mt-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-xl",
    option: ({ isFocused }: { isFocused: boolean }) =>
      `cursor-pointer rounded-2xl px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
    placeholder: () => "text-sm text-slate-400",
    singleValue: () => "text-sm font-semibold text-slate-900",
  };
}

function getRangeStart(dateRange: DateRangeValue, customStart: string) {
  if (dateRange === "custom" && customStart) {
    return startOfDay(new Date(customStart));
  }

  if (dateRange === "today") return startOfDay(new Date());
  if (dateRange === "7d") return startOfDay(subDays(new Date(), 6));
  return startOfDay(subDays(new Date(), 29));
}

function getRangeEnd(dateRange: DateRangeValue, customEnd: string) {
  if (dateRange === "custom" && customEnd) {
    return new Date(`${customEnd}T23:59:59`);
  }

  return new Date();
}

function priorityLabel(priority: CarrierPaymentPriority) {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function statusLabel(status: CarrierPaymentStatus) {
  if (status === "pending_review") return "Pending Review";
  if (status === "verified") return "Verified";
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  return "On Hold";
}

function mapWalletPayoutStatus(status: CarrierPaymentStatus) {
  if (status === "paid") return "completed" as const;
  if (status === "on_hold") return "on_hold" as const;
  if (status === "failed") return "failed" as const;
  return "processing" as const;
}

function priorityBadge(priority: CarrierPaymentPriority) {
  if (priority === "high") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusBadge(status: CarrierPaymentStatus) {
  if (status === "pending_review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "verified") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getRouteLabel(load: LoadRecord) {
  const origin = (load.origin || load.pickup_location || "Origin").split(",")[0]?.trim();
  const destination = (load.destination || load.delivery_location || "Destination")
    .split(",")[0]
    ?.trim();
  return `${origin || "Origin"} -> ${destination || "Destination"}`;
}

function buildPriority(dueDate: string): CarrierPaymentPriority {
  const due = getDateOrNull(dueDate);
  if (!due) return "medium";
  const diffMs = due.getTime() - new Date().getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "high";
  if (diffDays <= 3) return "medium";
  return "low";
}

function buildPaymentRecord(load: LoadRecord): CarrierPaymentRecord | null {
  if (!load.carrier_id) return null;
  if (!DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))) return null;

  const amount = toNumber(load.price);
  const invoiceDate = load.created_at ?? new Date().toISOString();
  const dueDate = new Date(new Date(invoiceDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const fuelSurcharge = Number((amount * 0.07).toFixed(2));
  const vatAmount = 0;
  const baseRate = Number((amount - fuelSurcharge - vatAmount).toFixed(2));
  const loadCode = load.id.slice(0, 8).toUpperCase();
  const invoiceNumber = `INV-${loadCode}`;
  const transactionId = `TX-${loadCode}-001`;

  return {
    transactionId,
    loadId: load.id,
    carrierId: load.carrier_id,
    supplierId: load.supplier_id,
    amount,
    baseRate,
    fuelSurcharge,
    vatAmount,
    invoiceNumber,
    invoiceDate,
    dueDate,
    status: "pending_review",
    priority: buildPriority(dueDate),
  };
}

function getLoadPaymentStatus(loadId: string, podStatus?: string | null): CarrierPaymentStatus {
  const normalizedPodStatus = normalizeStatus(podStatus);
  if (normalizedPodStatus === "verified") return "verified";
  if (normalizedPodStatus === "on_hold") return "on_hold";
  if (normalizedPodStatus === "rejected") return "failed";

  const existing = readCarrierPaymentOrders().find((item) => item.loadId === loadId);
  return existing?.status || "pending_review";
}

async function fetchCarrierPayments(): Promise<CarrierPaymentsData> {
  const [profilesResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase
      .from("loads")
      .select(
        "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at"
      )
      .not("carrier_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as ProfileRecord[];
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as LoadRecord[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const storedOrders = new Map(readCarrierPaymentOrders().map((item) => [item.transactionId, item]));
  const podUploads = readCarrierPodUploads();
  const walletPayouts = readCarrierWalletPayouts();

  const loadRows = loads
    .map((load) => {
      const baseRecord = buildPaymentRecord(load);
      if (!baseRecord) return null;

      const podRecord = podUploads[load.id];
      const derivedStatus = getLoadPaymentStatus(load.id, podRecord?.verificationStatus);
      const existing = storedOrders.get(baseRecord.transactionId);
      const record =
        existing ??
        upsertCarrierPaymentOrder({
          ...baseRecord,
          status: derivedStatus,
          verifiedAt: derivedStatus === "verified" ? podRecord?.verifiedAt || null : null,
        });
      const carrierProfile = profileById.get(record.carrierId);
      const supplierProfile = record.supplierId ? profileById.get(record.supplierId) : null;
      const carrierExtras = readCarrierExtras(record.carrierId);
      const supplierExtras = record.supplierId ? readSupplierExtras(record.supplierId) : {};
      const dueDate = getDateOrNull(record.dueDate);
      const hasPodDocument = Boolean(podRecord?.uploadedAt);
      const invoiceGenerated = Boolean(record.invoiceNumber);
      const loadConfirmationReady = Boolean(load.id && load.created_at);
      const overdueDays = dueDate
        ? Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const checklistBase = [
        { label: "POD Submitted", checked: hasPodDocument },
        { label: "Load Delivered", checked: DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)) },
        { label: "Invoice Generated", checked: invoiceGenerated },
        { label: "Carrier Payout Setup Complete", checked: Boolean(carrierExtras.payoutSetupComplete) },
        { label: "Payment Amount Correct", checked: amountMatches(record) },
      ];

      return {
        ...record,
        sourceType: "load_payment" as const,
        walletPayoutId: null,
        carrierName:
          carrierExtras.companyName?.trim() ||
          carrierProfile?.company_name?.trim() ||
          carrierProfile?.full_name?.trim() ||
          `Carrier ${record.carrierId.slice(0, 8)}`,
        shipperName:
          supplierExtras.companyName?.trim() ||
          supplierProfile?.company_name?.trim() ||
          supplierProfile?.full_name?.trim() ||
          "Marketplace shipper",
        loadReference: record.loadId.slice(0, 8).toUpperCase(),
        route: getRouteLabel(load),
        loadStatus: load.status ?? "delivered",
        priorityLabel: priorityLabel(record.priority),
        statusLabel: statusLabel(record.status),
        overdueDays,
        documents: [
          {
            label:
              podRecord?.mode === "team"
                ? "Alpha Freight POD Review Request"
                : podRecord?.name || "POD (Proof of Delivery)",
            status: hasPodDocument ? "uploaded" : "missing",
            actionLabel: hasPodDocument ? "View / Download" : "Request",
          },
          {
            label: `Invoice #${record.invoiceNumber}`,
            status: invoiceGenerated ? "uploaded" : "missing",
            actionLabel: invoiceGenerated ? "View / Download" : "Request",
          },
          {
            label: "Load Confirmation",
            status: loadConfirmationReady ? "uploaded" : "missing",
            actionLabel: loadConfirmationReady ? "View / Download" : "Request",
          },
        ],
        checklist: checklistBase,
      } satisfies PaymentRow;
    })
    .filter(Boolean) as PaymentRow[];

  const walletRows = walletPayouts.map((payout) => {
    const payoutCode = payout.id.slice(0, 8).toUpperCase();
    const transactionId = `WP-${payoutCode}`;
    const baseRecord: CarrierPaymentRecord = {
      transactionId,
      loadId: payout.id,
      carrierId: payout.carrierId,
      supplierId: null,
      amount: payout.amount,
      baseRate: payout.amount,
      fuelSurcharge: 0,
      vatAmount: 0,
      invoiceNumber: `WPR-${payoutCode}`,
      invoiceDate: payout.createdAt,
      dueDate: payout.createdAt,
      status:
        payout.status === "completed"
          ? "paid"
          : payout.status === "on_hold"
            ? "on_hold"
            : payout.status === "failed"
              ? "failed"
              : "pending_review",
      priority: "high",
      verificationNotes: payout.internalNote?.trim() || "Carrier initiated wallet payout request.",
    };

    const existing = storedOrders.get(transactionId);
    const record = existing ?? upsertCarrierPaymentOrder(baseRecord);
    const carrierProfile = profileById.get(payout.carrierId);
    const carrierExtras = readCarrierExtras(payout.carrierId);

    return {
      ...record,
      sourceType: "wallet_payout" as const,
      walletPayoutId: payout.id,
      carrierName:
        carrierExtras.companyName?.trim() ||
        carrierProfile?.company_name?.trim() ||
        carrierProfile?.full_name?.trim() ||
        `Carrier ${payout.carrierId.slice(0, 8)}`,
      shipperName: "Wallet payout request",
      loadReference: `PAY-${payoutCode}`,
      route: `${payout.bankName} • • • • ${payout.accountSuffix}`,
      loadStatus: "wallet_payout",
      priorityLabel: priorityLabel(record.priority),
      statusLabel: statusLabel(record.status),
      overdueDays: 0,
      documents: [
        {
          label: `Destination • ${payout.bankName} • • • • ${payout.accountSuffix}`,
          status: "uploaded",
          actionLabel: "View",
        },
        {
          label: `Account Holder • ${payout.accountHolder}`,
          status: "uploaded",
          actionLabel: "View",
        },
        {
          label: payout.internalNote?.trim() ? `Internal Note • ${payout.internalNote.trim()}` : "Internal Note",
          status: payout.internalNote?.trim() ? "uploaded" : "missing",
          actionLabel: payout.internalNote?.trim() ? "View" : "Request",
        },
      ],
      checklist: [
        { label: "Carrier payout request submitted", checked: true },
        { label: "Payout setup complete", checked: Boolean(carrierExtras.payoutSetupComplete) },
        { label: "Bank destination available", checked: Boolean(payout.bankName && payout.accountSuffix) },
        { label: "Admin review completed", checked: record.status === "verified" || record.status === "paid" },
        { label: "Funds released", checked: record.status === "paid" },
      ],
    } satisfies PaymentRow;
  });

  const rows = [...walletRows, ...loadRows].sort(
    (left, right) =>
      (getDateOrNull(right.invoiceDate)?.getTime() ?? 0) - (getDateOrNull(left.invoiceDate)?.getTime() ?? 0)
  );

  return { rows };
}

function amountMatches(record: CarrierPaymentRecord) {
  const total = Number((record.baseRate + record.fuelSurcharge + record.vatAmount).toFixed(2));
  return total === Number(record.amount.toFixed(2));
}

function exportRows(rows: PaymentRow[]) {
  if (rows.length === 0) {
    toast.error("No payments available to export.");
    return;
  }

  const csvRows = [
    [
      "Transaction ID",
      "Carrier",
      "Load ID",
      "Amount",
      "Invoice Date",
      "Due Date",
      "Status",
      "Priority",
    ],
    ...rows.map((row) => [
      row.transactionId,
      row.carrierName,
      row.loadReference,
      formatMoney(row.amount),
      format(new Date(row.invoiceDate), "dd/MM/yyyy"),
      format(new Date(row.dueDate), "dd/MM/yyyy"),
      row.statusLabel,
      row.priorityLabel,
    ]),
  ];

  const csv = csvRows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "carrier-payments.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Carrier payments exported.");
}

function StatsCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm text-slate-500">{note}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function CarrierPaymentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>("30d");
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("date");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-carrier-payments"],
    queryFn: fetchCarrierPayments,
  });

  const rangeStart = useMemo(
    () => getRangeStart(dateRange, customStart),
    [dateRange, customStart]
  );
  const rangeEnd = useMemo(() => getRangeEnd(dateRange, customEnd), [dateRange, customEnd]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return (data?.rows ?? [])
      .filter((row) => {
        const invoiceText = row.invoiceNumber.toLowerCase();
        const dueDate = getDateOrNull(row.dueDate);
        const invoiceDate = getDateOrNull(row.invoiceDate);
        const inRange =
          Boolean(invoiceDate && invoiceDate >= rangeStart && invoiceDate <= rangeEnd) ||
          Boolean(dueDate && dueDate >= rangeStart && dueDate <= rangeEnd);

        if (!inRange) return false;
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
        if (!search) return true;

        return (
          row.carrierName.toLowerCase().includes(search) ||
          row.loadReference.toLowerCase().includes(search) ||
          invoiceText.includes(search) ||
          row.transactionId.toLowerCase().includes(search)
        );
      })
      .sort((left, right) => {
        if (sortBy === "amount") return right.amount - left.amount;
        if (sortBy === "status") return left.statusLabel.localeCompare(right.statusLabel);
        if (sortBy === "due_date") {
          return (getDateOrNull(left.dueDate)?.getTime() ?? 0) - (getDateOrNull(right.dueDate)?.getTime() ?? 0);
        }
        return (getDateOrNull(right.invoiceDate)?.getTime() ?? 0) - (getDateOrNull(left.invoiceDate)?.getTime() ?? 0);
      });
  }, [customEnd, data?.rows, dateRange, priorityFilter, rangeEnd, rangeStart, searchTerm, sortBy, statusFilter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredRows.length, page, rowsPerPage]);

  useEffect(() => {
    if (selectedTransactionId && !filteredRows.some((row) => row.transactionId === selectedTransactionId)) {
      setSelectedTransactionId(null);
    }
  }, [filteredRows, selectedTransactionId]);

  useEffect(() => {
    const selected = filteredRows.find((row) => row.transactionId === selectedTransactionId);
    setVerificationNotes(selected?.verificationNotes ?? "");
    setDisputeReason(selected?.disputeReason ?? "");
  }, [filteredRows, selectedTransactionId]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedRow = filteredRows.find((row) => row.transactionId === selectedTransactionId) ?? null;
  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.transactionId));

  const stats = useMemo(() => {
    const pendingReview = filteredRows.filter((row) => row.status === "pending_review").length;
    const readyToRelease = filteredRows.filter((row) => row.status === "verified").length;
    const totalPendingAmount = filteredRows
      .filter((row) => row.status === "pending_review" || row.status === "verified" || row.status === "on_hold")
      .reduce((sum, row) => sum + row.amount, 0);
    const releasedToday = filteredRows
      .filter((row) => row.status === "paid" && row.releasedAt && startOfDay(new Date(row.releasedAt)).getTime() === startOfDay(new Date()).getTime())
      .reduce((sum, row) => sum + row.amount, 0);
    const overdue = filteredRows.filter((row) => row.overdueDays >= 3 && row.status !== "paid").length;

    return [
      { label: "Pending Review", value: pendingReview.toLocaleString(), note: "Payments waiting for admin check", icon: Clock3 },
      { label: "Ready to Release", value: readyToRelease.toLocaleString(), note: "Verified and pending payout release", icon: CheckCircle2 },
      { label: "Total Pending Amount", value: formatMoney(totalPendingAmount), note: "Pending review, verified, and on hold", icon: CircleDollarSign },
      { label: "Released Today", value: formatMoney(releasedToday), note: "Payments completed today", icon: ArrowUpRight },
      { label: "Overdue", value: overdue.toLocaleString(), note: "Payments overdue by 3+ days", icon: AlertCircle },
    ];
  }, [filteredRows]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] });
    toast.success("Carrier payments refreshed.");
  };

  const updatePaymentState = async (
    row: PaymentRow,
    transactionId: string,
    updates: Partial<CarrierPaymentRecord>,
    successMessage: string
  ) => {
    mergeCarrierPaymentOrder(transactionId, updates);

    if (row.sourceType === "wallet_payout" && row.walletPayoutId) {
      mergeCarrierWalletPayout(row.walletPayoutId, {
        status: mapWalletPayoutStatus(updates.status ?? row.status),
      });
    }

    if (row.sourceType === "load_payment" && (updates.status === "verified" || updates.status === "paid")) {
      mergeCarrierPodUpload(row.loadId, {
        verificationStatus: "verified",
        verifiedAt: updates.verifiedAt ?? new Date().toISOString(),
        verifiedBy: "Admin - Khalid",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin - Khalid",
        reviewNote: updates.verificationNotes ?? row.verificationNotes ?? null,
      });
    }

    if (row.sourceType === "load_payment" && updates.status === "on_hold") {
      mergeCarrierPodUpload(row.loadId, {
        verificationStatus: "on_hold",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin - Khalid",
        reviewNote: updates.disputeReason ?? row.disputeReason ?? "POD review placed on hold.",
      });
    }

    if (row.sourceType === "load_payment" && updates.status === "failed") {
      mergeCarrierPodUpload(row.loadId, {
        verificationStatus: "rejected",
        rejectedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin - Khalid",
        reviewNote: updates.disputeReason ?? row.disputeReason ?? "POD review rejected.",
      });
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] });
    toast.success(successMessage);
  };

  const handleBulkUpdate = async (
    status: CarrierPaymentStatus,
    successMessage: string
  ) => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one payment first.");
      return;
    }

    selectedRows.forEach((row) => {
      mergeCarrierPaymentOrder(row.transactionId, {
        status,
        verificationNotes: verificationNotes || row.verificationNotes,
        disputeReason: disputeReason || row.disputeReason,
        verifiedAt: status === "verified" ? new Date().toISOString() : row.verifiedAt,
        releasedAt: status === "paid" ? new Date().toISOString() : row.releasedAt,
        heldAt: status === "on_hold" ? new Date().toISOString() : row.heldAt,
      });

      if (row.sourceType === "wallet_payout" && row.walletPayoutId) {
        mergeCarrierWalletPayout(row.walletPayoutId, {
          status: mapWalletPayoutStatus(status),
        });
      }

      if (row.sourceType === "load_payment" && (status === "verified" || status === "paid")) {
        mergeCarrierPodUpload(row.loadId, {
          verificationStatus: "verified",
          verifiedAt: new Date().toISOString(),
          verifiedBy: "Admin - Khalid",
          reviewedAt: new Date().toISOString(),
          reviewedBy: "Admin - Khalid",
          reviewNote: verificationNotes || row.verificationNotes || null,
        });
      }

      if (row.sourceType === "load_payment" && status === "on_hold") {
        mergeCarrierPodUpload(row.loadId, {
          verificationStatus: "on_hold",
          reviewedAt: new Date().toISOString(),
          reviewedBy: "Admin - Khalid",
          reviewNote: disputeReason || row.disputeReason || "POD review placed on hold.",
        });
      }
    });

    setSelectedIds([]);
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] });
    toast.success(successMessage);
  };

  return (
    <>
    <div
      className={cn(
        "space-y-6 pb-8 transition duration-200",
        selectedRow ? "pointer-events-none select-none blur-[4px]" : ""
      )}
    >
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Carrier Payments
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Carrier payments verification queue with review and release controls
              </h1>
              <p className="max-w-3xl text-sm text-slate-500">
                Review delivered-load payouts, verify supporting documents, release cleared payments,
                and hold disputed transactions from one compact admin surface.
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
              onClick={() => exportRows(filteredRows)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,0.55fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by carrier name, load ID, invoice number"
              className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <Select
            instanceId="carrier-payments-range"
            isSearchable={false}
            options={DATE_RANGE_OPTIONS}
            value={DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)}
            onChange={(option) => {
              setDateRange((option?.value as DateRangeValue) || "30d");
              setPage(1);
            }}
            classNames={buildSelectStyles()}
          />

          <Select
            instanceId="carrier-payments-status"
            isSearchable={false}
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((option) => option.value === statusFilter)}
            onChange={(option) => {
              setStatusFilter((option?.value as StatusFilterValue) || "all");
              setPage(1);
            }}
            classNames={buildSelectStyles()}
          />

          <Select
            instanceId="carrier-payments-priority"
            isSearchable={false}
            options={PRIORITY_OPTIONS}
            value={PRIORITY_OPTIONS.find((option) => option.value === priorityFilter)}
            onChange={(option) => {
              setPriorityFilter((option?.value as PriorityFilterValue) || "all");
              setPage(1);
            }}
            classNames={buildSelectStyles()}
          />

          <Select
            instanceId="carrier-payments-sort"
            isSearchable={false}
            options={SORT_OPTIONS}
            value={SORT_OPTIONS.find((option) => option.value === sortBy)}
            onChange={(option) => setSortBy((option?.value as SortValue) || "date")}
            classNames={buildSelectStyles()}
          />

          <div className="flex items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
            <Filter className="mr-2 h-4 w-4" />
            Review mode
          </div>
        </div>

        {dateRange === "custom" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Custom start
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-600">
              Custom end
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {stats.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Payment Queue
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Delivered-load payments and wallet payout queue
            </h2>
          </div>

          <Select
            instanceId="carrier-payments-rows"
            isSearchable={false}
            options={ROWS_PER_PAGE_OPTIONS}
            value={ROWS_PER_PAGE_OPTIONS.find((option) => option.value === rowsPerPage)}
            onChange={(option) => {
              setRowsPerPage(Number(option?.value) || 10);
              setPage(1);
            }}
            classNames={buildSelectStyles()}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <th className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.transactionId))}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? Array.from(new Set([...current, ...paginatedRows.map((row) => row.transactionId)]))
                          : current.filter((id) => !paginatedRows.some((row) => row.transactionId === id))
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Carrier</th>
                <th className="px-5 py-4">Load ID</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Invoice Date</th>
                <th className="px-5 py-4">Due Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-slate-500">
                    Loading carrier payments...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-slate-500">
                    No payments match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={row.transactionId}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.transactionId)}
                        onChange={(event) =>
                          setSelectedIds((current) =>
                            event.target.checked
                              ? [...current, row.transactionId]
                              : current.filter((id) => id !== row.transactionId)
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                      {(page - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTransactionId(row.transactionId)}
                          className="text-left text-sm font-semibold text-slate-950 transition hover:text-slate-700"
                        >
                          {row.carrierName}
                        </button>
                        <p className="text-xs text-slate-500">{row.transactionId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/loads`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
                        {row.loadReference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {format(new Date(row.invoiceDate), "dd/MM/yy")}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {format(new Date(row.dueDate), "dd/MM/yy")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusBadge(row.status))}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", priorityBadge(row.priority))}>
                        {row.priorityLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          title="Review"
                          onClick={() => setSelectedTransactionId(row.transactionId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Verify"
                          onClick={() =>
                            void updatePaymentState(
                              row,
                              row.transactionId,
                              {
                                status: "verified",
                                verificationNotes: verificationNotes || row.verificationNotes,
                                verifiedAt: new Date().toISOString(),
                              },
                              `${row.carrierName} payment verified.`
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Release"
                          onClick={() =>
                            void updatePaymentState(
                              row,
                              row.transactionId,
                              {
                                status: "paid",
                                verificationNotes: verificationNotes || row.verificationNotes,
                                verifiedAt: row.verifiedAt ?? new Date().toISOString(),
                                releasedAt: new Date().toISOString(),
                              },
                              `${row.carrierName} payment released.`
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Hold"
                          onClick={() =>
                            void updatePaymentState(
                              row,
                              row.transactionId,
                              {
                                status: "on_hold",
                                disputeReason: disputeReason || row.disputeReason || "Awaiting clarification.",
                                heldAt: new Date().toISOString(),
                              },
                              `${row.carrierName} payment moved to hold.`
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {filteredRows.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
            {Math.min(page * rowsPerPage, filteredRows.length)} of {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Bulk Actions
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Apply verification and payout actions to multiple selected payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" className="h-11 rounded-2xl border-slate-200 px-4" onClick={() => void handleBulkUpdate("verified", "Selected payments verified.")}>
              <FileCheck2 className="mr-2 h-4 w-4" />
              Verify Selected
            </Button>
            <Button type="button" variant="secondary" className="h-11 rounded-2xl border-slate-200 px-4" onClick={() => void handleBulkUpdate("paid", "Selected payments released.")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Release Selected
            </Button>
            <Button type="button" variant="secondary" className="h-11 rounded-2xl border-slate-200 px-4" onClick={() => void handleBulkUpdate("on_hold", "Selected payments moved to hold.")}>
              <PauseCircle className="mr-2 h-4 w-4" />
              Hold Selected
            </Button>
            <Button type="button" variant="secondary" className="h-11 rounded-2xl border-slate-200 px-4" onClick={() => exportRows(selectedRows)}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        </div>
      </section>
    </div>
    {selectedRow ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-md">
        <button
          type="button"
          aria-label="Close payment detail"
          className="absolute inset-0 cursor-default"
          onClick={() => setSelectedTransactionId(null)}
        />
        <section className="relative z-10 max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/60 bg-white/95 shadow-[0_32px_120px_rgba(15,23,42,0.26)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Payment Detail - Review Mode
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {selectedRow.transactionId} - {selectedRow.carrierName}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Amount {formatMoney(selectedRow.amount)} | Due {format(new Date(selectedRow.dueDate), "dd/MM/yy")} | {selectedRow.statusLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex rounded-full border px-3 py-1 text-sm font-semibold", statusBadge(selectedRow.status))}>
                {selectedRow.statusLabel}
              </span>
              <Link href={`/admin/carriers/${selectedRow.carrierId}`}>
                <Button type="button" variant="secondary" className="h-10 rounded-2xl border-slate-200 px-3">
                  View Carrier
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-10 rounded-2xl border-slate-200 p-0"
                onClick={() => setSelectedTransactionId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-5 py-5">
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-950">Payment Summary</h3>
                  </div>
                  <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transaction ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carrier</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.carrierName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Load ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.loadReference}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Shipper</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.shipperName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amount</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(selectedRow.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.statusLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invoice Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{format(new Date(selectedRow.invoiceDate), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Due Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{format(new Date(selectedRow.dueDate), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-950">Payment Breakdown</h3>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {[
                      { label: "Base Rate", amount: selectedRow.baseRate },
                      { label: "Fuel Surcharge", amount: selectedRow.fuelSurcharge },
                      { label: "Tax (VAT)", amount: selectedRow.vatAmount },
                      { label: "Total", amount: selectedRow.amount, isTotal: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.isTotal ? "Final payout" : "Verified amount"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatMoney(item.amount)}</p>
                          {!item.isTotal ? (
                            <p className="text-xs font-semibold text-emerald-600">Checked</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-950">Documents to Verify</h3>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {selectedRow.documents.map((document) => (
                      <div key={document.label} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{document.label}</p>
                          <p className={cn("text-xs font-semibold", document.status === "uploaded" ? "text-emerald-600" : "text-rose-600")}>
                            {document.status === "uploaded" ? "Uploaded" : "Missing"}
                          </p>
                        </div>
                        <Button type="button" variant="secondary" className="h-9 rounded-2xl border-slate-200 px-3">
                          {document.actionLabel}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-950">Verification Checklist</h3>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {selectedRow.checklist.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <span className={cn("text-xs font-semibold", item.checked ? "text-emerald-600" : "text-amber-600")}>
                          {item.checked ? "Done" : "Review"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-950">Admin Notes</h3>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <label className="space-y-2 text-sm font-medium text-slate-600">
                      Verification Notes
                      <textarea
                        value={verificationNotes}
                        onChange={(event) => setVerificationNotes(event.target.value)}
                        rows={4}
                        className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                        placeholder="Admin comments for verification..."
                      />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-slate-600">
                      Dispute Reason
                      <textarea
                        value={disputeReason}
                        onChange={(event) => setDisputeReason(event.target.value)}
                        rows={3}
                        className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                        placeholder="Add a reason if payment is rejected or placed on hold..."
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-950">Action Buttons</h3>
                  <div className="mt-4 grid gap-3">
                    <Button
                      type="button"
                      className="h-11 justify-start rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                      onClick={() =>
                        void updatePaymentState(
                          selectedRow,
                          selectedRow.transactionId,
                          {
                            status: "paid",
                            verificationNotes,
                            verifiedAt: selectedRow.verifiedAt ?? new Date().toISOString(),
                            releasedAt: new Date().toISOString(),
                          },
                          "Payment verified and released."
                        )
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify & Release
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 justify-start rounded-2xl border-slate-200"
                      onClick={() =>
                        void updatePaymentState(
                          selectedRow,
                          selectedRow.transactionId,
                          {
                            status: "on_hold",
                            disputeReason: disputeReason || "Awaiting more supporting information.",
                            heldAt: new Date().toISOString(),
                          },
                          "Payment moved to hold."
                        )
                      }
                    >
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Hold
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 justify-start rounded-2xl border-slate-200"
                      onClick={() =>
                        void updatePaymentState(
                          selectedRow,
                          selectedRow.transactionId,
                          {
                            status: "failed",
                            disputeReason: disputeReason || "Rejected after payment review.",
                          },
                          "Payment rejected."
                        )
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 justify-start rounded-2xl border-slate-200"
                      onClick={() =>
                        void updatePaymentState(
                          selectedRow,
                          selectedRow.transactionId,
                          {
                            requestedInfoAt: new Date().toISOString(),
                            disputeReason: disputeReason || "Requested more information from carrier or shipper.",
                          },
                          "More information requested."
                        )
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Request More Info
                    </Button>
                    <Button type="button" variant="secondary" className="h-11 justify-start rounded-2xl border-slate-200">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Shipper
                    </Button>
                    <Button type="button" variant="secondary" className="h-11 justify-start rounded-2xl border-slate-200">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Carrier
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
