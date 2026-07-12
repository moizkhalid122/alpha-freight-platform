import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { formatEngagementCount } from "@/lib/feed-posts";
import { colors } from "@/lib/theme";

type FeedLikeButtonProps = {
  liked: boolean;
  count: number;
  disabled?: boolean;
  tone?: "light" | "dark";
  layout?: "row" | "column";
  iconSize?: number;
  onLike: () => void;
  onUnlike: () => void;
};

const LIKED_COLOR = "#F97316";
const DEFAULT_ICON_SIZE = 20;

export default function FeedLikeButton({
  liked,
  count,
  disabled,
  tone = "light",
  layout = "row",
  iconSize = DEFAULT_ICON_SIZE,
  onLike,
  onUnlike,
}: FeedLikeButtonProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [localLiked, setLocalLiked] = useState(liked);
  const lottieRef = useRef<LottieView>(null);
  const countScale = useSharedValue(1);

  useEffect(() => {
    setDisplayCount(count);
  }, [count]);

  useEffect(() => {
    setLocalLiked(liked);
  }, [liked]);

  useEffect(() => {
    if (!localLiked) return;

    const timer = setTimeout(() => {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    }, 16);

    return () => clearTimeout(timer);
  }, [localLiked]);

  const handlePress = useCallback(() => {
    if (disabled) return;

    if (localLiked) {
      setLocalLiked(false);
      setDisplayCount((value) => Math.max(0, value - 1));
      lottieRef.current?.pause();
      onUnlike();
      return;
    }

    setLocalLiked(true);
    setDisplayCount((value) => value + 1);
    onLike();
    countScale.value = withSequence(withSpring(1.28, { damping: 8 }), withSpring(1));
  }, [countScale, disabled, localLiked, onLike, onUnlike]);

  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const isDark = tone === "dark";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrap,
        layout === "column" && styles.wrapColumn,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
    >
      <View style={[styles.iconSlot, { width: iconSize, height: iconSize }]}>
        {localLiked ? (
          <LottieView
            ref={lottieRef}
            source={require("@/assets/lottie/fire-like.json")}
            autoPlay
            loop
            resizeMode="contain"
            style={{ width: iconSize, height: iconSize }}
          />
        ) : (
          <Ionicons
            name="flame-outline"
            size={iconSize}
            color={isDark ? colors.white : colors.ink}
          />
        )}
      </View>

      <Animated.Text
        style={[
          styles.count,
          layout === "column" && styles.countColumn,
          isDark && styles.countDark,
          localLiked && styles.countLiked,
          countStyle,
        ]}
      >
        {formatEngagementCount(displayCount)}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 44,
  },
  wrapColumn: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: 0,
    gap: 2,
  },
  pressed: {
    opacity: 0.72,
  },
  iconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
    minWidth: 16,
  },
  countColumn: {
    marginLeft: 5,
    textAlign: "center",
    alignSelf: "center",
  },
  countLiked: {
    color: LIKED_COLOR,
  },
  countDark: {
    color: colors.white,
  },
});
