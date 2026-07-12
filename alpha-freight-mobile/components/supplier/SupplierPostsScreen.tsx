import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useIsFocused } from "@/lib/use-is-focused";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import SupplierPodReviewModal from "@/components/supplier/SupplierPodReviewModal";
import { getMapboxToken } from "@/lib/mapbox";
import UkFlag from "@/components/ui/UkFlag";
import {
  SUPPLIER_POST_FILTERS,
  SupplierMyPost,
  SupplierMyPostsData,
  SupplierPostsFilter,
  filterSupplierPosts,
  getSupplierPostStatusMeta,
  isAwaitingBankTransferVerification,
  shouldShowSupplierCompletePayment,
  updateSupplierPostStatus,
} from "@/lib/supplier-my-posts";
import {
  getCachedSupplierMyPosts,
  isSupplierMyPostsCacheStale,
  prefetchSupplierMyPosts,
  setCachedSupplierMyPosts,
} from "@/lib/supplier-my-posts-cache";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import { setCachedSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { colors, radius, spacing } from "@/lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 36;
const CARD_GAP = 12;

type StatCard = {
  id: string;
  label: string;
  meta: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "light";
};

function StatSwipeCard({
  label,
  meta,
  value,
  icon,
  variant = "light",
}: Omit<StatCard, "id">) {
  const isPrimary = variant === "primary";
  const isLight = variant === "light";

  return (
    <View
      style={[
        styles.swipeCard,
        isPrimary && styles.swipeCardPrimary,
        isLight && styles.swipeCardLight,
      ]}
    >
      {isPrimary ? <View style={styles.earningsAccent} /> : null}
      <View style={styles.swipeBody}>
        <View style={styles.swipeTop}>
          {isPrimary ? (
            <View style={styles.labelRow}>
              <UkFlag size={20} />
              <Text style={[styles.swipeLabel, styles.swipeLabelPrimary]}>{label}</Text>
            </View>
          ) : (
            <Text style={[styles.swipeLabel, isLight && styles.swipeLabelLight]}>{label}</Text>
          )}
          <View
            style={[
              styles.swipeIconWrap,
              isPrimary && styles.swipeIconWrapPrimary,
              isLight && styles.swipeIconWrapLight,
            ]}
          >
            <Ionicons name={icon} size={16} color={colors.ink} />
          </View>
        </View>
        <Text style={[styles.swipeValue, isPrimary && styles.swipeValuePrimary]}>{value}</Text>
        <Text style={styles.swipeMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function StatusChip({ post }: { post: SupplierMyPost }) {
  const meta = getSupplierPostStatusMeta(
    post.status,
    post.paymentState,
    post.needsPodReview,
    post.bankTransferStatus
  );
  const chipStyle =
    meta.tone === "success"
      ? styles.chipSuccess
      : meta.tone === "transit"
        ? styles.chipTransit
        : meta.tone === "active"
          ? styles.chipActive
          : meta.tone === "booked"
            ? styles.chipBooked
            : meta.tone === "review"
              ? styles.chipReview
              : styles.chipMuted;

  return (
    <View style={[styles.statusChip, chipStyle]}>
      <View style={styles.statusDot} />
      <Text style={styles.statusChipText}>{meta.label}</Text>
    </View>
  );
}

function PostCard({
  post,
  updating,
  mapsEnabled,
  onMarkInTransit,
  onMarkCompleted,
  onReviewPod,
  onViewDetails,
}: {
  post: SupplierMyPost;
  updating: boolean;
  mapsEnabled: boolean;
  onMarkInTransit: (loadId: string) => void;
  onMarkCompleted: (loadId: string) => void;
  onReviewPod: (post: SupplierMyPost) => void;
  onViewDetails: (post: SupplierMyPost) => void;
}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postCardTop}>
        <StatusChip post={post} />
        <Text style={styles.postCode}>{post.code}</Text>
      </View>

      <View style={styles.routeRow}>
        <Text style={styles.routeCity} numberOfLines={1}>
          {post.origin}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.mutedLight} />
        <Text style={styles.routeCity} numberOfLines={1}>
          {post.destination}
        </Text>
      </View>

      <Text style={styles.postSub}>
        {post.equipment} · {post.commodity}
      </Text>

      <View style={styles.mapWrap}>
        {mapsEnabled ? (
          <LoadRouteMap
            origin={post.origin}
            destination={post.destination}
            height={120}
            code={post.code}
          />
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>Pickup {post.pickupLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="flag-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>Delivery {post.deliveryLabel}</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {post.paymentLabel ? (
          <View
            style={[
              styles.paymentBadge,
              post.paymentState === "paid" ? styles.paymentBadgePaid : styles.paymentBadgeDue,
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                post.paymentState === "paid" ? styles.paymentBadgeTextPaid : styles.paymentBadgeTextDue,
              ]}
            >
              {post.paymentLabel}
            </Text>
          </View>
        ) : null}
        {post.needsPodReview ? (
          <View style={styles.podBadge}>
            <Ionicons name="document-text-outline" size={12} color={colors.ink} />
            <Text style={styles.podBadgeText}>POD awaiting review</Text>
          </View>
        ) : null}
        <Text style={styles.postedText}>{post.postedLabel}</Text>
      </View>

      <Pressable style={styles.detailsLink} onPress={() => onViewDetails(post)}>
        <Text style={styles.detailsText}>View details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
      </Pressable>

      <View style={styles.postFooter}>
        <View style={styles.footerActions}>
          {post.needsPodReview && post.podUrl ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && styles.pressed]}
              disabled={updating}
              onPress={() => onReviewPod(post)}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.ink} />
              <Text style={styles.actionBtnText}>Review POD</Text>
            </Pressable>
          ) : post.status === "booked" && post.paymentState === "paid" ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              disabled={updating}
              onPress={() => onMarkInTransit(post.id)}
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <>
                  <Ionicons name="navigate-outline" size={16} color={colors.ink} />
                  <Text style={styles.actionBtnText}>Mark in transit</Text>
                </>
              )}
            </Pressable>
          ) : post.status === "in-transit" ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              disabled={updating}
              onPress={() => onMarkCompleted(post.id)}
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <>
                  <Ionicons name="checkmark-done-outline" size={16} color={colors.ink} />
                  <Text style={styles.actionBtnText}>Mark completed</Text>
                </>
              )}
            </Pressable>
          ) : isAwaitingBankTransferVerification(post) ? (
            <View style={styles.carrierTag}>
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={styles.carrierTagText}>Awaiting verification</Text>
            </View>
          ) : shouldShowSupplierCompletePayment(post) ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              onPress={() => router.push(`/complete-payment?loadId=${post.id}`)}
            >
              <Ionicons name="card-outline" size={16} color={colors.ink} />
              <Text style={styles.actionBtnText}>Complete payment</Text>
            </Pressable>
          ) : post.carrierId ? (
            <View style={styles.carrierTag}>
              <Ionicons name="person-outline" size={14} color={colors.muted} />
              <Text style={styles.carrierTagText}>Carrier assigned</Text>
            </View>
          ) : (
            <View style={styles.carrierTag}>
              <Ionicons name="hourglass-outline" size={14} color={colors.muted} />
              <Text style={styles.carrierTagText}>Awaiting carrier</Text>
            </View>
          )}
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{post.priceLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function PostsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonStat} />
      <View style={styles.skeletonSearch} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export default function SupplierPostsScreen() {
  const isFocused = useIsFocused();
  const [data, setData] = useState<SupplierMyPostsData | null>(() => getCachedSupplierMyPosts());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SupplierPostsFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !getCachedSupplierMyPosts());
  const [podReviewPost, setPodReviewPost] = useState<SupplierMyPost | null>(null);
  const mapsEnabled = Boolean(getMapboxToken()) && isFocused;

  const loadData = useCallback(async (silent = false) => {
    if (!silent && !getCachedSupplierMyPosts()) setLoading(true);
    try {
      const result = await prefetchSupplierMyPosts(isSupplierMyPostsCacheStale());
      if (!result) {
        if (!getCachedSupplierMyPosts()) router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      if (!getCachedSupplierMyPosts()) router.replace("/login");
    } finally {
      if (!silent || !getCachedSupplierMyPosts()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getCachedSupplierMyPosts()) {
      void loadData(false);
    }
  }, [loadData]);

  useDeferredFocusRefresh(() => {
    if (isSupplierMyPostsCacheStale()) {
      void loadData(true);
    }
  }, [loadData]);

  const statCards = useMemo<StatCard[]>(() => {
    if (!data) return [];
    return [
      {
        id: "live",
        label: "Live posts",
        meta: "Paid & on marketplace",
        value: String(data.stats.active),
        icon: "globe-outline",
        variant: "light",
      },
      {
        id: "transit",
        label: "In transit",
        meta: "Currently moving",
        value: String(data.stats.inTransit),
        icon: "navigate-outline",
        variant: "light",
      },
      {
        id: "spend",
        label: "Total posted",
        meta: "All supplier loads",
        value: String(data.stats.total),
        icon: "layers-outline",
        variant: "primary",
      },
    ];
  }, [data]);

  const filteredPosts = useMemo(
    () => (data ? filterSupplierPosts(data.posts, filter, search) : []),
    [data, filter, search]
  );

  const handleMarkInTransit = useCallback(async (loadId: string) => {
    setUpdatingId(loadId);
    try {
      const updated = await updateSupplierPostStatus(loadId, "in-transit");
      if (updated) {
        setCachedSupplierMyPosts(updated);
        setCachedSupplierDashboard(null);
        setData(updated);
      }
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleMarkCompleted = useCallback(async (loadId: string) => {
    setUpdatingId(loadId);
    try {
      const updated = await updateSupplierPostStatus(loadId, "completed");
      if (updated) {
        setCachedSupplierMyPosts(updated);
        setCachedSupplierDashboard(null);
        setData(updated);
      }
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handlePodReviewed = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const showSkeleton = loading && !data;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.headerBlock}>
          <Text style={styles.headerEyebrow}>SUPPLIER</Text>
          <Text style={styles.pageTitle}>My posts</Text>
          <Text style={styles.pageSub}>Manage posted loads, payments, and POD review</Text>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showSkeleton ? (
            <PostsSkeleton />
          ) : !data ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cloud-offline-outline" size={36} color={colors.mutedLight} />
              <Text style={styles.emptyTitle}>Could not load your posts</Text>
              <Text style={styles.emptySub}>Pull down or reopen this tab to try again.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => void loadData()}>
                <Text style={styles.emptyBtnText}>Retry</Text>
                <Ionicons name="refresh-outline" size={16} color={colors.ink} />
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.cardsRow}
              >
                {statCards.map((card) => (
                  <StatSwipeCard key={card.id} {...card} />
                ))}
              </ScrollView>

              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color={colors.muted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search routes, cities or load ID"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {SUPPLIER_POST_FILTERS.map((chip) => {
                  const active = filter === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      style={[styles.chip, active && styles.filterChipActive]}
                      onPress={() => setFilter(chip.id)}
                    >
                      <Ionicons
                        name={chip.icon}
                        size={15}
                        color={active ? colors.ink : colors.muted}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your posted loads</Text>
                <Text style={styles.sectionCount}>
                  {filteredPosts.length} of {data.posts.length} loads
                </Text>
              </View>

              {filteredPosts.length ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    updating={updatingId === post.id}
                    mapsEnabled={mapsEnabled}
                    onMarkInTransit={handleMarkInTransit}
                    onMarkCompleted={handleMarkCompleted}
                    onReviewPod={setPodReviewPost}
                    onViewDetails={(item) => router.push(`/supplier-load/${item.id}`)}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="layers-outline" size={36} color={colors.mutedLight} />
                  <Text style={styles.emptyTitle}>
                    {data.posts.length ? "No loads match this filter" : "No loads posted yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {data.posts.length
                      ? "Try another filter or search term."
                      : "Post your first UK freight route to reach carriers."}
                  </Text>
                  {!data.posts.length ? (
                    <Pressable style={styles.emptyBtn} onPress={() => router.push("/post-load")}>
                      <Text style={styles.emptyBtnText}>Post a load</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <SupplierPodReviewModal
        post={podReviewPost}
        visible={Boolean(podReviewPost)}
        onClose={() => setPodReviewPost(null)}
        onReviewed={() => void handlePodReviewed()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  headerBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  cardsRow: {
    gap: CARD_GAP,
    paddingRight: spacing.lg,
    marginBottom: spacing.lg,
  },
  swipeCard: {
    width: CARD_WIDTH,
    height: 132,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  swipeCardPrimary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  swipeCardLight: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
  },
  earningsAccent: {
    height: 3,
    backgroundColor: colors.brand,
  },
  swipeBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  swipeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swipeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  swipeLabelPrimary: { color: colors.muted },
  swipeLabelLight: { color: colors.muted },
  swipeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeIconWrapPrimary: { backgroundColor: colors.brandSoft },
  swipeIconWrapLight: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  swipeValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  swipeValuePrimary: {
    fontSize: 32,
    fontWeight: "900",
  },
  swipeMeta: {
    fontSize: 11,
    color: colors.mutedLight,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputFill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    padding: 0,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  sectionHeader: {
    marginBottom: spacing.md,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  postCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 12,
    gap: 10,
  },
  postCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  chipSuccess: { backgroundColor: colors.brandSoft },
  chipTransit: { backgroundColor: "#EFF6FF" },
  chipActive: { backgroundColor: "#ECFDF5" },
  chipBooked: { backgroundColor: "#FFFBEB" },
  chipReview: { backgroundColor: "#F5F3FF" },
  chipMuted: { backgroundColor: colors.canvasMuted },
  statusChipText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.ink,
  },
  postCode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedLight,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeCity: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  postSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  mapWrap: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.inputFill,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  metaRow: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  paymentBadgePaid: { backgroundColor: "#ECFDF5" },
  paymentBadgeDue: { backgroundColor: "#FFFBEB" },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  paymentBadgeTextPaid: { color: "#047857" },
  paymentBadgeTextDue: { color: "#B45309" },
  podBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#F5F3FF",
  },
  podBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  postedText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 4,
  },
  footerActions: { flex: 1 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  actionBtnPrimary: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.ink,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  carrierTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  carrierTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  pricePill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyCard: {
    alignItems: "center",
    gap: 8,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  skeletonWrap: { gap: spacing.md },
  skeletonStat: {
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
  },
  skeletonSearch: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
  },
  skeletonCard: {
    height: 180,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
