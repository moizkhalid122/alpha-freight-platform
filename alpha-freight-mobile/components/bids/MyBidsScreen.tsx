import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BID_FILTERS,
  BidFilter,
  CarrierBid,
  fetchCarrierBids,
  filterCarrierBids,
  formatBidDate,
  getBidStats,
  getBidStatusMeta,
  getLoadCode,
  getTimeAgo,
  withdrawCarrierBid,
} from "@/lib/carrier-bids";
import { formatMoney } from "@/lib/carrier-dashboard";
import { colors, radius, spacing } from "@/lib/theme";

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
      <Text style={styles.chipText}>{meta.label}</Text>
    </View>
  );
}

function BidCard({
  bid,
  withdrawing,
  onWithdraw,
}: {
  bid: CarrierBid;
  withdrawing: boolean;
  onWithdraw: (bidId: string) => void;
}) {
  const load = bid.loads;
  const listedPrice = Number(load?.price || 0);

  return (
    <View style={styles.bidCard}>
      <View style={styles.bidHeader}>
        <View style={styles.bidHeaderLeft}>
          <StatusChip status={bid.status} />
          <Text style={styles.bidCode}>{getLoadCode(bid.load_id)}</Text>
        </View>
        <Text style={styles.bidTime}>{getTimeAgo(bid.created_at)}</Text>
      </View>

      <Text style={styles.bidRoute} numberOfLines={2}>
        {(load?.origin || "Origin TBC") + " → " + (load?.destination || "Destination TBC")}
      </Text>

      <View style={styles.bidMetaRow}>
        <Text style={styles.bidMeta}>Pickup {formatBidDate(load?.pickup_date)}</Text>
        {load?.equipment ? <Text style={styles.bidMeta}> · {load.equipment}</Text> : null}
      </View>

      <View style={styles.bidFooter}>
        <View>
          <Text style={styles.bidAmountLabel}>Your bid</Text>
          <Text style={styles.bidAmount}>{bid.amountLabel}</Text>
          {listedPrice > 0 ? (
            <Text style={styles.bidListed}>Listed {formatMoney(listedPrice)}</Text>
          ) : null}
        </View>

        {bid.status === "pending" ? (
          <Pressable
            style={({ pressed }) => [
              styles.withdrawBtn,
              withdrawing && styles.btnDisabled,
              pressed && !withdrawing && styles.pressed,
            ]}
            disabled={withdrawing}
            onPress={() => onWithdraw(bid.id)}
          >
            {withdrawing ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function MyBidsScreen() {
  const [bids, setBids] = useState<CarrierBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BidFilter>("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadBids = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await fetchCarrierBids();
      setBids(rows);
    } catch {
      Alert.alert("Unable to load bids", "Please pull to refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBids();
  }, [loadBids]);

  const filteredBids = useMemo(() => filterCarrierBids(bids, filter), [bids, filter]);
  const stats = useMemo(() => getBidStats(bids), [bids]);

  const handleWithdraw = useCallback(
    (bidId: string) => {
      Alert.alert("Withdraw bid?", "This offer will be removed from the supplier's review queue.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setActionId(bidId);
              try {
                await withdrawCarrierBid(bidId);
                await loadBids();
              } catch (error) {
                Alert.alert(
                  "Withdraw failed",
                  error instanceof Error ? error.message : "Could not withdraw bid."
                );
              } finally {
                setActionId(null);
              }
            })();
          },
        },
      ]);
    },
    [loadBids]
  );

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
            <Text style={styles.headerEyebrow}>MARKETPLACE</Text>
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
        <Text style={styles.pageSub}>Track offers you&apos;ve placed and supplier responses</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsRow}>
            {[
              { label: "Total", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Accepted", value: stats.accepted },
              { label: "Rejected", value: stats.rejected },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
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

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.loadingText}>Loading bids…</Text>
            </View>
          ) : filteredBids.length ? (
            filteredBids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                withdrawing={actionId === bid.id}
                onWithdraw={handleWithdraw}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="hammer-outline" size={36} color={colors.mutedLight} />
              <Text style={styles.emptyTitle}>No bids yet</Text>
              <Text style={styles.emptySub}>
                Browse available loads and submit your first offer.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
                onPress={() => router.navigate("/(main)/loads")}
              >
                <Text style={styles.ctaBtnText}>Find loads</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  headerCenter: { flex: 1 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.mutedLight,
  },
  pageTitle: {
    fontSize: 26,
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
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 2,
  },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  filtersRow: { gap: 8, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  filterChipTextActive: { color: colors.ink, fontWeight: "700" },
  bidCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  bidHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bidHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipPending: { backgroundColor: "#FFFBEB" },
  chipSuccess: { backgroundColor: "rgba(5,150,105,0.1)" },
  chipDanger: { backgroundColor: colors.dangerSoft },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.ink, textTransform: "capitalize" },
  bidCode: { fontSize: 11, fontWeight: "700", color: colors.mutedLight },
  bidTime: { fontSize: 12, fontWeight: "600", color: colors.muted },
  bidRoute: { fontSize: 15, fontWeight: "800", color: colors.ink, lineHeight: 20 },
  bidMetaRow: { flexDirection: "row", flexWrap: "wrap" },
  bidMeta: { fontSize: 12, fontWeight: "500", color: colors.muted },
  bidFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bidAmountLabel: { fontSize: 11, fontWeight: "600", color: colors.muted },
  bidAmount: { fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  bidListed: { fontSize: 12, fontWeight: "600", color: colors.muted, marginTop: 2 },
  withdrawBtn: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: "center",
  },
  withdrawBtnText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  loadingCard: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
  },
  loadingText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  emptyCard: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.canvas,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 },
  ctaBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "800", color: colors.ink },
  btnDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
