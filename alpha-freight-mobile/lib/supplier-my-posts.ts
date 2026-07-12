import { Ionicons } from "@expo/vector-icons";
import {
  hasSubmittedPod,
  isMissingPodColumnError,
  isShipmentFullyClosed,
  needsSupplierPodReview,
} from "@/lib/load-pod-verification";
import { supabase } from "@/lib/supabase";

export type SupplierPostsFilter =
  | "all"
  | "active"
  | "booked"
  | "in-transit"
  | "pod-review"
  | "completed";

export type BankTransferStatus = "pending" | "verified" | "rejected";

export type SupplierMyPost = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  priceLabel: string;
  equipment: string;
  commodity: string;
  status: string;
  displayStatus: string;
  statusLabel: string;
  paymentState: string;
  paymentRoute: string;
  paymentLabel: string;
  bankTransferStatus: BankTransferStatus | null;
  pickupLabel: string;
  deliveryLabel: string;
  postedLabel: string;
  podUrl?: string | null;
  podName?: string | null;
  podVerificationStatus?: string | null;
  needsPodReview: boolean;
  carrierId?: string | null;
};

export type SupplierMyPostsData = {
  fullName: string;
  stats: {
    total: number;
    active: number;
    booked: number;
    inTransit: number;
    podReview: number;
    completed: number;
    pendingPayment: number;
  };
  posts: SupplierMyPost[];
};

export const SUPPLIER_POST_FILTERS: {
  id: SupplierPostsFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "all", label: "All", icon: "layers-outline" },
  { id: "active", label: "Live", icon: "globe-outline" },
  { id: "booked", label: "Booked", icon: "bookmark-outline" },
  { id: "in-transit", label: "In transit", icon: "navigate-outline" },
  { id: "pod-review", label: "POD review", icon: "document-text-outline" },
  { id: "completed", label: "Completed", icon: "checkmark-done-outline" },
];

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateLabel(value?: string | null, fallback = "TBC") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPostedLabel(value?: string | null) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Posted today";
  return `Posted ${formatDateLabel(value)}`;
}

function getShortCode(id: string) {
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

function resolvePaymentState(loadState?: string | null, recordState?: string | null) {
  if (loadState === "paid" || recordState === "paid") return "paid";
  return String(recordState || loadState || "pending").toLowerCase();
}

function getEffectiveStatus(status: string, paymentState: string) {
  if (paymentState !== "paid" && (status === "active" || status === "pending-payment")) {
    return "pending-payment";
  }
  return status;
}

export function getSupplierPostStatusMeta(
  status: string,
  paymentState: string,
  needsPodReview: boolean,
  bankTransferStatus: BankTransferStatus | null = null
) {
  if (needsPodReview) {
    return { label: "POD review", tone: "review" as const };
  }
  if (bankTransferStatus === "pending" && paymentState !== "paid") {
    return { label: "Awaiting verification", tone: "muted" as const };
  }
  const effective = getEffectiveStatus(status, paymentState);
  switch (effective) {
    case "pending-payment":
      return { label: "Awaiting payment", tone: "muted" as const };
    case "active":
      return { label: "Live", tone: "active" as const };
    case "booked":
      return { label: "Booked", tone: "booked" as const };
    case "in-transit":
    case "loading":
      return { label: "In transit", tone: "transit" as const };
    case "delivered":
      return { label: "Delivered", tone: "transit" as const };
    case "completed":
      return { label: "Completed", tone: "success" as const };
    default:
      return { label: effective.replace("-", " "), tone: "muted" as const };
  }
}

function getPaymentLabel(
  paymentState: string,
  paymentRoute: string,
  status: string,
  bankTransferStatus: BankTransferStatus | null
) {
  if (paymentState === "paid") return "Paid";
  if (bankTransferStatus === "pending") return "Awaiting verification";
  if (status === "completed" || status === "delivered") return "";
  if (paymentRoute === "pay-now") return "Payment due";
  return "Pay later";
}

export function isAwaitingBankTransferVerification(post: SupplierMyPost) {
  return post.bankTransferStatus === "pending";
}

export function shouldShowSupplierCompletePayment(post: SupplierMyPost) {
  return (
    post.paymentState !== "paid" &&
    post.displayStatus === "pending-payment" &&
    !isAwaitingBankTransferVerification(post)
  );
}

export function matchesSupplierPostFilter(
  post: SupplierMyPost,
  filter: SupplierPostsFilter
) {
  if (filter === "all") return true;
  if (filter === "pod-review") return post.needsPodReview;
  if (filter === "completed") {
    if (post.needsPodReview) return false;
    return post.status === "completed" || post.status === "delivered";
  }
  if (filter === "active") {
    return post.status === "active" && post.paymentState === "paid";
  }
  return post.status === filter;
}

export function filterSupplierPosts(
  posts: SupplierMyPost[],
  filter: SupplierPostsFilter,
  search: string
) {
  const query = search.trim().toLowerCase();
  return posts.filter((post) => {
    if (!matchesSupplierPostFilter(post, filter)) return false;
    if (!query) return true;
    return (
      post.code.toLowerCase().includes(query) ||
      post.origin.toLowerCase().includes(query) ||
      post.destination.toLowerCase().includes(query) ||
      post.equipment.toLowerCase().includes(query) ||
      post.commodity.toLowerCase().includes(query) ||
      post.statusLabel.toLowerCase().includes(query)
    );
  });
}

function mapLoadRow(
  load: Record<string, unknown>,
  paymentByLoad: Map<string, string>,
  pendingBankTransferLoads: Set<string>
): SupplierMyPost {
  const id = String(load.id);
  const status = String(load.status || "active").toLowerCase();
  const paymentState = resolvePaymentState(
    load.payment_state as string | null,
    paymentByLoad.get(id)
  );
  const paymentRoute = String(load.payment_route || "pay-later");
  const bankTransferStatus = pendingBankTransferLoads.has(id) ? ("pending" as const) : null;
  const podFields = {
    pod_url: load.pod_url as string | null,
    pod_verification_status: load.pod_verification_status as string | null,
    status: load.status as string | null,
  };
  const needsPodReview = needsSupplierPodReview(podFields);
  const statusMeta = getSupplierPostStatusMeta(
    status,
    paymentState,
    needsPodReview,
    bankTransferStatus
  );
  const price = Number(load.price) || 0;

  return {
    id,
    code: getShortCode(id),
    origin: String(load.origin || "Origin"),
    destination: String(load.destination || "Destination"),
    price,
    priceLabel: formatMoney(price),
    equipment: String(load.equipment || "Any equipment"),
    commodity: String(load.commodity || "General freight"),
    status,
    displayStatus: getEffectiveStatus(status, paymentState),
    statusLabel: statusMeta.label,
    paymentState,
    paymentRoute,
    paymentLabel: getPaymentLabel(paymentState, paymentRoute, status, bankTransferStatus),
    bankTransferStatus,
    pickupLabel: formatDateLabel(load.pickup_date as string | null),
    deliveryLabel: formatDateLabel(load.delivery_date as string | null),
    postedLabel: formatPostedLabel(load.created_at as string | null),
    podUrl: load.pod_url as string | null,
    podName: load.pod_name as string | null,
    podVerificationStatus: load.pod_verification_status as string | null,
    needsPodReview,
    carrierId: load.carrier_id as string | null,
  };
}

async function fetchPendingBankTransferLoadIds(supplierId: string) {
  const pending = new Set<string>();
  try {
    const { data, error } = await supabase
      .from("bank_transfer_requests")
      .select("load_id")
      .eq("supplier_id", supplierId)
      .eq("status", "pending");

    if (error) {
      if (!/bank_transfer_requests|schema cache|relation.*does not exist/i.test(error.message)) {
        console.warn("Pending bank transfer lookup failed:", error.message);
      }
      return pending;
    }

    (data ?? []).forEach((row) => {
      pending.add(String(row.load_id));
    });
  } catch {
    // Table may not exist yet in some environments.
  }
  return pending;
}

export async function fetchSupplierPostById(loadId: string): Promise<SupplierMyPost | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !loadId) return null;

  const loadSelectWithPod =
    "id, origin, destination, price, status, equipment, commodity, pickup_date, delivery_date, payment_route, payment_state, carrier_id, created_at, pod_url, pod_name, pod_verification_status";
  const loadSelectFallback =
    "id, origin, destination, price, status, equipment, commodity, pickup_date, delivery_date, payment_route, payment_state, carrier_id, created_at";

  let row: Record<string, unknown> | null = null;

  const primary = await supabase
    .from("loads")
    .select(loadSelectWithPod)
    .eq("id", loadId)
    .eq("supplier_id", user.id)
    .maybeSingle();

  if (primary.error && isMissingPodColumnError(primary.error.message)) {
    const fallback = await supabase
      .from("loads")
      .select(loadSelectFallback)
      .eq("id", loadId)
      .eq("supplier_id", user.id)
      .maybeSingle();
    row = (fallback.data as Record<string, unknown> | null) ?? null;
  } else if (!primary.error) {
    row = (primary.data as Record<string, unknown> | null) ?? null;
  }

  if (!row) return null;

  const paymentByLoad = new Map<string, string>();
  const { data: paymentRow } = await supabase
    .from("supplier_payments")
    .select("load_id, payment_state")
    .eq("supplier_id", user.id)
    .eq("load_id", loadId)
    .maybeSingle();

  if (paymentRow) {
    paymentByLoad.set(String(paymentRow.load_id), String(paymentRow.payment_state || "pending"));
  }

  const pendingBankTransferLoads = await fetchPendingBankTransferLoadIds(user.id);

  return mapLoadRow(row, paymentByLoad, pendingBankTransferLoads);
}

export function canSupplierTrackShipment(post: SupplierMyPost) {
  if (post.paymentState !== "paid") return false;
  if (!post.carrierId) return false;
  if (["completed", "delivered"].includes(post.status)) return false;
  return ["booked", "in-transit", "loading"].includes(post.status);
}

export function isSupplierShipmentComplete(post: SupplierMyPost) {
  if (post.needsPodReview) return false;
  return post.status === "completed" || post.status === "delivered";
}

export function isTrackableSupplierPost(post: SupplierMyPost) {
  return canSupplierTrackShipment(post);
}

export function getSupplierTrackingProgress(status: string) {
  switch (status) {
    case "booked":
      return 15;
    case "loading":
      return 25;
    case "in-transit":
      return 58;
    case "delivered":
    case "completed":
      return 100;
    case "active":
      return 8;
    default:
      return 5;
  }
}

export async function fetchSupplierMyPosts(): Promise<SupplierMyPostsData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  const loadSelectWithPod =
    "id, origin, destination, price, status, equipment, commodity, pickup_date, delivery_date, payment_route, payment_state, carrier_id, created_at, pod_url, pod_name, pod_verification_status";
  const loadSelectFallback =
    "id, origin, destination, price, status, equipment, commodity, pickup_date, delivery_date, payment_route, payment_state, carrier_id, created_at";

  let rows: Record<string, unknown>[] = [];

  const primary = await supabase
    .from("loads")
    .select(loadSelectWithPod)
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false });

  if (primary.error && isMissingPodColumnError(primary.error.message)) {
    const fallback = await supabase
      .from("loads")
      .select(loadSelectFallback)
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      console.warn("Supplier my posts fallback query failed:", fallback.error.message);
    } else {
      rows = (fallback.data ?? []) as Record<string, unknown>[];
    }
  } else if (primary.error) {
    const broad = await supabase
      .from("loads")
      .select("*")
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });
    if (broad.error) {
      console.warn("Supplier my posts query failed:", broad.error.message);
    } else {
      rows = (broad.data ?? []) as Record<string, unknown>[];
    }
  } else {
    rows = (primary.data ?? []) as Record<string, unknown>[];
  }

  const paymentByLoad = new Map<string, string>();
  const { data: paymentRows, error: paymentError } = await supabase
    .from("supplier_payments")
    .select("load_id, payment_state")
    .eq("supplier_id", user.id);

  if (!paymentError) {
    (paymentRows ?? []).forEach((row) => {
      paymentByLoad.set(String(row.load_id), String(row.payment_state || "pending"));
    });
  }

  const pendingBankTransferLoads = await fetchPendingBankTransferLoadIds(user.id);

  const posts = rows.map((row) => mapLoadRow(row, paymentByLoad, pendingBankTransferLoads));

  const stats = {
    total: posts.length,
    active: posts.filter((p) => p.status === "active" && p.paymentState === "paid").length,
    booked: posts.filter((p) => p.status === "booked").length,
    inTransit: posts.filter((p) => p.status === "in-transit" || p.status === "loading").length,
    podReview: posts.filter((p) => p.needsPodReview).length,
    completed: posts.filter(
      (p) =>
        !p.needsPodReview &&
        (p.status === "completed" ||
          p.status === "delivered" ||
          isShipmentFullyClosed({
            status: p.status,
            pod_verification_status: p.podVerificationStatus,
            pod_url: p.podUrl,
          }))
    ).length,
    pendingPayment: posts.filter((p) => p.paymentState !== "paid" && p.displayStatus === "pending-payment")
      .length,
  };

  return {
    fullName: profile?.full_name || profile?.company_name || "Supplier",
    stats,
    posts,
  };
}

export async function updateSupplierPostStatus(loadId: string, nextStatus: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase
    .from("loads")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", loadId)
    .eq("supplier_id", user.id);

  if (error) return null;
  return fetchSupplierMyPosts();
}

export { formatMoney as formatSupplierPostMoney };
