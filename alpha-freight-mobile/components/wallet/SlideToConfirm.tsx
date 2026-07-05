import { useCallback } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";

const THUMB_SIZE = 52;
const TRACK_HEIGHT = 60;
const CONFIRM_THRESHOLD = 0.82;

type SlideToConfirmProps = {
  label?: string;
  disabled?: boolean;
  onConfirm: () => void;
};

export default function SlideToConfirm({
  label = "Slide to confirm payout",
  disabled = false,
  onConfirm,
}: SlideToConfirmProps) {
  const translateX = useSharedValue(0);
  const trackWidth = useSharedValue(280);
  const confirmed = useSharedValue(false);

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidth.value = event.nativeEvent.layout.width;
  }, [trackWidth]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      if (confirmed.value) return;
      const max = Math.max(trackWidth.value - THUMB_SIZE - 8, 0);
      translateX.value = Math.min(Math.max(event.translationX, 0), max);
    })
    .onEnd(() => {
      if (confirmed.value) return;
      const max = Math.max(trackWidth.value - THUMB_SIZE - 8, 0);
      if (max > 0 && translateX.value >= max * CONFIRM_THRESHOLD) {
        confirmed.value = true;
        translateX.value = withSpring(max, { damping: 18, stiffness: 220 });
        runOnJS(onConfirm)();
        return;
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE * 0.5,
    opacity: confirmed.value ? 1 : 0.35 + (translateX.value / Math.max(trackWidth.value, 1)) * 0.45,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(confirmed.value ? 0 : 1 - translateX.value / Math.max(trackWidth.value, 1), {
      duration: 120,
    }),
  }));

  return (
    <View style={[styles.track, disabled && styles.trackDisabled]} onLayout={onTrackLayout}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Ionicons name="chevron-forward" size={22} color={colors.ink} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function resetSlideToConfirm() {
  // noop export for external reset via key remount
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    overflow: "hidden",
  },
  trackDisabled: {
    opacity: 0.55,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
  },
  label: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.2,
  },
  thumb: {
    position: "absolute",
    left: 4,
    top: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
