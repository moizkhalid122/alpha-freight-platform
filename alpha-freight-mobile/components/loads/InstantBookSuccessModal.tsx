import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type InstantBookSuccessModalProps = {
  visible: boolean;
  loadCode: string;
  routeLabel: string;
  amountLabel: string;
  onClose: () => void;
};

export default function InstantBookSuccessModal({
  visible,
  loadCode,
  routeLabel,
  amountLabel,
  onClose,
}: InstantBookSuccessModalProps) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
  }, [opacity, scale, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={34} color={colors.ink} />
          </View>
          <Text style={styles.eyebrow}>Ready, set, go!</Text>
          <Text style={styles.title}>Load booked instantly</Text>
          <Text style={styles.meta}>
            {loadCode} · {routeLabel}
          </Text>
          <Text style={styles.amount}>{amountLabel} secured</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={() => {
              onClose();
              router.push("/my-loads");
            }}
          >
            <Text style={styles.primaryBtnText}>My shipments</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.secondaryBtnText}>Browse more loads</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
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
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.success,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
  secondaryBtn: {
    width: "100%",
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  pressed: {
    opacity: 0.88,
  },
});
