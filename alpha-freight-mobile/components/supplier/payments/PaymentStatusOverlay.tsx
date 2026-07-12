import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { colors, radius, shadow, spacing } from "@/lib/theme";

export type PaymentOverlayPhase = "processing" | "success" | "failed";

type PaymentStatusOverlayProps = {
  visible: boolean;
  phase: PaymentOverlayPhase;
  amountLabel: string;
  errorMessage?: string;
  onSuccessFinish: () => void;
  onRetry: () => void;
};

const LOTTIE = {
  success: require("@/assets/lottie/payment-success.json"),
  failed: require("@/assets/lottie/payment-failed.json"),
} as const;

const COPY = {
  processing: {
    eyebrow: "Processing",
    title: "Confirming payment",
    subtitle: "Securing your load…",
  },
  success: {
    eyebrow: "Approved",
    title: "Payment successful",
    subtitle: "Your load is going live.",
  },
  failed: {
    eyebrow: "Declined",
    title: "Payment failed",
    subtitle: "Your card was not charged.",
  },
} as const;

export default function PaymentStatusOverlay({
  visible,
  phase,
  amountLabel,
  errorMessage,
  onSuccessFinish,
  onRetry,
}: PaymentStatusOverlayProps) {
  const lottieRef = useRef<LottieView>(null);
  const finishedRef = useRef(false);
  const copy = COPY[phase];

  const finishSuccessOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onSuccessFinish();
  }, [onSuccessFinish]);

  useEffect(() => {
    if (!visible) {
      finishedRef.current = false;
      return;
    }
    if (phase !== "processing") {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    }
  }, [phase, visible]);

  useEffect(() => {
    if (!visible || phase !== "success") return;
    const timer = setTimeout(() => {
      finishSuccessOnce();
    }, 2200);
    return () => clearTimeout(timer);
  }, [finishSuccessOnce, phase, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop} />

        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          style={styles.sheet}
        >
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            {phase === "processing" ? (
              <View style={styles.processingRing}>
                <ActivityIndicator size="small" color={colors.ink} />
              </View>
            ) : (
              <LottieView
                ref={lottieRef}
                source={LOTTIE[phase]}
                autoPlay
                loop={false}
                style={styles.lottie}
                onAnimationFinish={
                  phase === "success"
                    ? () => {
                        finishSuccessOnce();
                      }
                    : undefined
                }
              />
            )}
          </View>

          <Animated.Text entering={FadeInDown.delay(60).duration(260)} style={styles.eyebrow}>
            {copy.eyebrow}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(90).duration(260)} style={styles.title}>
            {copy.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120).duration(260)} style={styles.subtitle}>
            {phase === "failed" && errorMessage ? errorMessage : copy.subtitle}
          </Animated.Text>

          {phase !== "processing" ? (
            <View style={styles.amountPill}>
              <Text style={styles.amount}>{amountLabel}</Text>
            </View>
          ) : null}

          {phase === "failed" ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={onRetry}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.ink} />
              <Text style={styles.primaryBtnText}>Try again</Text>
            </Pressable>
          ) : null}

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={11} color={colors.mutedLight} />
            <Text style={styles.secureText}>Secured by Stripe</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.md,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    ...shadow.card,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginBottom: spacing.sm,
  },
  iconWrap: {
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  processingRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: "rgba(191, 255, 7, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 88,
    height: 88,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedLight,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  amountPill: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  primaryBtn: {
    marginTop: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
  secureRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  secureText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedLight,
    letterSpacing: 0.2,
  },
});
