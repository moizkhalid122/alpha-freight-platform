import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";

type PinShellProps = {
  title: string;
  subtitle: string;
  error?: string | null;
  children: ReactNode;
  showBack?: boolean;
};

export default function PinShell({
  title,
  subtitle,
  error,
  children,
  showBack = true,
}: PinShellProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {showBack ? (
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.body}>
          <Image source={require("@/assets/brand/pin-logo.png")} style={styles.logo} resizeMode="contain" />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

          <View style={styles.content}>{children}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safe: {
    flex: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  backSpacer: {
    height: 44,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logo: {
    width: 220,
    height: 56,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
    minHeight: 18,
  },
  errorSpacer: {
    height: 18,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
});
