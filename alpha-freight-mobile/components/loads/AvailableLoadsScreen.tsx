import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadDetailSheet, { LoadDetailSheetRef } from "@/components/loads/LoadDetailSheet";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import LoadsListSkeleton from "@/components/loads/LoadsListSkeleton";
import WaveHand from "@/components/ui/WaveHand";
import {
  getCachedAvailableLoads,
  prefetchAvailableLoads,
} from "@/lib/available-loads-cache";
import { prefetchCarrierMyLoads } from "@/lib/carrier-my-loads-cache";
import {
  AvailableLoad,
  AvailableLoadsData,
  LOAD_FILTERS,
  LoadFilter,
  filterLoads,
} from "@/lib/available-loads";
import { callSupport, openMapsNavigation } from "@/lib/load-actions";
import { colors, radius, spacing } from "@/lib/theme";

function LoadCard({
  load,
  onViewDetails,
  mapsEnabled,
}: {
  load: AvailableLoad;
  onViewDetails: (load: AvailableLoad) => void;
  mapsEnabled: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.loadCard, pressed && styles.pressed]}
      onPress={() => onViewDetails(load)}
    >
      <Text style={styles.loadDate}>{load.pickupLabel}</Text>
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

      <Pressable style={styles.detailsLink} onPress={() => onViewDetails(load)}>
        <Text style={styles.detailsText}>View load details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
      </Pressable>

      <View style={styles.loadFooter}>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickBtn}
            onPress={(event) => {
              event.stopPropagation?.();
              void callSupport();
            }}
          >
            <Ionicons name="call-outline" size={18} color={colors.ink} />
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={(event) => {
              event.stopPropagation?.();
              void openMapsNavigation(load.origin);
            }}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{load.priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AvailableLoadsScreen() {
  const detailSheetRef = useRef<LoadDetailSheetRef>(null);
  const isFocused = useIsFocused();
  const [data, setData] = useState<AvailableLoadsData | null>(() => getCachedAvailableLoads());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LoadFilter>("all");

  const loadData = useCallback(async () => {
    try {
      const result = await prefetchAvailableLoads();
      if (!result) {
        router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredLoads = useMemo(
    () => (data ? filterLoads(data.loads, filter, search) : []),
    [data, filter, search]
  );

  const firstName = data?.fullName.split(" ")[0] || "Carrier";
  const showSkeleton = !data;

  const handleViewDetails = useCallback((load: AvailableLoad) => {
    detailSheetRef.current?.open(load);
  }, []);

  const handleInstantBookComplete = useCallback(async () => {
    await Promise.all([loadData(), prefetchCarrierMyLoads()]);
  }, [loadData]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Hi</Text>
            <WaveHand size={34} />
            <Text style={styles.greeting}>{firstName}</Text>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search routes or cities"
              placeholderTextColor={colors.mutedLight}
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {LOAD_FILTERS.map((chip) => {
              const active = filter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(chip.id)}
                >
                  <Ionicons name={chip.icon} size={15} color={active ? colors.ink : colors.muted} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open now</Text>
            <Text style={styles.sectionCount}>
              {showSkeleton ? "Loading UK loads…" : `${filteredLoads.length} UK loads`}
            </Text>
          </View>

          {showSkeleton ? (
            <LoadsListSkeleton />
          ) : filteredLoads.length ? (
            filteredLoads.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                onViewDetails={handleViewDetails}
                mapsEnabled={isFocused}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="bus-outline" size={36} color={colors.mutedLight} />
              <Text style={styles.emptyTitle}>No loads match your search</Text>
              <Text style={styles.emptySub}>Try another filter or check back soon for fresh UK routes.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <LoadDetailSheet
        ref={detailSheetRef}
        onInstantBookComplete={handleInstantBookComplete}
      />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
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
    paddingBottom: spacing.lg,
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
  chipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 2,
  },
  loadCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 14,
  },
  loadDate: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 4,
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
  mapWrap: {
    marginBottom: spacing.md,
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
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
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
    padding: spacing.xl,
    backgroundColor: colors.canvas,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  emptySub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
