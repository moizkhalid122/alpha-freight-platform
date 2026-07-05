import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import ConfettiPop from "@/components/ui/ConfettiPop";
import {
  subscribeVerifiedCelebration,
  type VerifiedCelebrationPayload,
} from "@/lib/verified-celebration";
import { colors, radius, spacing } from "@/lib/theme";

export default function VerifiedCelebrationModal() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<VerifiedCelebrationPayload | null>(null);

  useEffect(() => {
    return subscribeVerifiedCelebration((nextPayload) => {
      setPayload(nextPayload);
      setVisible(true);
    });
  }, []);

  const handleClose = () => {
    setVisible(false);
    payload?.onClose?.();
    setPayload(null);
  };

  if (!visible || !payload) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.stage}>
          <ConfettiPop delay={120} />

          <Animated.View entering={FadeIn.duration(420)} style={styles.card}>
            <Animated.View entering={ZoomIn.delay(80).duration(480)} style={styles.iconWrap}>
              <Ionicons name="shield-checkmark" size={34} color={colors.ink} />
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(140).duration(420)} style={styles.title}>
              {payload.title}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(200).duration(420)} style={styles.body}>
              {payload.body}
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(260).duration(420)} style={styles.footer}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={handleClose}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
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
    backgroundColor: "rgba(15, 23, 36, 0.52)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  stage: {
    overflow: "hidden",
    borderRadius: radius.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.ink,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  footer: {
    width: "100%",
    marginTop: spacing.sm,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
