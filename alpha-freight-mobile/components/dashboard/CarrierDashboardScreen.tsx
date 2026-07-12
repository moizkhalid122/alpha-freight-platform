import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  CarrierDashboardData,
  formatMoney,
} from "@/lib/carrier-dashboard";
import {
  getCachedCarrierDashboard,
  isCarrierDashboardCacheStale,
  prefetchCarrierDashboard,
} from "@/lib/carrier-dashboard-cache";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import { callSupport, openMapsNavigation } from "@/lib/load-actions";
import { colors, radius, spacing } from "@/lib/theme";
import { useUnreadNotificationCount } from "@/lib/user-notifications";

function navigateToAvailableLoads() {
  router.navigate("/(main)/loads");
}

function navigateToMyLoads() {
  router.push("/my-loads");
}

function navigateToWallet() {
  router.navigate("/(main)/wallet");
}

function navigateToReferrals() {
  router.push("/referrals");
}

function navigateToMyBids() {
  router.push("/my-bids");
}

function navigateToSupport() {
  router.push("/support");
}

function navigateToNotifications() {
  router.push("/notifications");
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 36;
const CARD_GAP = 12;
const QUICK_BUTTON_WIDTH = 108;
const QUICK_BUTTON_GAP = 10;
const QUICK_SNAP_INTERVAL = QUICK_BUTTON_WIDTH + QUICK_BUTTON_GAP;
const HEADER_HEIGHT = 268;

type DashboardTab = "loads" | "available";
type SwipeStatCard = {
  id: string;
  label: string;
  meta: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: "primary" | "light";
};

function StatSwipeCard({
  label,
  meta,
  value,
  icon,
  variant = "primary",
}: Omit<SwipeStatCard, "id">) {
  const isLight = variant === "light";
  const isEarnings = variant === "primary";

  return (
    <View
      style={[
        styles.swipeCard,
        isEarnings && styles.swipeCardEarnings,
        isLight && styles.swipeCardLight,
      ]}
    >
      {isEarnings ? <View style={styles.earningsAccent} /> : null}
      <View style={styles.swipeBody}>
        <View style={styles.swipeTop}>
          {isEarnings ? (
            <View style={styles.labelRow}>
              <UkFlag size={20} />
              <Text style={[styles.swipeLabel, styles.swipeLabelEarnings]}>{label}</Text>
            </View>
          ) : (
            <Text
              style={[styles.swipeLabel, isLight && styles.swipeLabelLight]}
            >
              {label}
            </Text>
          )}
          <View
            style={[
              styles.swipeIconWrap,
              isEarnings && styles.swipeIconWrapEarnings,
              isLight && styles.swipeIconWrapLight,
            ]}
          >
            <Ionicons name={icon} size={16} color={colors.ink} />
          </View>
        </View>
        <Text
          style={[
            styles.swipeValue,
            isEarnings && styles.swipeValueEarnings,
            isLight && styles.swipeValueLight,
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.swipeMeta,
            isEarnings && styles.swipeMetaEarnings,
            isLight && styles.swipeMetaLight,
          ]}
        >
          {meta}
        </Text>
      </View>
    </View>
  );
}

const QUICK_TILES = [
  { id: "find", label: "Find loads", icon: "search-outline" as const },
  { id: "my", label: "My loads", icon: "layers-outline" as const },
  { id: "bids", label: "My bids", icon: "hammer-outline" as const },
  { id: "wallet", label: "Wallet", icon: "wallet-outline" as const },
  { id: "refer", label: "Referrals", icon: "gift-outline" as const },
  { id: "support", label: "Support", icon: "help-circle-outline" as const },
];

type QuickTile = (typeof QUICK_TILES)[number];

function getQuickTileHandler(id: string) {
  switch (id) {
    case "find":
      return navigateToAvailableLoads;
    case "my":
      return navigateToMyLoads;
    case "bids":
      return navigateToMyBids;
    case "wallet":
      return navigateToWallet;
    case "refer":
      return navigateToReferrals;
    case "support":
      return navigateToSupport;
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
        brand={item.id === "find"}
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

function statusStyle(status: string) {
  const value = status.toLowerCase();
  if (value === "completed" || value === "delivered") {
    return { bg: colors.brandSoft, text: colors.ink, label: "Delivered", dot: colors.brand };
  }
  if (value === "in-transit" || value === "loading") {
    return { bg: "#EFF6FF", text: "#1D4ED8", label: "In transit", dot: "#3B82F6" };
  }
  if (value === "booked" || value === "assigned") {
    return { bg: "#FFFBEB", text: "#B45309", label: "Booked", dot: "#F59E0B" };
  }
  return { bg: colors.canvasMuted, text: colors.muted, label: status, dot: colors.mutedLight };
}

function LoadRouteCard({
  load,
  hideBalance,
  onPress,
}: {
  load: CarrierDashboardData["recentActivity"][number];
  hideBalance: boolean;
  onPress: () => void;
}) {
  const chip = statusStyle(load.status);

  return (
    <Pressable style={({ pressed }) => [styles.loadCard, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.loadCardHeader}>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: chip.dot }]} />
          <Text style={[styles.statusChipText, { color: chip.text }]}>{chip.label}</Text>
        </View>
        <Text style={styles.loadDate}>{load.subtitle}</Text>
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
          <Pressable
            style={({ pressed }) => [styles.loadActionBtn, pressed && styles.pressed]}
            onPress={(event) => {
              event.stopPropagation?.();
              void openMapsNavigation(load.origin);
            }}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.loadCardMeta}>
          <Text style={styles.loadId}>{load.title}</Text>
          <Text style={styles.loadMeta}>UK freight route</Text>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.loadPrice}>{hideBalance ? "••••" : load.amount}</Text>
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
        <Ionicons name="location-outline" size={20} color={colors.mutedLight} />
        <View style={styles.searchSkeleton} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        <View style={styles.statSkeletonCard} />
        <View style={styles.statSkeletonCard} />
        <View style={styles.statSkeletonCard} />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickButtonsRow}
      >
        <View style={styles.quickBtnSkeleton} />
        <View style={styles.quickBtnSkeleton} />
        <View style={styles.quickBtnSkeleton} />
        <View style={styles.quickBtnSkeleton} />
      </ScrollView>

      <View style={styles.loadSkeletonCard} />
      <View style={styles.loadSkeletonCard} />
    </>
  );
}

export default function CarrierDashboardScreen() {
  const [data, setData] = useState<CarrierDashboardData | null>(() => getCachedCarrierDashboard());
  const [hideBalance, setHideBalance] = useState(false);
  const { count: unreadNotifications, refresh: refreshUnreadNotifications } =
    useUnreadNotificationCount();
  const [activeTab, setActiveTab] = useState<DashboardTab>("loads");

  const statCards = useMemo<SwipeStatCard[]>(() => {
    if (!data) return [];
    const masked = hideBalance ? "••••••" : null;
    return [
      {
        id: "earnings",
        label: "Total earnings",
        meta: "POD verified · withdrawable",
        value: masked ?? formatMoney(data.earnings),
        icon: "trending-up-outline",
        variant: "primary",
      },
      {
        id: "incoming",
        label: "Incoming",
        meta: "POD submitted · awaiting review",
        value: masked ?? formatMoney(data.incomingEarnings ?? 0),
        icon: "hourglass-outline",
        variant: "light",
      },
      {
        id: "active",
        label: "Active loads",
        meta: "Currently in progress",
        value: String(data.activeLoads),
        icon: "bus-outline",
        variant: "light",
      },
      {
        id: "completed",
        label: "Completed",
        meta: "All time deliveries",
        value: String(data.completedLoads),
        icon: "checkmark-done-outline",
        variant: "light",
      },
      {
        id: "open",
        label: "Open UK loads",
        meta: "Available to book now",
        value: String(data.availableLoads),
        icon: "globe-outline",
        variant: "light",
      },
    ];
  }, [data, hideBalance]);

  const loadDashboard = useCallback(async (force = false) => {
    try {
      const result = await prefetchCarrierDashboard(force);
      if (!result) {
        if (!getCachedCarrierDashboard()) router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      if (!getCachedCarrierDashboard()) router.replace("/login");
    }
  }, []);

  useEffect(() => {
    if (!getCachedCarrierDashboard()) {
      void loadDashboard(false);
    }
  }, [loadDashboard]);

  useDeferredFocusRefresh(() => {
    void loadDashboard(isCarrierDashboardCacheStale());
    void refreshUnreadNotifications();
  }, [loadDashboard, refreshUnreadNotifications]);

  const firstName = data?.fullName.split(" ")[0] || "Carrier";
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
              <Text style={styles.heroText}>
                WE MOVE THE{"\n"}FREIGHT
              </Text>
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
          <Text style={styles.greetingSub}>Your UK freight command centre</Text>

          {data.verificationStatus === "review" ? (
            <View style={styles.reviewBanner}>
              <View style={styles.reviewIcon}>
                <Ionicons name="time-outline" size={18} color={colors.ink} />
              </View>
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewTitle}>Professional review in progress</Text>
                <Text style={styles.reviewSub}>
                  Your account is under review. You can explore the app while we verify your details.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.togglePill, activeTab === "loads" && styles.togglePillActive]}
              onPress={navigateToMyLoads}
            >
              <Text style={[styles.toggleText, activeTab === "loads" && styles.toggleTextActive]}>
                MY LOADS
              </Text>
            </Pressable>
            <Pressable
              style={[styles.togglePill, activeTab === "available" && styles.togglePillActive]}
              onPress={navigateToAvailableLoads}
            >
              <Text
                style={[styles.toggleText, activeTab === "available" && styles.toggleTextActive]}
              >
                AVAILABLE
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="location-outline" size={20} color={colors.ink} />
            <TextInput
              placeholder="Where are you delivering?"
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
              <StatSwipeCard
                key={card.id}
                label={card.label}
                meta={card.meta}
                value={card.value}
                icon={card.icon}
                variant={card.variant}
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
          <QuickAccessStrip />

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {activeTab === "loads" ? "Your loads" : "Open UK loads"}
              </Text>
              {activeTab === "loads" && data.recentActivity.length ? (
                <Text style={styles.sectionCount}>{data.recentActivity.length} active routes</Text>
              ) : null}
            </View>
            <Pressable style={styles.sectionLinkBtn} onPress={navigateToMyLoads}>
              <Text style={styles.sectionLink}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
            </Pressable>
          </View>

          {activeTab === "loads" ? (
            data.recentActivity.length ? (
              data.recentActivity.map((load) => (
                <LoadRouteCard
                  key={load.id}
                  load={load}
                  hideBalance={hideBalance}
                  onPress={navigateToMyLoads}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="bus-outline" size={32} color={colors.mutedLight} />
                <Text style={styles.emptyTitle}>No loads assigned yet</Text>
                <Text style={styles.emptySub}>Browse open freight across the UK.</Text>
              </View>
            )
          ) : (
            <View style={styles.availableBanner}>
              <View style={styles.availableCount}>
                <Text style={styles.availableCountValue}>{data.availableLoads}</Text>
                <Text style={styles.availableCountLabel}>loads open now</Text>
              </View>
              <Text style={styles.availableCopy}>
                Fresh UK routes posted daily. Tap below to browse and book.
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            onPress={navigateToAvailableLoads}
          >
            <Text style={styles.ctaText}>Find available loads</Text>
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
  quickBtnSkeleton: {
    width: QUICK_BUTTON_WIDTH,
    height: 88,
    marginRight: QUICK_BUTTON_GAP,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
  loadSkeletonCard: {
    height: 168,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
    marginBottom: 12,
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
  reviewBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCopy: {
    flex: 1,
    gap: 4,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  reviewSub: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.muted,
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
  swipeCardEarnings: {
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
  swipeLabelEarnings: {
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
  swipeIconWrapEarnings: {
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
  swipeValueEarnings: {
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
  swipeMetaEarnings: {
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
  emptyCard: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  emptySub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 16,
    marginTop: spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(21,27,36,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
