import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CARRIER_REFERRAL_BASE_REWARD,
  CARRIER_REFERRAL_MILESTONE_LOADS,
  CarrierReferralDashboard,
  CarrierReferralRow,
  buildCarrierReferralSignupLink,
} from "@/lib/carrier-referrals";
import {
  getCachedCarrierReferrals,
  prefetchCarrierReferrals,
  setCachedCarrierReferrals,
} from "@/lib/carrier-referrals-cache";
import { formatProfileStatMoney } from "@/lib/carrier-dashboard";
import { colors, radius, spacing } from "@/lib/theme";

function StatCard({
  label,
  value,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.statIconWrap}>
          <Ionicons name={icon} size={12} color={colors.ink} />
        </View>
      </View>
      <Text
        style={[styles.statValue, compact && styles.statValueCompact]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
      >
        {value}
      </Text>
    </View>
  );
}

function StatusChip({ status }: { status: CarrierReferralRow["status"] }) {
  const tone =
    status === "Active"
      ? styles.chipActive
      : status === "Completed"
        ? styles.chipCompleted
        : styles.chipPending;

  const textTone =
    status === "Active"
      ? styles.chipTextActive
      : status === "Completed"
        ? styles.chipTextCompleted
        : styles.chipTextPending;

  return (
    <View style={[styles.chip, tone]}>
      <Text style={[styles.chipText, textTone]}>{status}</Text>
    </View>
  );
}

function ReferralRow({ referral }: { referral: CarrierReferralRow }) {
  const initials = referral.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          <StatusChip status={referral.status} />
        </View>
        <Text style={styles.referralMeta}>
          Joined {referral.date} · {referral.loads} loads
        </Text>
      </View>
      <View style={styles.referralEarned}>
        <Text style={styles.referralEarnedValue}>
          {referral.earned > 0 ? formatProfileStatMoney(referral.earned) : "—"}
        </Text>
        <Text style={styles.referralEarnedLabel}>Earned</Text>
      </View>
    </View>
  );
}

function StepRow({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function ReferralsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonStatsRow}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>
      <View style={styles.skeletonBlock} />
      <View style={styles.skeletonBlockTall} />
    </View>
  );
}

export default function CarrierReferralsScreen() {
  const [data, setData] = useState<CarrierReferralDashboard | null>(() => getCachedCarrierReferrals());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = useMemo(
    () => (data?.referralCode ? buildCarrierReferralSignupLink(data.referralCode) : ""),
    [data?.referralCode]
  );

  useEffect(() => {
    let mounted = true;

    void prefetchCarrierReferrals(!data).then((result) => {
      if (mounted && result) setData(result);
    });

    return () => {
      mounted = false;
    };
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

    try {
      await Share.share({
        title: "Join Alpha Freight",
        message: `${data.carrierName} invited you to join Alpha Freight as a carrier.\n\nCode: ${data.referralCode}\n${referralLink}`,
        url: referralLink,
      });
    } catch {
      // User dismissed share sheet.
    }
  }, [data?.carrierName, data?.referralCode, referralLink]);

  const handleRefresh = useCallback(async () => {
    const result = await prefetchCarrierReferrals(true);
    if (result) {
      setCachedCarrierReferrals(result);
      setData(result);
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
            <Text style={styles.pageTitle}>Referrals</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            onPress={() => void handleRefresh()}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.pageSub}>Invite carriers and earn referral credits</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showSkeleton ? (
            <ReferralsSkeleton />
          ) : (
            <>
              <View style={styles.heroCard}>
                <View style={styles.heroAccent} />
                <View style={styles.heroIconWrap}>
                  <Ionicons name="gift-outline" size={22} color={colors.ink} />
                </View>
                <Text style={styles.heroEyebrow}>Your invitation</Text>
                <Text style={styles.heroTitle}>
                  Earn {formatProfileStatMoney(CARRIER_REFERRAL_BASE_REWARD)} per qualified referral
                </Text>
                <Text style={styles.heroBody}>
                  When a referred carrier is approved and completes {CARRIER_REFERRAL_MILESTONE_LOADS} loads,
                  credit is added to your balance.
                </Text>

                <View style={styles.codeCard}>
                  <View style={styles.codeCopy}>
                    <Text style={styles.codeLabel}>Referral code</Text>
                    <Text style={styles.codeValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {data.referralCode}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                    onPress={() => void handleCopyCode()}
                  >
                    <Ionicons
                      name={copiedCode ? "checkmark-outline" : "copy-outline"}
                      size={18}
                      color={colors.ink}
                    />
                  </Pressable>
                </View>

                <View style={styles.heroActions}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => void handleShare()}
                  >
                    <Ionicons name="share-social-outline" size={18} color={colors.ink} />
                    <Text style={styles.primaryBtnText}>Share invite</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                    onPress={() => void handleCopyLink()}
                  >
                    <Ionicons
                      name={copiedLink ? "checkmark-outline" : "link-outline"}
                      size={18}
                      color={colors.ink}
                    />
                    <Text style={styles.secondaryBtnText}>{copiedLink ? "Copied" : "Copy link"}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label="Referrals"
                  value={String(data.stats.totalReferrals)}
                  icon="people-outline"
                />
                <StatCard
                  label="Earned"
                  value={formatProfileStatMoney(data.stats.totalEarned)}
                  icon="trending-up-outline"
                  compact
                />
                <StatCard
                  label="Pending"
                  value={formatProfileStatMoney(data.stats.pendingRewards)}
                  icon="time-outline"
                  compact
                />
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionEyebrow}>How it works</Text>
                <Text style={styles.sectionTitle}>Three simple steps</Text>
                <View style={styles.stepsWrap}>
                  <StepRow
                    step="1"
                    title="Share your code"
                    description="Send your referral code or invite link to another carrier."
                  />
                  <StepRow
                    step="2"
                    title="They join Alpha"
                    description="Your referral completes onboarding and gets verified."
                  />
                  <StepRow
                    step="3"
                    title="You get rewarded"
                    description={`Credits release after approval and their ${CARRIER_REFERRAL_MILESTONE_LOADS}-load milestone.`}
                  />
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Network</Text>
                  <Text style={styles.sectionTitle}>Referral history</Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{data.referrals.length} total</Text>
                </View>
              </View>

              <View style={styles.listCard}>
                {data.referrals.length ? (
                  data.referrals.map((referral, index) => (
                    <View key={referral.id}>
                      <ReferralRow referral={referral} />
                      {index < data.referrals.length - 1 ? <View style={styles.listDivider} /> : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                      <Ionicons name="people-outline" size={28} color={colors.mutedLight} />
                    </View>
                    <Text style={styles.emptyTitle}>No referrals yet</Text>
                    <Text style={styles.emptyBody}>
                      Share your invite link and referred carriers will appear here once they sign up.
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
                      onPress={() => void handleShare()}
                    >
                      <Text style={styles.emptyBtnText}>Send invitation</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.ink} />
                    </Pressable>
                  </View>
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
    backgroundColor: colors.canvas,
  },
  safeTop: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.mutedLight,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: "hidden",
  },
  heroAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brand,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(21, 27, 36, 0.08)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.mutedLight,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.35,
    color: colors.ink,
    marginBottom: 6,
  },
  heroBody: {
    fontSize: 13.5,
    fontWeight: "500",
    lineHeight: 19,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  codeCopy: {
    flex: 1,
    minWidth: 0,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.mutedLight,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  copyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
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
    gap: 6,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 68,
    justifyContent: "space-between",
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 6,
  },
  statIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  statValueCompact: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  statLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.mutedLight,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: 4,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.mutedLight,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: colors.ink,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  stepsWrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  stepDescription: {
    fontSize: 12.5,
    fontWeight: "500",
    lineHeight: 18,
    color: colors.muted,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkSoft,
  },
  referralCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  referralTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  referralName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  referralMeta: {
    fontSize: 11.5,
    fontWeight: "500",
    color: colors.muted,
  },
  referralEarned: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  referralEarnedValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  referralEarnedLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#1D4ED8",
  },
  chipTextPending: {
    color: "#B45309",
  },
  chipTextCompleted: {
    color: colors.ink,
  },
  chipActive: {
    backgroundColor: "#EFF6FF",
  },
  chipPending: {
    backgroundColor: "#FFFBEB",
  },
  chipCompleted: {
    backgroundColor: colors.brandSoft,
  },
  listDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
  skeletonWrap: {
    gap: spacing.md,
  },
  skeletonHero: {
    height: 240,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  skeletonStat: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.inputFill,
  },
  skeletonBlock: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
  skeletonBlockTall: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
});
