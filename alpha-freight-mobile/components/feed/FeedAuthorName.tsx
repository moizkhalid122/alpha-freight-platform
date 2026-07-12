import { Image, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";

const VERIFIED_BADGE = require("@/assets/verified-badge.png");

type FeedAuthorNameProps = {
  name: string;
  verified?: boolean;
  tone?: "light" | "dark";
  textStyle?: TextStyle;
  style?: ViewStyle;
  numberOfLines?: number;
  badgeSize?: number;
};

export default function FeedAuthorName({
  name,
  verified,
  tone = "light",
  textStyle,
  style,
  numberOfLines = 1,
  badgeSize,
}: FeedAuthorNameProps) {
  const resolvedBadgeSize = badgeSize ?? (tone === "dark" ? 17 : 16);

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.name, textStyle]} numberOfLines={numberOfLines}>
        {name}
      </Text>
      {verified ? (
        <Image
          source={VERIFIED_BADGE}
          style={{ width: resolvedBadgeSize, height: resolvedBadgeSize }}
          resizeMode="contain"
          accessibilityLabel="Verified account"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  name: {
    flexShrink: 1,
  },
});
