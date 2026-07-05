import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type ReplyMoreOptionsSheetProps = {
  visible: boolean;
  replyText: string;
  onClose: () => void;
  onCopy: () => void;
  onReport?: () => void;
};

type OptionItem = {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "default" | "danger";
  onPress: () => void;
};

function OptionRow({
  item,
  isLast,
}: {
  item: OptionItem;
  isLast: boolean;
}) {
  const isDanger = item.tone === "danger";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionRow,
        !isLast && styles.optionRowBorder,
        pressed && styles.optionRowPressed,
      ]}
      onPress={item.onPress}
    >
      <View style={[styles.optionIconWrap, isDanger && styles.optionIconWrapDanger]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={isDanger ? colors.danger : colors.inkSoft}
        />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionLabel, isDanger && styles.optionLabelDanger]}>
          {item.label}
        </Text>
        <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
    </Pressable>
  );
}

export default function ReplyMoreOptionsSheet({
  visible,
  replyText,
  onClose,
  onCopy,
  onReport,
}: ReplyMoreOptionsSheetProps) {
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    onClose();
    try {
      await Share.share({ message: replyText });
    } catch {
      // User dismissed share sheet.
    }
  };

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleReport = () => {
    onReport?.();
    onClose();
  };

  const options: OptionItem[] = [
    {
      key: "share",
      label: "Share reply",
      subtitle: "Send this answer to another app",
      icon: "share-outline",
      onPress: () => void handleShare(),
    },
    {
      key: "copy",
      label: "Copy full reply",
      subtitle: "Save the entire response to clipboard",
      icon: "copy-outline",
      onPress: handleCopy,
    },
    {
      key: "report",
      label: "Report an issue",
      subtitle: "Flag incorrect or unsafe content",
      icon: "flag-outline",
      tone: "danger",
      onPress: handleReport,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close options" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>Reply options</Text>
            <Text style={styles.subtitle}>Manage this AI response</Text>
          </View>

          <View style={styles.optionsCard}>
            {options.map((item, index) => (
              <OptionRow
                key={item.key}
                item={item}
                isLast={index === options.length - 1}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 36, 0.48)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadow.card,
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D4D4D4",
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.muted,
  },
  optionsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionRowPressed: {
    backgroundColor: colors.canvasMuted,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconWrapDanger: {
    backgroundColor: colors.dangerSoft,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  optionLabelDanger: {
    color: colors.danger,
  },
  optionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: colors.muted,
  },
  cancelBtn: {
    marginTop: spacing.md,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnPressed: {
    opacity: 0.82,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.inkSoft,
  },
});
