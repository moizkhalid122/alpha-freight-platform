import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/lib/theme";

type ReelUploadProgressSheetProps = {
  visible: boolean;
  progress: number;
  label: string;
  complete: boolean;
  onDismissed?: () => void;
};

export default function ReelUploadProgressSheet({
  visible,
  progress,
  label,
  complete,
  onDismissed,
}: ReelUploadProgressSheetProps) {
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 240 });
      return;
    }

    if (!mounted) return;

    translateY.value = withTiming(
      120,
      { duration: 280, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
          if (onDismissed) {
            runOnJS(onDismissed)();
          }
        }
      }
    );
    opacity.value = withTiming(0, { duration: 220 });
  }, [visible, mounted, translateY, opacity, onDismissed]);

  useEffect(() => {
    fillWidth.value = withTiming(Math.max(0, Math.min(100, progress)), {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, fillWidth]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  if (!mounted) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <Animated.View style={[styles.wrap, sheetStyle]} pointerEvents="none">
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {complete ? (
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color={colors.ink} />
          )}
          <Text style={styles.label} numberOfLines={1}>
            {complete ? "Reel uploaded successfully" : label}
          </Text>
          <Text style={styles.percent}>{clamped}%</Text>
        </View>
        <View style={styles.track}>
          <Animated.View
            style={[styles.fill, fillStyle, complete && styles.fillComplete]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    zIndex: 20,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  percent: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.muted,
    minWidth: 36,
    textAlign: "right",
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  fillComplete: {
    backgroundColor: "#22C55E",
  },
});
