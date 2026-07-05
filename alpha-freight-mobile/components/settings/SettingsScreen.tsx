import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DEFAULT_NOTIFICATION_PREFS,
  NotificationPrefs,
  readNotificationPrefs,
  writeNotificationPrefs,
} from "@/lib/carrier-settings-prefs";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.toggleTrack, checked && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, checked && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

function PrefRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefCopy}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{sublabel}</Text>
      </View>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </View>
  );
}

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [{ data: { user } }, storedPrefs] = await Promise.all([
          supabase.auth.getUser(),
          readNotificationPrefs(),
        ]);
        if (user?.email) setEmail(user.email);
        setPrefs(storedPrefs);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePref = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      void writeNotificationPrefs(next);
      return next;
    });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }, []);

  const handlePasswordUpdate = useCallback(async () => {
    setPasswordMessage(null);

    if (passwordForm.next.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      setPasswordSaving(true);
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (error) throw error;
      setPasswordForm({ next: "", confirm: "" });
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not update password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }, [passwordForm]);

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
            <Text style={styles.headerEyebrow}>ACCOUNT</Text>
            <Text style={styles.pageTitle}>Settings</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.pageSub}>Security, notifications, and sign-in preferences</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {prefsSaved ? (
              <View style={styles.savedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.savedBannerText}>Preferences saved</Text>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Profile & account</Text>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>Signed in as</Text>
                  <Text style={styles.infoValue}>{email || "—"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Change password</Text>
              <TextInput
                value={passwordForm.next}
                onChangeText={(next) => setPasswordForm((current) => ({ ...current, next }))}
                placeholder="New password"
                placeholderTextColor={colors.mutedLight}
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                value={passwordForm.confirm}
                onChangeText={(confirm) => setPasswordForm((current) => ({ ...current, confirm }))}
                placeholder="Confirm new password"
                placeholderTextColor={colors.mutedLight}
                secureTextEntry
                style={styles.input}
              />
              {passwordMessage ? (
                <Text
                  style={[
                    styles.formMessage,
                    passwordMessage.type === "success" ? styles.formSuccess : styles.formError,
                  ]}
                >
                  {passwordMessage.text}
                </Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  passwordSaving && styles.btnDisabled,
                  pressed && !passwordSaving && styles.pressed,
                ]}
                disabled={passwordSaving}
                onPress={() => void handlePasswordUpdate()}
              >
                {passwordSaving ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <Text style={styles.primaryBtnText}>Update password</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Notification preferences</Text>
              <Text style={styles.sectionSub}>
                Stored on this device. Push alerts still follow your phone permission settings.
              </Text>
              <PrefRow
                label="Load alerts"
                sublabel="New freight matching your fleet"
                checked={prefs.loadAlerts}
                onChange={(value) => void updatePref("loadAlerts", value)}
              />
              <PrefRow
                label="Bid updates"
                sublabel="When suppliers accept or reject offers"
                checked={prefs.bidUpdates}
                onChange={(value) => void updatePref("bidUpdates", value)}
              />
              <PrefRow
                label="Weekly reports"
                sublabel="Summary of earnings and activity"
                checked={prefs.weeklyReports}
                onChange={(value) => void updatePref("weeklyReports", value)}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.supportLink, pressed && styles.pressed]}
              onPress={() => router.push("/support")}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.ink} />
              <Text style={styles.supportLinkText}>Need help? Visit Support</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
            </Pressable>
          </ScrollView>
        )}
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
  headerSpacer: { width: 40 },
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(5,150,105,0.08)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  savedBannerText: { fontSize: 14, fontWeight: "700", color: colors.success },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
  },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  infoValue: { fontSize: 15, fontWeight: "700", color: colors.ink },
  input: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  formMessage: { fontSize: 13, fontWeight: "600" },
  formSuccess: { color: colors.success },
  formError: { color: colors.danger },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "800", color: colors.ink },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  prefCopy: { flex: 1, gap: 2 },
  prefLabel: { fontSize: 15, fontWeight: "700", color: colors.ink },
  prefSub: { fontSize: 12, fontWeight: "500", color: colors.muted },
  toggle: { padding: 4 },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: colors.ink },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  supportLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  supportLinkText: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.ink },
  btnDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
