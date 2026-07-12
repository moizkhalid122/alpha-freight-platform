import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FooterAiOrb from "@/components/dashboard/FooterAiOrb";
import { colors, spacing } from "@/lib/theme";
import { LAUNCH_FEATURES } from "@/lib/launch-config";

export type CarrierTabKey = "home" | "feed" | "loads" | "wallet" | "profile";
export type SupplierTabKey = "home" | "feed" | "posts" | "bids" | "profile";
export type TabKey = CarrierTabKey | SupplierTabKey;

type BottomTabBarProps = {
  active: TabKey;
  onChange?: (tab: TabKey) => void;
  variant?: "light" | "dark";
  role?: "carrier" | "supplier";
};

type TabDef = { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap };

const CARRIER_LEFT_TABS: TabDef[] = [
  { key: "home", label: "Home", icon: "grid-outline" },
  { key: "loads", label: "Loads", icon: "bus-outline" },
];

const CARRIER_RIGHT_TABS: TabDef[] = [
  { key: "wallet", label: "Wallet", icon: "wallet-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

const CARRIER_FEED_LEFT_TABS: TabDef[] = [
  { key: "home", label: "Home", icon: "grid-outline" },
  { key: "feed", label: "Feed", icon: "newspaper-outline" },
];

const CARRIER_FEED_RIGHT_TABS: TabDef[] = [
  { key: "loads", label: "Loads", icon: "bus-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

const SUPPLIER_LEFT_TABS: TabDef[] = [
  { key: "home", label: "Home", icon: "grid-outline" },
  { key: "posts", label: "Posts", icon: "layers-outline" },
];

const SUPPLIER_RIGHT_TABS: TabDef[] = [
  { key: "bids", label: "Bids", icon: "pricetag-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

const SUPPLIER_FEED_LEFT_TABS: TabDef[] = [
  { key: "home", label: "Home", icon: "grid-outline" },
  { key: "feed", label: "Feed", icon: "newspaper-outline" },
];

const SUPPLIER_FEED_RIGHT_TABS: TabDef[] = [
  { key: "posts", label: "Posts", icon: "layers-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

function TabItem({
  tab,
  isActive,
  isDark,
  onPress,
}: {
  tab: TabDef;
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      onPress={onPress}
      hitSlop={8}
    >
      {isActive ? <View style={styles.activeBar} /> : null}
      <Ionicons
        name={tab.icon}
        size={22}
        color={isActive ? (isDark ? colors.brand : colors.ink) : isDark ? colors.muted : colors.mutedLight}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
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

function BottomTabBar({
  active,
  onChange,
  variant = "light",
  role = "carrier",
}: BottomTabBarProps) {
  const isDark = variant === "dark";

  const { leftTabs, rightTabs } =
    role === "supplier"
      ? LAUNCH_FEATURES.socialFeed
        ? { leftTabs: SUPPLIER_FEED_LEFT_TABS, rightTabs: SUPPLIER_FEED_RIGHT_TABS }
        : { leftTabs: SUPPLIER_LEFT_TABS, rightTabs: SUPPLIER_RIGHT_TABS }
      : LAUNCH_FEATURES.socialFeed
        ? { leftTabs: CARRIER_FEED_LEFT_TABS, rightTabs: CARRIER_FEED_RIGHT_TABS }
        : { leftTabs: CARRIER_LEFT_TABS, rightTabs: CARRIER_RIGHT_TABS };

  const isSupplier = role === "supplier";

  return (
    <View style={[styles.shell, isDark && styles.shellDark]}>
      <View style={[styles.bar, isDark && styles.barDark, isSupplier && styles.barSupplier]}>
        {leftTabs.map((tab, index) => (
          <View
            key={tab.key}
            style={[styles.tabSlot, isSupplier && index === 0 && styles.tabSlotSupplierStart]}
          >
            <TabItem
              tab={tab}
              isActive={tab.key === active}
              isDark={isDark}
              onPress={() => onChange?.(tab.key)}
            />
          </View>
        ))}

        <View style={[styles.tabSlot, styles.tabSlotCenter]}>
          <View style={styles.orbWrap}>
            <FooterAiOrb />
          </View>
        </View>

        {rightTabs.map((tab, index) => (
          <View
            key={tab.key}
            style={[
              styles.tabSlot,
              isSupplier && index === rightTabs.length - 1 && styles.tabSlotSupplierEnd,
            ]}
          >
            <TabItem
              tab={tab}
              isActive={tab.key === active}
              isDark={isDark}
              onPress={() => onChange?.(tab.key)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(BottomTabBar);

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
    paddingHorizontal: spacing.xs,
  },
  barSupplier: {
    paddingHorizontal: spacing.sm,
  },
  barDark: {},
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  tabSlotSupplierStart: {
    paddingLeft: 2,
  },
  tabSlotSupplierEnd: {
    paddingRight: 2,
  },
  tabSlotCenter: {
    justifyContent: "flex-end",
    zIndex: 2,
  },
  orbWrap: {
    marginTop: -18,
    alignItems: "center",
  },
  item: {
    width: "100%",
    maxWidth: 72,
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
    letterSpacing: 0.1,
    textAlign: "center",
    width: "100%",
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
});
