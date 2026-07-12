import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import UkFlag from "@/components/ui/UkFlag";
import {
  BID_FILTERS,
  BidFilter,
  SupplierBid,
  acceptSupplierBid,
  fetchSupplierBids,
  filterSupplierBids,
  formatBidDate,
  formatEquipmentLabel,
  formatLoadStatus,
  getBidStats,
  getBidStatusMeta,
  getCity,
  getTimeAgo,
  rejectSupplierBid,
  searchSupplierBids,
} from "@/lib/supplier-bids";
import { setCachedSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { setCachedSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import { supabase } from "@/lib/supabase";
import { colors, radius, shadow, spacing } from "@/lib/theme";

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

type FlashMessage = { type: "success" | "error"; text: string };

const SUPPLIER_BIDS_CHANNEL = "supplier-mobile-bids";
let activeSupplierBidsChannel: ReturnType<typeof supabase.channel> | null = null;

function teardownSupplierBidsChannel() {
  if (!activeSupplierBidsChannel) return;
  void supabase.removeChannel(activeSupplierBidsChannel);
  activeSupplierBidsChannel = null;
}

function StatSwipeCard({
  label,
  meta,
  value,
  icon,
  variant = "light",
}: Omit<StatCard, "id">) {
  const isPrimary = variant === "primary";

  return (
    <View
      style={[
        styles.swipeCard,
        isPrimary && styles.swipeCardPrimary,
        !isPrimary && styles.swipeCardLight,
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
            <Text style={styles.swipeLabel}>{label}</Text>
          )}
          <View style={[styles.swipeIconWrap, isPrimary && styles.swipeIconWrapPrimary]}>
            <Ionicons name={icon} size={16} color={colors.ink} />
          </View>
        </View>
        <Text style={[styles.swipeValue, isPrimary && styles.swipeValuePrimary]}>{value}</Text>
        <Text style={styles.swipeMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const meta = getBidStatusMeta(status);
  const toneStyle =
    meta.tone === "success"
      ? styles.chipSuccess
      : meta.tone === "danger"
        ? styles.chipDanger
        : styles.chipPending;

  return (
    <View style={[styles.chip, toneStyle]}>
      <View style={styles.chipDot} />
      <Text style={styles.chipText}>{meta.label}</Text>
    </View>
  );
}

function BidCard({
  bid,
  actionId,
  onAccept,
  onReject,
}: {
  bid: SupplierBid;
  actionId: string | null;
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
}) {
  const meta = getBidStatusMeta(bid.status);
  const accentStyle =
    meta.tone === "success"
      ? styles.accentSuccess
      : meta.tone === "danger"
        ? styles.accentDanger
        : styles.accentPending;
  const isPending = bid.status === "pending";
  const isActing = actionId === bid.id;

  return (
    <View style={styles.bidCard}>
      <View style={[styles.bidAccent, accentStyle]} />

      <View style={styles.bidTopRow}>
        <View style={styles.carrierAvatar}>
          <Text style={styles.carrierAvatarText}>{bid.carrierInitials}</Text>
        </View>
        <View style={styles.carrierCopy}>
          <Text style={styles.carrierName} numberOfLines={1}>
            {bid.carrierName}
          </Text>
          <Text style={styles.carrierMeta}>Carrier · {getTimeAgo(bid.created_at)}</Text>
        </View>
        <View style={styles.bidAmountBlock}>
          <Text style={styles.bidAmountLabel}>Bid amount</Text>
          <Text style={styles.bidAmount}>{bid.amountLabel}</Text>
        </View>
      </View>

      <View style={styles.bidTagRow}>
        <StatusChip status={bid.status} />
        <View style={styles.loadStatusChip}>
          <Text style={styles.loadStatusChipText}>Load {formatLoadStatus(bid.loads?.status)}</Text>
        </View>
        <Text style={styles.loadCode}>{bid.loadCode}</Text>
      </View>

      <Text style={styles.loadTitle} numberOfLines={1}>
        {bid.loadTitle}
      </Text>

      <View style={styles.routeBox}>
        <View style={styles.routeSide}>
          <Text style={styles.routeLabel}>From</Text>
          <Text style={styles.routeCity} numberOfLines={1}>
            {getCity(bid.loads?.origin)}
          </Text>
          <Text style={styles.routeFull} numberOfLines={1}>
            {bid.loads?.origin || "—"}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={colors.mutedLight} />
        <View style={[styles.routeSide, styles.routeSideRight]}>
          <Text style={[styles.routeLabel, styles.routeLabelRight]}>To</Text>
          <Text style={[styles.routeCity, styles.routeCityRight]} numberOfLines={1}>
            {getCity(bid.loads?.destination)}
          </Text>
          <Text style={[styles.routeFull, styles.routeFullRight]} numberOfLines={1}>
            {bid.loads?.destination || "—"}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.muted} />
          <Text style={styles.metaText}>Pickup {formatBidDate(bid.loads?.pickup_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="bus-outline" size={13} color={colors.muted} />
          <Text style={styles.metaText}>{formatEquipmentLabel(bid.loads?.equipment)}</Text>
        </View>
        {bid.loads?.weight ? (
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={13} color={colors.muted} />
            <Text style={styles.metaText}>{bid.loads.weight} kg</Text>
          </View>
        ) : null}
      </View>

      {bid.listedPrice > 0 ? (
        <View style={styles.priceCompareRow}>
          <Text style={styles.priceCompareListed}>Listed {bid.listedPriceLabel}</Text>
          {bid.priceDiffLabel ? (
            <Text
              style={[
                styles.priceCompareDiff,
                bid.priceDiffTone === "below" && styles.priceCompareBelow,
                bid.priceDiffTone === "above" && styles.priceCompareAbove,
              ]}
            >
              {bid.priceDiffLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {isPending ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.acceptBtn,
                isActing && styles.btnDisabled,
                pressed && !isActing && styles.pressed,
              ]}
              disabled={Boolean(actionId)}
              onPress={() => onAccept(bid.id)}
            >
              {isActing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                  <Text style={styles.acceptBtnText}>Accept bid</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.declineBtn,
                isActing && styles.btnDisabled,
                pressed && !isActing && styles.pressed,
              ]}
              disabled={Boolean(actionId)}
              onPress={() => onReject(bid.id)}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
          </>
        ) : (
          <View
            style={[
              styles.resolvedBadge,
              meta.tone === "success" ? styles.resolvedBadgeSuccess : styles.resolvedBadgeDanger,
            ]}
          >
            <Ionicons
              name={meta.tone === "success" ? "checkmark-circle" : "close-circle"}
              size={15}
              color={meta.tone === "success" ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.resolvedBadgeText,
                meta.tone === "success" ? styles.resolvedBadgeTextSuccess : styles.resolvedBadgeTextDanger,
              ]}
            >
              {meta.label}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.viewLoadBtn, pressed && styles.pressed]}
          onPress={() => router.navigate("/(supplier-main)/posts")}
        >
          <Text style={styles.viewLoadBtnText}>View load</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

function BidsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonStat} />
      <View style={styles.skeletonSearch} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export default function SupplierBidsScreen() {
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<BidFilter>("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  const showFlash = useCallback((type: FlashMessage["type"], text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 3500);
  }, []);

  const loadBids = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const rows = await fetchSupplierBids();
      setBids(rows);
    } catch {
      showFlash("error", "Unable to load bids right now.");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [showFlash]);

  const loadBidsRef = useRef(loadBids);
  loadBidsRef.current = loadBids;

  useEffect(() => {
    void loadBids();
  }, [loadBids]);

  useDeferredFocusRefresh(() => {
    void loadBids(false);
  }, [loadBids]);

  useEffect(() => {
    teardownSupplierBidsChannel();

    const channel = supabase
      .channel(SUPPLIER_BIDS_CHANNEL)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => {
        void loadBidsRef.current(true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => {
        void loadBidsRef.current(true);
      })
      .subscribe();

    activeSupplierBidsChannel = channel;

    return () => {
      teardownSupplierBidsChannel();
    };
  }, []);

  const stats = useMemo(() => getBidStats(bids), [bids]);

  const filteredBids = useMemo(() => {
    const byFilter = filterSupplierBids(bids, filter);
    return searchSupplierBids(byFilter, search);
  }, [bids, filter, search]);

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        id: "pending",
        label: "Pending review",
        meta: "Awaiting your decision",
        value: String(stats.pending),
        icon: "hourglass-outline",
        variant: "light",
      },
      {
        id: "accepted",
        label: "Accepted",
        meta: "Carrier assigned",
        value: String(stats.accepted),
        icon: "checkmark-circle-outline",
        variant: "light",
      },
      {
        id: "total",
        label: "Total offers",
        meta: "All carrier bids",
        value: String(stats.total),
        icon: "layers-outline",
        variant: "primary",
      },
    ],
    [stats]
  );

  const handleAccept = useCallback(
    (bidId: string) => {
      Alert.alert(
        "Accept this bid?",
        "The carrier will be assigned to the load and all other pending bids will be declined.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Accept bid",
            onPress: () => {
              void (async () => {
                setActionId(bidId);
                try {
                  await acceptSupplierBid(bidId);
                  setCachedSupplierMyPosts(null);
                  setCachedSupplierDashboard(null);
                  await loadBids(true);
                  showFlash("success", "Bid accepted. Carrier has been assigned to this load.");
                } catch (error) {
                  showFlash(
                    "error",
                    error instanceof Error ? error.message : "We could not update this bid."
                  );
                } finally {
                  setActionId(null);
                }
              })();
            },
          },
        ]
      );
    },
    [loadBids, showFlash]
  );

  const handleReject = useCallback(
    (bidId: string) => {
      Alert.alert("Decline this bid?", "The carrier will be notified that their offer was not selected.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setActionId(bidId);
              try {
                await rejectSupplierBid(bidId);
                await loadBids(true);
                showFlash("success", "Bid declined.");
              } catch (error) {
                showFlash(
                  "error",
                  error instanceof Error ? error.message : "We could not update this bid."
                );
              } finally {
                setActionId(null);
              }
            })();
          },
        },
      ]);
    },
    [loadBids, showFlash]
  );

  const showSkeleton = loading && !bids.length;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        {flash ? (
          <Animated.View
            entering={FadeInUp.duration(280)}
            exiting={FadeOut.duration(180)}
            style={[
              styles.flashBanner,
              flash.type === "success" ? styles.flashSuccess : styles.flashError,
            ]}
          >
            <Ionicons
              name={flash.type === "success" ? "checkmark-circle-outline" : "alert-circle-outline"}
              size={18}
              color={flash.type === "success" ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.flashText,
                flash.type === "success" ? styles.flashTextSuccess : styles.flashTextError,
              ]}
            >
              {flash.text}
            </Text>
          </Animated.View>
        ) : null}

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SUPPLIER</Text>
            <Text style={styles.pageTitle}>My bids</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            onPress={() => void loadBids()}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.pageSub}>Review, compare, and accept carrier offers on your loads</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadBids(true);
              }}
              tintColor={colors.ink}
            />
          }
        >
          {showSkeleton ? (
            <BidsSkeleton />
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
                  placeholder="Search carrier, route, or load ref"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search ? (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
              >
                {BID_FILTERS.map((item) => {
                  const active = filter === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(item.id)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {loading && !bids.length ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={colors.ink} />
                  <Text style={styles.loadingText}>Loading bids…</Text>
                </View>
              ) : filteredBids.length ? (
                filteredBids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    actionId={actionId}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="document-text-outline" size={36} color={colors.mutedLight} />
                  <Text style={styles.emptyTitle}>
                    {filter === "all" && !search ? "No bids yet" : "No matching bids"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {filter === "all" && !search
                      ? "Once carriers bid on your loads, offers will appear here for review."
                      : "Try another filter or search term to see more offers."}
                  </Text>
                  {filter === "all" && !search ? (
                    <Pressable
                      style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
                      onPress={() => router.push("/post-load")}
                    >
                      <Text style={styles.emptyBtnText}>Post a load</Text>
                      <Ionicons name="add-circle-outline" size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  flashBanner: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadow.soft,
  },
  flashSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  flashError: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FECACA",
  },
  flashText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  flashTextSuccess: { color: colors.success },
  flashTextError: { color: colors.danger },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
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
    letterSpacing: -0.5,
    color: colors.ink,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  pageSub: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  cardsRow: {
    paddingHorizontal: spacing.lg,
    gap: CARD_GAP,
  },
  swipeCard: {
    width: CARD_WIDTH,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.soft,
  },
  swipeCardPrimary: {
    backgroundColor: colors.ink,
  },
  swipeCardLight: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  earningsAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.brand,
  },
  swipeBody: {
    padding: spacing.md,
    gap: 6,
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
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  swipeLabelPrimary: {
    color: "rgba(255,255,255,0.72)",
  },
  swipeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeIconWrapPrimary: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  swipeValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  swipeValuePrimary: {
    color: colors.white,
  },
  swipeMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    padding: 0,
  },
  filtersRow: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  bidCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    overflow: "hidden",
    ...shadow.soft,
  },
  bidAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  accentPending: { backgroundColor: "#F59E0B" },
  accentSuccess: { backgroundColor: colors.success },
  accentDanger: { backgroundColor: colors.danger },
  bidTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  carrierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  carrierAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  carrierCopy: {
    flex: 1,
    gap: 2,
  },
  carrierName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  carrierMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
  },
  bidAmountBlock: {
    alignItems: "flex-end",
  },
  bidAmountLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  bidTagRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "currentColor",
  },
  chipPending: {
    backgroundColor: "#FEF3C7",
  },
  chipSuccess: {
    backgroundColor: "#D1FAE5",
  },
  chipDanger: {
    backgroundColor: "#FEE2E2",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  loadStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  loadStatusChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
  },
  loadCode: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  loadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkSoft,
    marginBottom: 10,
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    padding: 12,
    marginBottom: 10,
  },
  routeSide: {
    flex: 1,
    gap: 2,
  },
  routeSideRight: {
    alignItems: "flex-end",
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  routeLabelRight: {
    textAlign: "right",
  },
  routeCity: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    textTransform: "capitalize",
  },
  routeCityRight: {
    textAlign: "right",
  },
  routeFull: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
  },
  routeFullRight: {
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
  },
  priceCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingTop: 2,
  },
  priceCompareListed: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  priceCompareDiff: {
    fontSize: 12,
    fontWeight: "700",
  },
  priceCompareBelow: {
    color: colors.success,
  },
  priceCompareAbove: {
    color: "#D97706",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  acceptBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  declineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  resolvedBadge: {
    flex: 1,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resolvedBadgeSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  resolvedBadgeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FECACA",
  },
  resolvedBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  resolvedBadgeTextSuccess: { color: colors.success },
  resolvedBadgeTextDanger: { color: colors.danger },
  viewLoadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  viewLoadBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  btnDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.88 },
  loadingCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
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
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skeletonStat: {
    height: 110,
    borderRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  skeletonSearch: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
  },
  skeletonCard: {
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
});
