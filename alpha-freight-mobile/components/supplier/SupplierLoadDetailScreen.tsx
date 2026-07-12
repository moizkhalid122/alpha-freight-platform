import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import SupplierPodReviewModal from "@/components/supplier/SupplierPodReviewModal";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { getMapboxToken } from "@/lib/mapbox";
import { formatDistance, formatDuration } from "@/lib/mapbox";
import { callSupport, openMapsNavigation } from "@/lib/load-actions";
import {
  SupplierMyPost,
  canSupplierTrackShipment,
  fetchSupplierPostById,
  getSupplierPostStatusMeta,
  isSupplierShipmentComplete,
  shouldShowSupplierCompletePayment,
  isAwaitingBankTransferVerification,
  updateSupplierPostStatus,
} from "@/lib/supplier-my-posts";
import {
  getCachedSupplierPostById,
  prefetchSupplierMyPosts,
  setCachedSupplierMyPosts,
} from "@/lib/supplier-my-posts-cache";
import { setCachedSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { useTransitionReady } from "@/lib/use-after-transition";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={colors.ink} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ post }: { post: SupplierMyPost }) {
  const meta = getSupplierPostStatusMeta(
    post.status,
    post.paymentState,
    post.needsPodReview,
    post.bankTransferStatus
  );
  const toneStyle =
    meta.tone === "success"
      ? styles.badgeSuccess
      : meta.tone === "transit"
        ? styles.badgeTransit
        : meta.tone === "active"
          ? styles.badgeActive
          : meta.tone === "booked"
            ? styles.badgeBooked
            : meta.tone === "review"
              ? styles.badgeReview
              : styles.badgeMuted;

  return (
    <View style={[styles.statusBadge, toneStyle]}>
      <Text style={styles.statusBadgeText}>{meta.label}</Text>
    </View>
  );
}

export default function SupplierLoadDetailScreen() {
  const { loadId } = useLocalSearchParams<{ loadId?: string }>();
  const [post, setPost] = useState<SupplierMyPost | null>(() =>
    loadId ? getCachedSupplierPostById(String(loadId)) : null
  );
  const [carrierName, setCarrierName] = useState("");
  const [loading, setLoading] = useState(() => !loadId || !getCachedSupplierPostById(String(loadId)));
  const [updating, setUpdating] = useState(false);
  const [podReviewPost, setPodReviewPost] = useState<SupplierMyPost | null>(null);
  const mapsEnabled = Boolean(getMapboxToken());
  const transitionReady = useTransitionReady();

  const { route } = useLoadRoute(
    post?.origin ?? "",
    post?.destination ?? "",
    !!post && transitionReady
  );

  const loadPost = useCallback(async () => {
    if (!loadId) {
      router.back();
      return;
    }

    const cached = getCachedSupplierPostById(String(loadId));
    if (!cached) setLoading(true);
    const result = await fetchSupplierPostById(String(loadId));
    if (!result) {
      router.back();
      return;
    }

    setPost(result);

    if (result.carrierId) {
      const { data: carrier } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", result.carrierId)
        .maybeSingle();
      setCarrierName(carrier?.company_name || carrier?.full_name || "Assigned carrier");
    } else {
      setCarrierName("Awaiting carrier");
    }

    setLoading(false);
  }, [loadId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const canTrackShipment = useMemo(() => {
    if (!post) return false;
    return canSupplierTrackShipment(post);
  }, [post]);

  const shipmentComplete = useMemo(() => {
    if (!post) return false;
    return isSupplierShipmentComplete(post);
  }, [post]);

  const handleStatusUpdate = useCallback(
    async (nextStatus: string) => {
      if (!post) return;
      setUpdating(true);
      try {
        const updated = await updateSupplierPostStatus(post.id, nextStatus);
        if (updated) {
          setCachedSupplierMyPosts(updated);
          setCachedSupplierDashboard(null);
          const refreshed = updated.posts.find((item) => item.id === post.id) ?? null;
          if (refreshed) setPost(refreshed);
        }
      } finally {
        setUpdating(false);
      }
    },
    [post]
  );

  const confirmStatus = useCallback(
    (nextStatus: string, title: string, message: string) => {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => void handleStatusUpdate(nextStatus) },
      ]);
    },
    [handleStatusUpdate]
  );

  if (loading && !post) {
    return (
      <View style={styles.loadingRoot}>
        <Pressable style={styles.loadingBack} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Load details</Text>
            <Text style={styles.headerTitle}>{post.code}</Text>
          </View>
          <StatusBadge post={post} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.routeTitle}>
          {post.origin} → {post.destination}
        </Text>
        <Text style={styles.routeSub}>
          {post.equipment} · {post.commodity}
        </Text>

        <View style={styles.mapWrap}>
          {mapsEnabled && transitionReady ? (
            <LoadRouteMap
              origin={post.origin}
              destination={post.destination}
              height={180}
              code={post.code}
              zoomable
            />
          ) : (
            <View style={styles.mapPlaceholder} />
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{formatDistance(route?.distanceMeters ?? null)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{formatDuration(route?.durationSeconds ?? null)}</Text>
            <Text style={styles.statLabel}>Est. drive</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{post.paymentLabel || "—"}</Text>
            <Text style={styles.statLabel}>Payment</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{post.priceLabel}</Text>
            <Text style={styles.statLabel}>Load value</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipment status</Text>
          <DetailRow icon="pulse-outline" label="Current status" value={post.statusLabel} />
          <DetailRow icon="person-outline" label="Carrier" value={carrierName} />
          <DetailRow icon="calendar-outline" label="Pickup" value={post.pickupLabel} />
          <DetailRow icon="flag-outline" label="Delivery" value={post.deliveryLabel} />
          <DetailRow icon="time-outline" label="Posted" value={post.postedLabel} />
          {post.needsPodReview ? (
            <DetailRow icon="document-text-outline" label="POD" value="Awaiting your review" />
          ) : null}
        </View>

        <View style={styles.actionsCard}>
          {canTrackShipment ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={() => router.push(`/load-tracking/${post.id}`)}
            >
              <Ionicons name="navigate-outline" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Track shipment</Text>
            </Pressable>
          ) : null}

          {shipmentComplete ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.premiumGreenDark} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          ) : null}

          {shouldShowSupplierCompletePayment(post) ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => router.push(`/complete-payment?loadId=${post.id}`)}
            >
              <Ionicons name="card-outline" size={18} color={colors.ink} />
              <Text style={styles.secondaryBtnText}>Complete payment</Text>
            </Pressable>
          ) : null}

          {isAwaitingBankTransferVerification(post) ? (
            <View style={styles.verificationNotice}>
              <Ionicons name="time-outline" size={18} color={colors.muted} />
              <Text style={styles.verificationNoticeText}>
                Bank transfer submitted — awaiting admin verification
              </Text>
            </View>
          ) : null}

          {post.needsPodReview && post.podUrl ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => setPodReviewPost(post)}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.ink} />
              <Text style={styles.secondaryBtnText}>Review POD</Text>
            </Pressable>
          ) : null}

          {post.status === "booked" && post.paymentState === "paid" ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              disabled={updating}
              onPress={() =>
                confirmStatus(
                  "in-transit",
                  "Mark in transit",
                  "Confirm this load has been collected and is now in transit."
                )
              }
            >
              <Ionicons name="navigate-outline" size={18} color={colors.ink} />
              <Text style={styles.secondaryBtnText}>Mark in transit</Text>
            </Pressable>
          ) : null}

          {post.status === "in-transit" ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              disabled={updating}
              onPress={() =>
                confirmStatus(
                  "completed",
                  "Mark completed",
                  "Confirm this shipment has been delivered successfully."
                )
              }
            >
              <Ionicons name="checkmark-done-outline" size={18} color={colors.ink} />
              <Text style={styles.secondaryBtnText}>Mark completed</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={() => void openMapsNavigation(post.destination)}
          >
            <Ionicons name="map-outline" size={18} color={colors.ink} />
            <Text style={styles.secondaryBtnText}>Open delivery in maps</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={() => void callSupport()}
          >
            <Ionicons name="help-circle-outline" size={18} color={colors.ink} />
            <Text style={styles.secondaryBtnText}>Contact support</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SupplierPodReviewModal
        visible={Boolean(podReviewPost)}
        post={podReviewPost}
        onClose={() => setPodReviewPost(null)}
        onReviewed={async () => {
          setPodReviewPost(null);
          await prefetchSupplierMyPosts(true);
          await loadPost();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeTop: { backgroundColor: colors.white },
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  loadingBack: {
    position: "absolute",
    top: 56,
    left: spacing.lg,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.ink },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "800", color: colors.ink, textTransform: "uppercase" },
  badgeSuccess: { backgroundColor: colors.brandSoft },
  badgeTransit: { backgroundColor: "#EFF6FF" },
  badgeActive: { backgroundColor: "#ECFDF5" },
  badgeBooked: { backgroundColor: "#FFFBEB" },
  badgeReview: { backgroundColor: "#F5F3FF" },
  badgeMuted: { backgroundColor: colors.canvasMuted },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  routeTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  routeSub: { fontSize: 14, fontWeight: "600", color: colors.muted, marginTop: -4 },
  mapWrap: { borderRadius: radius.lg, overflow: "hidden" },
  mapPlaceholder: { height: 180, borderRadius: radius.lg, backgroundColor: colors.inputFill },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  statCell: {
    width: "50%",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.canvasMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  detailValue: { fontSize: 15, fontWeight: "700", color: colors.ink },
  actionsCard: { gap: 10 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: colors.ink },
  secondaryBtn: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  verificationNotice: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.canvasMuted,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  verificationNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  completedBadge: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  completedBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.premiumGreenDark,
  },
  pressed: { opacity: 0.9 },
});
