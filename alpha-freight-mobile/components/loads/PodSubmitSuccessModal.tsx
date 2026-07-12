import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type PodSubmitSuccessModalProps = {
  visible: boolean;
  loadCode: string;
  routeLabel: string;
  onClose: () => void;
};

export default function PodSubmitSuccessModal({
  visible,
  loadCode,
  routeLabel,
  onClose,
}: PodSubmitSuccessModalProps) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.96);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    lottieRef.current?.reset();
    lottieRef.current?.play();
  }, [opacity, scale, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <LottieView
            ref={lottieRef}
            source={require("@/assets/lottie/pod-balloting.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.eyebrow}>Delivery submitted</Text>
          <Text style={styles.title}>POD uploaded successfully</Text>
          <Text style={styles.meta}>
            {loadCode} · {routeLabel}
          </Text>
          <Text style={styles.note}>Awaiting supplier verification before payout is released.</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.card,
  },
  lottie: {
    width: 220,
    height: 220,
    marginTop: -spacing.sm,
    marginBottom: -spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.success,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  meta: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  note: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
});
