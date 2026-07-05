import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useIsFocused } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadDetailSheet, { LoadDetailSheetRef } from "@/components/loads/LoadDetailSheet";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import UkFlag from "@/components/ui/UkFlag";
import {
  CarrierMyLoad,
  CarrierMyLoadsData,
  MY_LOAD_FILTERS,
  MyLoadsFilter,
  filterMyLoads,
  formatMoney,
  getLoadStatusMeta,
  myLoadToAvailableLoad,
  updateCarrierLoadStatus,
} from "@/lib/carrier-my-loads";
import {
  getCachedCarrierMyLoads,
  prefetchCarrierMyLoads,
  setCachedCarrierMyLoads,
} from "@/lib/carrier-my-loads-cache";
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
  const isEarnings = variant === "primary";
  const isLight = variant === "light";

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
            <Text style={[styles.swipeLabel, isLight && styles.swipeLabelLight]}>{label}</Text>
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

function StatusChip({ status }: { status: string }) {
  const meta = getLoadStatusMeta(status);
  const chipStyle =
    meta.tone === "success"
      ? styles.chipSuccess
      : meta.tone === "transit"
        ? styles.chipTransit
        : meta.tone === "active"
          ? styles.statusChipActive
          : styles.chipMuted;

  return (
    <View style={[styles.statusChip, chipStyle]}>
      <View style={[styles.statusDot, meta.tone === "transit" && styles.statusDotTransit]} />
      <Text style={styles.statusChipText}>{meta.label}</Text>
    </View>
  );
}

function MyLoadCard({
  load,
  mapsEnabled,
  onViewDetails,
}: {
  load: CarrierMyLoad;
  mapsEnabled: boolean;
  onViewDetails: (load: CarrierMyLoad) => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.loadCard, pressed && styles.pressed]}>
      <View style={styles.loadCardTop}>
        <StatusChip status={load.status} />
        <Text style={styles.loadCode}>{load.code}</Text>
      </View>

      <View style={styles.routeRow}>
        <Text style={styles.loadTitle} numberOfLines={1}>
          {load.origin}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.mutedLight} />
        <Text style={styles.loadTitle} numberOfLines={1}>
          {load.destination}
        </Text>
      </View>

      <Text style={styles.loadSub}>
        {load.equipment} · {load.commodity}
      </Text>

      <View style={styles.mapWrap}>
        {mapsEnabled ? (
          <LoadRouteMap
            origin={load.origin}
            destination={load.destination}
            height={120}
            code={load.code}
          />
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={styles.dateText}>Pickup {load.pickupLabel}</Text>
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="flag-outline" size={14} color={colors.muted} />
          <Text style={styles.dateText}>Delivery {load.deliveryLabel}</Text>
        </View>
      </View>

      <Pressable style={styles.detailsLink} onPress={() => onViewDetails(load)}>
        <Text style={styles.detailsText}>Update details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
      </Pressable>

      <View style={styles.loadFooter}>
        <View style={styles.quickActions}>
          <Pressable style={styles.quickBtn}>
            <Ionicons name="call-outline" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.quickBtn}>
            <Ionicons name="navigate-outline" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.quickBtn}>
            <Ionicons name="document-text-outline" size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{load.priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function MyLoadsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonStat} />
      <View style={styles.skeletonSearch} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export default function MyLoadsScreen() {
  const detailSheetRef = useRef<LoadDetailSheetRef>(null);
  const isFocused = useIsFocused();
  const [data, setData] = useState<CarrierMyLoadsData | null>(() => getCachedCarrierMyLoads());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MyLoadsFilter>("all");

  const loadData = useCallback(async () => {
    try {
      const result = await prefetchCarrierMyLoads(true);
      if (!result) {
        router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      if (!getCachedCarrierMyLoads()) router.replace("/login");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statCards = useMemo<StatCard[]>(() => {
    if (!data) return [];
    return [
      {
        id: "active",
        label: "Active loads",
        meta: "Awaiting pickup or dispatch",
        value: String(data.stats.active),
        icon: "bus-outline",
        variant: "light",
      },
      {
        id: "transit",
        label: "In transit",
        meta: "Currently on UK routes",
        value: String(data.stats.inTransit),
        icon: "navigate-outline",
        variant: "light",
      },
      {
        id: "earnings",
        label: "Total earnings",
        meta: "Completed UK deliveries",
        value: formatMoney(data.stats.earnings),
        icon: "trending-up",
        variant: "primary",
      },
    ];
  }, [data]);

  const filteredLoads = useMemo(
    () => (data ? filterMyLoads(data.loads, filter, search) : []),
    [data, filter, search]
  );

  const handleViewDetails = useCallback((load: CarrierMyLoad) => {
    detailSheetRef.current?.open(myLoadToAvailableLoad(load), {
      variant: "assigned",
      status: load.status,
      loadId: load.id,
    });
  }, []);

  const handleStatusUpdate = useCallback(async (loadId: string, nextStatus: string) => {
    const updated = await updateCarrierLoadStatus(loadId, nextStatus);
    if (updated) {
      setCachedCarrierMyLoads(updated);
      setData(updated);
    }
  }, []);

  const showSkeleton = !data;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>CARRIER</Text>
            <Text style={styles.pageTitle}>My loads</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.pageSub}>Assigned UK freight routes</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showSkeleton ? (
            <MyLoadsSkeleton />
          ) : (
            <>
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
                {MY_LOAD_FILTERS.map((chip) => {
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
                <Text style={styles.sectionTitle}>Your assignments</Text>
                <Text style={styles.sectionCount}>
                  {filteredLoads.length} of {data.loads.length} loads
                </Text>
              </View>

              {filteredLoads.length ? (
                filteredLoads.map((load) => (
                  <MyLoadCard
                    key={load.id}
                    load={load}
                    mapsEnabled={isFocused}
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="layers-outline" size={36} color={colors.mutedLight} />
                  <Text style={styles.emptyTitle}>
                    {data.loads.length ? "No loads match this filter" : "No loads assigned yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {data.loads.length
                      ? "Try another filter or search term."
                      : "Browse open UK freight and book your next route."}
                  </Text>
                  {!data.loads.length ? (
                    <Pressable
                      style={styles.emptyBtn}
                      onPress={() => router.navigate("/(main)/loads")}
                    >
                      <Text style={styles.emptyBtnText}>Find available loads</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <LoadDetailSheet ref={detailSheetRef} onStatusUpdate={handleStatusUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeTop: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    color: colors.muted,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  scroll: {
    flex: 1,
  },
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
    color: colors.muted,
  },
  swipeMetaLight: {
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
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingBottom: spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  loadCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 14,
  },
  loadCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipSuccess: {
    backgroundColor: colors.brandSoft,
  },
  chipTransit: {
    backgroundColor: "#EFF6FF",
  },
  statusChipActive: {
    backgroundColor: "#FFFBEB",
  },
  chipMuted: {
    backgroundColor: colors.canvasMuted,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  statusDotTransit: {
    backgroundColor: "#3B82F6",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  loadTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  loadSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: spacing.md,
  },
  loadCode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.4,
  },
  mapWrap: {
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.inputFill,
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.sm,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: spacing.md,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  loadFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricePill: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    gap: spacing.sm,
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
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  skeletonWrap: {
    gap: spacing.md,
  },
  skeletonStat: {
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
  },
  skeletonSearch: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
  },
  skeletonCard: {
    height: 320,
    borderRadius: radius.xl,
    backgroundColor: colors.inputFill,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
