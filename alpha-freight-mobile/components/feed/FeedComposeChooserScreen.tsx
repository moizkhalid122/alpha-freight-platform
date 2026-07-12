import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type FeedComposeChooserScreenProps = {
  role: "carrier" | "supplier";
};

function ComposeOption({
  icon,
  title,
  subtitle,
  accent,
  delay,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  delay: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 210 }));
  }, [delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        onPress={onPress}
      >
        <View style={[styles.optionIcon, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={22} color={colors.ink} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
      </Pressable>
    </Animated.View>
  );
}

export default function FeedComposeChooserScreen({ role }: FeedComposeChooserScreenProps) {
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(16);
  const cardScale = useSharedValue(0.94);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 280 });
    headerY.value = withSpring(0, { damping: 16, stiffness: 220 });
    cardOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
    cardScale.value = withDelay(80, withSpring(1, { damping: 14, stiffness: 210 }));
  }, [cardOpacity, cardScale, headerOpacity, headerY]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.hero, headerStyle]}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color={colors.ink} />
            <Text style={styles.badgeText}>Create</Text>
          </View>
          <Text style={styles.title}>Share with the network</Text>
          <Text style={styles.subtitle}>Choose what you want to publish</Text>
        </Animated.View>

        <Animated.View style={[styles.card, cardStyle]}>
          <ComposeOption
            delay={120}
            icon="newspaper-outline"
            title="Post"
            subtitle="Updates, photos, and news"
            accent="#EEF2FF"
            onPress={() =>
              router.replace({ pathname: "/create-feed-post", params: { role } })
            }
          />
          <ComposeOption
            delay={200}
            icon="film-outline"
            title="Reel"
            subtitle="Short vertical video"
            accent="#FFF7ED"
            onPress={() =>
              router.replace({ pathname: "/create-feed-reel", params: { role } })
            }
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.muted,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
});
