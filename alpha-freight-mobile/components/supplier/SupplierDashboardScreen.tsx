import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import UkFlag from "@/components/ui/UkFlag";
import WaveHand from "@/components/ui/WaveHand";
import { callSupport } from "@/lib/load-actions";
import {
  SupplierDashboardData,
  formatSupplierMoney,
} from "@/lib/supplier-dashboard";
import {
  getCachedSupplierDashboard,
  isSupplierDashboardCacheStale,
  prefetchSupplierDashboard,
} from "@/lib/supplier-dashboard-cache";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import { colors, radius, spacing } from "@/lib/theme";
import { useUnreadNotificationCount } from "@/lib/user-notifications";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 36;
const CARD_GAP = 12;
const QUICK_BUTTON_WIDTH = 108;
const QUICK_BUTTON_GAP = 10;
const QUICK_SNAP_INTERVAL = QUICK_BUTTON_WIDTH + QUICK_BUTTON_GAP;
const HEADER_HEIGHT = 268;

type DashboardTab = "posts" | "bids";

type SwipeStatCard = {
  id: string;
  label: string;
  meta: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: "primary" | "light";
  onPress?: () => void;
};

function navigateToPosts() {
  router.navigate("/(supplier-main)/posts");
}

function navigateToBids() {
  router.navigate("/(supplier-main)/bids");
}

function navigateToPostLoad() {
  router.push("/post-load");
}

function navigateToProfile() {
  router.navigate("/(supplier-main)/profile");
}

function navigateToNotifications() {
  router.push("/notifications");
}

function navigateToSupport() {
  router.push("/support");
}

function navigateToPayLater() {
  router.push("/pay-later");
}

function navigateToReferrals() {
  router.push("/referrals");
}

function StatSwipeCard({
  label,
  meta,
  value,
  icon,
  variant = "primary",
  onPress,
}: Omit<SwipeStatCard, "id">) {
  const isLight = variant === "light";
  const isPrimary = variant === "primary";

  const content = (
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
        <Text
          style={[
            styles.swipeValue,
            isPrimary && styles.swipeValuePrimary,
            isLight && styles.swipeValueLight,
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.swipeMeta,
            isPrimary && styles.swipeMetaPrimary,
            isLight && styles.swipeMetaLight,
          ]}
        >
          {meta}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const QUICK_TILES = [
  { id: "post", label: "Post load", icon: "add-circle-outline" as const },
  { id: "posts", label: "My posts", icon: "layers-outline" as const },
  { id: "bids", label: "My bids", icon: "hammer-outline" as const },
  { id: "notifications", label: "Alerts", icon: "notifications-outline" as const },
  { id: "pay-later", label: "Pay later", icon: "card-outline" as const },
  { id: "refer", label: "Referrals", icon: "gift-outline" as const },
  { id: "support", label: "Support", icon: "help-circle-outline" as const },
  { id: "profile", label: "Profile", icon: "person-outline" as const },
];

type QuickTile = (typeof QUICK_TILES)[number];

function getQuickTileHandler(id: string) {
  switch (id) {
    case "post":
      return navigateToPostLoad;
    case "posts":
      return navigateToPosts;
    case "bids":
      return navigateToBids;
    case "notifications":
      return navigateToNotifications;
    case "pay-later":
      return navigateToPayLater;
    case "refer":
      return navigateToReferrals;
    case "support":
      return navigateToSupport;
    case "profile":
      return navigateToProfile;
    default:
      return undefined;
  }
}

function QuickAccessButton({
  label,
  icon,
  brand,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  brand?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.quickBtnIcon, brand && styles.quickBtnIconBrand]}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <Text style={styles.quickBtnLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickAccessStrip() {
  const renderItem = useCallback(({ item }: { item: QuickTile }) => {
    const onPress = getQuickTileHandler(item.id);
    if (!onPress) return null;

    return (
      <QuickAccessButton
        label={item.label}
        icon={item.icon}
        brand={item.id === "post"}
        onPress={onPress}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: QuickTile) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<QuickTile> | null | undefined, index: number) => ({
      length: QUICK_SNAP_INTERVAL,
      offset: QUICK_SNAP_INTERVAL * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      horizontal
      data={QUICK_TILES}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      snapToInterval={QUICK_SNAP_INTERVAL}
      snapToAlignment="start"
      decelerationRate={Platform.OS === "ios" ? 0.992 : 0.985}
      disableIntervalMomentum
      nestedScrollEnabled
      directionalLockEnabled
      bounces
      overScrollMode="never"
      scrollEventThrottle={16}
      contentContainerStyle={styles.quickButtonsRow}
      style={styles.quickAccessStrip}
      getItemLayout={getItemLayout}
      removeClippedSubviews={Platform.OS === "android"}
    />
  );
}

function statusStyle(status: string, paymentState: string) {
  const value = status.toLowerCase();
  if (paymentState !== "paid") {
    return { bg: "#F3F4F6", text: colors.muted, label: "Awaiting payment", dot: colors.mutedLight };
  }
  if (value === "completed" || value === "delivered") {
    return { bg: colors.brandSoft, text: colors.ink, label: "Completed", dot: colors.brand };
  }
  if (value === "in-transit" || value === "loading") {
    return { bg: "#EFF6FF", text: "#1D4ED8", label: "In transit", dot: "#3B82F6" };
  }
  if (value === "booked" || value === "assigned") {
    return { bg: "#FFFBEB", text: "#B45309", label: "Booked", dot: "#F59E0B" };
  }
  if (value === "active") {
    return { bg: "#ECFDF5", text: "#047857", label: "Live", dot: "#10B981" };
  }
  return { bg: colors.canvasMuted, text: colors.muted, label: status.replace("-", " "), dot: colors.mutedLight };
}

function LoadRouteCard({
  load,
  hideBalance,
  onPress,
}: {
  load: SupplierDashboardData["recentLoads"][number];
  hideBalance: boolean;
  onPress: () => void;
}) {
  const chip = statusStyle(load.status, load.paymentState);

  return (
    <Pressable style={({ pressed }) => [styles.loadCard, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.loadCardHeader}>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: chip.dot }]} />
          <Text style={[styles.statusChipText, { color: chip.text }]}>{chip.label}</Text>
        </View>
        <Text style={styles.loadDate}>{load.createdLabel}</Text>
      </View>

      <View style={styles.routeBlock}>
        <View style={styles.routeSide}>
          <Text style={styles.routeLabel}>From</Text>
          <Text style={styles.routeCity} numberOfLines={1}>
            {load.origin}
          </Text>
        </View>

        <View style={styles.routeMid}>
          <View style={styles.routeLine} />
          <View style={styles.routeArrow}>
            <Ionicons name="arrow-forward" size={12} color={colors.ink} />
          </View>
          <View style={styles.routeLine} />
        </View>

        <View style={[styles.routeSide, styles.routeSideEnd]}>
          <Text style={styles.routeLabel}>To</Text>
          <Text style={styles.routeCity} numberOfLines={1}>
            {load.destination}
          </Text>
        </View>
      </View>

      <View style={styles.loadCardFooter}>
        <View style={styles.loadCardActions}>
          <Pressable
            style={({ pressed }) => [styles.loadActionBtn, pressed && styles.pressed]}
            onPress={(event) => {
              event.stopPropagation?.();
              void callSupport();
            }}
          >
            <Ionicons name="call-outline" size={16} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.loadCardMeta}>
          <Text style={styles.loadId}>Posted load</Text>
          <Text style={styles.loadMeta}>UK freight route</Text>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.loadPrice}>{hideBalance ? "••••" : load.price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function DashboardSheetSkeleton() {
  return (
    <>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>Hi</Text>
        <WaveHand size={34} />
        <View style={styles.nameSkeleton} />
      </View>
      <View style={styles.subtitleSkeleton} />
      <View style={styles.toggleRow}>
        <View style={styles.toggleSkeleton} />
        <View style={styles.toggleSkeleton} />
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.mutedLight} />
        <View style={styles.searchSkeleton} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
        <View style={styles.statSkeletonCard} />
        <View style={styles.statSkeletonCard} />
        <View style={styles.statSkeletonCard} />
      </ScrollView>
    </>
  );
}

export default function SupplierDashboardScreen() {
  const [data, setData] = useState<SupplierDashboardData | null>(() => getCachedSupplierDashboard());
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("posts");
  const { count: unreadNotifications, refresh: refreshUnreadNotifications } =
    useUnreadNotificationCount();

  const statCards = useMemo<SwipeStatCard[]>(() => {
    if (!data) return [];
    const masked = hideBalance ? "••••••" : null;
    return [
      {
        id: "spend",
        label: "Total spend",
        meta: "All posted freight",
        value: masked ?? formatSupplierMoney(data.totalSpend),
        icon: "wallet-outline",
        variant: "primary",
      },
      {
        id: "active",
        label: "Active loads",
        meta: "Live or in progress",
        value: String(data.activeLoads),
        icon: "bus-outline",
        variant: "light",
      },
      {
        id: "bids",
        label: "Pending bids",
        meta: "Awaiting your review",
        value: String(data.pendingBids),
        icon: "hammer-outline",
        variant: "light",
      },
      {
        id: "payments",
        label: "Payments due",
        meta: "Loads awaiting payment",
        value: String(data.pendingPayments),
        icon: "card-outline",
        variant: "light",
        onPress: navigateToPayLater,
      },
      {
        id: "pod",
        label: "POD review",
        meta: "Delivery proof to approve",
        value: String(data.podReviewCount),
        icon: "document-text-outline",
        variant: "light",
        onPress: navigateToPosts,
      },
    ];
  }, [data, hideBalance]);

  const loadDashboard = useCallback(async (force = false) => {
    const result = await prefetchSupplierDashboard(force);
    if (result) setData(result);
  }, []);

  useDeferredFocusRefresh(() => {
    void loadDashboard(isSupplierDashboardCacheStale());
    void refreshUnreadNotifications();
  }, [loadDashboard, refreshUnreadNotifications]);

  const firstName = data?.fullName.split(" ")[0] || "Supplier";
  const showSkeleton = !data;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require("@/assets/dashboard-header.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(21,27,36,0.15)", "rgba(21,27,36,0.55)"]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={styles.headerInner}>
            <View style={styles.headerTopRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>AF</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable style={styles.headerIconBtn} onPress={navigateToNotifications}>
                  <Ionicons name="notifications-outline" size={20} color={colors.white} />
                  {unreadNotifications > 0 ? (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={() => setHideBalance((v) => !v)}>
                  <Ionicons
                    name={hideBalance ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.white}
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroText}>WE MOVE THE{"\n"}FREIGHT</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.sheet}>
          {showSkeleton ? (
            <DashboardSheetSkeleton />
          ) : (
            <>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>Hi</Text>
                <WaveHand size={34} />
                <Text style={styles.greeting}>{firstName},</Text>
              </View>
              <Text style={styles.greetingSub}>Your UK freight posting hub</Text>

              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.togglePill, activeTab === "posts" && styles.togglePillActive]}
                  onPress={() => setActiveTab("posts")}
                >
                  <Text style={[styles.toggleText, activeTab === "posts" && styles.toggleTextActive]}>
                    MY POSTS
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.togglePill, activeTab === "bids" && styles.togglePillActive]}
                  onPress={() => setActiveTab("bids")}
                >
                  <Text style={[styles.toggleText, activeTab === "bids" && styles.toggleTextActive]}>
                    MY BIDS
                  </Text>
                </Pressable>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color={colors.ink} />
                <TextInput
                  placeholder="Search your posted routes"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.cardsRow}
                scrollEventThrottle={16}
              >
                {statCards.map((card) => (
                  <StatSwipeCard key={card.id} {...card} />
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
              <QuickAccessStrip />

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {activeTab === "posts" ? "Your posted loads" : "Incoming bids"}
                  </Text>
                  {activeTab === "posts" && data.recentLoads.length ? (
                    <Text style={styles.sectionCount}>{data.recentLoads.length} recent routes</Text>
                  ) : activeTab === "bids" && data.pendingBids ? (
                    <Text style={styles.sectionCount}>{data.pendingBids} bids awaiting review</Text>
                  ) : null}
                </View>
                <Pressable
                  style={styles.sectionLinkBtn}
                  onPress={activeTab === "posts" ? navigateToPosts : navigateToBids}
                >
                  <Text style={styles.sectionLink}>View all</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
                </Pressable>
              </View>

              {activeTab === "posts" ? (
                data.recentLoads.length ? (
                  data.recentLoads.map((load) => (
                    <LoadRouteCard
                      key={load.id}
                      load={load}
                      hideBalance={hideBalance}
                      onPress={navigateToPosts}
                    />
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="cube-outline" size={32} color={colors.mutedLight} />
                    <Text style={styles.emptyTitle}>No loads posted yet</Text>
                    <Text style={styles.emptySub}>Post your first UK freight route to reach carriers.</Text>
                    <Pressable
                      style={({ pressed }) => [styles.emptyActionBtn, pressed && styles.pressed]}
                      onPress={navigateToPostLoad}
                    >
                      <Text style={styles.emptyActionText}>Post a load</Text>
                    </Pressable>
                  </View>
                )
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.availableBanner, pressed && styles.pressed]}
                  onPress={navigateToBids}
                >
                  <View style={styles.availableCount}>
                    <Text style={styles.availableCountValue}>{data.pendingBids}</Text>
                    <Text style={styles.availableCountLabel}>bids waiting</Text>
                  </View>
                  <Text style={styles.availableCopy}>
                    Review carrier offers on your posted loads and assign the best route match.
                  </Text>
                  <View style={styles.availableLinkRow}>
                    <Text style={styles.availableLink}>Open bid review</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
                  </View>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
                onPress={activeTab === "posts" ? navigateToPostLoad : navigateToBids}
              >
                <Text style={styles.ctaText}>
                  {activeTab === "posts" ? "Post a new load" : "Review bids"}
                </Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="arrow-forward" size={18} color={colors.ink} />
                </View>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  nameSkeleton: {
    width: 96,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.inputFill,
    marginLeft: 4,
  },
  subtitleSkeleton: {
    width: "62%",
    height: 14,
    borderRadius: 8,
    backgroundColor: colors.inputFill,
    marginTop: 8,
    marginBottom: spacing.md,
  },
  toggleSkeleton: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
  },
  searchSkeleton: {
    flex: 1,
    height: 18,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  statSkeletonCard: {
    width: CARD_WIDTH,
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  headerImage: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    justifyContent: "space-between",
  },
  headerInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(21,27,36,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.brand,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(21,27,36,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: "#151B24",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 12,
  },
  heroTextWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: spacing.sm,
  },
  heroText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 32,
    textAlign: "left",
    color: colors.white,
    textTransform: "uppercase",
    textShadowColor: "rgba(21,27,36,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sheet: {
    marginTop: -32,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.lg + 4,
    paddingHorizontal: spacing.lg,
    minHeight: 400,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  togglePillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.ink,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.ink,
  },
  toggleTextActive: {
    color: colors.ink,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputFill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    padding: 0,
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
  earningsAccent: {
    height: 3,
    backgroundColor: colors.brand,
    width: "100%",
  },
  swipeCardLight: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
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
    flexShrink: 1,
  },
  swipeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  swipeLabelPrimary: {
    color: colors.muted,
  },
  swipeLabelLight: {
    color: colors.muted,
  },
  swipeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeIconWrapPrimary: {
    backgroundColor: colors.brandSoft,
  },
  swipeIconWrapLight: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  swipeValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  swipeValuePrimary: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  swipeValueLight: {
    color: colors.ink,
  },
  swipeMeta: {
    fontSize: 11,
    color: colors.mutedLight,
  },
  swipeMetaPrimary: {
    color: colors.mutedLight,
  },
  swipeMetaLight: {
    color: colors.mutedLight,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: colors.mutedLight,
    marginBottom: spacing.sm,
  },
  quickButtonsRow: {
    paddingRight: spacing.lg,
  },
  quickAccessStrip: {
    height: 92,
    marginBottom: spacing.lg + 4,
  },
  quickBtn: {
    width: QUICK_BUTTON_WIDTH,
    marginRight: QUICK_BUTTON_GAP,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    gap: 10,
  },
  quickBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnIconBrand: {
    backgroundColor: colors.brandSoft,
  },
  quickBtnLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 2,
  },
  sectionLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  loadCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  loadCardHeader: {
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
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  loadDate: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  routeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  routeSide: {
    flex: 1,
    gap: 4,
  },
  routeSideEnd: {
    alignItems: "flex-end",
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.mutedLight,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  routeMid: {
    flexDirection: "row",
    alignItems: "center",
    width: 52,
  },
  routeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.border,
  },
  routeArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  loadCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 2,
  },
  loadCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  loadActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  loadCardMeta: {
    flex: 1,
    minWidth: 0,
  },
  loadId: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  loadMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.mutedLight,
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  loadPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  availableBanner: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  availableCount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  availableCountValue: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1,
  },
  availableCountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  availableCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  availableLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  availableLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  emptyCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
  emptyActionBtn: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  ctaIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
