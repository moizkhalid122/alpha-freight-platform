import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SupplierPayLaterData,
  SupplierPayLaterItem,
  fetchSupplierPayLaterQueue,
  formatPayLaterAmount,
} from "@/lib/supplier-pay-later";
import { colors, radius, shadow, spacing } from "@/lib/theme";

function QueueCard({ item }: { item: SupplierPayLaterItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardCode}>{item.loadCode}</Text>
          <Text style={styles.cardDue}>{item.dueLabel}</Text>
        </View>
        <Text style={styles.cardAmount}>{formatPayLaterAmount(item.amount)}</Text>
      </View>

      <Text style={styles.cardRoute} numberOfLines={1}>
        {item.origin} → {item.destination}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.muted} />
          <Text style={styles.metaText}>Pickup {item.pickupDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="bus-outline" size={13} color={colors.muted} />
          <Text style={styles.metaText}>{item.equipment}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.payBtn, pressed && styles.pressed]}
        onPress={() => router.push(`/complete-payment?loadId=${item.loadId}`)}
      >
        <Ionicons name="card-outline" size={16} color={colors.white} />
        <Text style={styles.payBtnText}>Complete payment</Text>
      </Pressable>
    </View>
  );
}

export default function SupplierPayLaterScreen() {
  const [data, setData] = useState<SupplierPayLaterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchSupplierPayLaterQueue();
      setData(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData(true);
    }, [loadData])
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PAYMENTS</Text>
            <Text style={styles.title}>Pay later queue</Text>
          </View>
        </View>
        <Text style={styles.sub}>
          Complete payment for saved loads before they go live on the marketplace.
        </Text>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              void loadData(true);
            }} />
          }
        >
          {loading && !data ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.loadingText}>Loading payment queue…</Text>
            </View>
          ) : data ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Awaiting payment</Text>
                  <Text style={styles.statValue}>{data.stats.queued}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Outstanding</Text>
                  <Text style={styles.statValue}>{formatPayLaterAmount(data.stats.pendingValue)}</Text>
                </View>
              </View>

              {data.items.length ? (
                data.items.map((item) => <QueueCard key={item.loadId} item={item} />)
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-circle-outline" size={36} color={colors.mutedLight} />
                  <Text style={styles.emptyTitle}>No pending payments</Text>
                  <Text style={styles.emptySub}>
                    Loads saved with pay later will appear here until payment is completed.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
                    onPress={() => router.push("/post-load")}
                  >
                    <Text style={styles.emptyBtnText}>Post a load</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : null}
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
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.muted,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sub: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 10,
    ...shadow.soft,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
  },
  cardDue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  cardRoute: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  loadingCard: {
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
  pressed: { opacity: 0.88 },
});
