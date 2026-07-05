import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { colors, shadow, spacing } from "@/lib/theme";

export type TabKey = "home" | "loads" | "wallet" | "profile";

type BottomTabBarProps = {
  active: TabKey;
  onChange?: (tab: TabKey) => void;
  variant?: "light" | "dark";
};

const LEFT_TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "grid-outline" },
  { key: "loads", label: "Loads", icon: "bus-outline" },
];

const RIGHT_TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "wallet", label: "Wallet", icon: "wallet-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

function TabItem({
  tab,
  isActive,
  isDark,
  onPress,
}: {
  tab: (typeof LEFT_TABS)[number];
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.item, pressed && styles.pressed]} onPress={onPress}>
      {isActive ? <View style={styles.activeBar} /> : null}
      <Ionicons
        name={tab.icon}
        size={22}
        color={isActive ? (isDark ? colors.brand : colors.ink) : isDark ? colors.muted : colors.mutedLight}
      />
      <Text
        style={[
          styles.label,
          isDark && styles.labelDark,
          isActive && styles.labelActive,
          isActive && isDark && styles.labelActiveDark,
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function AiOrbButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.orbBtn, pressed && styles.orbPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Alpha Assistant"
    >
      <View style={styles.orbRing}>
        <LottieView
          source={require("@/assets/lottie/orb-ai-assistant.json")}
          autoPlay
          loop
          style={styles.orbLottie}
        />
      </View>
      <Text style={styles.orbLabel}>AI</Text>
    </Pressable>
  );
}

export default function BottomTabBar({ active, onChange, variant = "light" }: BottomTabBarProps) {
  const isDark = variant === "dark";

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
        <View style={[styles.bar, isDark && styles.barDark]}>
          <View style={styles.side}>
            {LEFT_TABS.map((tab) => (
              <TabItem
                key={tab.key}
                tab={tab}
                isActive={tab.key === active}
                isDark={isDark}
                onPress={() => onChange?.(tab.key)}
              />
            ))}
          </View>

          <View style={styles.centerSlot} />

          <View style={styles.side}>
            {RIGHT_TABS.map((tab) => (
              <TabItem
                key={tab.key}
                tab={tab}
                isActive={tab.key === active}
                isDark={isDark}
                onPress={() => onChange?.(tab.key)}
              />
            ))}
          </View>
        </View>

        <View style={styles.orbFloat} pointerEvents="box-none">
          <AiOrbButton onPress={() => router.push("/ai-assistant")} />
        </View>
    </View>
  );
}

const ORB_SIZE = 62;
const CENTER_SLOT = ORB_SIZE + 8;

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    overflow: "visible",
  },
  shellDark: {
    backgroundColor: colors.ink,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: spacing.sm,
  },
  barDark: {},
  side: {
    flex: 1,
    flexDirection: "row",
  },
  centerSlot: {
    width: CENTER_SLOT,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingTop: 4,
    position: "relative",
  },
  pressed: {
    opacity: 0.65,
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedLight,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  labelDark: {
    color: colors.mutedLight,
  },
  labelActiveDark: {
    color: colors.white,
  },
  orbFloat: {
    position: "absolute",
    top: -18,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  orbBtn: {
    alignItems: "center",
    gap: 2,
  },
  orbPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  orbRing: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadow.soft,
  },
  orbLottie: {
    width: ORB_SIZE - 6,
    height: ORB_SIZE - 6,
  },
  orbLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.6,
  },
});
