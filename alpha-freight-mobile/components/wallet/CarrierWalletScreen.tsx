import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import UkFlag from "@/components/ui/UkFlag";
import PayoutDetailsSheet, { PayoutDetailsSheetRef } from "@/components/wallet/PayoutDetailsSheet";
import PendingEarningsSheet, { PendingEarningsSheetRef } from "@/components/wallet/PendingEarningsSheet";
import WithdrawSheet, { WithdrawSheetRef } from "@/components/wallet/WithdrawSheet";
import {
  CarrierWalletData,
  WalletActivity,
  WalletBalanceCard,
  buildWithdrawalActivity,
  formatWalletMoney,
  PayoutMethod,
} from "@/lib/carrier-wallet";
import {
  getCachedPayoutDetails,
  prefetchPayoutDetails,
} from "@/lib/carrier-payout-setup-cache";
import {
  getCachedCarrierWallet,
  prefetchCarrierWallet,
  setCachedCarrierWallet,
} from "@/lib/carrier-wallet-cache";
import { colors, radius, spacing } from "@/lib/theme";

function BalanceCard({ card }: { card: WalletBalanceCard }) {
  return (
    <View style={styles.balanceCard}>
      <View style={styles.cardFlagWrap}>
        {card.flag === "gb" ? (
          <UkFlag size={28} />
        ) : (
          <View style={[styles.cardIconCircle, card.flag === "earned" && styles.cardIconEarned]}>
            <Ionicons
              name={card.flag === "pending" ? "time-outline" : "trending-up-outline"}
              size={16}
              color={colors.ink}
            />
          </View>
        )}
      </View>
      <Text style={styles.cardAmount}>{card.amount}</Text>
      <Text style={styles.cardMeta}>{card.meta}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  primary,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionItem, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.actionCircle, primary ? styles.actionCirclePrimary : styles.actionCircleSecondary]}>
        <Ionicons name={icon} size={22} color={colors.ink} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActivityRow({ item }: { item: WalletActivity }) {
  const iconName =
    item.icon === "withdraw"
      ? "remove-outline"
      : item.icon === "convert"
        ? "swap-horizontal-outline"
        : "add-outline";

  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, item.pending && styles.activityIconPending]}>
        <Ionicons
          name={item.pending ? "time-outline" : iconName}
          size={18}
          color={colors.ink}
        />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activitySub}>{item.subtitle}</Text>
        {item.amountSecondary ? (
          <Text style={styles.activitySecondary}>{item.amountSecondary}</Text>
        ) : null}
      </View>
      <View style={styles.activityAmountCol}>
        <Text style={[styles.activityAmount, item.positive && styles.activityAmountPositive]}>
          {item.amount}
        </Text>
      </View>
    </View>
  );
}

function WalletSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonCards}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );
}

export default function CarrierWalletScreen() {
  const withdrawSheetRef = useRef<WithdrawSheetRef>(null);
  const pendingSheetRef = useRef<PendingEarningsSheetRef>(null);
  const payoutDetailsRef = useRef<PayoutDetailsSheetRef>(null);
  const [data, setData] = useState<CarrierWalletData | null>(() => getCachedCarrierWallet());
  const [loading, setLoading] = useState(!getCachedCarrierWallet());
  const [payoutReady, setPayoutReady] = useState<boolean | null>(() => {
    const cached = getCachedPayoutDetails();
    return cached ? cached.payoutSetupComplete : null;
  });

  const ensurePayoutSetup = useCallback(async () => {
    const payout = await prefetchPayoutDetails();
    const ready = Boolean(payout?.payoutSetupComplete);
    setPayoutReady(ready);
    if (!ready) {
      router.push("/payout-setup");
      return false;
    }
    return true;
  }, []);

  const loadWallet = useCallback(async () => {
    const hadCache = !!getCachedCarrierWallet();
    if (!hadCache) setLoading(true);

    try {
      const [result, payout] = await Promise.all([prefetchCarrierWallet(), prefetchPayoutDetails()]);
      if (!result) {
        if (!getCachedCarrierWallet()) router.replace("/login");
        return;
      }
      setData(result);
      setPayoutReady(Boolean(payout?.payoutSetupComplete));
    } catch {
      if (!getCachedCarrierWallet()) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const pendingActivities = useMemo(
    () => data?.activities.filter((item) => item.pending) || [],
    [data]
  );
  const recentActivities = useMemo(
    () => data?.activities.filter((item) => !item.pending) || [],
    [data]
  );

  const handleWithdrawPress = useCallback(async () => {
    if (!data) return;
    const ready = payoutReady ?? (await ensurePayoutSetup());
    if (!ready) return;
    withdrawSheetRef.current?.open(data.availableBalance);
  }, [data, ensurePayoutSetup, payoutReady]);

  const handlePendingPress = useCallback(() => {
    if (!data) return;
    pendingSheetRef.current?.open({
      total: data.pendingBalance,
      items: data.activities.filter((item) => item.pending),
    });
  }, [data]);

  const handlePayoutDetailsPress = useCallback(async () => {
    const ready = payoutReady ?? (await ensurePayoutSetup());
    if (!ready) return;
    payoutDetailsRef.current?.open();
  }, [ensurePayoutSetup, payoutReady]);

  const handleWithdrawComplete = useCallback(
    ({ amount, method }: { amount: number; method: PayoutMethod }) => {
      setData((current) => {
        if (!current) return current;

        const nextAvailable = Math.max(current.availableBalance - amount, 0);
        const withdrawal = buildWithdrawalActivity(amount, method);
        const nextActivities = [
          withdrawal,
          ...current.activities.filter((item) => item.id !== "empty"),
        ];

        const nextData: CarrierWalletData = {
          ...current,
          availableBalance: nextAvailable,
          cards: current.cards.map((card) =>
            card.id === "gbp"
              ? { ...card, amount: formatWalletMoney(nextAvailable) }
              : card
          ),
          activities: nextActivities,
        };

        setCachedCarrierWallet(nextData);
        return nextData;
      });
    },
    []
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Wallet balance</Text>
          </View>

          {loading && !data ? (
            <WalletSkeleton />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {(data?.cards || []).map((card) => (
                  <BalanceCard key={card.id} card={card} />
                ))}
              </ScrollView>

              <View style={styles.actionsRow}>
                <ActionButton
                  label="Withdraw"
                  icon="arrow-down-outline"
                  primary
                  onPress={handleWithdrawPress}
                />
                <ActionButton
                  label="Pending earnings"
                  icon="time-outline"
                  onPress={handlePendingPress}
                />
                <ActionButton
                  label="Payout details"
                  icon="card-outline"
                  onPress={handlePayoutDetailsPress}
                />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activities</Text>
                <Pressable style={styles.filterBtn}>
                  <Ionicons name="options-outline" size={16} color={colors.ink} />
                  <Text style={styles.filterText}>Filter</Text>
                </Pressable>
              </View>

              {pendingActivities.length ? (
                <View style={styles.activityGroup}>
                  <Text style={styles.groupLabel}>Pending</Text>
                  {pendingActivities.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </View>
              ) : null}

              <View style={styles.activityGroup}>
                <Text style={styles.groupLabel}>Recent</Text>
                {recentActivities.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <WithdrawSheet ref={withdrawSheetRef} onComplete={handleWithdrawComplete} />
      <PendingEarningsSheet ref={pendingSheetRef} />
      <PayoutDetailsSheet ref={payoutDetailsRef} />
    </View>
  );
}

const CARD_WIDTH = 148;

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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.ink,
  },
  cardsRow: {
    gap: 12,
    paddingBottom: spacing.lg,
  },
  balanceCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  cardFlagWrap: {
    marginBottom: 2,
  },
  cardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIconEarned: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  actionItem: {
    alignItems: "center",
    gap: 10,
    minWidth: 88,
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCirclePrimary: {
    backgroundColor: colors.brand,
  },
  actionCircleSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.inputFill,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  activityGroup: {
    marginBottom: spacing.lg,
    gap: 4,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIconPending: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  activitySub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  activitySecondary: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedLight,
    marginTop: 2,
  },
  activityAmountCol: {
    alignItems: "flex-end",
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  activityAmountPositive: {
    color: colors.success,
  },
  skeletonWrap: {
    gap: spacing.md,
  },
  skeletonLineWide: {
    height: 28,
    width: "55%",
    borderRadius: 10,
    backgroundColor: colors.inputFill,
  },
  skeletonCards: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: 132,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
