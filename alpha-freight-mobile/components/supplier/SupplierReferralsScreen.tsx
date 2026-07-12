import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatSupplierStatMoney } from "@/lib/supplier-profile";
import {
  SUPPLIER_REFERRAL_BASE_REWARD,
  SUPPLIER_REFERRAL_MILESTONE_LOADS,
  SupplierReferralDashboard,
  SupplierReferralRow,
  buildSupplierReferralSignupLink,
} from "@/lib/supplier-referrals";
import {
  getCachedSupplierReferrals,
  prefetchSupplierReferrals,
  setCachedSupplierReferrals,
} from "@/lib/supplier-referrals-cache";
import { colors, radius, spacing } from "@/lib/theme";

function ReferralRow({ referral }: { referral: SupplierReferralRow }) {
  const initials = referral.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const chipStyle =
    referral.status === "Active"
      ? styles.chipActive
      : referral.status === "Completed"
        ? styles.chipCompleted
        : styles.chipPending;

  return (
    <View style={styles.referralRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.referralCopy}>
        <View style={styles.referralTitleRow}>
          <Text style={styles.referralName} numberOfLines={1}>
            {referral.name}
          </Text>
          <View style={[styles.chip, chipStyle]}>
            <Text style={styles.chipText}>{referral.status}</Text>
          </View>
        </View>
        <Text style={styles.referralMeta}>
          Joined {referral.date} · {referral.loads} loads
        </Text>
      </View>
      <View style={styles.referralEarned}>
        <Text style={styles.referralEarnedValue}>
          {referral.earned > 0 ? formatSupplierStatMoney(referral.earned) : "—"}
        </Text>
        <Text style={styles.referralEarnedLabel}>Earned</Text>
      </View>
    </View>
  );
}

export default function SupplierReferralsScreen() {
  const [data, setData] = useState<SupplierReferralDashboard | null>(() => getCachedSupplierReferrals());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = useMemo(
    () => (data?.referralCode ? buildSupplierReferralSignupLink(data.referralCode) : ""),
    [data?.referralCode]
  );

  useEffect(() => {
    void prefetchSupplierReferrals(!data).then((result) => {
      if (result) setData(result);
    });
  }, [data]);

  const handleCopyCode = useCallback(async () => {
    if (!data?.referralCode) return;
    await Clipboard.setStringAsync(data.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [data?.referralCode]);

  const handleCopyLink = useCallback(async () => {
    if (!referralLink) return;
    await Clipboard.setStringAsync(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    if (!data?.referralCode || !referralLink) return;
    await Share.share({
      title: "Join Alpha Freight",
      message: `${data.supplierName} invited you to join Alpha Freight as a supplier.\n\nCode: ${data.referralCode}\n${referralLink}`,
      url: referralLink,
    });
  }, [data?.referralCode, data?.supplierName, referralLink]);

  const handleRefresh = useCallback(async () => {
    const result = await prefetchSupplierReferrals(true);
    if (result) {
      setCachedSupplierReferrals(result);
      setData(result);
    }
  }, []);

  if (!data) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeTop} edges={["top"]}>
          <Text style={styles.loadingText}>Loading referrals…</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>SUPPLIER</Text>
            <Text style={styles.pageTitle}>Referrals</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={() => void handleRefresh()}>
            <Ionicons name="refresh-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.pageSub}>Invite suppliers and earn referral rewards</Text>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              Earn {formatSupplierStatMoney(SUPPLIER_REFERRAL_BASE_REWARD)} per qualified referral
            </Text>
            <Text style={styles.heroBody}>
              When a referred supplier completes {SUPPLIER_REFERRAL_MILESTONE_LOADS} loads, your reward is released.
            </Text>
            <View style={styles.codeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeLabel}>Referral code</Text>
                <Text style={styles.codeValue}>{data.referralCode}</Text>
              </View>
              <Pressable style={styles.copyBtn} onPress={() => void handleCopyCode()}>
                <Ionicons name={copiedCode ? "checkmark-outline" : "copy-outline"} size={18} color={colors.ink} />
              </Pressable>
            </View>
            <View style={styles.heroActions}>
              <Pressable style={styles.primaryBtn} onPress={() => void handleShare()}>
                <Ionicons name="share-social-outline" size={18} color={colors.ink} />
                <Text style={styles.primaryBtnText}>Share invite</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void handleCopyLink()}>
                <Ionicons name={copiedLink ? "checkmark-outline" : "link-outline"} size={18} color={colors.ink} />
                <Text style={styles.secondaryBtnText}>{copiedLink ? "Copied" : "Copy link"}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Referrals</Text>
              <Text style={styles.statValue}>{data.stats.totalReferrals}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Earned</Text>
              <Text style={styles.statValue}>{formatSupplierStatMoney(data.stats.totalEarned)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{formatSupplierStatMoney(data.stats.pendingRewards)}</Text>
            </View>
          </View>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>Referral history</Text>
            {data.referrals.length ? (
              data.referrals.map((referral) => <ReferralRow key={referral.id} referral={referral} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={28} color={colors.mutedLight} />
                <Text style={styles.emptyTitle}>No referrals yet</Text>
                <Text style={styles.emptyBody}>Share your invite link to grow your supplier network.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  loadingText: { padding: spacing.lg, color: colors.muted },
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
  pageSub: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    fontSize: 14,
    color: colors.muted,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    gap: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 2,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  listCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  referralCopy: { flex: 1, gap: 4 },
  referralTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  referralName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipPending: { backgroundColor: colors.canvas },
  chipActive: { backgroundColor: colors.brandSoft },
  chipCompleted: { backgroundColor: "#D1FAE5" },
  chipText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  referralMeta: {
    fontSize: 11,
    color: colors.muted,
  },
  referralEarned: { alignItems: "flex-end" },
  referralEarnedValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  referralEarnedLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
});
