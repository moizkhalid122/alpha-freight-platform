import { fetchSupplierDashboard } from "@/lib/supplier-dashboard";
import { fetchSupplierMyPosts } from "@/lib/supplier-my-posts";
import { fetchSupplierBidsSummary, type SupplierBidsSummary } from "@/lib/supplier-bids";
import { formatSupplierMoney } from "@/lib/supplier-payments";

export type AiSupplierPostSnapshot = {
  code: string;
  route: string;
  price: string;
  status: string;
  paymentLabel: string;
  equipment: string;
  pickup: string;
  needsPodReview: boolean;
};

export type AiSupplierContext = {
  supplierName: string;
  fetchedAt: string;
  stats: {
    totalLoads: number;
    activeLoads: number;
    pendingBids: number;
    pendingPayments: number;
    podReviewCount: number;
    totalSpend: string;
  };
  posts: AiSupplierPostSnapshot[];
  bids: SupplierBidsSummary;
};

function buildRoute(origin?: string | null, destination?: string | null) {
  const from = origin?.trim() || "Origin TBC";
  const to = destination?.trim() || "Destination TBC";
  return `${from} → ${to}`;
}

export async function fetchAiSupplierContext(): Promise<AiSupplierContext | null> {
  const [dashboard, postsData, bids] = await Promise.all([
    fetchSupplierDashboard().catch(() => null),
    fetchSupplierMyPosts().catch(() => null),
    fetchSupplierBidsSummary().catch(() => null),
  ]);

  const supplierName = dashboard?.fullName || postsData?.fullName || "Supplier";

  if (!dashboard && !postsData?.posts.length && !bids?.recent.length) {
    return null;
  }

  const posts = (postsData?.posts || [])
    .slice(0, 8)
    .map((post) => ({
      code: post.code,
      route: buildRoute(post.origin, post.destination),
      price: post.priceLabel,
      status: post.statusLabel,
      paymentLabel: post.paymentLabel || "—",
      equipment: post.equipment,
      pickup: post.pickupLabel,
      needsPodReview: post.needsPodReview,
    }));

  return {
    supplierName,
    fetchedAt: new Date().toISOString(),
    stats: {
      totalLoads: dashboard?.totalLoads ?? postsData?.stats.total ?? 0,
      activeLoads: dashboard?.activeLoads ?? postsData?.stats.active ?? 0,
      pendingBids: dashboard?.pendingBids ?? 0,
      pendingPayments: dashboard?.pendingPayments ?? postsData?.stats.pendingPayment ?? 0,
      podReviewCount: dashboard?.podReviewCount ?? postsData?.stats.podReview ?? 0,
      totalSpend: formatSupplierMoney(dashboard?.totalSpend ?? 0),
    },
    posts,
    bids: bids ?? { pending: [], recent: [], totalPending: 0 },
  };
}
