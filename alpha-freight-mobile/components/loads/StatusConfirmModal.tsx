import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type StatusConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loadCode: string;
  routeLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StatusConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  loadCode,
  routeLabel,
  icon,
  loading = false,
  onCancel,
  onConfirm,
}: StatusConfirmModalProps) {
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.topAccent} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={20} color={colors.ink} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Confirmation</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.routeCard}>
            <Text style={styles.routeCode}>{loadCode}</Text>
            <Text style={styles.routeLabel} numberOfLines={2}>
              {routeLabel}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && !loading && styles.pressed,
              loading && styles.btnDisabled,
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.confirmText} numberOfLines={1}>
                {confirmLabel}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && !loading && styles.cancelPressed,
              loading && styles.btnDisabled,
            ]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Not now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(21, 27, 36, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brand,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.mutedLight,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
    color: colors.ink,
  },
  message: {
    fontSize: 13.5,
    fontWeight: "500",
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    marginBottom: 14,
  },
  routeCode: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: colors.mutedLight,
    textTransform: "uppercase",
  },
  routeLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  confirmBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
    marginBottom: 4,
    ...shadow.soft,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.1,
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cancelPressed: {
    opacity: 0.65,
  },
});
