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
import FeedAuthorName from "@/components/feed/FeedAuthorName";
import EditProfileSheet, { EditProfileSheetRef } from "@/components/profile/EditProfileSheet";
import UkFlag from "@/components/ui/UkFlag";
import {
  CarrierProfileData,
  formatProfileStatMoney,
  pickCarrierAvatar,
  signOutCarrier,
  uploadCarrierAvatar,
} from "@/lib/carrier-profile";
import {
  getCachedCarrierProfile,
  isCarrierProfileCacheStale,
  prefetchCarrierProfile,
  setCachedCarrierProfile,
} from "@/lib/carrier-profile-cache";
import { useDeferredFocusRefresh } from "@/lib/use-deferred-focus-refresh";
import { setCachedCarrierDashboard } from "@/lib/carrier-dashboard-cache";
import { setCachedCarrierWallet } from "@/lib/carrier-wallet-cache";
import { setCachedAvailableLoads } from "@/lib/available-loads-cache";
import { initializePushNotifications } from "@/lib/push-notifications";
import { isOfficialFeedEmail } from "@/lib/feed-official-accounts";
import { colors, radius, spacing } from "@/lib/theme";

function ProfileSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonHero}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLines}>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLineMid} />
        </View>
      </View>
      <View style={styles.skeletonStatsRow}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>
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

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return <Text style={styles.emptyTags}>Not configured</Text>;
  }

  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function verificationLabel(status: CarrierProfileData["verificationStatus"]) {
  if (status === "verified") return "Verified carrier";
  if (status === "review") return "Under review";
  return "Verification pending";
}

export default function CarrierProfileScreen() {
  const editSheetRef = useRef<EditProfileSheetRef>(null);
  const [data, setData] = useState<CarrierProfileData | null>(() => getCachedCarrierProfile());
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async (force = false) => {
    try {
      const result = await prefetchCarrierProfile(force);
      if (!result) {
        if (!getCachedCarrierProfile()) router.replace("/login");
        return;
      }
      setData(result);
    } catch {
      if (!getCachedCarrierProfile()) router.replace("/login");
    }
  }, []);

  useDeferredFocusRefresh(() => {
    void loadProfile(isCarrierProfileCacheStale());
  }, [loadProfile]);

  const handleEditPress = useCallback(() => {
    if (!data) return;
    editSheetRef.current?.open(data);
  }, [data]);

  const handleProfileSaved = useCallback((profile: CarrierProfileData) => {
    setCachedCarrierProfile(profile);
    setData(profile);
  }, []);

  const handleAvatarPress = useCallback(async () => {
    if (uploadingAvatar) return;

    try {
      const uri = await pickCarrierAvatar();
      if (!uri) return;

      setUploadingAvatar(true);
      await uploadCarrierAvatar(uri);
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
      await signOutCarrier();
      setCachedCarrierProfile(null);
      setCachedCarrierDashboard(null);
      setCachedCarrierWallet(null);
      setCachedAvailableLoads(null);
      router.replace("/welcome");
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  const showSkeleton = !data;
  const isVerified = data?.verificationStatus === "verified";
  const isOfficial = isOfficialFeedEmail(data?.email);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Profile</Text>
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
                      verified={isOfficial || isVerified}
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

                <View style={styles.completionBlock}>
                  <View style={styles.completionHeader}>
                    <Text style={styles.completionLabel}>Profile completion</Text>
                    <Text style={styles.completionValue}>{data.completionPercent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${data.completionPercent}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label="Active loads"
                  value={String(data.stats.activeLoads)}
                  icon="bus-outline"
                />
                <StatCard
                  label="Completed"
                  value={String(data.stats.completedLoads)}
                  icon="checkmark-done-outline"
                />
                <StatCard
                  label="Earnings"
                  value={formatProfileStatMoney(data.stats.totalEarnings)}
                  icon="trending-up-outline"
                  compact
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                  <InfoRow icon="mail-outline" label="Email" value={data.email || "Not provided"} />
                  <InfoRow icon="call-outline" label="Phone" value={data.phone} />
                  <InfoRow icon="location-outline" label="Base address" value={data.address} />
                  <InfoRow icon="card-outline" label="Operator ID" value={data.operatorId} />
                  {data.registrationNo !== "Not provided" ? (
                    <InfoRow
                      icon="document-text-outline"
                      label="Company registration"
                      value={data.registrationNo}
                    />
                  ) : null}
                  <InfoRow
                    icon="wallet-outline"
                    label="Payout account"
                    value={data.payoutAccount}
                    linkLabel={data.payoutSetupComplete ? "Update details" : "Set up payout"}
                    onPress={() =>
                      router.push(
                        data.payoutSetupComplete ? "/payout-setup?mode=edit" : "/payout-setup"
                      )
                    }
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fleet</Text>
                <View style={styles.sectionCard}>
                  <InfoRow icon="business-outline" label="Fleet size" value={data.fleetSize} />
                  <View style={styles.tagSection}>
                    <Text style={styles.tagSectionLabel}>Vehicle types</Text>
                    <TagList tags={data.vehicleTypes} />
                  </View>
                  <View style={styles.tagSection}>
                    <Text style={styles.tagSectionLabel}>Operating regions</Text>
                    <TagList tags={data.operatingRegions.length ? data.operatingRegions : ["United Kingdom"]} />
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.sectionCard}>
                  <SettingsRow
                    icon="create-outline"
                    label="Edit profile"
                    sublabel="Name, contact, operator details"
                    onPress={handleEditPress}
                  />
                  <SettingsRow
                    icon="notifications-outline"
                    label="Notifications"
                    sublabel="Load updates and payout alerts"
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
                    icon="hammer-outline"
                    label="My bids"
                    sublabel="Track marketplace offers"
                    onPress={() => router.push("/my-bids")}
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

      <EditProfileSheet ref={editSheetRef} onSaved={handleProfileSaved} />
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
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
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
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.mutedLight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 21,
  },
  infoValueLink: {
    color: colors.inkSoft,
  },
  infoLinkHint: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 2,
  },
  tagSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tagSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  emptyTags: {
    fontSize: 14,
    fontWeight: "500",
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputFill,
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
  skeletonWrap: {
    gap: spacing.lg,
  },
  skeletonHero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.inputFill,
  },
  skeletonLines: {
    flex: 1,
    gap: 10,
  },
  skeletonLineWide: {
    height: 22,
    width: "70%",
    borderRadius: 8,
    backgroundColor: colors.inputFill,
  },
  skeletonLineMid: {
    height: 14,
    width: "45%",
    borderRadius: 8,
    backgroundColor: colors.inputFill,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  skeletonStat: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.inputFill,
  },
  pressed: {
    opacity: 0.82,
  },
});
