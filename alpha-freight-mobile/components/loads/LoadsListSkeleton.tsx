import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) {
  return <View style={[styles.block, { width, height }, style]} />;
}

function LoadCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width="42%" height={16} />
      <SkeletonBlock width="88%" height={18} style={styles.gapSm} />
      <SkeletonBlock width="64%" height={14} style={styles.gapSm} />
      <SkeletonBlock width="100%" height={120} style={styles.gapMd} />
      <SkeletonBlock width="38%" height={14} style={styles.gapMd} />
      <View style={styles.footer}>
        <View style={styles.actions}>
          <SkeletonBlock width={40} height={40} style={styles.circle} />
          <SkeletonBlock width={40} height={40} style={styles.circle} />
          <SkeletonBlock width={40} height={40} style={styles.circle} />
        </View>
        <SkeletonBlock width={84} height={36} style={styles.pill} />
      </View>
    </View>
  );
}

export default function LoadsListSkeleton() {
  return (
    <View style={styles.wrap}>
      <LoadCardSkeleton />
      <LoadCardSkeleton />
      <LoadCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  block: {
    borderRadius: 10,
    backgroundColor: colors.inputFill,
  },
  gapSm: {
    marginTop: 8,
  },
  gapMd: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  circle: {
    borderRadius: 20,
  },
  pill: {
    borderRadius: radius.pill,
  },
});
