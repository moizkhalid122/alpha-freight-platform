import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

type ReelAvatarProps = {
  name: string;
  avatarSrc?: string;
};

export default function ReelAvatar({ name, avatarSrc }: ReelAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarSrc && !avatarSrc.startsWith("/")) {
    return <Image source={{ uri: avatarSrc }} style={styles.avatarImage} />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{initials || "AF"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.canvas,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },
});
