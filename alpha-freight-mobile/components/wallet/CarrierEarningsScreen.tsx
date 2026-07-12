import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CarrierEarningsData,
  EarningsRange,
  fetchCarrierEarnings,
} from "@/lib/carrier-earnings";
import { formatWalletMoney } from "@/lib/carrier-wallet";
import { colors, radius, spacing } from "@/lib/theme";

function EarningsChart({ data }: { data: CarrierEarningsData["chart"] }) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const barWidth = 28;
  const gap = 10;
  const height = 120;
  const width = data.length * (barWidth + gap);

  return (
    <View style={styles.chartWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={Math.max(width, 280)} height={height + 24}>
          {data.map((point, index) => {
            const barHeight = Math.max((point.value / max) * height, point.value > 0 ? 6 : 2);
            const x = index * (barWidth + gap);
            const y = height - barHeight;
            return (
              <Rect
                key={`${point.label}-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={point.value > 0 ? colors.brand : colors.inputFill}
              />
            );
          })}
        </Svg>
      </ScrollView>
      <View style={styles.chartLabels}>
        {data.map((point, index) => (
          <Text key={`${point.label}-${index}`} style={styles.chartLabel} numberOfLines={1}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function LoadRow({ item }: { item: CarrierEarningsData["loads"][number] }) {
  const tone =
    item.status === "completed"
      ? styles.loadStatusCompleted
      : item.status === "pending"
        ? styles.loadStatusPending
        : styles.loadStatusTransit;

  const label =
    item.status === "completed"
      ? "Verified"
      : item.status === "pending"
        ? "POD pending"
        : "In transit";

  return (
    <View style={styles.loadRow}>
      <View style={styles.loadCopy}>
        <Text style={styles.loadRoute}>{item.route}</Text>
        <Text style={styles.loadMeta}>
          {item.code} · {item.dateLabel}
        </Text>
      </View>
      <View style={styles.loadRight}>
        <Text style={styles.loadAmount}>{item.amountLabel}</Text>
        <Text style={[styles.loadStatus, tone]}>{label}</Text>
      </View>
    </View>
  );
}

export default function CarrierEarningsScreen() {
  const [range, setRange] = useState<EarningsRange>("week");
  const [data, setData] = useState<CarrierEarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextRange: EarningsRange) => {
    setLoading(true);
    try {
      const result = await fetchCarrierEarnings(nextRange);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        label: "Total",
        value: formatWalletMoney(data?.totalEarnings ?? 0),
        meta: range === "week" ? "Last 7 days" : "Last 30 days",
      },
      {
        id: "completed",
        label: "Completed",
        value: formatWalletMoney(data?.completedEarnings ?? 0),
        meta: `${data?.completedCount ?? 0} POD verified`,
      },
      {
        id: "pending",
        label: "Pending",
        value: formatWalletMoney((data?.pendingEarnings ?? 0) + (data?.inTransitEarnings ?? 0)),
        meta: `${(data?.pendingCount ?? 0) + (data?.loads.filter((l) => l.status === "in_transit").length ?? 0)} loads`,
      },
    ],
    [data, range]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CARRIER</Text>
            <Text style={styles.title}>Earnings</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.rangeRow}>
          {(["week", "month"] as EarningsRange[]).map((item) => {
            const active = range === item;
            return (
              <Pressable
                key={item}
                style={[styles.rangeChip, active && styles.rangeChipActive]}
                onPress={() => setRange(item)}
              >
                <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>
                  {item === "week" ? "Weekly" : "Monthly"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && !data ? (
            <ActivityIndicator color={colors.ink} style={styles.loader} />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
                {summaryCards.map((card) => (
                  <View key={card.id} style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{card.label}</Text>
                    <Text style={styles.summaryValue}>{card.value}</Text>
                    <Text style={styles.summaryMeta}>{card.meta}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Revenue trend</Text>
                {data?.chart?.length ? (
                  <EarningsChart data={data.chart} />
                ) : (
                  <Text style={styles.emptyText}>No earnings in this period yet.</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Per-load breakdown</Text>
                {data?.loads.length ? (
                  data.loads.map((item) => <LoadRow key={item.id} item={item} />)
                ) : (
                  <Text style={styles.emptyText}>Complete loads to see earnings here.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rangeChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.ink,
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  rangeChipTextActive: {
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  cardsRow: {
    gap: 12,
  },
  summaryCard: {
    width: 148,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  summaryMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  chartWrap: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chartLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
    minWidth: 36,
  },
  loadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  loadCopy: {
    flex: 1,
    gap: 2,
  },
  loadRoute: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  loadMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  loadRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  loadAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.success,
  },
  loadStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  loadStatusCompleted: {
    color: colors.success,
  },
  loadStatusPending: {
    color: colors.muted,
  },
  loadStatusTransit: {
    color: "#2563EB",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    paddingVertical: spacing.md,
  },
});
