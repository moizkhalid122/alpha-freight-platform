import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";

type SetupShellProps = {
  children: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  progress?: string;
  footer?: ReactNode;
  stepKey?: string;
};

export function SetupPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        isDisabled && styles.primaryBtnDisabled,
        pressed && !isDisabled && styles.primaryBtnPressed,
      ]}
      onPress={() => {
        if (isDisabled) return;
        onPress();
      }}
      disabled={isDisabled}
      hitSlop={8}
    >
      <Text style={[styles.primaryBtnText, isDisabled && styles.primaryBtnTextDisabled]}>
        {loading ? "Please wait…" : label}
      </Text>
    </Pressable>
  );
}

export function SetupOutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.outlineBtnText}>{label}</Text>
    </Pressable>
  );
}

export default function SetupShell({
  children,
  onBack,
  showBack = true,
  progress,
  footer,
  stepKey = "setup",
}: SetupShellProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.frame}>
        <View style={styles.header}>
          {showBack && onBack ? (
            <Pressable style={styles.backBtn} onPress={onBack} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}
          {progress ? <Text style={styles.progress}>{progress}</Text> : <View style={styles.progressSpacer} />}
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.bodySlot}>
          <Animated.View key={stepKey} entering={FadeInRight.duration(200)} style={styles.body}>
            {children}
          </Animated.View>
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  frame: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: {
    width: 36,
  },
  progress: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  progressSpacer: {
    flex: 1,
  },
  bodySlot: {
    flex: 1,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    zIndex: 20,
    elevation: 20,
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "#D7DCE3",
  },
  primaryBtnPressed: {
    backgroundColor: colors.blackSoft,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  primaryBtnTextDisabled: {
    color: "#F8FAFC",
  },
  outlineBtn: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
});
