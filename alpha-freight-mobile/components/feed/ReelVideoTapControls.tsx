import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type ReelVideoTapControlsProps = {
  visible: boolean;
  muted: boolean;
  onPlay: () => void;
  onToggleMute: () => void;
};

export default function ReelVideoTapControls({
  visible,
  muted,
  onPlay,
  onToggleMute,
}: ReelVideoTapControlsProps) {
  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.pill} pointerEvents="auto">
        <Pressable style={styles.btn} onPress={onPlay} hitSlop={8}>
          <Ionicons name="play" size={30} color={colors.white} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.btn} onPress={onToggleMute} hitSlop={8}>
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={26}
            color={colors.white}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  btn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
});
