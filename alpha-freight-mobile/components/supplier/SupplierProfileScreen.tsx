import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import EditSupplierProfileSheet, {
  EditSupplierProfileSheetRef,
} from "@/components/supplier/EditSupplierProfileSheet";
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import UkFlag from "@/components/ui/UkFlag";
import { signOutCarrier } from "@/lib/carrier-profile";
import { isOfficialFeedEmail } from "@/lib/feed-official-accounts";
import { initializePushNotifications } from "@/lib/push-notifications";
import { setCachedSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { setCachedSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import {
  SupplierProfileData,
  formatSupplierStatMoney,
  pickSupplierAvatar,
  uploadSupplierAvatar,
} from "@/lib/supplier-profile";
import {
  getCachedSupplierProfile,
  isSupplierProfileCacheStale,
  prefetchSupplierProfile,
  setCachedSupplierProfile,
} from "@/lib/supplier-profile-cache";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import { colors, radius, spacing } from "@/lib/theme";

function ProfileSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonStatsRow}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>
      <View style={styles.skeletonSection} />
    </View>
  );
}

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

function InfoRow({
  icon,
  label,
  value,
  onPress,
  linkLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  linkLabel?: string;
}) {
  const content = (
    <>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={colors.ink} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoValueLink]}>{value}</Text>
        {linkLabel ? <Text style={styles.infoLinkHint}>{linkLabel}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.infoRow}>{content}</View>;
}

function SettingsRow({
  icon,
  label,
  sublabel,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.ink} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.settingsSub}>{sublabel}</Text> : null}
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} /> : null}
    </Pressable>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={[styles.checkRow, done && styles.checkRowDone]}>
      <Text style={styles.checkLabel}>{label}</Text>
      {done ? (
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      ) : (
        <Text style={styles.checkPending}>Pending</Text>
      )}
    </View>
  );
}

function verificationLabel(status: SupplierProfileData["verificationStatus"]) {
  if (status === "verified") return "Verified supplier";
  if (status === "review") return "Under review";
  return "Verification pending";
}

export default function SupplierProfileScreen() {
  const editSheetRef = useRef<EditSupplierProfileSheetRef>(null);
  const [data, setData] = useState<SupplierProfileData | null>(() => getCachedSupplierProfile());
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async (force = false) => {
    try {
      const result = await prefetchSupplierProfile(force);
      if (!result) {
        if (!getCachedSupplierProfile()) router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      if (!getCachedSupplierProfile()) router.replace("/login");
    }
  }, []);

  useDeferredFocusRefresh(() => {
    void loadProfile(isSupplierProfileCacheStale());
  }, [loadProfile]);

  const handleEditPress = useCallback(() => {
    if (!data) return;
    editSheetRef.current?.open(data);
  }, [data]);

  const handleProfileSaved = useCallback((profile: SupplierProfileData) => {
    setCachedSupplierProfile(profile);
    setData(profile);
  }, []);

  const handleAvatarPress = useCallback(async () => {
    if (uploadingAvatar) return;

    try {
      const uri = await pickSupplierAvatar();
      if (!uri) return;

      setUploadingAvatar(true);
      await uploadSupplierAvatar(uri);
      await loadProfile(true);
    } catch (error) {
      Alert.alert(
        "Photo update failed",
        error instanceof Error ? error.message : "Unable to update profile photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }, [loadProfile, uploadingAvatar]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      setCachedSupplierDashboard(null);
      setCachedSupplierMyPosts(null);
      setCachedSupplierProfile(null);
      await signOutCarrier();
      router.replace("/welcome");
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  const showSkeleton = !data;
  const isVerified = data?.verificationStatus === "verified";
  const isOfficial = isOfficialFeedEmail(data?.email);
  const showVerifiedBadge = isOfficial || isVerified;

  const checklist = data
    ? [
        { label: "Company name", done: Boolean(data.companyName && data.companyName !== "Supplier Account") },
        { label: "Email", done: Boolean(data.email) },
        { label: "Phone", done: data.phone !== "Not provided" },
        { label: "Address", done: data.address !== "Not provided" },
        { label: "Tax ID", done: data.taxId !== "Not provided" },
      ]
    : [];

  const nextMilestone =
    data && data.completionPercent < 100
      ? "Complete your company details to finish supplier onboarding."
      : "Your supplier profile is fully configured.";

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.headerEyebrow}>SUPPLIER</Text>
            <Text style={styles.pageTitle}>Profile</Text>
            <Text style={styles.pageSub}>Company identity, contact details, and freight activity</Text>
          </View>

          {showSkeleton ? (
            <ProfileSkeleton />
          ) : (
            <>
              <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <Pressable
                    style={({ pressed }) => [styles.avatarPress, pressed && styles.pressed]}
                    onPress={() => void handleAvatarPress()}
                  >
                    {data.avatarUrl ? (
                      <Image source={{ uri: data.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>{data.initials}</Text>
                      </View>
                    )}
                    <View style={styles.avatarCamera}>
                      {uploadingAvatar ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name="camera-outline" size={14} color={colors.white} />
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.heroCopy}>
                    <FeedAuthorName
                      name={data.displayName}
                      verified={showVerifiedBadge}
                      textStyle={styles.displayName}
                      badgeSize={20}
                    />
                    {data.fullName.trim().toLowerCase() !== data.displayName.trim().toLowerCase() ? (
                      <Text style={styles.fullName}>{data.fullName}</Text>
                    ) : null}
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgePending]}>
                        <Ionicons
                          name={isVerified ? "shield-checkmark-outline" : "time-outline"}
                          size={13}
                          color={isVerified ? colors.success : colors.ink}
                        />
                        <Text style={[styles.badgeText, isVerified && styles.badgeTextVerified]}>
                          {verificationLabel(data.verificationStatus)}
                        </Text>
                      </View>
                      <View style={styles.memberPill}>
                        <UkFlag size={14} />
                        <Text style={styles.memberText}>{data.memberSince}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.locationText}>
                    {data.city || data.address !== "Not provided" ? data.city || data.address : "United Kingdom"}
                  </Text>
                </View>

                <View style={styles.completionBlock}>
                  <View style={styles.completionHeader}>
                    <Text style={styles.completionLabel}>Profile completion</Text>
                    <Text style={styles.completionValue}>{data.completionPercent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${data.completionPercent}%` }]} />
                  </View>
                  <Text style={styles.completionHint}>{nextMilestone}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                  onPress={handleEditPress}
                >
                  <Ionicons name="create-outline" size={16} color={colors.white} />
                  <Text style={styles.editBtnText}>Edit profile</Text>
                </Pressable>
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label="Total loads"
                  value={String(data.stats.totalLoads)}
                  icon="layers-outline"
                />
                <StatCard
                  label="Completed"
                  value={String(data.stats.completedLoads)}
                  icon="checkmark-done-outline"
                />
                <StatCard
                  label="Freight spend"
                  value={formatSupplierStatMoney(data.stats.totalSpend)}
                  icon="wallet-outline"
                  compact
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                  <InfoRow icon="mail-outline" label="Email" value={data.email || "Not provided"} />
                  <InfoRow icon="call-outline" label="Phone" value={data.phone} />
                  <InfoRow icon="location-outline" label="Company address" value={data.address} />
                  <InfoRow icon="document-text-outline" label="Tax ID / VAT" value={data.taxId} />
                  <InfoRow icon="business-outline" label="Industry" value={data.industry} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.metricBlock}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>Load completion rate</Text>
                      <Text style={styles.metricValue}>{data.stats.completionRate}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFillSuccess, { width: `${data.stats.completionRate}%` }]}
                      />
                    </View>
                  </View>
                  <InfoRow
                    icon="cube-outline"
                    label="Monthly volume"
                    value={data.monthlyVolume}
                  />
                  <InfoRow icon="pricetag-outline" label="Commodity focus" value={data.commodity} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile checklist</Text>
                <View style={styles.sectionCard}>
                  {checklist.map((item) => (
                    <ChecklistRow key={item.label} label={item.label} done={item.done} />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.sectionCard}>
                  <SettingsRow
                    icon="create-outline"
                    label="Edit company details"
                    sublabel="Name, contact, tax ID, industry"
                    onPress={handleEditPress}
                  />
                  <SettingsRow
                    icon="notifications-outline"
                    label="Notifications"
                    sublabel="Load updates and bid alerts"
                    onPress={() => {
                      void initializePushNotifications();
                      router.push("/notifications");
                    }}
                  />
                  <SettingsRow
                    icon="lock-closed-outline"
                    label="Account security"
                    sublabel="Password and sign-in"
                    onPress={() => router.push("/settings")}
                  />
                  <SettingsRow
                    icon="help-circle-outline"
                    label="Support"
                    sublabel="Help centre and contact"
                    onPress={() => router.push("/support")}
                  />
                  <SettingsRow
                    icon="document-text-outline"
                    label="My posts"
                    sublabel="Manage posted loads and payments"
                    onPress={() => router.navigate("/(supplier-main)/posts")}
                  />
                  <SettingsRow
                    icon="hammer-outline"
                    label="My bids"
                    sublabel="Review carrier offers"
                    onPress={() => router.navigate("/(supplier-main)/bids")}
                  />
                  <SettingsRow
                    icon="card-outline"
                    label="Pay later queue"
                    sublabel="Complete saved load payments"
                    onPress={() => router.push("/pay-later")}
                  />
                  <SettingsRow
                    icon="gift-outline"
                    label="Referrals"
                    sublabel="Invite suppliers and earn rewards"
                    onPress={() => router.push("/referrals")}
                  />
                  <SettingsRow
                    icon="log-out-outline"
                    label={signingOut ? "Signing out…" : "Sign out"}
                    danger
                    onPress={handleSignOut}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <EditSupplierProfileSheet ref={editSheetRef} onSaved={handleProfileSaved} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerBlock: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 4,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.ink,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatarPress: {
    position: "relative",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.inputFill,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
  },
  avatarCamera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  fullName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeVerified: {
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    borderColor: "rgba(5, 150, 105, 0.2)",
  },
  badgePending: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  badgeTextVerified: {
    color: colors.success,
  },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  completionBlock: {
    gap: 8,
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  completionValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  completionHint: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 17,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.inputFill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  progressFillSuccess: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
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
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.lg,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 19,
  },
  infoValueLink: {
    color: colors.inkSoft,
  },
  infoLinkHint: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  metricBlock: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  checkRowDone: {
    backgroundColor: "#F0FDF4",
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  checkPending: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  settingsCopy: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  settingsLabelDanger: {
    color: colors.danger,
  },
  settingsSub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  pressed: { opacity: 0.88 },
  skeletonWrap: { gap: spacing.md },
  skeletonHero: {
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  skeletonStat: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.canvas,
  },
  skeletonSection: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
  },
});
