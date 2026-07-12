import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SupplierMyPost,
  getSupplierPostStatusMeta,
  isTrackableSupplierPost,
} from "@/lib/supplier-my-posts";
import {
  getCachedSupplierMyPosts,
  prefetchSupplierMyPosts,
} from "@/lib/supplier-my-posts-cache";
import { colors, radius, spacing } from "@/lib/theme";

function LoadPickRow({ post, onPress }: { post: SupplierMyPost; onPress: () => void }) {
  const meta = getSupplierPostStatusMeta(post.status, post.paymentState, post.needsPodReview);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.rowTop}>
        <Text style={styles.rowCode}>{post.code}</Text>
        <Text style={styles.rowStatus}>{meta.label}</Text>
      </View>
      <Text style={styles.rowRoute} numberOfLines={1}>
        {post.origin} → {post.destination}
      </Text>
      <View style={styles.rowFooter}>
        <Text style={styles.rowMeta}>{post.pickupLabel}</Text>
        <Text style={styles.rowPrice}>{post.priceLabel}</Text>
      </View>
    </Pressable>
  );
}

export default function LoadTrackingPickerScreen() {
  const cached = getCachedSupplierMyPosts();
  const [posts, setPosts] = useState<SupplierMyPost[]>(() =>
    (cached?.posts ?? []).filter(isTrackableSupplierPost)
  );
  const [loading, setLoading] = useState(() => !cached);

  const loadPosts = useCallback(async () => {
    if (!getCachedSupplierMyPosts()) setLoading(true);
    const data = await prefetchSupplierMyPosts();
    setPosts((data?.posts ?? []).filter(isTrackableSupplierPost));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts])
  );

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const priority = (status: string) => {
          if (status === "in-transit") return 0;
          if (status === "booked") return 1;
          if (status === "active") return 2;
          return 3;
        };
        return priority(a.status) - priority(b.status);
      }),
    [posts]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Tracking</Text>
            <Text style={styles.headerTitle}>Select a load</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Choose which shipment you want to track on the map.</Text>
      </SafeAreaView>

      {loading && sortedPosts.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.ink} />
        </View>
      ) : sortedPosts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="navigate-outline" size={40} color={colors.mutedLight} />
          <Text style={styles.emptyTitle}>No trackable loads yet</Text>
          <Text style={styles.emptySub}>
            Loads appear here once payment is confirmed and a carrier is assigned or the shipment is
            moving.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.replace("/(supplier-main)/posts")}>
            <Text style={styles.emptyBtnText}>View my posts</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {sortedPosts.map((post) => (
            <LoadPickRow
              key={post.id}
              post={post}
              onPress={() => router.push(`/load-tracking/${post.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeTop: { backgroundColor: colors.white, paddingBottom: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvasMuted,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.muted,
    textTransform: "uppercase",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.ink },
  emptySub: { fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
  },
  emptyBtnText: { color: colors.white, fontWeight: "700" },
  listContent: { padding: spacing.lg, gap: 12, paddingBottom: spacing.xxl },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCode: { fontSize: 13, fontWeight: "800", color: colors.ink },
  rowStatus: { fontSize: 11, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
  rowRoute: { fontSize: 16, fontWeight: "700", color: colors.ink },
  rowFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowMeta: { fontSize: 12, fontWeight: "600", color: colors.muted },
  rowPrice: { fontSize: 14, fontWeight: "800", color: colors.premiumGreenDark },
  pressed: { opacity: 0.92 },
});
