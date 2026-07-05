import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  initializePushNotifications,
  isNotificationPermissionGranted,
  isPushNotificationsSupported,
  requestNotificationPermissions,
} from "@/lib/push-notifications";
import {
  isNotificationPromptDismissed,
  markNotificationPromptDismissed,
  resetNotificationPromptDismissed,
  setNotificationPromptVisible,
} from "@/lib/notification-permission-session";
import { colors, radius, spacing } from "@/lib/theme";

const PROMPT_DELAY_MS = 1500;

type NotificationPermissionGateProps = {
  enabled: boolean;
};

export default function NotificationPermissionGate({ enabled }: NotificationPermissionGateProps) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [blockedInSettings, setBlockedInSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hidePrompt = useCallback(() => {
    setVisible(false);
    setNotificationPromptVisible(false);
  }, []);

  const evaluatePermission = useCallback(async () => {
    if (!enabled || !isPushNotificationsSupported()) {
      hidePrompt();
      return false;
    }

    const granted = await isNotificationPermissionGranted();
    if (granted) {
      hidePrompt();
      void initializePushNotifications();
      return true;
    }

    return false;
  }, [enabled, hidePrompt]);

  const schedulePrompt = useCallback(() => {
    if (!enabled || !isPushNotificationsSupported() || isNotificationPromptDismissed()) {
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(() => {
      void (async () => {
        const granted = await evaluatePermission();
        if (granted || isNotificationPromptDismissed()) return;
        setBlockedInSettings(false);
        setVisible(true);
        setNotificationPromptVisible(true);
      })();
    }, PROMPT_DELAY_MS);
  }, [clearTimer, enabled, evaluatePermission]);

  useEffect(() => {
    if (enabled) {
      schedulePrompt();
    } else {
      hidePrompt();
    }
    return clearTimer;
  }, [clearTimer, enabled, hidePrompt, schedulePrompt]);

  useFocusEffect(
    useCallback(() => {
      void evaluatePermission();
      schedulePrompt();
      return clearTimer;
    }, [clearTimer, evaluatePermission, schedulePrompt])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !enabled) return;
      resetNotificationPromptDismissed();
      void evaluatePermission().then((granted) => {
        if (!granted) schedulePrompt();
      });
    });

    return () => subscription.remove();
  }, [enabled, evaluatePermission, schedulePrompt]);

  const handleAllow = useCallback(async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermissions();
      if (result === "granted") {
        hidePrompt();
        await initializePushNotifications();
        return;
      }

      setBlockedInSettings(result === "denied");
    } finally {
      setRequesting(false);
    }
  }, [hidePrompt]);

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleLater = useCallback(() => {
    markNotificationPromptDismissed();
    hidePrompt();
  }, [hidePrompt]);

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={handleLater}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Animated.View entering={FadeIn.duration(420)} style={styles.content}>
            <Animated.View entering={ZoomIn.delay(80).duration(500)} style={styles.heroArt}>
              <View style={styles.heroRing}>
                <Ionicons name="notifications" size={34} color={colors.ink} />
              </View>
              <View style={styles.heroDotLeft} />
              <View style={styles.heroDotRight} />
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(120).duration(420)} style={styles.title}>
              Turn on notifications
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(180).duration(420)} style={styles.subtitle}>
              Required to receive verification alerts, load updates, and payout notifications — even when
              the app is closed.
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(240).duration(420)} style={styles.actions}>
              {blockedInSettings ? (
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.primaryBtnText}>Open phone settings</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (pressed || requesting) && styles.pressed,
                    requesting && styles.primaryBtnDisabled,
                  ]}
                  onPress={() => void handleAllow()}
                  disabled={requesting}
                >
                  {requesting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Allow notifications</Text>
                  )}
                </Pressable>
              )}

              {!blockedInSettings ? (
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={handleLater}
                  disabled={requesting}
                >
                  <Text style={styles.secondaryBtnText}>Not now</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 36, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    minHeight: "62%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  heroArt: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  heroRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  heroDotLeft: {
    position: "absolute",
    left: 72,
    bottom: 28,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#5B8DEF",
    borderWidth: 2,
    borderColor: colors.ink,
  },
  heroDotRight: {
    position: "absolute",
    right: 72,
    bottom: 36,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#8B5CF6",
    borderWidth: 2,
    borderColor: colors.ink,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryBtnDisabled: {
    opacity: 0.75,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  secondaryBtn: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  pressed: {
    opacity: 0.88,
  },
});
